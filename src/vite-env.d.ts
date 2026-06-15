/// <reference types="vite/client" />

// Giver TypeScript lov til at importere .md filer med ?raw (Vite raw import)
declare module '*.md?raw' {
  const content: string;
  export default content;
}

// Build-time constants injected by vite.config.ts
declare const __APP_VERSION__: string;
declare const __APP_BUILD_DATE__: string;
declare const __APP_GIT_HASH__: string;
