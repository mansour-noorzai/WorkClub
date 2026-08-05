import { Types } from 'mongoose';
import { calculateInvoice, timeEntriesToInvoiceLine } from '../src/services/invoiceService';

describe('invoice service', () => {
  it('calculates subtotal, tax, and total deterministically', () => {
    const result = calculateInvoice(
      [
        { description: 'Design', quantity: 10, unitPrice: 75 },
        { description: 'Development', quantity: 4.5, unitPrice: 120 },
      ],
      10
    );
    expect(result.subTotal).toBe(1290);
    expect(result.taxTotal).toBe(129);
    expect(result.total).toBe(1419);
  });

  it('rolls billable minutes into one hourly invoice line', () => {
    const ids = [new Types.ObjectId(), new Types.ObjectId()];
    const line = timeEntriesToInvoiceLine(
      [
        { _id: ids[0], durationMinutes: 90 },
        { _id: ids[1], durationMinutes: 30 },
      ],
      100
    );
    expect(line.quantity).toBe(2);
    expect(line.unitPrice).toBe(100);
    expect(line.timeEntries).toEqual(ids.map(String));
  });
});
