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
exports.createApp = createApp;
var compression_1 = require("compression");
var cookie_parser_1 = require("cookie-parser");
var cors_1 = require("cors");
var express_1 = require("express");
var express_rate_limit_1 = require("express-rate-limit");
var helmet_1 = require("helmet");
var mongoose_1 = require("mongoose");
var swagger_ui_express_1 = require("swagger-ui-express");
var env_1 = require("./config/env");
var openapi_1 = require("./config/openapi");
var metrics_1 = require("./config/metrics");
var auditMutations_1 = require("./middleware/auditMutations");
var authenticate_1 = require("./middleware/authenticate");
var requestObservability_1 = require("./middleware/requestObservability");
var auditRoutes_1 = require("./routes/auditRoutes");
var authRoutes_1 = require("./routes/authRoutes");
var clientRoutes_1 = require("./routes/clientRoutes");
var dashboardRoutes_1 = require("./routes/dashboardRoutes");
var invoiceRoutes_1 = require("./routes/invoiceRoutes");
var notificationRoutes_1 = require("./routes/notificationRoutes");
var portalRoutes_1 = require("./routes/portalRoutes");
var projectRoutes_1 = require("./routes/projectRoutes");
var proposalRoutes_1 = require("./routes/proposalRoutes");
var taskRoutes_1 = require("./routes/taskRoutes");
var teamRoutes_1 = require("./routes/teamRoutes");
var timeEntryRoutes_1 = require("./routes/timeEntryRoutes");
var workspaceRoutes_1 = require("./routes/workspaceRoutes");
var apiError_1 = require("./utils/apiError");
function createApp() {
    var _this = this;
    var app = (0, express_1.default)();
    var env = (0, env_1.getEnv)();
    var openApiDocument = (0, openapi_1.loadOpenApiDocument)();
    app.disable('x-powered-by');
    if (env.TRUST_PROXY)
        app.set('trust proxy', 1);
    app.use(requestObservability_1.requestLogger);
    app.use(requestObservability_1.requestMetrics);
    // The API serves Swagger UI with inline bootstrap code. The browser application
    // is protected by the stricter CSP in frontend/nginx.conf.
    app.use((0, helmet_1.default)({ contentSecurityPolicy: false }));
    app.use((0, compression_1.default)());
    app.use((0, cors_1.default)({
        origin: env.FRONTEND_ORIGIN.split(',').map(function (origin) { return origin.trim(); }),
        credentials: true,
    }));
    app.use(express_1.default.json({ limit: '1mb' }));
    app.use(express_1.default.urlencoded({ extended: false }));
    app.use((0, cookie_parser_1.default)());
    app.get('/api/health', function (_req, res) {
        res.json({
            success: true,
            result: { service: 'WorkClub API', status: 'ok', version: '1.1.0' },
        });
    });
    app.get('/api/health/live', function (_req, res) {
        res.json({ success: true, result: { status: 'alive' } });
    });
    app.get('/api/health/ready', function (_req, res) {
        var ready = mongoose_1.default.connection.readyState === 1;
        res.status(ready ? 200 : 503).json({
            success: ready,
            result: { status: ready ? 'ready' : 'not_ready', database: ready ? 'up' : 'down' },
        });
    });
    app.get('/api/metrics', function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    if (env.METRICS_TOKEN &&
                        req.headers.authorization !== "Bearer ".concat(env.METRICS_TOKEN)) {
                        return [2 /*return*/, res.status(401).json({ success: false, message: 'Metrics authorization required.' })];
                    }
                    res.setHeader('content-type', metrics_1.metricsRegistry.contentType);
                    _b = (_a = res).send;
                    return [4 /*yield*/, metrics_1.metricsRegistry.metrics()];
                case 1: return [2 /*return*/, _b.apply(_a, [_c.sent()])];
            }
        });
    }); });
    app.get('/api/docs.json', function (_req, res) { return res.json(openApiDocument); });
    app.use('/api/docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(openApiDocument));
    app.use('/api/auth/login', (0, express_rate_limit_1.default)({
        windowMs: 15 * 60 * 1000,
        limit: 10,
        standardHeaders: true,
        legacyHeaders: false,
        skipSuccessfulRequests: true,
    }));
    app.use(['/api/auth/register-workspace', '/api/auth/request-password-reset', '/api/auth/resend-verification'], (0, express_rate_limit_1.default)({ windowMs: 60 * 60 * 1000, limit: 10, standardHeaders: true, legacyHeaders: false }));
    app.use('/api/auth', (0, express_rate_limit_1.default)({ windowMs: 15 * 60 * 1000, limit: 100, standardHeaders: true, legacyHeaders: false }), authRoutes_1.authRoutes);
    app.use('/api', authenticate_1.authenticate);
    app.use('/api', auditMutations_1.auditMutations);
    app.use('/api/dashboard', dashboardRoutes_1.dashboardRoutes);
    app.use('/api/client', clientRoutes_1.clientRoutes);
    app.use('/api/project', projectRoutes_1.projectRoutes);
    app.use('/api/task', taskRoutes_1.taskRoutes);
    app.use('/api/timeentry', timeEntryRoutes_1.timeEntryRoutes);
    app.use('/api/invoice', invoiceRoutes_1.invoiceRoutes);
    app.use('/api/proposal', proposalRoutes_1.proposalRoutes);
    app.use('/api/team', teamRoutes_1.teamRoutes);
    app.use('/api/workspace', workspaceRoutes_1.workspaceRoutes);
    app.use('/api/notification', notificationRoutes_1.notificationRoutes);
    app.use('/api/portal', portalRoutes_1.portalRoutes);
    app.use('/api/audit', auditRoutes_1.auditRoutes);
    app.use(function (_req, _res, next) { return next(new apiError_1.ApiError(404, 'Route not found.')); });
    app.use(function (error, req, res, _next) {
        var _a, _b;
        if (error instanceof apiError_1.ApiError) {
            return res
                .status(error.status)
                .json({ success: false, message: error.message, details: (_a = error.details) !== null && _a !== void 0 ? _a : null });
        }
        var possibleMongoError = error;
        if (possibleMongoError.code === 11000) {
            return res.status(409).json({
                success: false,
                message: 'A record with this unique value already exists.',
                details: (_b = possibleMongoError.keyValue) !== null && _b !== void 0 ? _b : null,
            });
        }
        if (env.NODE_ENV !== 'test')
            req.log.error({ error: error }, 'Unhandled request error');
        return res.status(500).json({
            success: false,
            message: env.NODE_ENV === 'production' ? 'Internal server error.' : possibleMongoError.message,
        });
    });
    return app;
}
