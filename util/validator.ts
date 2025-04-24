import { ZodError, ZodSchema } from 'zod';
import type { ValidationTargets } from 'hono';
import { validator } from 'hono/validator';
import { ApiResponse } from '@/schemas/api-response.ts';

const formatZodError = (error: ZodError): string =>
  error.errors
    .map((err) => `${err.path.join('.')}: ${err.message}`)
    .join(', ');

export const validateSchema = <
  T extends ZodSchema,
  Target extends keyof ValidationTargets,
>(target: Target, schema: T) => {
  return validator(target, (value, c) => {
    const parsed = schema.safeParse(value);
    if (!parsed.success) {
      const apiResponse: ApiResponse = {
        error: {
          code: 'BAD_REQUEST',
          message: formatZodError(parsed.error),
        },
        success: false,
      };
      return c.json(apiResponse, 400);
    }
    return parsed.data;
  });
};
