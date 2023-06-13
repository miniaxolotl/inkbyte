import { InferType, boolean, object, ref, string } from "yup";

//***********************************************
//* user
//***********************************************

export const userSchema = object({
  email: string().label("Email").email().max(32).required(),
  first_name: string().label("First Name").min(2).max(32).required(),
  last_name: string().label("Last Name").min(2).max(32).required(),
});

export const userCreateSchema = object({
  email: string().label("Email").email().max(32).required(),
  first_name: string().label("First Name").min(2).max(32).required(),
  last_name: string().label("Last Name").min(2).max(32).required(),
  password: string()
    .label("Password")
    .min(8)
    .max(128)
    .equals([ref("confirm_password")], "Passwords must match")
    .required(),
  confirm_password: string()
    .label("Confirm Password")
    .min(8)
    .max(128)
    .equals([ref("password")], "Passwords must match")
    .required(),
  marketing_opt_out: boolean().label("Email Updates").default(false),
});

export const userLoginSchema = object({
  email: string().label("Email").email().max(32).required(),
  password: string().label("Password").min(8).max(128).required(),
  remember_me: boolean().label("Remember me").default(false),
});

export const userResetSchema = object({
  email: string().label("Email").email().max(32).required(),
});

export type UserSchema = InferType<typeof userSchema>;

export type UserCreateSchema = InferType<typeof userCreateSchema>;

export type UserLoginSchema = InferType<typeof userLoginSchema>;

export type UserResetSchema = InferType<typeof userResetSchema>;
