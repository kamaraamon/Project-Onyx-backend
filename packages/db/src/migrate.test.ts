import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { commandEnv, installProcessEnv } from '@onyx/config';
import { afterAll, describe, expect, it } from 'vitest';

const localUrl = 'postgresql://onyx:onyx@127.0.0.1:5432/onyx';

function assertLocal(url: string): void {
  const host = new URL(url).hostname;
  if (host !== '127.0.0.1' && host !== 'localhost') {
    throw new Error('Migration tests refuse non-local databases');
  }
}

function prisma(args: string[], extra: Record<string, string> = {}): void {
  assertLocal(localUrl);
  execFileSync('pnpm', ['exec', 'prisma', ...args, '--schema', 'prisma/schema.prisma'], {
    cwd: path.join(process.cwd(), 'packages/db'),
    env: commandEnv({ DATABASE_URL: localUrl, DIRECT_URL: localUrl, ...extra }),
    stdio: 'pipe',
  });
}

describe('ephemeral postgres migration', () => {
  afterAll(async () => {
    const globalForPrisma = globalThis as unknown as { onyxPrisma?: { $disconnect?: () => Promise<void> } };
    await globalForPrisma.onyxPrisma?.$disconnect?.();
  });

  it('applies the create-only migration and keeps AuditLog append-only', async () => {
    assertLocal(localUrl);
    const dir = mkdtempSync(path.join(tmpdir(), 'onyx-migrate-'));
    const reset = path.join(dir, 'reset.sql');
    writeFileSync(
      reset,
      'DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public; GRANT ALL ON SCHEMA public TO onyx; GRANT ALL ON SCHEMA public TO public;',
    );
    prisma(['db', 'execute', '--file', reset]);
    prisma(['migrate', 'deploy']);

    installProcessEnv({
      DATABASE_URL: localUrl,
      DIRECT_URL: localUrl,
      SESSION_SECRET: 'session-secret-test-value',
      ADMIN_BOOTSTRAP_EMAIL: 'admin@example.com',
      ADMIN_BOOTSTRAP_PASSWORD: 'bootstrap-pass',
      PAYMENT_PROVIDER: 'mock',
      PAYMENT_MODE: 'none',
      REGISTRATION_MODE: 'invite_only',
      CRON_SECRET: 'cron-secret-test-value',
      TOTP_ENCRYPTION_KEY: 'totp-key-test-value-1',
      INVITATION_TTL_DAYS: '7',
    });

    const { appendAuditLog, prisma: client } = await import('./client');
    const tables = await client.$queryRaw<Array<{ table_name: string }>>`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name LIKE 'onyx_%'
      ORDER BY table_name
    `;
    expect(tables.map((row) => row.table_name)).toEqual([
      'onyx_audit_logs',
      'onyx_login_attempts',
      'onyx_sessions',
      'onyx_users',
    ]);

    const legacy = await client.$queryRaw<Array<{ table_name: string }>>`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name IN ('users', 'wallets', 'subscriptions', 'coffre_fort')
    `;
    expect(legacy).toEqual([]);

    const user = await client.user.create({
      data: {
        email: `migrate-${Date.now()}@example.com`,
        passwordHash: 'hash',
      },
    });
    const entry = await appendAuditLog({ userId: user.id, action: 'lot0.migrate' });
    await expect(client.auditLog.delete({ where: { id: entry.id } })).rejects.toThrow(/append-only/);
  });
});
