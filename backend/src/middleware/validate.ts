import type { RequestHandler } from 'express';
import type { ZodTypeAny } from 'zod';
import { ApiError } from '../utils/apiError';

export function validate(
  schemas: { body?: ZodTypeAny; params?: ZodTypeAny; query?: ZodTypeAny }
): RequestHandler {
  return (req, _res, next) => {
    for (const key of ['body', 'params', 'query'] as const) {
      const schema = schemas[key];
      if (!schema) continue;
      const parsed = schema.safeParse(req[key]);
      if (!parsed.success) {
        return next(new ApiError(422, 'Validation failed.', parsed.error.flatten()));
      }
      if (key === 'body') req.body = parsed.data;
      else Object.assign(req[key], parsed.data);
    }
    return next();
  };
}
