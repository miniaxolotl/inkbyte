import KoaRouter from "koa-router";
import { ParameterizedContext } from "koa";

import {
  SchemaContext,
  SchemaResolver,
  SessionContext,
  SessionGuard,
  login,
  refresh_session,
} from "@lib/services";
import { UserLoginSchema, userLoginSchema } from "@lib/schema-validator";
import { CLIENT_ERROR } from "@lib/utility";

export const route = ["/auth", "/session"];
export const router = new KoaRouter();

export const SessionController = { router, route };

router.post(
  "/",
  SchemaResolver(userLoginSchema),
  async (ctx: ParameterizedContext<SchemaContext<UserLoginSchema>>) => {
    const user = await login(ctx.state.body);
    if (!user) {
      ctx.throw(
        CLIENT_ERROR.UNAUTHORIZED.status,
        CLIENT_ERROR.UNAUTHORIZED.message,
      );
    }

    ctx.body = user;
    ctx.status = 201;
  },
); // {post} /v1/auth

router.post(
  "/refresh",
  SessionGuard(),
  async (ctx: ParameterizedContext<SessionContext>) => {
    ctx.body = await refresh_session(ctx.state.session.token);
    ctx.status = 201;
  },
); // {post} /v1/auth/refresh
