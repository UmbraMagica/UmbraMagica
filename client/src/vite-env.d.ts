/// <reference types="vite/client" />

declare interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  // Přidejte další proměnné prostředí zde, pokud je potřeba
}

declare interface ImportMeta {
  readonly env: ImportMetaEnv;
} 