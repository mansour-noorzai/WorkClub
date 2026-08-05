"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listQuery = exports.idParams = exports.emptyBody = exports.objectId = void 0;
var zod_1 = require("zod");
exports.objectId = zod_1.z.string().regex(/^[a-f\d]{24}$/i, 'Invalid MongoDB id');
exports.emptyBody = zod_1.z.object({}).strict();
exports.idParams = zod_1.z.object({ id: exports.objectId }).strict();
exports.listQuery = zod_1.z
    .object({
    page: zod_1.z.coerce.number().int().positive().default(1),
    limit: zod_1.z.coerce.number().int().min(1).max(100).default(20),
    search: zod_1.z.string().trim().max(100).optional(),
})
    .strict();
