import KoaRouter from "koa-router";
import { ParameterizedContext } from "koa";

export const route = ["/session"];
export const router = new KoaRouter();

export const SessionController = { router, route };

router.get("/", async (ctx: ParameterizedContext) => {
  ctx.body = "/api/v1/auth";
  ctx.status = 201;
}); // {get} /v1/auth

router.post("/", async (ctx: ParameterizedContext) => {
  ctx.body = "/api/v1/auth";
  ctx.status = 201;
}); // {post} /v1/auth

router.delete("/", async (ctx: ParameterizedContext) => {
  ctx.body = "/api/v1/auth";
  ctx.status = 200;
}); // {delete} /v1/auth
