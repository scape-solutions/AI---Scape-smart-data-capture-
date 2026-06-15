import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import { execSync } from 'child_process';
import { readFileSync } from 'fs';

// Read version from package.json
const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'));

// Get short git commit hash (falls back to 'local' if git is unavailable)
let gitHash = 'local';
try {
  gitHash = execSync('git rev-parse --short HEAD', { stdio: ['pipe', 'pipe', 'pipe'] })
    .toString()
    .trim();
} catch { /* not a git repo or git not available */ }

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      // Build info — baked in at build/dev time
      '__APP_VERSION__': JSON.stringify(pkg.version),
      '__APP_BUILD_DATE__': JSON.stringify(new Date().toISOString()),
      '__APP_GIT_HASH__': JSON.stringify(gitHash),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify - file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},

      // Tillad alle lokale hostnavne (f.eks. runes-macbook-pro.local)
      allowedHosts: true,

      // Sikrer at serveren lytter på det lokale netværk (hvis du ikke allerede har det)
      host: true,

      // Videresend API-kald til Express-serveren (npm run serve på port 8080)
      // Så fungerer AI'en korrekt på både Mac og mobil under lokal udvikling
      proxy: {
        '/api': {
          target: 'http://localhost:8080',
          changeOrigin: true,
        }
      }
    },
  };
});
