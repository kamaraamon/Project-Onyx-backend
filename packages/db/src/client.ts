import { Prisma, PrismaClient } from '@prisma/client';
import { loadEnv } from '@onyx/config';

const appendOnlyBlocked = new Set(['update', 'updateMany', 'delete', 'deleteMany', 'upsert']);

function createClient() {
  loadEnv();
  const base = new PrismaClient();
  return base.$extends({
    query: {
      auditLog: {
        $allOperations({ operation, args, query }) {
          if (appendOnlyBlocked.has(operation)) {
            throw new Error('AuditLog is append-only');
          }
          return query(args);
        },
      },
    },
  });
}

type OnyxPrisma = ReturnType<typeof createClient>;

const globalForPrisma = globalThis as unknown as { onyxPrisma?: OnyxPrisma };

export const prisma = globalForPrisma.onyxPrisma ?? createClient();

globalForPrisma.onyxPrisma = prisma;

export async function appendAuditLog(entry: {
  userId?: string;
  action: string;
  metadata?: Prisma.InputJsonValue;
}) {
  return prisma.auditLog.create({
    data: {
      action: entry.action,
      ...(entry.userId ? { userId: entry.userId } : {}),
      ...(entry.metadata !== undefined ? { metadata: entry.metadata } : {}),
    },
  });
}
