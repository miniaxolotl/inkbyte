import { Next, ParameterizedContext } from "koa";

import {
  BaseRole,
  PermissionRoleMap,
  SessionModel,
  UserModel,
} from "@lib/shared";
import { CLIENT_ERROR } from "@lib/utility";

import {
  get_session_by_token,
  is_session_expired,
  is_user_verified,
  update_user_last_ip,
} from "../service";

type SessionGuardOptions = {
  passthrough?: boolean;
};

export type SessionContext = {
  session: SessionModel;
  user: Required<UserModel>;
  roles: BaseRole[];
  authority: number;
};

export const SessionGuard = (
  options: SessionGuardOptions = { passthrough: false },
) => {
  return async (ctx: ParameterizedContext<SessionContext>, next: Next) => {
    const authorization = ctx.headers.authorization;
    if (authorization && authorization.length > 0) {
      const [authorization_type, authorization_key] = authorization.split(" ");
      if (authorization_type === "Basic" && authorization_key) {
        const session = await get_session_by_token(authorization_key);
        if (
          session &&
          !is_session_expired(session) &&
          is_user_verified(session.user)
        ) {
          update_user_last_ip(session.user_id, ctx.ip);
          ctx.state = {
            ...ctx.state,
            session: session,
            user: session.user,
            roles: session.user.roles.map((x) => x.role),
            authority: session.user.roles[0].role.authority,
          } as SessionContext;
          return await next();
        }
      }
    }
    if (options.passthrough) {
      ctx.state = {
        ...ctx.state,
        roles: [PermissionRoleMap.basic_user],
        authority: PermissionRoleMap.basic_user.authority,
      };
      return await next();
    }
    ctx.throw(
      CLIENT_ERROR.UNAUTHORIZED.status,
      CLIENT_ERROR.UNAUTHORIZED.message,
    );
  };
};
