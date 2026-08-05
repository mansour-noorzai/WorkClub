"use strict";
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
exports.workspaceRoutes = void 0;
var express_1 = require("express");
var authorize_1 = require("../middleware/authorize");
var validate_1 = require("../middleware/validate");
var Workspace_1 = require("../models/Workspace");
var apiError_1 = require("../utils/apiError");
var asyncHandler_1 = require("../utils/asyncHandler");
var schemas_1 = require("../validation/schemas");
exports.workspaceRoutes = (0, express_1.Router)();
exports.workspaceRoutes.use((0, authorize_1.authorize)('owner', 'manager', 'member'));
exports.workspaceRoutes.get('/', (0, asyncHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var workspace;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, Workspace_1.Workspace.findOne({
                    _id: req.user.workspace,
                    removed: false,
                }).lean()];
            case 1:
                workspace = _a.sent();
                if (!workspace)
                    throw new apiError_1.ApiError(404, 'Workspace not found.');
                if (req.user.role === 'member' && workspace) {
                    workspace.settings.defaultHourlyRate = 0;
                    workspace.settings.invoicePrefix = '';
                }
                res.json({ success: true, result: workspace });
                return [2 /*return*/];
        }
    });
}); }));
exports.workspaceRoutes.patch('/', (0, authorize_1.authorize)('owner', 'manager'), (0, validate_1.validate)({ body: schemas_1.workspaceSchemas.update }), (0, asyncHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var billingKeys, update, _i, _a, _b, key, value, workspace;
    var _c;
    return __generator(this, function (_d) {
        switch (_d.label) {
            case 0:
                if (req.user.role === 'manager') {
                    billingKeys = ['currency', 'defaultHourlyRate', 'invoicePrefix'];
                    if (req.body.settings &&
                        billingKeys.some(function (key) { return Object.prototype.hasOwnProperty.call(req.body.settings, key); })) {
                        throw new apiError_1.ApiError(403, 'Only Owners can update billing settings.');
                    }
                }
                update = {};
                if (req.body.name)
                    update.name = req.body.name;
                for (_i = 0, _a = Object.entries((_c = req.body.settings) !== null && _c !== void 0 ? _c : {}); _i < _a.length; _i++) {
                    _b = _a[_i], key = _b[0], value = _b[1];
                    update["settings.".concat(key)] = value;
                }
                return [4 /*yield*/, Workspace_1.Workspace.findOneAndUpdate({ _id: req.user.workspace, removed: false }, { $set: update }, { new: true, runValidators: true })];
            case 1:
                workspace = _d.sent();
                if (!workspace)
                    throw new apiError_1.ApiError(404, 'Workspace not found.');
                res.json({ success: true, result: workspace });
                return [2 /*return*/];
        }
    });
}); }));
