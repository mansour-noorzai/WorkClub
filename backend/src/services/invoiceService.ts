export interface DraftLine {
  description: string;
  quantity: number;
  unitPrice: number;
  timeEntries?: string[];
}

export function calculateInvoice(lines: DraftLine[], taxRate = 0) {
  const items = lines.map((line) => ({
    ...line,
    total: roundMoney(line.quantity * line.unitPrice),
  }));
  const subTotal = roundMoney(items.reduce((sum, line) => sum + line.total, 0));
  const taxTotal = roundMoney(subTotal * (taxRate / 100));
  return { items, subTotal, taxTotal, total: roundMoney(subTotal + taxTotal) };
}

export function timeEntriesToInvoiceLine(
  entries: Array<{ _id: { toString(): string }; durationMinutes: number }>,
  hourlyRate: number
): DraftLine {
  const totalMinutes = entries.reduce((sum, entry) => sum + entry.durationMinutes, 0);
  return {
    description: 'Billable project time',
    quantity: Math.round((totalMinutes / 60) * 100) / 100,
    unitPrice: hourlyRate,
    timeEntries: entries.map((entry) => entry._id.toString()),
  };
}

function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
