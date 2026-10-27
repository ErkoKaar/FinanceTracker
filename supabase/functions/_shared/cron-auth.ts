// Guard for the functions only pg_cron should call (send-reminders, bank-sync). They are deployed
// with --no-verify-jwt because a cron job has no user session, so without this check anyone who
// knows the project URL could trigger them (spam reminders, burn the bank's daily fetch quota).
// The cron job sends the CRON_SECRET function secret in an `x-cron-secret` header, reading it from
// Supabase Vault, so the value never appears in this repository.

export function isCronRequest(req: Request): boolean {
  const expected = Deno.env.get("CRON_SECRET");
  if (!expected) return false; // fail closed if the secret was never set
  const given = req.headers.get("x-cron-secret") ?? "";

  // Constant-time comparison, so response timing doesn't reveal how much of a guess was right.
  const a = new TextEncoder().encode(given);
  const b = new TextEncoder().encode(expected);
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

export function forbidden() {
  return new Response(JSON.stringify({ error: "Forbidden" }), {
    status: 403,
    headers: { "Content-Type": "application/json" },
  });
}
