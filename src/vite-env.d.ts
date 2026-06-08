/// <reference types="vite/client" />

// Giver TypeScript lov til at importere .md filer med ?raw (Vite raw import)
declare module '*.md?raw' {
  const content: string;
  export default content;
}
