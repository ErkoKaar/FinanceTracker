// Starting/completing the bank connection flow via the bank-connect Edge Function (Enable
// Banking under the hood). Reading/deleting stored connections lives in finance-data.ts.
import { supabase } from "./supabase";

// Marks that this tab started a bank connection, so /bank-callback only accepts a code from a flow
// the user began here. Without it, someone could send a logged-in user a callback link carrying
// their own bank code and attach their account to the victim's data (login CSRF).
const PENDING_KEY = "financetracker-bank-auth";
const PENDING_MAX_AGE_MS = 60 * 60 * 1000;

type Pending = { state: string; startedAt: number };

// Begins the authorization flow: the Edge Function returns the bank's authorization URL and the
// whole page navigates there. The bank redirects back to /bank-callback?code=... afterwards.
export async function startBankAuth() {
  const { data, error } = await supabase.functions.invoke("bank-connect", {
    body: { action: "start", redirectUrl: `${window.location.origin}/bank-callback` },
  });
  if (error) throw error;
  if (!data?.url || typeof data.state !== "string") throw new Error("Bank did not return an authorization URL");
  sessionStorage.setItem(PENDING_KEY, JSON.stringify({ state: data.state, startedAt: Date.now() } satisfies Pending));
  window.location.href = data.url;
}

/**
 * True if this tab started the bank flow within the last hour (and, when the bank echoes `state`
 * back, it matches). Single use: the marker is cleared either way.
 */
export function consumePendingBankAuth(returnedState: string | undefined): boolean {
  let pending: Pending | null = null;
  try {
    pending = JSON.parse(sessionStorage.getItem(PENDING_KEY) ?? "null");
    sessionStorage.removeItem(PENDING_KEY);
  } catch {
    return false;
  }
  if (!pending || Date.now() - pending.startedAt > PENDING_MAX_AGE_MS) return false;
  return returnedState === undefined || returnedState === pending.state;
}

// Exchanges the one-time ?code= from the bank redirect for a stored connection. The Edge Function
// also runs the initial one-year import before responding, so this can take a little while.
export async function completeBankAuth(code: string): Promise<{ accounts: number; imported: number }> {
  const { data, error } = await supabase.functions.invoke("bank-connect", {
    body: { action: "callback", code },
  });
  if (error) throw error;
  return data;
}
