import { defineConfig } from 'vitest/config';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    testTimeout: 30000,
    hookTimeout: 60000,
    include: ['test/**/*.test.ts'],
    exclude: ['node_modules', 'dist'],
    env: loadEnvFile(),
  },
});

/** Read test/.env and return as key-value pairs */
function loadEnvFile(): Record<string, string> {
  try {
    const content = readFileSync(resolve(__dirname, 'test/.env'), 'utf-8');
    const env: Record<string, string> = {};
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const idx = trimmed.indexOf('=');
      if (idx > 0) {
        env[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim();
      }
    }
    return env;
  } catch {
    return {};
  }
}
