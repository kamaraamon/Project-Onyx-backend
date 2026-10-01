import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { boot, EnvValidationError, loadEnv, type EnvInput } from './env';

function valid(overrides: EnvInput = {}): EnvInput {
  return {
    DATABASE_URL: 'postgresql://127.0.0.1:5432/onyx',
    SESSION_SECRET: 'session-secret-test-value',
    ADMIN_BOOTSTRAP_EMAIL: 'admin@example.com',
    ADMIN_BOOTSTRAP_PASSWORD: 'bootstrap-pass',
    PAYMENT_PROVIDER: 'mock',
    PAYMENT_MODE: 'none',
    REGISTRATION_MODE: 'invite_only',
    CRON_SECRET: 'cron-secret-test-value',
    TOTP_ENCRYPTION_KEY: 'totp-key-test-value-1',
    INVITATION_TTL_DAYS: '7',
    ...overrides,
  };
}

function namesFor(input: EnvInput): readonly string[] {
  try {
    loadEnv(input);
  } catch (error) {
    expect(error).toBeInstanceOf(EnvValidationError);
    return (error as EnvValidationError).names;
  }
  throw new Error('expected env validation to fail');
}

describe('loadEnv failure cases', () => {
  it('rejects a missing DATABASE_URL', () => {
    expect(namesFor(valid({ DATABASE_URL: undefined }))).toContain('DATABASE_URL');
  });

  it('rejects a missing SESSION_SECRET', () => {
    expect(namesFor(valid({ SESSION_SECRET: undefined }))).toContain('SESSION_SECRET');
  });

  it('rejects a short SESSION_SECRET', () => {
    expect(namesFor(valid({ SESSION_SECRET: 'too-short' }))).toContain('SESSION_SECRET');
  });

  it('rejects a missing ADMIN_BOOTSTRAP_EMAIL', () => {
    expect(namesFor(valid({ ADMIN_BOOTSTRAP_EMAIL: undefined }))).toContain(
      'ADMIN_BOOTSTRAP_EMAIL',
    );
  });

  it('rejects an invalid ADMIN_BOOTSTRAP_EMAIL', () => {
    expect(namesFor(valid({ ADMIN_BOOTSTRAP_EMAIL: 'not-an-email' }))).toContain(
      'ADMIN_BOOTSTRAP_EMAIL',
    );
  });

  it('rejects a missing ADMIN_BOOTSTRAP_PASSWORD', () => {
    expect(namesFor(valid({ ADMIN_BOOTSTRAP_PASSWORD: undefined }))).toContain(
      'ADMIN_BOOTSTRAP_PASSWORD',
    );
  });

  it('rejects a short ADMIN_BOOTSTRAP_PASSWORD', () => {
    expect(namesFor(valid({ ADMIN_BOOTSTRAP_PASSWORD: 'short' }))).toContain(
      'ADMIN_BOOTSTRAP_PASSWORD',
    );
  });

  it('rejects a missing PAYMENT_PROVIDER', () => {
    expect(namesFor(valid({ PAYMENT_PROVIDER: undefined }))).toContain('PAYMENT_PROVIDER');
  });

  it('rejects an invalid PAYMENT_PROVIDER', () => {
    expect(namesFor(valid({ PAYMENT_PROVIDER: 'stripe' }))).toContain('PAYMENT_PROVIDER');
  });

  it('rejects a missing PAYMENT_MODE', () => {
    expect(namesFor(valid({ PAYMENT_MODE: undefined }))).toContain('PAYMENT_MODE');
  });

  it('rejects an invalid PAYMENT_MODE', () => {
    expect(namesFor(valid({ PAYMENT_MODE: 'auto' }))).toContain('PAYMENT_MODE');
  });

  it('rejects a missing REGISTRATION_MODE', () => {
    expect(namesFor(valid({ REGISTRATION_MODE: undefined }))).toContain('REGISTRATION_MODE');
  });

  it('rejects a REGISTRATION_MODE other than invite_only', () => {
    expect(namesFor(valid({ REGISTRATION_MODE: 'open' }))).toContain('REGISTRATION_MODE');
  });

  it('rejects a missing CRON_SECRET', () => {
    expect(namesFor(valid({ CRON_SECRET: undefined }))).toContain('CRON_SECRET');
  });

  it('rejects a short CRON_SECRET', () => {
    expect(namesFor(valid({ CRON_SECRET: 'too-short' }))).toContain('CRON_SECRET');
  });

  it('rejects a missing TOTP_ENCRYPTION_KEY', () => {
    expect(namesFor(valid({ TOTP_ENCRYPTION_KEY: undefined }))).toContain('TOTP_ENCRYPTION_KEY');
  });

  it('rejects a short TOTP_ENCRYPTION_KEY', () => {
    expect(namesFor(valid({ TOTP_ENCRYPTION_KEY: 'too-short' }))).toContain('TOTP_ENCRYPTION_KEY');
  });

  it('rejects a missing INVITATION_TTL_DAYS', () => {
    expect(namesFor(valid({ INVITATION_TTL_DAYS: undefined }))).toContain('INVITATION_TTL_DAYS');
  });

  it('rejects a non-integer INVITATION_TTL_DAYS', () => {
    expect(namesFor(valid({ INVITATION_TTL_DAYS: '3.5' }))).toContain('INVITATION_TTL_DAYS');
  });

  it('rejects a non-integer BETA_MAX_USERS', () => {
    expect(namesFor(valid({ BETA_MAX_USERS: 'five' }))).toContain('BETA_MAX_USERS');
  });

  it('rejects an invalid LEGAL_REVIEW_DONE', () => {
    expect(namesFor(valid({ LEGAL_REVIEW_DONE: 'yes' }))).toContain('LEGAL_REVIEW_DONE');
  });

  it('rejects VAULT_ variables', () => {
    expect(namesFor(valid({ VAULT_PASSWORD: 'present' }))).toContain('VAULT_PASSWORD');
  });

  it('rejects a NEXT_PUBLIC_ secret name', () => {
    expect(namesFor(valid({ NEXT_PUBLIC_DATABASE_URL: 'postgresql://127.0.0.1:5432/other' }))).toContain(
      'NEXT_PUBLIC_DATABASE_URL',
    );
  });

  it('rejects a NEXT_PUBLIC_ value that copies a secret', () => {
    const secret = 'session-secret-test-value';
    expect(namesFor(valid({ NEXT_PUBLIC_SITE_NAME: secret }))).toContain('NEXT_PUBLIC_SITE_NAME');
  });
});

