import { Next, ParameterizedContext } from "koa";

import { BaseMap, exclude } from "@lib/utility";

export const sanitize = async (ctx: ParameterizedContext, next: Next) => {
  await next();
  ctx.body = exclude(ctx.body as BaseMap, {
    keys: ["id", "password"],
    like: ["_id"],
  });
  if (typeof ctx.body === "string") ctx.set("Content-Type", "text/plain");
};
