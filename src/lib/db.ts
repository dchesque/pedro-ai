import { PrismaClient } from "../../prisma/generated/client_final";

const globalForPrisma = globalThis as unknown as {
  prismaInstance: PrismaClient | undefined
}

export const db = globalForPrisma.prismaInstance ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prismaInstance = db
