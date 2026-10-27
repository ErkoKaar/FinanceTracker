// Ambient type declarations for Vite's import.meta.env, typing the VITE_SUPABASE_*/VITE_VAPID_* variables.
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_VAPID_PUBLIC_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// True in the public demo build (`npm run build:demo`, or FT_DEMO=1): sample data in the browser
// instead of Supabase. Replaced at build time by vite.config.ts.
declare const __DEMO__: boolean;
