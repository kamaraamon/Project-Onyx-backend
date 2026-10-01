import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { contentSecurityPolicy, securityHeaders } from './security-headers';

function header(name: string): string {
  const found = securityHeaders.find((item) => item.key === name);
  expect(found).toBeDefined();
  return found?.value ?? '';
}

describe('security headers', () => {
  it('sends a strict CSP with frame-ancestors none', () => {
    expect(header('Content-Security-Policy')).toBe(contentSecurityPolicy);
    expect(contentSecurityPolicy).toContain("default-src 'self'");
    expect(contentSecurityPolicy).toContain("frame-ancestors 'none'");
    expect(contentSecurityPolicy).not.toContain('unsafe-inline');
    expect(contentSecurityPolicy).not.toContain('unsafe-eval');
  });

  it('sends nosniff, a referrer policy, and HSTS', () => {
    expect(header('X-Content-Type-Options')).toBe('nosniff');
    expect(header('Referrer-Policy')).toBe('strict-origin-when-cross-origin');
    expect(header('Strict-Transport-Security')).toContain('max-age=63072000');
    expect(header('X-Frame-Options')).toBe('DENY');
  });

  it('is wired from next.config.ts', () => {
    const config = readFileSync('apps/web/next.config.ts', 'utf8');
    expect(config).toContain('securityHeaders');
  });
});
