export type DatabaseError =
  | { type: 'NOT_FOUND'; message: string }
  | { type: 'VALIDATION_ERROR'; message: string }
  | { type: 'DATABASE_ERROR'; message: string };

export type DatabaseData<T> = {
  data: T;
  message: string;
};
