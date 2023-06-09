import { InferType } from "yup";

import { BaseUser, PermissionRoleMap } from "@lib/shared";
import { createUserSchema, userSchema } from "@lib/schema-validator";
import { genHash } from "@lib/crypt";
import { gen_id } from "@lib/utility";
import { prisma_db } from "@lib/database";

//***********************************************
//* user
//***********************************************

export const create_user = async (
  payload: InferType<typeof createUserSchema>,
  updated_by = 1,
) => {
  return await prisma_db.user.create({
    data: {
      uid: gen_id(),
      email: payload.email,
      first_name: payload.first_name,
      last_name: payload.last_name,
      password: await genHash(payload.password),
      // TODO: implement email verification
      verification_token: gen_id(),
      verification_date: new Date(),
      roles: {
        create: {
          role_id: PermissionRoleMap.BASIC_USER.id,
          updated_by,
        },
      },
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
