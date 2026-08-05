import request from "supertest";
import mongoose, { Types } from "mongoose";
import { createApp } from "../src/app";
import { connectDatabase, disconnectDatabase } from "../src/config/database";
import { resetEnvForTests } from "../src/config/env";
import { Client } from "../src/models/Client";
import { Invoice } from "../src/models/Invoice";
import { Project } from "../src/models/Project";
import { Proposal } from "../src/models/Proposal";
import { Task } from "../src/models/Task";
import { TimeEntry } from "../src/models/TimeEntry";
import { User } from "../src/models/User";
import { UserCredential } from "../src/models/UserCredential";
import {
  createRefreshSession,
  hashPassword,
  issueAuthToken,
} from "../src/services/authService";

const describeWithMongo =
  process.env.TEST_MONGO_URI || process.env.USE_IN_MEMORY_MONGO === "true"
    ? describe
    : describe.skip;

jest.setTimeout(120_000);

describeWithMongo("WorkClub API integration", () => {
  const app = createApp();

  beforeAll(async () => {
    resetEnvForTests();
    await connectDatabase();
  });

  beforeEach(async () => {
    const collections = await mongoose.connection.db!.collections();
    await Promise.all(
      collections.map((collection) => collection.deleteMany({})),
    );
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  it("registers, authenticates and atomically rotates refresh sessions", async () => {
    const registration = await request(app)
      .post("/api/auth/register-workspace")
      .send({
        workspaceName: "Integration Studio",
        name: "Integration Owner",
        email: "owner@integration.test",
        password: "StrongPassword!2026",
      });

    expect(registration.status).toBe(201);
    expect(registration.body.result.accessToken).toBeDefined();
    const refreshCookie = registration.headers["set-cookie"]?.[0];
    expect(refreshCookie).toContain("workclub_refresh=");

    const me = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${registration.body.result.accessToken}`);
    expect(me.status).toBe(200);
    expect(me.body.result.user.email).toBe("owner@integration.test");

    const refreshed = await request(app)
      .post("/api/auth/refresh")
      .set("Cookie", refreshCookie);
    expect(refreshed.status).toBe(200);
    expect(refreshed.body.result.accessToken).toBeDefined();

    const replayed = await request(app)
      .post("/api/auth/refresh")
      .set("Cookie", refreshCookie);
    expect(replayed.status).toBe(401);
  });

  it("refreshes the correct user in a multi-user database and rejects concurrent replay", async () => {
    await registerOwner(app, "first@integration.test", "First Studio");
    const second = await registerOwner(
      app,
      "second@integration.test",
      "Second Studio",
    );
    expect(second.refreshCookie).toContain("workclub_refresh=");

    const [firstRefresh, replay] = await Promise.all([
      request(app)
        .post("/api/auth/refresh")
        .set("Cookie", second.refreshCookie),
      request(app)
        .post("/api/auth/refresh")
        .set("Cookie", second.refreshCookie),
    ]);

    expect([firstRefresh.status, replay.status].sort()).toEqual([200, 401]);
    const successful = firstRefresh.status === 200 ? firstRefresh : replay;
    expect(successful.body.result.user.email).toBe("second@integration.test");
  });

  it("enforces tenant and Member assignment boundaries at the API layer", async () => {
    const first = await registerOwner(
      app,
      "owner-one@integration.test",
      "Studio One",
    );
    const second = await registerOwner(
      app,
      "owner-two@integration.test",
      "Studio Two",
    );
    const client = await Client.create({
      workspace: first.user.workspace,
      name: "Tenant One Client",
      primaryContact: { name: "Client Contact" },
      companySize: "2-10",
      status: "active",
      createdBy: first.user._id,
    });

    const crossTenant = await request(app)
      .get(`/api/client/${client._id}`)
      .set("Authorization", `Bearer ${second.token}`);
    expect(crossTenant.status).toBe(404);

    const member = await createAuthenticatedUser({
      workspace: first.user.workspace,
      email: "member@integration.test",
      role: "member",
    });
    const manager = await createAuthenticatedUser({
      workspace: first.user.workspace,
      email: "manager@integration.test",
      role: "manager",
    });
    const project = await Project.create({
      workspace: first.user.workspace,
      client: client._id,
      name: "Scoped Project",
      code: "SCOPED-1",
      teamMembers: [first.user._id, manager.user._id, member.user._id],
      status: "active",
      budget: { amount: 10_000, currency: "USD" },
      createdBy: first.user._id,
    });
    await Task.insertMany([
      {
        workspace: first.user.workspace,
        project: project._id,
        title: "Member task",
        assignee: member.user._id,
        status: "todo",
        priority: "medium",
        sortOrder: 0,
        createdBy: manager.user._id,
      },
      {
        workspace: first.user.workspace,
        project: project._id,
        title: "Manager task",
        assignee: manager.user._id,
        status: "todo",
        priority: "medium",
        sortOrder: 1,
        createdBy: first.user._id,
      },
    ]);

    const memberTasks = await request(app)
      .get("/api/task?limit=100")
      .set("Authorization", `Bearer ${member.token}`);
    expect(memberTasks.status).toBe(200);
    expect(memberTasks.body.result).toHaveLength(1);
    expect(memberTasks.body.result[0].title).toBe("Member task");

    const forbiddenClients = await request(app)
      .get("/api/client")
      .set("Authorization", `Bearer ${member.token}`);
    expect(forbiddenClients.status).toBe(403);

    const otherClient = await Client.create({
      workspace: second.user.workspace,
      name: "Tenant Two Client",
      primaryContact: { name: "Tenant Two Contact" },
      companySize: "2-10",
      status: "active",
      createdBy: second.user._id,
    });
    const otherProject = await Project.create({
      workspace: second.user.workspace,
      client: otherClient._id,
      name: "Tenant Two Project",
      code: "TENANT-2",
      teamMembers: [second.user._id],
      status: "active",
      budget: { amount: 1_000, currency: "USD" },
      createdBy: second.user._id,
    });
    const crossTenantProposal = await request(app)
      .post("/api/proposal")
      .set("Authorization", `Bearer ${first.token}`)
      .send({
        client: client._id.toString(),
        project: otherProject._id.toString(),
        title: "Invalid cross-tenant proposal",
        number: "PROP-X",
        validUntil: new Date(Date.now() + 86_400_000).toISOString(),
        currency: "USD",
        items: [{ description: "Work", quantity: 1, unitPrice: 100 }],
      });
    expect(crossTenantProposal.status).toBe(422);
    expect(
      await Proposal.countDocuments({ workspace: first.user.workspace }),
    ).toBe(0);
  });

  it("starts and stops a timer lifecycle for the current user", async () => {
    const owner = await registerOwner(
      app,
      "timer@integration.test",
      "Timer Studio",
    );
    const client = await Client.create({
      workspace: owner.user.workspace,
      name: "Timer Client",
      primaryContact: { name: "Timer Contact" },
      companySize: "2-10",
      status: "active",
      createdBy: owner.user._id,
    });
    const project = await Project.create({
      workspace: owner.user.workspace,
      client: client._id,
      name: "Timer Project",
      code: "TIMER-1",
      teamMembers: [owner.user._id],
      status: "active",
      budget: { amount: 1_000, currency: "USD" },
      createdBy: owner.user._id,
    });
    const task = await Task.create({
      workspace: owner.user.workspace,
      project: project._id,
      title: "Timer task",
      assignee: owner.user._id,
      status: "todo",
      priority: "medium",
      sortOrder: 0,
      createdBy: owner.user._id,
    });

    const start = await request(app)
      .post("/api/timeentry/start")
      .set("Authorization", `Bearer ${owner.token}`)
      .send({ task: task._id.toString(), billable: true, notes: "working" });
    expect(start.status).toBe(201);
    expect(start.body.result.running).toBe(true);

    const running = await request(app)
      .get("/api/timeentry/running")
      .set("Authorization", `Bearer ${owner.token}`);
    expect(running.status).toBe(200);
    expect(running.body.result).toBeDefined();

    const stop = await request(app)
      .patch(`/api/timeentry/${running.body.result._id}/stop`)
      .set("Authorization", `Bearer ${owner.token}`)
      .send({});
    expect(stop.status).toBe(200);
    expect(stop.body.result.running).toBe(false);
    expect(stop.body.result.endAt).toBeDefined();
  });

  it("creates a manual time entry with a completed duration", async () => {
    const owner = await registerOwner(
      app,
      "manual@integration.test",
      "Manual Studio",
    );
    const client = await Client.create({
      workspace: owner.user.workspace,
      name: "Manual Client",
      primaryContact: { name: "Manual Contact" },
      companySize: "2-10",
      status: "active",
      createdBy: owner.user._id,
    });
    const project = await Project.create({
      workspace: owner.user.workspace,
      client: client._id,
      name: "Manual Project",
      code: "MANUAL-1",
      teamMembers: [owner.user._id],
      status: "active",
      budget: { amount: 1_000, currency: "USD" },
      createdBy: owner.user._id,
    });
    const task = await Task.create({
      workspace: owner.user.workspace,
      project: project._id,
      title: "Manual task",
      assignee: owner.user._id,
      status: "todo",
      priority: "medium",
      sortOrder: 0,
      createdBy: owner.user._id,
    });

    const startAt = new Date(Date.now() - 60 * 60 * 1000);
    const manual = await request(app)
      .post("/api/timeentry/manual")
      .set("Authorization", `Bearer ${owner.token}`)
      .send({
        task: task._id.toString(),
        startAt: startAt.toISOString(),
        durationMinutes: 60,
        billable: true,
        notes: "Completed manual time",
      });

    expect(manual.status).toBe(201);
    expect(manual.body.result.running).toBe(false);
    expect(manual.body.result.durationMinutes).toBe(60);
    expect(new Date(manual.body.result.endAt).getTime()).toBe(
      startAt.getTime() + 60 * 60 * 1000,
    );
  });

  it("prevents concurrent invoices from consuming the same time entry twice", async () => {
    const owner = await registerOwner(
      app,
      "billing@integration.test",
      "Billing Studio",
    );
    const client = await Client.create({
      workspace: owner.user.workspace,
      name: "Billing Client",
      primaryContact: { name: "Billing Contact" },
      companySize: "2-10",
      status: "active",
      createdBy: owner.user._id,
    });
    const project = await Project.create({
      workspace: owner.user.workspace,
      client: client._id,
      name: "Billable Project",
      code: "BILL-1",
      teamMembers: [owner.user._id],
      status: "active",
      budget: { amount: 5_000, currency: "USD" },
      createdBy: owner.user._id,
    });
    const task = await Task.create({
      workspace: owner.user.workspace,
      project: project._id,
      title: "Billable task",
      assignee: owner.user._id,
      status: "done",
      priority: "medium",
      sortOrder: 0,
      createdBy: owner.user._id,
    });
    const entry = await TimeEntry.create({
      workspace: owner.user.workspace,
      project: project._id,
      task: task._id,
      user: owner.user._id,
      startAt: new Date(Date.now() - 60 * 60 * 1000),
      endAt: new Date(),
      durationMinutes: 60,
      billable: true,
      running: false,
      invoiceReservation: "abandoned-reservation",
      invoiceReservationExpiresAt: new Date(Date.now() - 60_000),
    });
    const releasedBillable = await request(app)
      .get(`/api/timeentry/billable?project=${project._id}`)
      .set("Authorization", `Bearer ${owner.token}`);
    expect(releasedBillable.status).toBe(200);
    expect(
      releasedBillable.body.result.map((item: { _id: string }) => item._id),
    ).toContain(entry._id.toString());
    const basePayload = {
      project: project._id.toString(),
      timeEntries: [entry._id.toString()],
      issueDate: new Date().toISOString(),
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      hourlyRate: 100,
      taxRate: 0,
    };

    const [a, b] = await Promise.all([
      request(app)
        .post("/api/invoice/from-time")
        .set("Authorization", `Bearer ${owner.token}`)
        .send({ ...basePayload, number: "INV-A" }),
      request(app)
        .post("/api/invoice/from-time")
        .set("Authorization", `Bearer ${owner.token}`)
        .send({ ...basePayload, number: "INV-B" }),
    ]);

    expect(
      [a.status, b.status].filter((status) => status === 201),
    ).toHaveLength(1);
    expect(
      [a.status, b.status].some((status) => status === 409 || status === 422),
    ).toBe(true);
    expect(
      await Invoice.countDocuments({ workspace: owner.user.workspace }),
    ).toBe(1);
    expect((await TimeEntry.findById(entry._id))?.invoice).toBeDefined();

    const invoice = await Invoice.findOne({ workspace: owner.user.workspace });
    expect(invoice).toBeDefined();
    const invalidPaid = await request(app)
      .patch(`/api/invoice/${invoice!._id}`)
      .set("Authorization", `Bearer ${owner.token}`)
      .send({ status: "paid" });
    expect(invalidPaid.status).toBe(409);

    const sent = await request(app)
      .patch(`/api/invoice/${invoice!._id}`)
      .set("Authorization", `Bearer ${owner.token}`)
      .send({ status: "sent" });
    expect(sent.status).toBe(200);
    const paid = await request(app)
      .patch(`/api/invoice/${invoice!._id}`)
      .set("Authorization", `Bearer ${owner.token}`)
      .send({ status: "paid" });
    expect(paid.status).toBe(200);
    expect(paid.body.result.paidAt).toBeDefined();
  });
});

async function registerOwner(
  app: ReturnType<typeof createApp>,
  email: string,
  workspaceName: string,
) {
  const response = await request(app)
    .post("/api/auth/register-workspace")
    .send({
      workspaceName,
      name: "Owner",
      email,
      password: "StrongPassword!2026",
    });
  expect(response.status).toBe(201);
  const user = await User.findOne({ email });
  if (!user) throw new Error("Registered Owner was not persisted.");
  const refreshCookie = response.headers["set-cookie"]?.[0] ?? "";
  return {
    user,
    token: response.body.result.accessToken as string,
    refreshCookie,
  };
}

async function createAuthenticatedUser(input: {
  workspace: Types.ObjectId;
  email: string;
  role: "manager" | "member";
}) {
  const user = await User.create({
    workspace: input.workspace,
    name: input.role,
    email: input.email,
    role: input.role,
    enabled: true,
  });
  const created = createRefreshSession();
  await UserCredential.create({
    user: user._id,
    ...hashPassword("StrongPassword!2026"),
    emailVerified: true,
    sessions: [created.session],
  });
  return { user, token: issueAuthToken(user, created.session.sessionId) };
}
