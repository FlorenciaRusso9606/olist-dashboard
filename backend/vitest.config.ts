import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // No usamos globals: importamos describe/it/expect/vi desde 'vitest'.
    // Es un poco más verboso pero más explícito y con mejor type-safety.
    globals: false,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/application/**', 'src/domain/**', 'src/adapters/**'],
      exclude: ['src/infrastructure/**', '**/*.d.ts'],
    },
  },
});
