// Supabase client instance, configured from the VITE_SUPABASE_* env vars (see .env.example).
import { createClient } from "@supabase/supabase-js";

// persistSession + autoRefreshToken are already the supabase-js defaults — stated explicitly here
// so a logged-in device stays signed in (session stored in localStorage, token silently refreshed
// in the background) until the user actually signs out, even across closing/reopening the app.
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  }
);
