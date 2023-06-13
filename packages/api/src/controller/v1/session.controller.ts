import {
  SchemaContext,
  SchemaResolver,
  SessionContext,
  SessionGuard,
  login,
  refresh_session,
} from "@lib/services";
import { UserLoginSchema, userLoginSchema } from "@lib/schema-validator";
import KoaRouter from "koa-router";
import { ParameterizedContext } from "koa";

export const route = ["/auth", "/session"];
export const router = new KoaRouter();

export const SessionController = { router, route };

router.post(
  "/",
  SchemaResolver(userLoginSchema),
  async (ctx: ParameterizedContext<SchemaContext<UserLoginSchema>>) => {
    ctx.body = await login(ctx.state.body);
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
