// Full-screen blocking message shown whenever the browser reports it has no network connection —
// every action in this app (login, add expense, etc.) requires Supabase, so there's no offline mode.
import { WifiOff } from "lucide-react";

export function OfflineNotice() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-sm text-center">
        <div className="size-14 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center justify-center mb-4 mx-auto">
          <WifiOff className="size-7 text-destructive" strokeWidth={1.8} />
        </div>
        <h1 className="text-xl font-semibold tracking-tight">You're offline</h1>
        <p className="text-sm text-muted-foreground mt-2">
          FinanceTracker needs an internet connection to load and save your data. Please reconnect and try again.
        </p>
      </div>
    </div>
  );
}
