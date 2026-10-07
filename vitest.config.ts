import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    root: './',
    include: ['.test-dist/**/*.spec.js'],
    setupFiles: ['.test-dist/test/setup.js'],
    maxWorkers: 2,
    testTimeout: 15000,
    hookTimeout: 30000,
  },
});
