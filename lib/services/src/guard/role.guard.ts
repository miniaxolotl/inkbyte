import { Next, ParameterizedContext } from "koa";

import { BaseRole, PermissionRoleMap } from "@lib/shared";
import { CLIENT_ERROR } from "@lib/utility";

import { SessionContext } from "..";

export const RoleGuard = (roles: BaseRole[], options?: { exact?: boolean }) => {
  return async (ctx: ParameterizedContext<SessionContext>, next: Next) => {
    for (const role of ctx.state.roles) {
      if (role.authority === PermissionRoleMap.admin_user.authority) {
        return await next();
      }
      if (role.id === PermissionRoleMap.disabled.id) {
        return ctx.throw(
          CLIENT_ERROR.UNAUTHORIZED.status,
          CLIENT_ERROR.UNAUTHORIZED.message,
        );
      }
      for (const requirement of roles) {
        if (options?.exact) {
          if (role.authority === requirement.authority) return await next();
        } else {
          if (role.authority >= requirement.authority) return await next();
        }
      }
    }
    return ctx.throw(
      CLIENT_ERROR.UNAUTHORIZED.status,
      CLIENT_ERROR.UNAUTHORIZED.message,
    );
  };
};
