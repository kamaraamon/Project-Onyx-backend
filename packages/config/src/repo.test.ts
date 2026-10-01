import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

function read(relativePath: string): string {
  return readFileSync(relativePath, 'utf8');
}

describe('repository guardrails', () => {
  it('keeps .env.example to empty names', () => {
    const example = read('.env.example');
    expect(example).not.toMatch(/VAULT_/);
    expect(example).not.toMatch(/NEXT_PUBLIC_/);
    const lines = example.split('\n').filter((line) => line.trim().length > 0);
    expect(lines.length).toBeGreaterThan(0);
    for (const line of lines) {
      expect(line).toMatch(/^[A-Z0-9_]+=$/);
    }
  });

  it('ignores env files, dependencies, and build output', () => {
    const ignore = read('.gitignore');
    expect(ignore).toMatch(/\.env\*/);
    expect(ignore).toMatch(/!\.env\.example/);
    expect(ignore).toMatch(/node_modules/);
    expect(ignore).toMatch(/dist/);
    expect(ignore).toMatch(/\.next/);
    expect(ignore).toMatch(/\.vercel/);
  });

  it('does not point CI at Neon', () => {
    const ci = read('.github/workflows/ci.yml').toLowerCase();
    expect(ci).not.toContain('neon');
    expect(ci).toContain('pnpm lint');
    expect(ci).toContain('pnpm typecheck');
    expect(ci).toContain('pnpm test');
    expect(ci).toContain('pnpm build');
    expect(ci).toContain('pnpm audit --prod');
    expect(ci).toContain('prisma validate');
    expect(ci).toContain('prisma migrate deploy');
    expect(ci).toContain('gitleaks detect');
    expect(ci).toContain('--redact');
    expect(ci).toContain('fetch-depth: 0');
  });

  it('schedules dependabot weekly', () => {
    const dependabot = read('.github/dependabot.yml');
    expect(dependabot).toContain('interval: weekly');
    expect(dependabot).toContain('package-ecosystem: npm');
  });

  it('runs gitleaks on staged changes in the pre-commit hook', () => {
    const hook = read('.husky/pre-commit');
    const script = read('scripts/gitleaks-protect.sh');
    expect(hook).toContain('scripts/gitleaks-protect.sh');
    expect(script).toContain('protect --staged');
    expect(script).toContain('--redact');
  });

  it('keeps Prisma and the db package out of the web app', () => {
    const pkg = JSON.parse(read('apps/web/package.json')) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
    const names = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies });
    expect(names).not.toContain('@prisma/client');
    expect(names).not.toContain('@onyx/db');
    expect(names).not.toContain('prisma');
  });
});
