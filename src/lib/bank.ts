// Starting/completing the bank connection flow via the bank-connect Edge Function (Enable
// Banking under the hood). Reading/deleting stored connections lives in finance-data.ts.
import { supabase } from "./supabase";

// Begins the authorization flow: the Edge Function returns the bank's authorization URL and the
// whole page navigates there. The bank redirects back to /bank-callback?code=... afterwards.
export async function startBankAuth() {
  const { data, error } = await supabase.functions.invoke("bank-connect", {
    body: { action: "start", redirectUrl: `${window.location.origin}/bank-callback` },
  });
  if (error) throw error;
  if (!data?.url) throw new Error("Bank did not return an authorization URL");
  window.location.href = data.url;
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
