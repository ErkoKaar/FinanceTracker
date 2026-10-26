// Logged-in app shell: header with account actions, and the five destinations, each with one job:
// Overview (this month), History (past months and years), Add, Plan (budget + recurring), Wishlist.
// Desktop shows them as a pill tab row in the header with Add as the primary button; below `md` they
// move into a bottom tab bar with Add as the raised centre button, thumb-reachable in the PWA.
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  LogOut,
  Bell,
  BellOff,
  Download,
  Landmark,
  Plus,
  LayoutGrid,
  History,
  Target,
  Gift,
  type LucideIcon,
} from "lucide-react";
import { useApplyRecurring, useBankConnections, useDisconnectBank } from "@/lib/finance-data";
import { isPushSupported, getPushSubscriptionStatus, subscribeToPush, unsubscribeFromPush } from "@/lib/push";
import { startBankAuth } from "@/lib/bank";
import { exportAllData } from "@/lib/export";
import { AddView } from "@/components/AddView";
import { PeriodView } from "@/components/PeriodView";
import { PlanView } from "@/components/PlanView";
import { WishlistView } from "@/components/WishlistView";
import { HistoryView } from "@/components/HistoryView";
import logo from "@/assets/finance-tracker-logo-transparent.png";

type Tab = "add" | "overview" | "history" | "plan" | "wishlist";

