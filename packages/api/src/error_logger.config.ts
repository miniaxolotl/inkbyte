import { Next, ParameterizedContext } from "koa";

import { api_config } from "@lib/config";

export const error_logger = async (ctx: ParameterizedContext, next: Next) => {
  try {
    return await next();
  } catch (e: unknown) {
    if (api_config.print_errors) console.log(e as Error);
  }
};
