import KoaRouter from "koa-router";
import { ParameterizedContext } from "koa";

import { type IdMap, PermissionRoleMap } from "@lib/shared";
import {
  PathContext,
  PathResolver,
  RoleGuard,
  SchemaContext,
  SchemaResolver,
  SessionGuard,
  create_user,
  get_user_by_id,
  get_users,
  soft_delete_user,
} from "@lib/services";
import { idSchema, userCreateSchema } from "@lib/schema-validator";
import { SUCCESS } from "@lib/utility";
import type { UserCreateSchema } from "@lib/schema-validator";

export const route = ["/user"];
export const router = new KoaRouter();

export const UserController = { router, route };

router.get(
  "/",
  SessionGuard(),
  RoleGuard([PermissionRoleMap.admin_user]),
  async (ctx: ParameterizedContext) => {
    ctx.body = await get_users();
    ctx.status = SUCCESS.OK.status;
  },
); // {get} /v1/user

router.get(
  "/:id",
  SessionGuard(),
  PathResolver(idSchema),
  async (ctx: ParameterizedContext<PathContext<IdMap>>) => {
    const user = await get_user_by_id(ctx.state.path.id);
    ctx.body = user;
    ctx.status = SUCCESS.OK.status;
  },
); // {get} /v1/user/:id

router.post(
  "/",
  SchemaResolver(userCreateSchema),
  async (ctx: ParameterizedContext<SchemaContext<UserCreateSchema>>) => {
    const user = await create_user(ctx.state.body);
    ctx.body = user;
    ctx.status = SUCCESS.CREATED.status;
  },
); // {post} /v1/user

router.delete(
  "/:id",
  SessionGuard(),
  RoleGuard([PermissionRoleMap.admin_user]),
  PathResolver(idSchema),
  async (ctx: ParameterizedContext<PathContext<IdMap>>) => {
    const user = await soft_delete_user(ctx.state.path.id);
    if (!user) ctx.throw(404, "User not found");
    ctx.body = user;
    ctx.status = SUCCESS.OK.status;
  },
); // {delete} /v1/user
