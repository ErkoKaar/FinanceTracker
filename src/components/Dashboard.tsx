// Logged-in app shell: header/tabs/sign-out, switches between the Add/Recurring/Month/Plan/Year/History tabs.
// The tab nav collapses into a dropdown below the `md` breakpoint, since all 6 tabs don't fit a phone width.
import { useEffect, useState } from "react";
import { LogOut, Bell, BellOff, Download, Menu, X } from "lucide-react";
import { useApplyRecurring } from "@/lib/finance-data";
import { isPushSupported, getPushSubscriptionStatus, subscribeToPush, unsubscribeFromPush } from "@/lib/push";
import { exportAllData } from "@/lib/export";
import { AddView } from "@/components/AddView";
import { RecurringView } from "@/components/RecurringView";
import { PeriodView } from "@/components/PeriodView";
import { PlanView } from "@/components/PlanView";
import { HistoryView } from "@/components/HistoryView";

type Tab = "add" | "recurring" | "month" | "plan" | "year" | "history";

const INPUT_TABS: [Tab, string][] = [
  ["add", "Add"],
  ["recurring", "Recurring"],
  ["plan", "Plan"],
];

const REVIEW_TABS: [Tab, string][] = [
  ["month", "Month"],
  ["year", "Year"],
  ["history", "History"],
];

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
  const [exporting, setExporting] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  useApplyRecurring(userId);

  function selectTab(k: Tab) {
    setTab(k);
    setMobileMenuOpen(false);
  }

  async function handleExport() {
    setExporting(true);
    try {
      await exportAllData();
    } finally {
      setExporting(false);
    }
  }

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
            <button
              onClick={() => setMobileMenuOpen((v) => !v)}
              className="md:hidden text-muted-foreground hover:text-foreground transition p-2 -ml-2"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
            <span className="font-semibold tracking-tight">FinanceTracker</span>
          </div>

          <nav className="hidden md:flex items-center gap-1 text-sm">
            {INPUT_TABS.map(([k, label]) => (
              <button
                key={k}
                onClick={() => selectTab(k)}
                className={`px-3 py-1.5 rounded-md transition ${
                  tab === k ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {label}
              </button>
            ))}
            <div className="w-px h-5 bg-border mx-2" />
            {REVIEW_TABS.map(([k, label]) => (
              <button
                key={k}
                onClick={() => selectTab(k)}
                className={`px-3 py-1.5 rounded-md transition ${
                  tab === k ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-1">
            <button
              onClick={handleExport}
              disabled={exporting}
              className="text-muted-foreground hover:text-foreground transition p-2 disabled:opacity-50"
              aria-label="Export all data as backup"
              title="Download a backup of all your data"
            >
              <Download className="size-4" />
            </button>
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

        {mobileMenuOpen && (
          <>
            <button
              className="md:hidden fixed inset-0 top-16 z-10 bg-background/60"
              aria-label="Close menu"
              onClick={() => setMobileMenuOpen(false)}
            />
            <nav className="md:hidden absolute top-16 left-0 right-0 z-20 bg-background border-b border-border px-6 py-3 flex flex-col gap-1 text-sm">
              {INPUT_TABS.map(([k, label]) => (
                <button
                  key={k}
                  onClick={() => selectTab(k)}
                  className={`px-3 py-2 rounded-md text-left transition ${
                    tab === k ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {label}
                </button>
              ))}
              <div className="h-px bg-border my-1" />
              {REVIEW_TABS.map(([k, label]) => (
                <button
                  key={k}
                  onClick={() => selectTab(k)}
                  className={`px-3 py-2 rounded-md text-left transition ${
                    tab === k ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {label}
                </button>
              ))}
            </nav>
          </>
        )}
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
