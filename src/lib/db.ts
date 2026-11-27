import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  prismaSchemaVersion?: string;
};

const CURRENT_SCHEMA_VERSION = 'v2-debeCambiarClave-qroa';

if (globalForPrisma.prismaSchemaVersion !== CURRENT_SCHEMA_VERSION) {
  globalForPrisma.prisma = undefined;
  globalForPrisma.prismaSchemaVersion = CURRENT_SCHEMA_VERSION;
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasourceUrl:
      process.env.DATABASE_URL_POOLED || process.env.DATABASE_URL,
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;
