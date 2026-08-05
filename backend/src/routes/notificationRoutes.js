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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationRoutes = void 0;
var express_1 = require("express");
var authorize_1 = require("../middleware/authorize");
var validate_1 = require("../middleware/validate");
var Notification_1 = require("../models/Notification");
var apiError_1 = require("../utils/apiError");
var asyncHandler_1 = require("../utils/asyncHandler");
var pagination_1 = require("../utils/pagination");
var schemas_1 = require("../validation/schemas");
exports.notificationRoutes = (0, express_1.Router)();
exports.notificationRoutes.get('/', (0, validate_1.validate)({ query: schemas_1.notificationSchemas.list }), (0, asyncHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, page, limit, skip, query, _b, items, total, unread;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                _a = (0, pagination_1.pagination)(req.query), page = _a.page, limit = _a.limit, skip = _a.skip;
                query = __assign(__assign({}, (0, authorize_1.workspaceScope)(req)), { user: req.user._id });
                if (String(req.query.unreadOnly) === 'true')
                    query.readAt = { $exists: false };
                return [4 /*yield*/, Promise.all([
                        Notification_1.Notification.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
                        Notification_1.Notification.countDocuments(query),
                        Notification_1.Notification.countDocuments(__assign(__assign({}, (0, authorize_1.workspaceScope)(req)), { user: req.user._id, readAt: { $exists: false } })),
                    ])];
            case 1:
                _b = _c.sent(), items = _b[0], total = _b[1], unread = _b[2];
                res.json({ success: true, result: items, meta: { page: page, limit: limit, total: total, unread: unread } });
                return [2 /*return*/];
        }
    });
}); }));
exports.notificationRoutes.patch('/:id/read', (0, validate_1.validate)({ params: schemas_1.notificationSchemas.params }), (0, asyncHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var item;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, Notification_1.Notification.findOneAndUpdate(__assign(__assign({ _id: req.params.id }, (0, authorize_1.workspaceScope)(req)), { user: req.user._id }), { readAt: new Date() }, { new: true })];
            case 1:
                item = _a.sent();
                if (!item)
                    throw new apiError_1.ApiError(404, 'Notification not found.');
                res.json({ success: true, result: item });
                return [2 /*return*/];
        }
    });
}); }));
