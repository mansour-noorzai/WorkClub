"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pagination = pagination;
function pagination(input) {
    var _a, _b;
    var page = Math.max(1, (_a = input.page) !== null && _a !== void 0 ? _a : 1);
    var limit = Math.min(100, Math.max(1, (_b = input.limit) !== null && _b !== void 0 ? _b : 20));
    return { page: page, limit: limit, skip: (page - 1) * limit };
}
