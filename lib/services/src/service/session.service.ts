import { addDays, isPast } from "date-fns";

import { SessionModel } from "@lib/shared";
import type { UserLoginSchema } from "@lib/schema-validator";
import { compare } from "@lib/crypt";
import { gen_id } from "@lib/utility";
import { prisma_db } from "@lib/database";

import { get_user_by_email, is_user_verified } from "./user.service";

//***********************************************
//* session
//***********************************************

// const MAX_SESSION_LENGTH = 1000 * 60 * 15; // NOTE: 15 minutes
export const MAX_SESSION_LENGTH = 30; // NOTE: 30 days
export const MAX_SESSION_LENGTH_MS = 1000 * 60 * 60 * 24 * MAX_SESSION_LENGTH; // NOTE: 30 days

export const get_session_by_token = async (token: string) => {
  return await prisma_db.session.findUnique({
    where: { token },
    include: {
      user: {
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
      },
    },
  });
}; // get_session_by_token

export const create_session = async (user_id: number) => {
  return await prisma_db.session.create({
    data: {
      user_id,
      token: gen_id(24),
      deleted: addDays(new Date(), MAX_SESSION_LENGTH),
    },
    include: {
      user: {
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
      },
    },
  });
}; // create_session

//***********************************************
//* session utility
//***********************************************

export const login = async ({ email, password }: UserLoginSchema) => {
  const user = await get_user_by_email(email);
  if (!user || !is_user_verified(user) || user.deleted) return null;
  if (!(await compare(password, user.password))) return null;
  return await create_session(user.id);
}; // login

export const refresh_session = async (session_token: string) => {
  return await prisma_db.session.update({
    where: { token: session_token },
    data: { deleted: addDays(new Date(), MAX_SESSION_LENGTH) },
    include: {
      user: {
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
      },
    },
  });
}; // refresh_session

export const is_session_expired = (session: SessionModel) => {
  return session.deleted ? isPast(session.deleted) : true;
}; // is_session_expired
