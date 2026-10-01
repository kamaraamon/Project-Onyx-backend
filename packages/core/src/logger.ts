const sensitiveKey = /password|secret|token|authorization|cookie/i;

export function redact<T>(value: T): T {
  return redactValue(value) as T;
}

function redactValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => redactValue(item));
  }
  if (value && typeof value === 'object') {
    const output: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(value)) {
      output[key] = sensitiveKey.test(key) ? '[REDACTED]' : redactValue(nested);
    }
    return output;
  }
  return value;
}

export function logInfo(event: string, fields?: Record<string, unknown>): void {
  const payload = fields ? { event, ...(redact(fields) as Record<string, unknown>) } : { event };
  process.stdout.write(`${JSON.stringify(payload)}\n`);
}
