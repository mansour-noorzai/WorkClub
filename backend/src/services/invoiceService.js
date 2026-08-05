"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateInvoice = calculateInvoice;
exports.timeEntriesToInvoiceLine = timeEntriesToInvoiceLine;
function calculateInvoice(lines, taxRate) {
    if (taxRate === void 0) { taxRate = 0; }
    var items = lines.map(function (line) { return (__assign(__assign({}, line), { total: roundMoney(line.quantity * line.unitPrice) })); });
    var subTotal = roundMoney(items.reduce(function (sum, line) { return sum + line.total; }, 0));
    var taxTotal = roundMoney(subTotal * (taxRate / 100));
    return { items: items, subTotal: subTotal, taxTotal: taxTotal, total: roundMoney(subTotal + taxTotal) };
}
function timeEntriesToInvoiceLine(entries, hourlyRate) {
    var totalMinutes = entries.reduce(function (sum, entry) { return sum + entry.durationMinutes; }, 0);
    return {
        description: 'Billable project time',
        quantity: Math.round((totalMinutes / 60) * 100) / 100,
        unitPrice: hourlyRate,
        timeEntries: entries.map(function (entry) { return entry._id.toString(); }),
    };
}
function roundMoney(value) {
    return Math.round((value + Number.EPSILON) * 100) / 100;
}
