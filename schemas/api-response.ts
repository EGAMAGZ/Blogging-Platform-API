type ErrorCode =
  | 'NOT_FOUND'
  | 'UNAUTHORIZED'
  | 'BAD_REQUEST'
  | 'SERVER_ERROR';

export type ApiSuccessResponse<T> = {
  success: true;
  data: T;
  message?: string;
};

export type ApiErrorResponse = {
  success: false;
  error: {
    message: string;
    code: ErrorCode;
  };
};

export type ApiResponse<T = void> = T extends void ? ApiErrorResponse
  : ApiSuccessResponse<T> | ApiErrorResponse;
