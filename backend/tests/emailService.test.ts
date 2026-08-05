import { resetEnvForTests } from "../src/config/env";
import { sendEmail } from "../src/services/emailService";
import { Resend } from "resend";

const mockSend = jest.fn();

jest.mock("resend", () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: {
      send: mockSend,
    },
  })),
}));

describe("emailService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetEnvForTests();
    delete process.env.RESEND_API_KEY;
    delete process.env.EMAIL_FROM;
    process.env.NODE_ENV = "development";
  });

  it("uses a Resend fallback sender address when EMAIL_FROM is not configured", async () => {
    process.env.RESEND_API_KEY = "test-key";

    const status = await sendEmail({
      to: "invitee@example.com",
      subject: "Join the workspace",
      heading: "You are invited",
      message: "Accept your invite.",
      actionLabel: "Accept",
      actionUrl: "http://localhost:5173/accept-invite",
    });

    expect(status).toBe("sent");
    expect(Resend).toHaveBeenCalled();
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        from: "onboarding@resend.dev",
        to: "invitee@example.com",
      }),
    );
  });
});
