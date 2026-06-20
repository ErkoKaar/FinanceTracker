// Logged-in app shell: header/tabs/sign-out, switches between the Add/Recurring/Month/Year/History tabs.
import { useState } from "react";
import { LogOut } from "lucide-react";
import { useApplyRecurring } from "@/lib/finance-data";
import { AddView } from "@/components/AddView";
import { RecurringView } from "@/components/RecurringView";
import { PeriodView } from "@/components/PeriodView";
import { HistoryView } from "@/components/HistoryView";

type Tab = "add" | "recurring" | "month" | "year" | "history";

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
  useApplyRecurring(userId);

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
          <button
            onClick={onSignOut}
            className="text-muted-foreground hover:text-foreground transition p-2"
            aria-label="Log out"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">
        {tab === "add" && <AddView userId={userId} email={email} />}
        {tab === "recurring" && <RecurringView userId={userId} />}
        {tab === "month" && <PeriodView mode="month" userId={userId} />}
        {tab === "year" && <PeriodView mode="year" userId={userId} />}
        {tab === "history" && <HistoryView userId={userId} />}
      </main>
    </div>
  );
}
