//***********************************************
//* role
//***********************************************

export type PermissionRole = "PREMIUM_USER" | "BASIC_USER" | "ADMIN_USER";

export type BaseRole = {
  id: number;
  slug: Lowercase<PermissionRole>;
  authority: number;
  deleted?: boolean;
};
