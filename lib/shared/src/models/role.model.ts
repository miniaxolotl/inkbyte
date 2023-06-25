//***********************************************
//* role
//***********************************************

export type PermissionRole =
  | "admin_user"
  | "disabled"
  | "basic_user"
  | "premium_user";

export type BaseRole = {
  id: number;
  slug: PermissionRole;
  authority: number;
};

export type RoleModel = BaseRole & {
  updated: Date;
  created: Date;
  deleted?: Date | null;
};
