import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const root = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      '@onyx/config': path.join(root, 'packages/config/src/index.ts'),
      '@onyx/core': path.join(root, 'packages/core/src/index.ts'),
      '@onyx/db': path.join(root, 'packages/db/src/index.ts'),
      '@onyx/payments': path.join(root, 'packages/payments/src/index.ts'),
    },
  },
  test: {
    environment: 'node',
    fileParallelism: false,
    include: ['packages/**/*.test.ts', 'apps/**/*.test.ts'],
  },
});
