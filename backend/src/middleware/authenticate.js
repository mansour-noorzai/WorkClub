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
exports.authenticate = void 0;
var User_1 = require("../models/User");
var UserCredential_1 = require("../models/UserCredential");
var authService_1 = require("../services/authService");
var apiError_1 = require("../utils/apiError");
var authenticate = function (req, _res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var token, payload_1, _a, user, credentials, activeSession, fiveMinutesAgo, error_1;
    var _b;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                _c.trys.push([0, 2, , 3]);
                token = ((_b = req.headers.authorization) === null || _b === void 0 ? void 0 : _b.startsWith('Bearer '))
                    ? req.headers.authorization.slice(7)
                    : undefined;
                if (!token)
                    throw new apiError_1.ApiError(401, 'Authentication required.');
                payload_1 = (0, authService_1.verifyAuthToken)(token);
                return [4 /*yield*/, Promise.all([
                        User_1.User.findOne({ _id: payload_1.id, removed: false, enabled: true }),
                        UserCredential_1.UserCredential.findOne({ user: payload_1.id, removed: false }),
                    ])];
            case 1:
                _a = _c.sent(), user = _a[0], credentials = _a[1];
                activeSession = payload_1.sid
                    ? credentials === null || credentials === void 0 ? void 0 : credentials.sessions.some(function (session) {
                        return session.sessionId === payload_1.sid && session.expiresAt.getTime() > Date.now();
                    })
                    : false;
                if (!user || !credentials || !activeSession) {
                    throw new apiError_1.ApiError(401, 'Session is invalid or expired.');
                }
                if (user.workspace.toString() !== payload_1.workspace) {
                    throw new apiError_1.ApiError(401, 'Session workspace is invalid.');
                }
                req.user = user;
                req.authToken = token;
                req.sessionId = payload_1.sid;
                fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
                if (!user.lastSeenAt || user.lastSeenAt < fiveMinutesAgo) {
                    void User_1.User.updateOne({ _id: user._id, $or: [{ lastSeenAt: { $lt: fiveMinutesAgo } }, { lastSeenAt: null }] }, { $set: { lastSeenAt: new Date() } }).catch(function () { return undefined; });
                }
                next();
                return [3 /*break*/, 3];
            case 2:
                error_1 = _c.sent();
                next(error_1 instanceof apiError_1.ApiError ? error_1 : new apiError_1.ApiError(401, 'Session is invalid or expired.'));
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.authenticate = authenticate;
