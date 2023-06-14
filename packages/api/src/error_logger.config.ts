import { Next, ParameterizedContext } from "koa";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";

import { CLIENT_ERROR, HTTP_RESPONSE_TYPE, SERVER_ERROR } from "@lib/utility";
import { api_config } from "@lib/config";

export const error_logger = async (ctx: ParameterizedContext, next: Next) => {
  try {
    return await next();
  } catch (e: unknown) {
    if (e instanceof PrismaClientKnownRequestError && e.code === "P2025") {
      ctx.status = CLIENT_ERROR.NOT_FOUND.status;
      ctx.body = CLIENT_ERROR.NOT_FOUND.message;
    } else {
      const error: HTTP_RESPONSE_TYPE = e as HTTP_RESPONSE_TYPE;
      ctx.status = error.status ?? SERVER_ERROR.INTERNAL.status;
      if (api_config.print_errors) console.log(e as Error);
      if (error.status) {
        ctx.body = error.status ? error.message : SERVER_ERROR.INTERNAL.message;
      } else {
        ctx.status = SERVER_ERROR.INTERNAL.status;
        ctx.body = error.message ?? SERVER_ERROR.INTERNAL.message;
      }
      if (typeof ctx.body === "string") ctx.set("Content-Type", "text/plain");
    }
  }
};
