import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { GET } from './route';

describe('GET /api/health', () => {
  it('returns 200 and exposes no config', async () => {
    const response = GET();
    expect(response.status).toBe(200);
    const body: unknown = await response.json();
    expect(body).toEqual({ status: 'ok' });
    const serialized = JSON.stringify(body);
    expect(serialized).not.toMatch(/DATABASE_URL|DIRECT_URL|SECRET|PASSWORD|TOKEN|KEY/);
    const source = readFileSync('apps/web/app/api/health/route.ts', 'utf8');
    expect(source).not.toMatch(/process\.env|DATABASE_URL|SECRET|PASSWORD/);
  });
});
