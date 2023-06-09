import yup, { object } from "yup";

//***********************************************
//* user
//***********************************************

export const userSchema = object({
  email: yup.string().label("Email").email().max(32).required(),
  first_name: yup.string().label("First Name").min(2).max(32).required(),
  last_name: yup.string().label("Last Name").min(2).max(32).required(),
});

export const createUserSchema = object({
  email: yup.string().label("Email").email().max(32).required(),
  first_name: yup.string().label("First Name").min(2).max(32).required(),
  last_name: yup.string().label("Last Name").min(2).max(32).required(),
  password: yup
    .string()
    .label("Password")
    .min(8)
    .max(128)
    .equals([yup.ref("confirm_password")], "Passwords must match")
    .required(),
  confirm_password: yup
    .string()
    .label("Confirm Password")
    .min(8)
    .max(128)
    .equals([yup.ref("password")], "Passwords must match")
    .required(),
});
