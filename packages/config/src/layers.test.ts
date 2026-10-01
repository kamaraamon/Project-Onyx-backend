import { execFileSync } from 'node:child_process';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();

function lintFile(relativePath: string, source: string): { failed: boolean; output: string } {
  const absolute = path.join(root, relativePath);
  mkdirSync(path.dirname(absolute), { recursive: true });
  writeFileSync(absolute, source);
  try {
    const output = execFileSync('pnpm', ['exec', 'eslint', relativePath], {
      cwd: root,
      encoding: 'utf8',
    });
    return { failed: false, output };
  } catch (error) {
    const failure = error as { stdout?: string; stderr?: string; status?: number };
    return {
      failed: failure.status !== 0,
      output: `${failure.stdout ?? ''}${failure.stderr ?? ''}`,
    };
  } finally {
    rmSync(absolute, { force: true });
  }
}

describe('layer rules', () => {
  it('fails pnpm lint when a web file imports Prisma', () => {
    const result = lintFile(
      'apps/web/lint-fixtures/prisma-import.ts',
      "import { PrismaClient } from '@prisma/client';\nexport const leak: typeof PrismaClient | null = null;\n",
    );
    expect(result.failed).toBe(true);
    expect(result.output).toMatch(/@prisma\/client/);
  });

  it('fails pnpm lint when a web file imports @onyx/db', () => {
    const result = lintFile(
      'apps/web/lint-fixtures/db-import.ts',
      "import { prisma } from '@onyx/db';\nexport const leak = prisma;\n",
    );
    expect(result.failed).toBe(true);
    expect(result.output).toMatch(/@onyx\/db/);
  });

  it('fails pnpm lint when process.env is read outside packages/config', () => {
    const result = lintFile(
      'packages/core/lint-fixtures/env.ts',
      'export const value = process.env.DATABASE_URL;\n',
    );
    expect(result.failed).toBe(true);
    expect(result.output).toMatch(/process\.env/);
  });

  it('fails pnpm lint when console.log is used', () => {
    const result = lintFile(
      'packages/core/lint-fixtures/console.ts',
      "export function speak(): void {\n  console.log('no');\n}\n",
    );
    expect(result.failed).toBe(true);
    expect(result.output).toMatch(/console/);
  });
});
