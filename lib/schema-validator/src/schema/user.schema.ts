import { InferType, boolean, object, ref, string } from "yup";

//***********************************************
//* user
//***********************************************

export const userSchema = object({
  email: string().label("Email").email().max(32).required(),
  first_name: string().label("First Name").min(2).max(32).required(),
  last_name: string().label("Last Name").min(2).max(32).required(),
});

export const createUserSchema = object({
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

export const loginUserSchema = object({
  email: string().label("Email").email().max(32).required(),
  password: string().label("Password").min(8).max(128).required(),
  remember_me: boolean().label("Remember me").default(false),
});

export const resetUserSchema = object({
  email: string().label("Email").email().max(32).required(),
});

export type UserSchema = InferType<typeof userSchema>;

export type CreateUserSchema = InferType<typeof createUserSchema>;

export type LoginUserSchema = InferType<typeof loginUserSchema>;

export type ResetUserSchema = InferType<typeof resetUserSchema>;
