import { PrismaClient } from '@prisma/client';

const isDemoService = (process.env.K_SERVICE ?? '').toLowerCase().includes('demo');
if (isDemoService && process.env.DEMO_DATABASE_URL) {
  // Route demo backend traffic to a separate Postgres database when provided.
  process.env.DATABASE_URL = process.env.DEMO_DATABASE_URL;
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
