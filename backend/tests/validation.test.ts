import { Types } from 'mongoose';
import { authSchemas, invoiceSchemas, proposalSchemas, timeEntrySchemas } from '../src/validation/schemas';

const objectId = new Types.ObjectId().toString();

describe('request validation', () => {
  it('rejects unknown authentication fields', () => {
    const result = authSchemas.login.safeParse({
      email: 'owner@example.com',
      password: 'password',
      $where: 'malicious input',
    });
    expect(result.success).toBe(false);
  });

  it('rejects manual time that extends into the future', () => {
    const result = timeEntrySchemas.manual.safeParse({
      task: objectId,
      startAt: new Date(Date.now() - 30 * 60_000),
      durationMinutes: 60,
      billable: true,
    });
    expect(result.success).toBe(false);
  });

  it('accepts completed historical manual time', () => {
    const result = timeEntrySchemas.manual.safeParse({
      task: objectId,
      startAt: new Date(Date.now() - 90 * 60_000),
      durationMinutes: 60,
      billable: true,
    });
    expect(result.success).toBe(true);
  });

  it('rejects invoice dates and duplicate time-entry references', () => {
    const issueDate = new Date('2026-08-10T00:00:00.000Z');
    expect(
      invoiceSchemas.create.safeParse({
        project: objectId,
        number: 'INV-1',
        issueDate,
        dueDate: new Date('2026-08-09T00:00:00.000Z'),
        currency: 'USD',
        items: [{ description: 'Delivery', quantity: 1, unitPrice: 100 }],
      }).success,
    ).toBe(false);
    expect(
      invoiceSchemas.fromTime.safeParse({
        project: objectId,
        timeEntries: [objectId, objectId],
        number: 'INV-2',
        issueDate,
        dueDate: new Date('2026-08-20T00:00:00.000Z'),
        hourlyRate: 100,
      }).success,
    ).toBe(false);
  });

  it('rejects already-expired proposals', () => {
    const result = proposalSchemas.create.safeParse({
      client: objectId,
      title: 'Expired offer',
      number: 'PROP-1',
      validUntil: new Date(Date.now() - 60_000),
      currency: 'USD',
      items: [{ description: 'Delivery', quantity: 1, unitPrice: 100 }],
    });
    expect(result.success).toBe(false);
  });
});
