import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { logInfo, redact } from './logger';

describe('redact', () => {
  it('redacts nested password, secret, token, authorization, and cookie fields', () => {
    const result = redact({
      ok: true,
      nested: {
        password: 'plain-password',
        profile: {
          token: 'plain-token',
          name: 'Ada',
        },
        items: [{ authorization: 'Bearer abc', cookie: 'sid=1', title: 'hello' }],
      },
      secret: 'plain-secret',
    });

    expect(result.ok).toBe(true);
    expect(result.nested.password).toBe('[REDACTED]');
    expect(result.nested.profile.token).toBe('[REDACTED]');
    expect(result.nested.profile.name).toBe('Ada');
    expect(result.nested.items[0]?.authorization).toBe('[REDACTED]');
    expect(result.nested.items[0]?.cookie).toBe('[REDACTED]');
    expect(result.nested.items[0]?.title).toBe('hello');
    expect(result.secret).toBe('[REDACTED]');
  });

  it('redacts matching keys regardless of case or suffix', () => {
    const result = redact({
      Password: 'p',
      access_token: 't',
      'Set-Cookie': 'c',
      sessionToken: 's',
      note: 'visible',
    });

    expect(result.Password).toBe('[REDACTED]');
    expect(result.access_token).toBe('[REDACTED]');
    expect(result['Set-Cookie']).toBe('[REDACTED]');
    expect(result.sessionToken).toBe('[REDACTED]');
    expect(result.note).toBe('visible');
  });

  it('writes redacted fields and does not use console.log', () => {
    const lines: string[] = [];
    const original = process.stdout.write.bind(process.stdout);
    process.stdout.write = ((chunk: string | Uint8Array) => {
      lines.push(String(chunk));
      return true;
    }) as typeof process.stdout.write;
    try {
      logInfo('auth', { password: 'hidden', email: 'ada@example.com' });
    } finally {
      process.stdout.write = original;
    }
    const payload = JSON.parse(lines.join('')) as { password: string; email: string };
    expect(payload.password).toBe('[REDACTED]');
    expect(payload.email).toBe('ada@example.com');
    const source = readFileSync(new URL('./logger.ts', import.meta.url), 'utf8');
    expect(source).not.toContain('console.log');
  });
});
