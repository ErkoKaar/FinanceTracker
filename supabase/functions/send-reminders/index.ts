// Edge Function invoked daily by a pg_cron schedule (see supabase/schema.sql's cron block).
// Sends a push reminder on Sundays ("log last week's entries") and on the last day of the month
// ("log last month's entries") to every row in push_subscriptions. No-ops on any other day.
//
// Deploy: npx supabase functions deploy send-reminders --no-verify-jwt
// Secrets needed: VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY (SUPABASE_URL/SERVICE_ROLE_KEY are
// auto-injected by Supabase). Set with:
//   npx supabase secrets set VAPID_PUBLIC_KEY=... VAPID_PRIVATE_KEY=...

import { createClient } from "npm:@supabase/supabase-js@2";
import webpush from "npm:web-push@3";

webpush.setVapidDetails(
  "mailto:reminders@financetracker.app",
  Deno.env.get("VAPID_PUBLIC_KEY")!,
  Deno.env.get("VAPID_PRIVATE_KEY")!
);

Deno.serve(async () => {
  const now = new Date();
  const isSunday = now.getDay() === 0;
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  const isLastDayOfMonth = tomorrow.getDate() === 1;

  if (!isSunday && !isLastDayOfMonth) {
    return new Response(JSON.stringify({ skipped: true }), { status: 200 });
  }

  const messages: string[] = [];
  if (isSunday) messages.push("Log last week's expenses and income if you forgot anything.");
  if (isLastDayOfMonth) messages.push("Last day of the month — make sure it's all logged.");
  const body = messages.join(" ");

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: subscriptions, error } = await supabase.from("push_subscriptions").select("*");
  if (error) throw error;

  const results = await Promise.allSettled(
    (subscriptions ?? []).map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify({ title: "FinanceTracker", body })
        );
      } catch (err) {
        // Subscription expired or was revoked on the device — stop trying to send to it.
        if (err.statusCode === 404 || err.statusCode === 410) {
          await supabase.from("push_subscriptions").delete().eq("id", sub.id);
        } else {
          throw err;
        }
      }
    })
  );

  return new Response(JSON.stringify({ sent: results.length }), { status: 200 });
});