const NAV: { id: Exclude<Tab, "add">; label: string; icon: LucideIcon }[] = [
  { id: "overview", label: "Overview", icon: LayoutGrid },
  { id: "history", label: "History", icon: History },
  { id: "plan", label: "Plan", icon: Target },
  { id: "wishlist", label: "Wishlist", icon: Gift },
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
  useApplyRecurring(userId);

  function selectTab(k: Tab) {
    setTab(k);
    window.scrollTo({ top: 0 });
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
            ? "Your bank connection is expiring. Renew it now? (You'll be redirected to the bank.)"
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

  const iconButton =
    "inline-flex size-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-foreground/[0.06] hover:text-foreground active:scale-95 disabled:opacity-50";

  return (
    <div className="min-h-dvh">
      <div className="aurora" aria-hidden />

      <header className="glass-bar sticky top-0 z-20 border-b border-border pt-[env(safe-area-inset-top)]">
        <div className="mx-auto grid h-16 max-w-6xl grid-cols-[1fr_auto] items-center gap-4 px-4 sm:px-6 md:grid-cols-[1fr_auto_1fr]">
          <div className="flex min-w-0 items-center gap-2.5">
            <img src={logo} alt="" className="logo-glow size-7 shrink-0" />
            <span className="truncate font-semibold tracking-tight">FinanceTracker</span>
          </div>

          <DesktopNav tab={tab} onSelect={selectTab} />

          <div className="flex items-center justify-end gap-0.5 sm:gap-1">
            <button
              onClick={() => selectTab("add")}
              aria-current={tab === "add" ? "page" : undefined}
              className={`mr-2 hidden h-10 items-center gap-1.5 rounded-full px-4 text-sm font-medium transition md:inline-flex active:scale-[0.97] ${
                tab === "add"
                  ? "bg-primary/15 text-primary ring-1 ring-primary/40"
                  : "bg-primary text-primary-foreground hover:brightness-110"
              }`}
            >
              <Plus className="size-4" strokeWidth={2.4} />
              Add entry
            </button>
            <button
              onClick={handleExport}
              disabled={exporting}
              className={iconButton}
              aria-label="Export all data as backup"
              title="Download a backup of all your data"
            >
              <Download className="size-4" />
            </button>
            <button
              onClick={handleBank}
              disabled={bankBusy}
              className={iconButton}
              aria-label={bankConnected ? "Manage bank connection" : "Connect bank"}
              title={
                bankConnected
                  ? bankExpiresSoon
                    ? "Bank connection expiring soon. Click to renew"
                    : "Bank connected, automatic imports are on"
                  : "Connect your bank for automatic imports"
              }
            >
              <Landmark
                className={`size-4 ${bankConnected ? (bankExpiresSoon ? "text-gold" : "text-primary") : ""}`}
              />
            </button>
            {isPushSupported() && (
              <button
                onClick={togglePush}
                className={iconButton}
                aria-label={pushEnabled ? "Disable reminders" : "Enable reminders"}
                title={pushEnabled ? "Weekly/month-end reminders are on" : "Enable weekly/month-end reminders"}
              >
                {pushEnabled ? <Bell className="size-4 text-primary" /> : <BellOff className="size-4" />}
              </button>
            )}
            <button onClick={onSignOut} className={iconButton} aria-label="Log out" title="Log out">
              <LogOut className="size-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-36 pt-6 sm:px-6 md:pb-20 md:pt-10">
        {/* key: each tab mounts fresh, so its entrance motion plays when you switch to it. */}
        <div key={tab}>
          {tab === "add" && (
            <AddView userId={userId} displayName={displayName} onUpdateDisplayName={onUpdateDisplayName} />
          )}
          {tab === "overview" && <PeriodView userId={userId} />}
          {tab === "history" && <HistoryView userId={userId} />}
          {tab === "plan" && <PlanView userId={userId} />}
          {tab === "wishlist" && <WishlistView userId={userId} />}
        </div>
      </main>

      <MobileTabBar tab={tab} onSelect={selectTab} />
    </div>
  );
}

// Pill row with one sliding highlight behind the active tab. When Add is open, no pill is active and
// the highlight fades out instead of jumping.
function DesktopNav({ tab, onSelect }: { tab: Tab; onSelect: (t: Tab) => void }) {
  const refs = useRef<Partial<Record<Tab, HTMLButtonElement | null>>>({});
  const [indicator, setIndicator] = useState<{ left: number; width: number } | null>(null);

  useLayoutEffect(() => {
    const el = refs.current[tab];
    if (el) setIndicator({ left: el.offsetLeft, width: el.offsetWidth });
  }, [tab]);

  return (
    <nav aria-label="Views" className="relative hidden items-center rounded-full glass p-1 text-sm md:flex">
      <span
        aria-hidden
        className={`absolute inset-y-1 left-0 rounded-full bg-foreground/[0.1] transition-[transform,width,opacity] duration-200 ease-in-out motion-reduce:transition-[opacity] ${
          tab === "add" ? "opacity-0" : "opacity-100"
        }`}
        style={indicator ? { width: indicator.width, transform: `translateX(${indicator.left}px)` } : { width: 0 }}
      />
      {NAV.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          ref={(el) => {
            refs.current[id] = el;
          }}
          onClick={() => onSelect(id)}
          aria-current={tab === id ? "page" : undefined}
          className={`relative flex items-center gap-1.5 rounded-full px-3.5 py-1.5 transition-colors ${
            tab === id ? "text-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Icon className={`size-4 ${tab === id ? "text-primary" : ""}`} strokeWidth={2} />
          {label}
        </button>
      ))}
    </nav>
  );
}

function MobileTabBar({ tab, onSelect }: { tab: Tab; onSelect: (t: Tab) => void }) {
  const item = (id: Exclude<Tab, "add">) => {
    const { label, icon: Icon } = NAV.find((n) => n.id === id)!;
    const active = tab === id;
    return (
      <button
        key={id}
        onClick={() => onSelect(id)}
        aria-current={active ? "page" : undefined}
        className={`flex min-h-14 flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors active:scale-95 ${
          active ? "text-foreground" : "text-muted-foreground"
        }`}
      >
        <span
          className={`flex h-7 w-12 items-center justify-center rounded-full transition-colors duration-200 ${
            active ? "bg-primary/15" : ""
          }`}
        >
          <Icon className={`size-5 transition-colors ${active ? "text-primary" : ""}`} strokeWidth={active ? 2.2 : 1.8} />
        </span>
        {label}
      </button>
    );
  };

  return (
    <nav
      aria-label="Views"
      className="glass-bar fixed inset-x-0 bottom-0 z-20 border-t border-border pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <div className="mx-auto grid max-w-md grid-cols-5 px-2">
        {item("overview")}
        {item("history")}
        <button
          onClick={() => onSelect("add")}
          aria-current={tab === "add" ? "page" : undefined}
          className="flex min-h-14 flex-col items-center justify-center gap-1 text-[11px] font-medium text-foreground"
        >
          <span
            className={`-mt-6 flex size-13 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_8px_24px_-6px_oklch(0.86_0.14_165/0.55)] ring-4 ring-background transition-transform duration-150 ease-out active:scale-95 ${
              tab === "add" ? "" : "brightness-95"
            }`}
          >
            <Plus className="size-6" strokeWidth={2.4} />
          </span>
          Add
        </button>
        {item("plan")}
        {item("wishlist")}
      </div>
    </nav>
  );
}
