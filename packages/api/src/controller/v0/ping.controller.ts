import KoaRouter from "koa-router";
import { ParameterizedContext } from "koa";

import { SUCCESS } from "@lib/utility";

export const route = ["/ping"];
export const router = new KoaRouter();

export const PingController = { router, route };

router.get("/", async (ctx: ParameterizedContext) => {
  ctx.response.body = "Pong!";
  ctx.response.status = SUCCESS.OK.status;
}); // {get} /v1/hello
