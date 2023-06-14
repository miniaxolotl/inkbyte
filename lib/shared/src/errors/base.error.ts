export type BaseErrorOptions = {
  message: string;
  internal_message?: string;
  status?: number;
};

export class BaseError extends Error {
  public status?: number;
  public internal_message?: string;
  constructor(data: BaseErrorOptions) {
    super(data.message);
    this.internal_message = data.internal_message;
    this.status = data.status || 500;
  }
}
