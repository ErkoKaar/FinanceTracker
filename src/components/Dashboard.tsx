// Logged-in app shell: header/tabs/sign-out, switches between the Add/Recurring/Month/Plan/Year/History tabs.
// The desktop nav groups tabs into two "Manage"/"Review" dropdowns; below the `md` breakpoint it
// collapses into a single full-width dropdown with the same two groups as labeled sections.
import { useEffect, useRef, useState } from "react";
import { LogOut, Bell, BellOff, Download, Landmark, Menu, X, ChevronDown } from "lucide-react";
import { useApplyRecurring, useApplyPreviousMonthCarryover, useBankConnections, useDisconnectBank } from "@/lib/finance-data";
import { isPushSupported, getPushSubscriptionStatus, subscribeToPush, unsubscribeFromPush } from "@/lib/push";
import { startBankAuth } from "@/lib/bank";
import { exportAllData } from "@/lib/export";
import { AddView } from "@/components/AddView";
import { RecurringView } from "@/components/RecurringView";
import { PeriodView } from "@/components/PeriodView";
import { PlanView } from "@/components/PlanView";
import { HistoryView } from "@/components/HistoryView";
import logo from "@/assets/finance-tracker-logo-transparent.png";

type Tab = "add" | "recurring" | "month" | "plan" | "year" | "history";
type GroupId = "manage" | "review";

const TAB_GROUPS: { id: GroupId; label: string; tabs: [Tab, string][] }[] = [
  {
    id: "manage",
    label: "Manage",
    tabs: [
      ["add", "Add"],
      ["recurring", "Recurring"],
      ["plan", "Plan"],
    ],
  },
  {
    id: "review",
    label: "Review",
    tabs: [
      ["month", "Month"],
      ["year", "Year"],
      ["history", "History"],
    ],
  },
];

export function Dashboard({
  userId,
  displayName,
  onUpdateDisplayName,
  onSignOut,
}: {
  userId: string;
  displayName: string;
  onUpdateDisplayName: (name: string) => void;
  onSignOut: () => void;
}) {
  const [tab, setTab] = useState<Tab>("add");
  const [pushEnabled, setPushEnabled] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openGroup, setOpenGroup] = useState<GroupId | null>(null);
  const navRef = useRef<HTMLElement>(null);
  useApplyRecurring(userId);
  useApplyPreviousMonthCarryover(userId);

  function selectTab(k: Tab) {
    setTab(k);
    setMobileMenuOpen(false);
    setOpenGroup(null);
  }

  // Closes an open desktop dropdown when clicking anywhere outside the nav — the dropdown only
  // opens/closes on click (no hover), so this is the sole way to dismiss it without picking a tab.
  useEffect(() => {
    if (!openGroup) return;
    function handleClick(e: MouseEvent) {
      if (navRef.current && !navRef.current.contains(e.target as Node)) setOpenGroup(null);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [openGroup]);

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

  const { data: bankConnections = [] } = useBankConnections(userId);
  const disconnectBank = useDisconnectBank(userId);
  const bankConnected = bankConnections.length > 0;
  // Consent lasts max ~180 days; warn (amber icon + renew prompt) within the last 14.
  const bankExpiresSoon = bankConnections.some(
    (c) => new Date(c.valid_until).getTime() - Date.now() < 14 * 24 * 3600 * 1000
  );
  const [bankBusy, setBankBusy] = useState(false);

  async function handleBank() {
    setBankBusy(true);
    try {
      if (!bankConnected) {
        if (confirm("Connect your Swedbank account? You'll be redirected to the bank to approve access.")) {
          await startBankAuth(); // navigates away on success
        }
      } else if (
        confirm(
          bankExpiresSoon
            ? "Your bank connection is expiring — renew it now? (You'll be redirected to the bank.)"
            : "Bank is connected. Renew the connection now? (Cancel to keep it as is.)"
        )
      ) {
        await startBankAuth();
      } else if (!bankExpiresSoon && confirm("Disconnect the bank instead? Already imported transactions will stay.")) {
        disconnectBank.mutate(bankConnections.map((c) => c.id));
      }
    } catch {
      alert("Could not reach the bank connection service. Try again in a moment.");
    } finally {
      setBankBusy(false);
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
            <img src={logo} alt="" className="h-7 w-7 logo-glow" />
            <span className="font-semibold tracking-tight">FinanceTracker</span>
          </div>

          <nav ref={navRef} className="hidden md:flex items-center gap-1 text-sm">
            {TAB_GROUPS.map((group) => {
              const activeTab = group.tabs.find(([k]) => k === tab);
              return (
                <div key={group.id} className="relative">
                  <button
                    onClick={() => setOpenGroup((g) => (g === group.id ? null : group.id))}
                    aria-expanded={openGroup === group.id}
                    className={`px-3 py-1.5 rounded-md transition flex items-center gap-1.5 ${
                      activeTab ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <span>
                      {group.label}
                      {activeTab && <span className="text-muted-foreground"> · {activeTab[1]}</span>}
                    </span>
                    <ChevronDown
                      className={`size-3.5 transition-transform ${openGroup === group.id ? "rotate-180" : ""}`}
                    />
                  </button>

                  {openGroup === group.id && (
                    <div className="absolute top-full left-0 mt-1 min-w-36 bg-popover border border-border rounded-lg shadow-lg py-1 z-30">
                      {group.tabs.map(([k, label]) => (
                        <button
                          key={k}
                          onClick={() => selectTab(k)}
                          className={`w-full text-left px-3 py-1.5 transition ${
                            tab === k
                              ? "bg-secondary text-foreground"
                              : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
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
            <button
              onClick={handleBank}
              disabled={bankBusy}
              className="text-muted-foreground hover:text-foreground transition p-2 disabled:opacity-50"
              aria-label={bankConnected ? "Manage bank connection" : "Connect bank"}
              title={
                bankConnected
                  ? bankExpiresSoon
                    ? "Bank connection expiring soon — click to renew"
                    : "Bank connected — automatic imports are on"
                  : "Connect your bank for automatic imports"
              }
            >
              <Landmark
                className={`size-4 ${bankConnected ? (bankExpiresSoon ? "text-amber-500" : "text-primary") : ""}`}
              />
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
            <nav className="md:hidden absolute top-16 left-0 right-0 z-20 bg-background border-b border-border px-6 py-3 flex flex-col text-sm">
              {TAB_GROUPS.map((group, i) => (
                <div key={group.id} className={i > 0 ? "mt-3" : undefined}>
                  <div className="px-3 pb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground/70">
                    {group.label}
                  </div>
                  {group.tabs.map(([k, label]) => (
                    <button
                      key={k}
                      onClick={() => selectTab(k)}
                      className={`w-full px-3 py-2 rounded-md text-left transition ${
                        tab === k ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              ))}
            </nav>
          </>
        )}
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">
        {tab === "add" && (
          <AddView userId={userId} displayName={displayName} onUpdateDisplayName={onUpdateDisplayName} />
        )}
        {tab === "recurring" && <RecurringView userId={userId} />}
        {tab === "month" && <PeriodView mode="month" userId={userId} />}
        {tab === "plan" && <PlanView userId={userId} />}
        {tab === "year" && <PeriodView mode="year" userId={userId} />}
        {tab === "history" && <HistoryView userId={userId} />}
      </main>
    </div>
  );
}
