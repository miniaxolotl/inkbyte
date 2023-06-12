import { InferType, number, object, string } from "yup";

//***********************************************
//* user
//***********************************************

export const idSchema = object({
  id: number().label("ID").min(1).required(),
});

export const uidSchema = object({
  uid: string().label("UID").min(1).required(),
});

export type IdSchema = InferType<typeof idSchema>;

export type UidSchema = InferType<typeof uidSchema>;
