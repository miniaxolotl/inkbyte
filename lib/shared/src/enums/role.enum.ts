//***********************************************
//* role
//***********************************************

import { BaseRole } from "../";

export enum PermissionRoleEnum {
  ADMIN_USER = "admin_user",
  BASIC_USER = "basic_user",
  PREMIUM_USER = "premium_user",
}

export const PermissionRoleMap: { [x in PermissionRoleEnum]: BaseRole } = {
  admin_user: {
    id: 1,
    slug: PermissionRoleEnum.ADMIN_USER,
    authority: 100,
  },
  basic_user: {
    id: 2,
    slug: PermissionRoleEnum.BASIC_USER,
    authority: 5,
  },
  premium_user: {
    id: 3,
    slug: PermissionRoleEnum.PREMIUM_USER,
    authority: 10,
  },
};
