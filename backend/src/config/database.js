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
exports.connectDatabase = connectDatabase;
exports.disconnectDatabase = disconnectDatabase;
var promises_1 = require("fs/promises");
var path_1 = require("path");
var mongoose_1 = require("mongoose");
var env_1 = require("./env");
var mongod;
var memoryDbPath;
function connectDatabase() {
    return __awaiter(this, void 0, void 0, function () {
        var env, uri, MongoMemoryServer_1, error_1;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    env = (0, env_1.getEnv)();
                    mongoose_1.default.set("strictQuery", true);
                    uri = env.MONGO_URI;
                    if (!(process.env.USE_IN_MEMORY_MONGO === 'true')) return [3 /*break*/, 8];
                    return [4 /*yield*/, Promise.resolve().then(function () { return require('mongodb-memory-server'); })];
                case 1:
                    MongoMemoryServer_1 = (_b.sent()).MongoMemoryServer;
                    return [4 /*yield*/, (0, promises_1.mkdtemp)((0, path_1.join)(process.cwd(), '.workclub-mongodb-'))];
                case 2:
                    memoryDbPath = _b.sent();
                    _b.label = 3;
                case 3:
                    _b.trys.push([3, 5, , 7]);
                    return [4 /*yield*/, MongoMemoryServer_1.create({
                            binary: { version: (_a = process.env.MONGOMS_VERSION) !== null && _a !== void 0 ? _a : '8.0.4' },
                            instance: {
                                dbPath: memoryDbPath,
                                storageEngine: 'wiredTiger',
                                args: process.platform === 'win32' ? [] : ['--nounixsocket'],
                            },
                        })];
                case 4:
                    mongod = _b.sent();
                    return [3 /*break*/, 7];
                case 5:
                    error_1 = _b.sent();
                    return [4 /*yield*/, removeMemoryDatabaseFiles()];
                case 6:
                    _b.sent();
                    throw error_1;
                case 7:
                    uri = mongod.getUri();
                    _b.label = 8;
                case 8: return [2 /*return*/, mongoose_1.default.connect(uri, {
                        maxPoolSize: env.MONGO_MAX_POOL_SIZE,
                        serverSelectionTimeoutMS: env.MONGO_SERVER_SELECTION_TIMEOUT_MS,
                        autoIndex: env.NODE_ENV !== "production",
                    })];
            }
        });
    });
}
function disconnectDatabase() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, , 2, 8]);
                    return [4 /*yield*/, mongoose_1.default.disconnect()];
                case 1:
                    _a.sent();
                    return [3 /*break*/, 8];
                case 2:
                    _a.trys.push([2, , 5, 7]);
                    if (!mongod) return [3 /*break*/, 4];
                    return [4 /*yield*/, mongod.stop()];
                case 3:
                    _a.sent();
                    _a.label = 4;
                case 4: return [3 /*break*/, 7];
                case 5:
                    mongod = undefined;
                    return [4 /*yield*/, removeMemoryDatabaseFiles()];
                case 6:
                    _a.sent();
                    return [7 /*endfinally*/];
                case 7: return [7 /*endfinally*/];
                case 8: return [2 /*return*/];
            }
        });
    });
}
function removeMemoryDatabaseFiles() {
    return __awaiter(this, void 0, void 0, function () {
        var pathToRemove;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!memoryDbPath) return [3 /*break*/, 2];
                    pathToRemove = memoryDbPath;
                    memoryDbPath = undefined;
                    return [4 /*yield*/, (0, promises_1.rm)(pathToRemove, { recursive: true, force: true })];
                case 1:
                    _a.sent();
                    _a.label = 2;
                case 2: return [2 /*return*/];
            }
        });
    });
}
