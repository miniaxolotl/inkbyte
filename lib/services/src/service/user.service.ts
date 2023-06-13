import { isFuture } from "date-fns";

import { BaseUser, PermissionRoleMap } from "@lib/shared";
import type { UserCreateSchema, UserSchema } from "@lib/schema-validator";
import { genHash } from "@lib/crypt";
import { gen_id } from "@lib/utility";
import { prisma_db } from "@lib/database";

//***********************************************
//* user
//***********************************************

export const get_users = async () => {
  const user = await prisma_db.user.findMany({
    include: {
      image: true,
      roles: {
        where: { deleted: null },
        orderBy: { role: { authority: "desc" } },
        include: {
          role: true,
        },
      },
    },
  });
  return user;
}; // get_users

export const get_user_by_id = async (id: number) => {
  const user = await prisma_db.user.findUnique({
    where: { id },
    include: {
      image: true,
      roles: {
        where: { deleted: null },
        orderBy: { role: { authority: "desc" } },
        include: {
          role: true,
        },
      },
    },
  });
  return user;
}; // get_user_by_id

export const get_user_by_email = async (email: string) => {
  const user = await prisma_db.user.findUnique({
    where: { email },
    include: {
      image: true,
      roles: {
        where: { deleted: null },
        orderBy: { role: { authority: "desc" } },
        include: {
          role: true,
        },
      },
    },
  });
  return user;
}; // get_user_by_email

export const create_user = async (payload: UserCreateSchema) => {
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
          role_id: PermissionRoleMap.basic_user.id,
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

export const patch_user_password = async (payload: UserCreateSchema) => {
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

//***********************************************
//* user utility
//***********************************************

export const update_user_last_ip = async (user_id: number, last_ip: string) => {
  return await prisma_db.user.update({
    where: { id: user_id },
    data: { last_ip },
  });
}; // update_user_last_ip

export const is_user_verified = (user: BaseUser) => {
  if (!user.verification_token || !user.verification_date) return false;
  if (isFuture(user.verification_date)) return false;
  return true;
}; // is_user_verified
