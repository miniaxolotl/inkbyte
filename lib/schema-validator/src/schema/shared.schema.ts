import yup, { InferType, object } from "yup";

//***********************************************
//* user
//***********************************************

export const idSchema = object({
  id: yup.number().label("ID").min(1).required(),
});

export const uidSchema = object({
  uid: yup.string().label("UID").min(1).required(),
});

export type IdSchema = InferType<typeof idSchema>;

export type UidSchema = InferType<typeof uidSchema>;
