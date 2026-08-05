"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadOpenApiDocument = loadOpenApiDocument;
var fs_1 = require("fs");
var path_1 = require("path");
var yaml_1 = require("yaml");
var candidates = [
    (0, path_1.resolve)(process.cwd(), 'openapi.yaml'),
    (0, path_1.resolve)(process.cwd(), 'backend/openapi.yaml'),
    (0, path_1.resolve)(__dirname, '../../openapi.yaml'),
];
function loadOpenApiDocument() {
    var path = candidates.find(function (candidate) {
        try {
            (0, fs_1.readFileSync)(candidate);
            return true;
        }
        catch (_a) {
            return false;
        }
    });
    if (!path)
        throw new Error('Unable to locate backend/openapi.yaml.');
    return yaml_1.default.parse((0, fs_1.readFileSync)(path, 'utf8'));
}
