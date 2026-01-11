import { PrismaClient } from "../../prisma/generated/client_new";

const globalForPrisma = globalThis as unknown as {
  prismaNew: PrismaClient | undefined
}

export const db = globalForPrisma.prismaNew ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prismaNew = db
