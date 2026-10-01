import js from '@eslint/js';
import tseslint from 'typescript-eslint';

const consoleRule = {
  'no-console': ['error', { allow: ['warn', 'error'] }],
};

const envRule = {
  'no-restricted-properties': [
    'error',
    {
      object: 'process',
      property: 'env',
      message: 'process.env is only allowed in packages/config.',
    },
  ],
};

const webImportRule = {
  'no-restricted-imports': [
    'error',
    {
      paths: [
        {
          name: '@prisma/client',
          message: 'apps/web must not import @prisma/client.',
        },
        {
          name: '@onyx/db',
          message: 'apps/web must not import packages/db.',
        },
      ],
      patterns: [
        {
          group: ['@prisma/client/*', '@onyx/db/*', '**/packages/db', '**/packages/db/**'],
          message: 'apps/web must not import Prisma or packages/db.',
        },
      ],
    },
  ],
};

export function createEslintConfig() {
  return tseslint.config(
    {
      ignores: [
        '**/node_modules/**',
        '**/dist/**',
        '**/.next/**',
        '**/.turbo/**',
        '**/.tools/**',
        '**/coverage/**',
      ],
    },
    js.configs.recommended,
    ...tseslint.configs.recommended,
    {
      files: ['**/*.{ts,tsx,mjs,js}'],
      rules: {
        ...consoleRule,
        ...envRule,
      },
    },
    {
      files: ['packages/config/**/*.{ts,tsx}'],
      rules: {
        'no-restricted-properties': 'off',
      },
    },
    {
      files: ['apps/web/**/*.{ts,tsx}'],
      rules: webImportRule,
    },
  );
}
