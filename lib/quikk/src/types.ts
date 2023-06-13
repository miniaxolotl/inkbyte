export type HTTPMethod = "delete" | "get" | "patch" | "post" | "put" | "search";

export type HTTPStatusCodes = 200 | 201 | 204 | 400 | 401 | 404 | 500;

export type QuikkPayload = {
  [x: number | string]: QuikkPayload | number | string;
};

export type GetParams = {
  parameters?: QuikkPayload;
  headers?: { [key: string]: number | string };
};

export type PostParams<T = QuikkPayload> = GetParams & {
  body?: QuikkPayload | T | string;
  formData?: QuikkPayload;
};

export type QuikkParams<T = QuikkPayload> = PostParams<T> & {
  method?: HTTPMethod;
};

export type QuikkClient = ReturnType<
  (options: QuikkParams<QuikkPayload>) => Promise<Response>
>;

export type QuikkResponse<T> = Promise<Response & { json: Promise<T> }>;

export type QuikkConfig = {
  protocol?: "http" | "https";

  base_url: string;
  base_port?: number;
  base_path?: string;

  api_token?: string;
  api_token_type?: string;
  api_version?: string;
};
