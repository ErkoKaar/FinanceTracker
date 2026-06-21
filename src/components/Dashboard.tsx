// Logged-in app shell: header/tabs/sign-out, switches between the Add/Recurring/Month/Plan/Year/History tabs.
import { useEffect, useState } from "react";
import { LogOut, Bell, BellOff } from "lucide-react";
import { useApplyRecurring } from "@/lib/finance-data";
import { isPushSupported, getPushSubscriptionStatus, subscribeToPush, unsubscribeFromPush } from "@/lib/push";
import { AddView } from "@/components/AddView";
import { RecurringView } from "@/components/RecurringView";
import { PeriodView } from "@/components/PeriodView";
import { PlanView } from "@/components/PlanView";
import { HistoryView } from "@/components/HistoryView";

type Tab = "add" | "recurring" | "month" | "plan" | "year" | "history";

export function Dashboard({
  userId,
  email,
  onSignOut,
}: {
  userId: string;
  email: string;
  onSignOut: () => void;
}) {
  const [tab, setTab] = useState<Tab>("add");
  const [pushEnabled, setPushEnabled] = useState(false);
  useApplyRecurring(userId);

  useEffect(() => {
    if (isPushSupported()) getPushSubscriptionStatus().then(setPushEnabled);
  }, []);

  async function togglePush() {
    try {
      if (pushEnabled) {
        await unsubscribeFromPush();
        setPushEnabled(false);
      } else {
        await subscribeToPush(userId);
        setPushEnabled(true);
      }
    } catch {
      // Permission denied or unsupported — button just stays in its current state.
    }
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-border sticky top-0 bg-background/80 backdrop-blur z-10">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="font-semibold tracking-tight">FinanceTracker</span>
          </div>
          <nav className="flex items-center gap-1 text-sm">
            {([
              ["add", "Add"],
              ["recurring", "Recurring"],
              ["plan", "Plan"],
            ] as [Tab, string][]).map(([k, label]) => (
              <button
                key={k}
                onClick={() => setTab(k)}
                className={`px-3 py-1.5 rounded-md transition ${
                  tab === k ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {label}
              </button>
            ))}
            <div className="w-px h-5 bg-border mx-2" />
            {([
              ["month", "Month"],
              ["year", "Year"],
              ["history", "History"],
            ] as [Tab, string][]).map(([k, label]) => (
              <button
                key={k}
                onClick={() => setTab(k)}
                className={`px-3 py-1.5 rounded-md transition ${
                  tab === k ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {label}
              </button>
            ))}
          </nav>
          <div className="flex items-center gap-1">
            {isPushSupported() && (
              <button
                onClick={togglePush}
                className="text-muted-foreground hover:text-foreground transition p-2"
                aria-label={pushEnabled ? "Disable reminders" : "Enable reminders"}
                title={pushEnabled ? "Weekly/month-end reminders are on" : "Enable weekly/month-end reminders"}
              >
                {pushEnabled ? <Bell className="size-4 text-primary" /> : <BellOff className="size-4" />}
              </button>
            )}
            <button
              onClick={onSignOut}
              className="text-muted-foreground hover:text-foreground transition p-2"
              aria-label="Log out"
            >
              <LogOut className="size-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">
        {tab === "add" && <AddView userId={userId} email={email} />}
        {tab === "recurring" && <RecurringView userId={userId} />}
        {tab === "month" && <PeriodView mode="month" userId={userId} />}
        {tab === "plan" && <PlanView userId={userId} />}
        {tab === "year" && <PeriodView mode="year" userId={userId} />}
        {tab === "history" && <HistoryView userId={userId} />}
      </main>
    </div>
  );
}
