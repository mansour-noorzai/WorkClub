"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorize = authorize;
exports.workspaceScope = workspaceScope;
exports.memberProjectScope = memberProjectScope;
exports.memberTaskScope = memberTaskScope;
var apiError_1 = require("../utils/apiError");
function authorize() {
    var roles = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        roles[_i] = arguments[_i];
    }
    return function (req, _res, next) {
        if (!req.user)
            return next(new apiError_1.ApiError(401, 'Authentication required.'));
        if (!roles.includes(req.user.role)) {
            return next(new apiError_1.ApiError(403, 'You do not have permission for this action.'));
        }
        return next();
    };
}
function workspaceScope(req) {
    if (!req.user)
        throw new apiError_1.ApiError(401, 'Authentication required.');
    return { workspace: req.user.workspace, removed: false };
}
function memberProjectScope(req) {
    var _a, _b;
    var scope = workspaceScope(req);
    if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) === 'member')
        scope.teamMembers = req.user._id;
    if (((_b = req.user) === null || _b === void 0 ? void 0 : _b.role) === 'client')
        scope.client = req.user.client;
    return scope;
}
function memberTaskScope(req) {
    var _a;
    var scope = workspaceScope(req);
    if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) === 'member')
        scope.assignee = req.user._id;
    return scope;
}
