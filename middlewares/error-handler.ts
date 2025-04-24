import { Context, Next } from 'hono';
import { ApiResponse } from '@/schemas/api-response.ts';

export const errorHandler = async (c: Context, next: Next) => {
  try {
    await next();
  } catch (error) {
    console.error('Error:', error);

    const apiResponse: ApiResponse = {
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: error instanceof Error
          ? error.message
          : 'An unexpected error occurred',
      },
    };

    return c.json(apiResponse, 500);
  }
};
