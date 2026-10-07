import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    root: './',
    include: ['.test-dist/**/*.e2e-spec.js'],
    setupFiles: ['.test-dist/test/setup.js'],
    testTimeout: 15000,
    hookTimeout: 30000,
  },
});
