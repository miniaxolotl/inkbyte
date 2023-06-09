//***********************************************
//* role
//***********************************************

export enum PermissionRoleEnum {
  PREMIUM_USER = "PREMIUM_USER",
  BASIC_USER = "BASIC_USER",
  ADMIN_USER = "ADMIN_USER",
}

export const PermissionRoleMap = {
  ADMIN_USER: {
    id: 1,
    slug: PermissionRoleEnum.ADMIN_USER,
    authority: 100,
  },
  BASIC_USER: {
    id: 2,
    slug: PermissionRoleEnum.BASIC_USER,
    authority: 5,
  },
  PREMIUM_USER: {
    id: 3,
    slug: PermissionRoleEnum.PREMIUM_USER,
    authority: 10,
  },
};
