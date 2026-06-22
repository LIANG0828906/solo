import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
    benchmark: {
      include: ['tests/**/*.bench.ts'],
      reporters: ['verbose'],
    },
    environment: 'node',
    globals: true,
    css: false,
  },
});
