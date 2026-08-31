// User-facing Edge Function for connecting a Swedbank account via Enable Banking.
//   action "start":    begins the bank authorization flow, returns the bank's redirect URL
//   action "callback": exchanges the ?code= from the redirect for a session, stores the connected
//                      accounts and runs the initial one-year import (full history is typically
//                      only available for ~1 hour after authorization, so it can't wait for cron)
//
// Deploy: npx supabase functions deploy bank-connect
// (JWT verification stays ON — the caller must be a logged-in app user.)
// Secrets needed: ENABLE_BANKING_APP_ID, ENABLE_BANKING_PRIVATE_KEY.
import { createClient } from "npm:@supabase/supabase-js@2";
import { ebFetch, syncAccount } from "../_shared/enablebanking.ts";

const ASPSP = { name: "Swedbank", country: "EE" };

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    // Resolve the calling user from their JWT so every stored row is tied to them.
    const authClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
    });
    const { data: { user }, error: userError } = await authClient.auth.getUser();
    if (userError || !user) return json({ error: "Not authenticated" }, 401);

    const body = await req.json();

    if (body.action === "start") {
      if (typeof body.redirectUrl !== "string") return json({ error: "redirectUrl is required" }, 400);
      // Ask for the longest consent the bank allows (typically 180 days).
      const { aspsps } = await ebFetch(`/aspsps?country=${ASPSP.country}`);
      // deno-lint-ignore no-explicit-any
      const bank = (aspsps ?? []).find((a: any) => a.name === ASPSP.name);
      const maxSeconds = bank?.maximum_consent_validity ?? 180 * 24 * 3600;
      const { url } = await ebFetch("/auth", {
        method: "POST",
        body: JSON.stringify({
          access: { valid_until: new Date(Date.now() + maxSeconds * 1000).toISOString() },
          aspsp: ASPSP,
          state: crypto.randomUUID(),
          redirect_url: body.redirectUrl,
          psu_type: "personal",
        }),
      });
      return json({ url });
    }

    if (body.action === "callback") {
      if (typeof body.code !== "string") return json({ error: "code is required" }, 400);
      const session = await ebFetch("/sessions", { method: "POST", body: JSON.stringify({ code: body.code }) });

      // Writes go through the service role (bank_connections rows are not client-writable);
      // every row still carries the calling user's id, so RLS reads stay correctly scoped.
      const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
      const validUntil = session.access?.valid_until ?? new Date(Date.now() + 180 * 24 * 3600 * 1000).toISOString();
      const yearAgo = new Date(Date.now() - 365 * 24 * 3600 * 1000).toISOString().slice(0, 10);

      let imported = 0;
      for (const account of session.accounts ?? []) {
        // account_hash is stable across re-authorizations, so renewing consent updates the
        // existing row (new session_id + valid_until) instead of duplicating the account.
        const { data: conn, error } = await admin
          .from("bank_connections")
          .upsert(
            {
              user_id: user.id,
              session_id: session.session_id,
              account_uid: account.uid,
              account_hash: account.identification_hash ?? account.uid,
              account_name: account.name ?? account.account_id?.iban ?? "Account",
              valid_until: validUntil,
            },
            { onConflict: "user_id,account_hash" }
          )
          .select()
          .single();
        if (error) throw error;
        imported += await syncAccount(admin, conn, yearAgo);
      }

      return json({ accounts: (session.accounts ?? []).length, imported });
    }

    return json({ error: "Unknown action" }, 400);
  } catch (err) {
    console.error(err);
    return json({ error: err instanceof Error ? err.message : String(err) }, 500);
  }
});
