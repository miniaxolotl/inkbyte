import { PrismaClient } from '@prisma/client';

export const prisma_db: PrismaClient = new PrismaClient({});

export const connect_prisma = async () => {
  try {
    await prisma_db.$connect();
    console.log(`[database]: connected to prisma`);
  } catch {
    console.log(`[database]: {error} prisma`);
  }
};
