import type { CreateUserSchema, UserSchema } from "@lib/schema-validator";
import { PermissionRoleMap } from "@lib/shared";
import { genHash } from "@lib/crypt";
import { gen_id } from "@lib/utility";
import { prisma_db } from "@lib/database";

//***********************************************
//* user
//***********************************************

export const get_user_by_id = async (id: number) => {
  const user = await prisma_db.user.findUnique({
    where: { id },
    include: { roles: true },
  });
  return user;
}; // get_user_by_id

export const create_user = async (payload: CreateUserSchema) => {
  const user = await prisma_db.user.create({
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
          updated_by: 1,
        },
      },
    },
  });
  return user;
}; // create_user

export const patch_user = async (payload: UserSchema) => {
  const user = await prisma_db.user.update({
    where: { email: payload.email },
    data: {
      first_name: payload.first_name,
      last_name: payload.last_name,
    },
  });
  return user;
}; // patch_user

export const patch_user_password = async (payload: CreateUserSchema) => {
  const user = await prisma_db.user.update({
    where: { email: payload.email },
    data: { password: await genHash(payload.password) },
  });
  return user;
}; // patch_user

export const soft_delete_user = async (id: number) => {
  const user = await prisma_db.user.update({
    where: { id },
    data: { deleted: new Date() },
  });
  return user;
}; // soft_delete_user
