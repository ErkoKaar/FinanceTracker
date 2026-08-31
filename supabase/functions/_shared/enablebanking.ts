// Shared Enable Banking API helpers used by the bank-connect and bank-sync Edge Functions.
// Every API request carries a short-lived RS256 JWT signed with the application's private key
// (the key pair generated when registering the app in the Enable Banking Control Panel).
//
// Secrets needed: ENABLE_BANKING_APP_ID, ENABLE_BANKING_PRIVATE_KEY (PKCS#8 PEM — the format the
// Control Panel's "Generate in the browser" option exports).
import { SignJWT, importPKCS8 } from "npm:jose@5";

const API_BASE = "https://api.enablebanking.com";

async function ebToken(): Promise<string> {
  const appId = Deno.env.get("ENABLE_BANKING_APP_ID");
  const pem = Deno.env.get("ENABLE_BANKING_PRIVATE_KEY");
  if (!appId || !pem) throw new Error("ENABLE_BANKING_APP_ID / ENABLE_BANKING_PRIVATE_KEY secrets are not set");
  const key = await importPKCS8(pem, "RS256");
  const now = Math.floor(Date.now() / 1000);
  return await new SignJWT({ iss: "enablebanking.com", aud: "api.enablebanking.com" })
    .setProtectedHeader({ typ: "JWT", alg: "RS256", kid: appId })
    .setIssuedAt(now)
    .setExpirationTime(now + 3600)
    .sign(key);
}

export async function ebFetch(path: string, init?: RequestInit) {
  const token = await ebToken();
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { ...(init?.headers ?? {}), "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Enable Banking ${path} failed: ${res.status} ${body}`);
  }
  return await res.json();
}

type BankConnection = {
  id: string;
  user_id: string;
  account_uid: string;
};

// Fetches booked transactions for one connected account since dateFrom (YYYY-MM-DD) and inserts
// them as expenses (DBIT) / incomes (CRDT) with category "Other". Dedup relies on the unique
// (user_id, bank_transaction_id) indexes — already-imported rows are skipped via ON CONFLICT DO
// NOTHING, which is what makes the overlapping date windows used by callers safe.
// deno-lint-ignore no-explicit-any
export async function syncAccount(supabase: any, conn: BankConnection, dateFrom: string): Promise<number> {
  const rows = new Map<string, { table: "expenses" | "incomes"; row: Record<string, unknown> }>();
  let continuationKey: string | undefined;

  do {
    const params = new URLSearchParams({ date_from: dateFrom });
    if (continuationKey) params.set("continuation_key", continuationKey);
    const page = await ebFetch(`/accounts/${conn.account_uid}/transactions?${params}`);

    for (const tx of page.transactions ?? []) {
      // Pending transactions change or disappear before booking — only import settled ones.
      if (tx.status !== "BOOK") continue;
      const amount = Math.abs(parseFloat(tx.transaction_amount?.amount ?? "0"));
      if (!amount || Number.isNaN(amount)) continue;
      const date = tx.booking_date ?? tx.value_date;
      if (!date) continue;

      const remittance = Array.isArray(tx.remittance_information)
        ? tx.remittance_information.join(" ").trim()
        : "";
      const counterparty = tx.credit_debit_indicator === "DBIT" ? tx.creditor?.name : tx.debtor?.name;
      const description = counterparty || remittance || "Bank transaction";

      // Not every transaction carries entry_reference; the fallback fingerprint collapses two
      // truly identical reference-less transactions on the same day into one — acceptable, since
      // the alternative (no dedup) would duplicate everything on every overlapping sync.
      const txId = tx.entry_reference
        ? `${conn.account_uid}:${tx.entry_reference}`
        : `${conn.account_uid}:${date}:${tx.credit_debit_indicator}:${amount}:${description}`;

      rows.set(txId, {
        table: tx.credit_debit_indicator === "DBIT" ? "expenses" : "incomes",
        row: {
          user_id: conn.user_id,
          amount,
          description,
          category: "Other",
          date,
          bank_transaction_id: txId,
        },
      });
    }
    continuationKey = page.continuation_key;
  } while (continuationKey);

  for (const table of ["expenses", "incomes"] as const) {
    const tableRows = [...rows.values()].filter((r) => r.table === table).map((r) => r.row);
    for (let i = 0; i < tableRows.length; i += 500) {
      const { error } = await supabase.from(table).upsert(tableRows.slice(i, i + 500), {
        onConflict: "user_id,bank_transaction_id",
        ignoreDuplicates: true,
      });
      if (error) throw error;
    }
  }

  const { error } = await supabase
    .from("bank_connections")
    .update({ last_synced_at: new Date().toISOString() })
    .eq("id", conn.id);
  if (error) throw error;

  return rows.size;
}
