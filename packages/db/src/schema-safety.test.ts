import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const schema = readFileSync('packages/db/prisma/schema.prisma', 'utf8');
const migration = readFileSync(
  'packages/db/prisma/migrations/20261001140000_init_onyx_identity/migration.sql',
  'utf8',
);
const client = readFileSync('packages/db/src/client.ts', 'utf8');

function withoutComments(source: string): string {
  return source
    .split('\n')
    .filter((line) => !line.trim().startsWith('//') && !line.trim().startsWith('///'))
    .join('\n');
}

describe('schema safety', () => {
  it('stores no third-party service password or login', () => {
    const modelsOnly = withoutComments(schema);
    expect(modelsOnly).not.toMatch(
      /encryptedUsername|encryptedPassword|serviceUsername|servicePassword/i,
    );
    expect(modelsOnly).not.toMatch(/netflix|spotify|coffre_fort|VAULT_/i);

    const models = [...schema.matchAll(/model\s+(\w+)\s+\{([\s\S]*?)\n\}/g)];
    const fields: string[] = [];
    for (const match of models) {
      const body = match[2] ?? '';
      for (const line of body.split('\n')) {
        const field = line.match(/^\s+([A-Za-z]\w*)\s+/);
        if (field?.[1] && !field[1].startsWith('@@')) {
          fields.push(field[1]);
        }
      }
    }

    const credentials = fields.filter((name) => {
      if (name === 'passwordHash') return false;
      return /password|username|credential/i.test(name) || /(?:^|_)login(?:$|_)/i.test(name);
    });
    expect(credentials).toEqual([]);
  });

  it('maps new tables onto onyx_ names and keeps amounts integral', () => {
    expect(schema).toContain('@@map("onyx_users")');
    expect(schema).toContain('@@map("onyx_sessions")');
    expect(schema).toContain('@@map("onyx_login_attempts")');
    expect(schema).toContain('@@map("onyx_audit_logs")');
    expect(schema).not.toMatch(/\bFloat\b|\bDecimal\b/);
    expect(schema).toContain('url       = env("DATABASE_URL")');
    expect(schema).toContain('directUrl = env("DIRECT_URL")');
  });

  it('documents AuditLog as append-only and exposes no update or delete helper', () => {
    expect(schema).toMatch(/Append-only/);
    expect(client).toMatch(/append-only/i);
    expect(client).not.toMatch(/auditLog\.(update|updateMany|delete|deleteMany|upsert)/);
    expect(client).toContain('appendAuditLog');
  });

  it('creates only the new onyx tables', () => {
    expect(migration).not.toMatch(/\bDROP\b/);
    const created = [...migration.matchAll(/CREATE TABLE "([^"]+)"/g)].map((match) => match[1]);
    expect(created.sort()).toEqual([
      'onyx_audit_logs',
      'onyx_login_attempts',
      'onyx_sessions',
      'onyx_users',
    ]);
    const altered = [...migration.matchAll(/ALTER TABLE "([^"]+)"/g)].map((match) => match[1]);
    expect(altered.length).toBeGreaterThan(0);
    for (const name of altered) {
      expect(name?.startsWith('onyx_')).toBe(true);
    }
    expect(migration).not.toMatch(/"users"|"wallets"|"subscriptions"|"coffre_fort"/);
  });
});
