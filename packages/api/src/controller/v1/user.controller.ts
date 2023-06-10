import KoaRouter from "koa-router";
import { ParameterizedContext } from "koa";

import {
  PathContext,
  PathResolver,
  SchemaContext,
  SchemaResolver,
  create_user,
  get_user_by_id,
  get_users,
  soft_delete_user,
} from "@lib/services";
import type { IdMap } from "@lib/shared";

import { createUserSchema, idSchema } from "@lib/schema-validator";
import type { CreateUserSchema } from "@lib/schema-validator";
import { SUCCESS } from "@lib/utility";

export const route = ["/user"];
export const router = new KoaRouter();

export const UserController = { router, route };

router.get("/", async (ctx: ParameterizedContext) => {
  ctx.body = await get_users();
  ctx.status = SUCCESS.OK.status;
}); // {get} /v1/user

router.get(
  "/:id",
  PathResolver(idSchema),
  async (ctx: ParameterizedContext<PathContext<IdMap>>) => {
    const user = await get_user_by_id(ctx.state.path.id);
    ctx.body = user;
    ctx.status = SUCCESS.OK.status;
  },
); // {get} /v1/user/:id

router.post(
  "/",
  SchemaResolver(createUserSchema),
  async (ctx: ParameterizedContext<SchemaContext<CreateUserSchema>>) => {
    const user = await create_user(ctx.state.body);
    ctx.body = user;
    ctx.status = SUCCESS.CREATED.status;
  },
); // {post} /v1/user

router.delete(
  "/:id",
  PathResolver(idSchema),
  async (ctx: ParameterizedContext<PathContext<IdMap>>) => {
    const user = await soft_delete_user(ctx.state.path.id);
    if (!user) ctx.throw(404, "User not found");
    ctx.body = user;
    ctx.status = SUCCESS.OK.status;
  },
); // {delete} /v1/user
