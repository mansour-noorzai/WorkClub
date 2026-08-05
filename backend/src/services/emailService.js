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
exports.sendEmail = sendEmail;
exports.sendInviteEmail = sendInviteEmail;
exports.sendVerificationEmail = sendVerificationEmail;
exports.sendPasswordResetEmail = sendPasswordResetEmail;
var resend_1 = require("resend");
var env_1 = require("../config/env");
function sendEmail(input) {
    return __awaiter(this, void 0, void 0, function () {
        var env, configuredFrom, fromAddress, hasResendKey, action, resend, _a;
        var _b, _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    env = (0, env_1.getEnv)();
                    configuredFrom = (_b = env.EMAIL_FROM) === null || _b === void 0 ? void 0 : _b.trim();
                    fromAddress = configuredFrom || "onboarding@resend.dev";
                    hasResendKey = Boolean((_c = env.RESEND_API_KEY) === null || _c === void 0 ? void 0 : _c.trim());
                    if (!hasResendKey) {
                        if (env.NODE_ENV === "production") {
                            return [2 /*return*/, "skipped"];
                        }
                        console.info("[email] Development fallback: ".concat(input.subject));
                        console.info("[email] to=".concat(input.to, " from=").concat(fromAddress));
                        console.info("[email] ".concat(input.message).concat(input.actionUrl ? " :: ".concat(input.actionUrl) : ""));
                        return [2 /*return*/, "sent"];
                    }
                    action = input.actionLabel && input.actionUrl
                        ? "<p><a href=\"".concat(escapeAttribute(input.actionUrl), "\" style=\"display:inline-block;background:#6558f5;color:#fff;padding:11px 18px;border-radius:8px;text-decoration:none\">").concat(escapeHtml(input.actionLabel), "</a></p>")
                        : "";
                    _d.label = 1;
                case 1:
                    _d.trys.push([1, 3, , 4]);
                    resend = new resend_1.Resend(env.RESEND_API_KEY);
                    return [4 /*yield*/, resend.emails.send({
                            from: fromAddress,
                            to: input.to,
                            subject: input.subject,
                            html: "<div style=\"font-family:Arial,sans-serif;color:#172033;max-width:560px\"><h2>".concat(escapeHtml(input.heading), "</h2><p>").concat(escapeHtml(input.message), "</p>").concat(action, "<p style=\"color:#667085;font-size:12px\">WorkClub</p></div>"),
                        })];
                case 2:
                    _d.sent();
                    return [2 /*return*/, "sent"];
                case 3:
                    _a = _d.sent();
                    return [2 /*return*/, "failed"];
                case 4: return [2 /*return*/];
            }
        });
    });
}
function sendInviteEmail(input) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, sendEmail({
                    to: input.email,
                    subject: "Join ".concat(input.workspaceName, " on WorkClub"),
                    heading: "You’re invited to WorkClub",
                    message: "".concat(input.inviterName, " invited you to join ").concat(input.workspaceName, "."),
                    actionLabel: "Accept invitation",
                    actionUrl: input.inviteUrl,
                })];
        });
    });
}
function sendVerificationEmail(input) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, sendEmail({
                    to: input.email,
                    subject: "Verify your WorkClub email",
                    heading: "Verify your email address",
                    message: "Confirm your email address to activate your WorkClub workspace.",
                    actionLabel: "Verify email",
                    actionUrl: input.verificationUrl,
                })];
        });
    });
}
function sendPasswordResetEmail(input) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, sendEmail({
                    to: input.email,
                    subject: "Reset your WorkClub password",
                    heading: "Reset your password",
                    message: "Use this link to choose a new password. It expires in 30 minutes.",
                    actionLabel: "Reset password",
                    actionUrl: input.resetUrl,
                })];
        });
    });
}
function escapeHtml(value) {
    return value.replace(/[&<>"']/g, function (character) {
        var map = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;",
        };
        return map[character];
    });
}
function escapeAttribute(value) {
    return escapeHtml(value).replace(/`/g, "&#096;");
}
