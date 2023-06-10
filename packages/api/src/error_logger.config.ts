import { Next, ParameterizedContext } from "koa";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";

import { CLIENT_ERROR } from "@lib/utility";
// import { api_config } from "@lib/config";

export const error_logger = async (ctx: ParameterizedContext, next: Next) => {
  try {
    return await next();
  } catch (e: unknown) {
    if (e instanceof PrismaClientKnownRequestError && e.code === "P2025") {
      ctx.status = CLIENT_ERROR.NOT_FOUND.status;
      ctx.body = CLIENT_ERROR.NOT_FOUND.message;
    }

    // if (api_config.print_errors) console.log(e as Error);
  }
};