describe('loadEnv success cases', () => {
  it('falls back DIRECT_URL to DATABASE_URL when unset', () => {
    const env = loadEnv(valid());
    expect(env.DIRECT_URL).toBe(env.DATABASE_URL);
  });

  it('keeps an explicit DIRECT_URL', () => {
    const env = loadEnv(valid({ DIRECT_URL: 'postgresql://127.0.0.1:5432/direct' }));
    expect(env.DIRECT_URL).toBe('postgresql://127.0.0.1:5432/direct');
  });

  it('defaults BETA_MAX_USERS to 5', () => {
    expect(loadEnv(valid()).BETA_MAX_USERS).toBe(5);
  });

  it('defaults LEGAL_REVIEW_DONE to false', () => {
    expect(loadEnv(valid()).LEGAL_REVIEW_DONE).toBe(false);
  });

  it('accepts LEGAL_REVIEW_DONE true', () => {
    expect(loadEnv(valid({ LEGAL_REVIEW_DONE: 'true' })).LEGAL_REVIEW_DONE).toBe(true);
  });

  it('accepts a non-secret NEXT_PUBLIC_ value', () => {
    const env = loadEnv(valid({ NEXT_PUBLIC_SITE_NAME: 'Onyx' }));
    expect(env.DATABASE_URL).toContain('127.0.0.1');
  });

  it('does not define VAULT_ keys on the schema', () => {
    const source = readFileSync(new URL('./env.ts', import.meta.url), 'utf8');
    expect(source).not.toMatch(/VAULT_[A-Z0-9_]+/);
  });
});

describe('boot', () => {
  it('refuses to start when a required variable is missing', () => {
    const previous = process.env.DATABASE_URL;
    delete process.env.DATABASE_URL;
    delete process.env.SESSION_SECRET;
    try {
      expect(() => boot()).toThrow(EnvValidationError);
    } finally {
      if (previous === undefined) delete process.env.DATABASE_URL;
      else process.env.DATABASE_URL = previous;
    }
  });

  it('skips validation during the Next.js production build', () => {
    process.env.NEXT_PHASE = 'phase-production-build';
    try {
      expect(boot()).toBeUndefined();
    } finally {
      delete process.env.NEXT_PHASE;
    }
  });
});
