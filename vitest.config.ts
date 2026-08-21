import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: './.testing/vitest.setup.ts',
  },
  define: {
    'process.env.GEMINI_API_KEY': JSON.stringify('mock-api-key'),
    '__APP_VERSION__': JSON.stringify('1.0.0-test'),
    '__APP_BUILD_DATE__': JSON.stringify(new Date().toISOString()),
    '__APP_GIT_HASH__': JSON.stringify('test-hash'),
  },
});
