import { InferType } from "yup";

import { createUserSchema, userSchema } from "@lib/schema-validator";
import { BaseUser } from "@lib/shared";
import { genHash } from "@lib/crypt";
import { gen_id } from "@lib/utility";
import { prisma_db } from "@lib/database";

//***********************************************
//* user
//***********************************************

export const create_user = async (
  payload: InferType<typeof createUserSchema>,
) => {
  return await prisma_db.user.create({
    data: {
      uid: gen_id(),
      email: payload.email,
      password: await genHash(payload.password),
    },
  });
}; // create_user

//***********************************************
//* user: other
//***********************************************

export const patch_user = async (
  payload: InferType<typeof userSchema> & BaseUser,
) => {
  return await prisma_db.user.update({
    where: {
      email: payload.email,
    },
    data: {
      first_name: payload.first_name,
      last_name: payload.last_name,
      last_ip: payload.last_ip,
    },
  });
}; // patch_user
