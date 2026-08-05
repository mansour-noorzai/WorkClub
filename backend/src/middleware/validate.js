"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = validate;
var apiError_1 = require("../utils/apiError");
function validate(schemas) {
    return function (req, _res, next) {
        for (var _i = 0, _a = ['body', 'params', 'query']; _i < _a.length; _i++) {
            var key = _a[_i];
            var schema = schemas[key];
            if (!schema)
                continue;
            var parsed = schema.safeParse(req[key]);
            if (!parsed.success) {
                return next(new apiError_1.ApiError(422, 'Validation failed.', parsed.error.flatten()));
            }
            if (key === 'body')
                req.body = parsed.data;
            else
                Object.assign(req[key], parsed.data);
        }
        return next();
    };
}
