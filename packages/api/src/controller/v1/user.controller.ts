import KoaRouter from "koa-router";
import { ParameterizedContext } from "koa";

import { SchemaResolver } from "@lib/services";
import { createUserSchema } from "@lib/schema-validator";

export const route = ["/user"];
export const router = new KoaRouter();

export const UserController = { router, route };

router.get("/", async (ctx: ParameterizedContext) => {
  ctx.body = "/api/v1/user";
  ctx.status = 200;
}); // {get} /v1/user

router.post(
  "/",
  SchemaResolver(createUserSchema),
  async (ctx: ParameterizedContext) => {
    ctx.body = "/api/v1/user";
    ctx.status = 201;
  },
); // {post} /v1/user

router.delete("/", async (ctx: ParameterizedContext) => {
  ctx.body = "/api/v1/user";
  ctx.status = 200;
}); // {delete} /v1/user
