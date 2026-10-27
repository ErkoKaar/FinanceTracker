// Edge Function invoked daily by pg_cron (see supabase/schema.sql's cron block). Imports new
// booked transactions for every still-valid bank connection, and sends a push reminder shortly
// before a connection's consent expires (PSD2 consents last max ~180 days and must then be
// renewed by the user in the app).
//
// Deploy: npx supabase functions deploy bank-sync --no-verify-jwt
// Secrets needed: ENABLE_BANKING_APP_ID, ENABLE_BANKING_PRIVATE_KEY, CRON_SECRET (+ the VAPID keys
// already set for send-reminders; expiry reminders are skipped if they're absent).
// Only the cron job may call it: requests without the CRON_SECRET header are refused, otherwise
// anyone could use up the banks' few allowed unattended fetches per day.
import { createClient } from "npm:@supabase/supabase-js@2";
import webpush from "npm:web-push@3";
import { syncAccount } from "../_shared/enablebanking.ts";
import { forbidden, isCronRequest } from "../_shared/cron-auth.ts";

const REMIND_AT_DAYS_LEFT = [14, 7, 3, 1];

Deno.serve(async (req) => {
  if (!isCronRequest(req)) return forbidden();

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: connections, error } = await supabase.from("bank_connections").select("*");
  if (error) throw error;

  const now = Date.now();
  let imported = 0;
  const failures: string[] = [];
  // user_id -> smallest days-left among their expiring connections
  const expiring = new Map<string, number>();

  for (const conn of connections ?? []) {
    const msLeft = new Date(conn.valid_until).getTime() - now;
    if (msLeft <= 0) continue; // consent expired — nothing to fetch until the user renews it

    // Overlap the window by a few days so transactions booked late are still picked up;
    // the unique bank_transaction_id indexes make re-imports no-ops.
    const from = conn.last_synced_at
      ? new Date(new Date(conn.last_synced_at).getTime() - 3 * 24 * 3600 * 1000)
      : new Date(now - 30 * 24 * 3600 * 1000);
    try {
      imported += await syncAccount(supabase, conn, from.toISOString().slice(0, 10));
    } catch (err) {
      // One broken account (bank downtime, rate limit) shouldn't block the others.
      console.error(`sync failed for connection ${conn.id}:`, err);
      failures.push(conn.id);
    }

    const daysLeft = Math.ceil(msLeft / (24 * 3600 * 1000));
    if (REMIND_AT_DAYS_LEFT.includes(daysLeft)) {
      expiring.set(conn.user_id, Math.min(expiring.get(conn.user_id) ?? Infinity, daysLeft));
    }
  }

  const vapidPublic = Deno.env.get("VAPID_PUBLIC_KEY");
  const vapidPrivate = Deno.env.get("VAPID_PRIVATE_KEY");
  if (expiring.size > 0 && vapidPublic && vapidPrivate) {
    webpush.setVapidDetails("mailto:reminders@financetracker.app", vapidPublic, vapidPrivate);
    const { data: subscriptions } = await supabase
      .from("push_subscriptions")
      .select("*")
      .in("user_id", [...expiring.keys()]);
    await Promise.allSettled(
      (subscriptions ?? []).map(async (sub) => {
        const days = expiring.get(sub.user_id)!;
        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            JSON.stringify({
              title: "FinanceTracker",
              body: `Your bank connection expires in ${days} day${days === 1 ? "" : "s"} — renew it in the app to keep automatic imports running.`,
            })
          );
        } catch (err) {
          // Subscription expired or was revoked on the device — stop trying to send to it.
          if (err.statusCode === 404 || err.statusCode === 410) {
            await supabase.from("push_subscriptions").delete().eq("id", sub.id);
          }
        }
      })
    );
  }

  return new Response(JSON.stringify({ imported, failed: failures.length }), { status: 200 });
});
