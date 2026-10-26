// Full-screen blocking message shown whenever the browser reports it has no network connection —
// every action in this app (login, add expense, etc.) requires Supabase, so there's no offline mode.
import { WifiOff } from "lucide-react";

export function OfflineNotice() {
  return (
    <div className="flex min-h-dvh items-center justify-center px-4">
      <div className="aurora" aria-hidden />
      <div className="max-w-sm text-center">
        <div className="glass mx-auto mb-5 flex size-14 items-center justify-center rounded-2xl">
          <WifiOff className="size-6 text-muted-foreground" strokeWidth={1.8} />
        </div>
        <h1 className="display text-4xl font-bold">You're offline</h1>
        <p className="text-sm text-muted-foreground mt-2">
          FinanceTracker needs an internet connection to load and save your data. Please reconnect and try again.
        </p>
      </div>
    </div>
  );
}
