import { z } from 'zod';

const publicSecretName =
  /PASSWORD|SECRET|TOKEN|DATABASE|CREDENTIAL|COOKIE|AUTHORIZATION|PRIVATE|ENCRYPTION/i;

const secretValueKeys = [
  'DATABASE_URL',
  'DIRECT_URL',
  'SESSION_SECRET',
  'ADMIN_BOOTSTRAP_PASSWORD',
  'CRON_SECRET',
  'TOTP_ENCRYPTION_KEY',
] as const;

export const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  DIRECT_URL: z.string().min(1),
  SESSION_SECRET: z.string().min(16),
  ADMIN_BOOTSTRAP_EMAIL: z.string().email(),
  ADMIN_BOOTSTRAP_PASSWORD: z.string().min(8),
  PAYMENT_PROVIDER: z.enum(['manual', 'mock', 'wave']),
  PAYMENT_MODE: z.enum(['none', 'manual']),
  REGISTRATION_MODE: z.literal('invite_only'),
  BETA_MAX_USERS: z.coerce.number().int().positive().default(5),
  LEGAL_REVIEW_DONE: z
    .enum(['true', 'false'])
    .default('false')
    .transform((value) => value === 'true'),
  CRON_SECRET: z.string().min(16),
  TOTP_ENCRYPTION_KEY: z.string().min(16),
  INVITATION_TTL_DAYS: z.coerce.number().int().positive(),
});

export type Env = z.infer<typeof envSchema>;

export type EnvInput = Record<string, string | undefined>;

export class EnvValidationError extends Error {
  readonly names: readonly string[];

  constructor(names: readonly string[]) {
    const unique = [...new Set(names)];
    super(`Invalid environment: ${unique.join(', ')}`);
    this.name = 'EnvValidationError';
    this.names = unique;
  }
}

function readStrings(source: EnvInput): Record<string, string> {
  const raw: Record<string, string> = {};
  for (const [key, value] of Object.entries(source)) {
    if (typeof value === 'string' && value.trim() !== '') {
      raw[key] = value;
    }
  }
  return raw;
}

function withDirectUrl(raw: Record<string, string>): Record<string, string> {
  const databaseUrl = raw.DATABASE_URL;
  if (!raw.DIRECT_URL && databaseUrl) {
    return { ...raw, DIRECT_URL: databaseUrl };
  }
  return raw;
}

function forbiddenNames(raw: Record<string, string>): string[] {
  const secretValues = secretValueKeys
    .map((key) => raw[key])
    .filter((value): value is string => Boolean(value));
  const names: string[] = [];
  for (const [key, value] of Object.entries(raw)) {
    if (key.startsWith('VAULT_')) {
      names.push(key);
    }
    if (!key.startsWith('NEXT_PUBLIC_')) {
      continue;
    }
    if (publicSecretName.test(key) || secretValues.includes(value)) {
      names.push(key);
    }
  }
  return names;
}

export function loadEnv(source: EnvInput = process.env): Env {
  const usingProcess = source === process.env;
  const normalized = withDirectUrl(readStrings(source));
  const forbidden = forbiddenNames(normalized);
  const parsed = envSchema.safeParse(normalized);
  if (!parsed.success || forbidden.length > 0) {
    const issueNames = parsed.success
      ? []
      : parsed.error.issues.map((issue) => String(issue.path[0] ?? 'env'));
    throw new EnvValidationError([...forbidden, ...issueNames]);
  }
  if (usingProcess && !process.env.DIRECT_URL) {
    process.env.DIRECT_URL = parsed.data.DIRECT_URL;
  }
  return parsed.data;
}

export function boot(): Env | undefined {
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    return undefined;
  }
  return loadEnv();
}

export function installProcessEnv(values: EnvInput): void {
  for (const [key, value] of Object.entries(values)) {
    if (typeof value === 'string') {
      process.env[key] = value;
    } else {
      delete process.env[key];
    }
  }
}

export function commandEnv(overrides: Record<string, string>): NodeJS.ProcessEnv {
  return { ...process.env, ...overrides };
}
