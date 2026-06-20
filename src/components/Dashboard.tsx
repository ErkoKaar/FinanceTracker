// Logged-in app shell: header/tabs/sign-out, switches between the Lisa/Kuu/Aasta/Ajalugu tabs.
import { useState } from "react";
import { Wallet, LogOut } from "lucide-react";
import { AddView } from "@/components/AddView";
import { PeriodView } from "@/components/PeriodView";
import { HistoryView } from "@/components/HistoryView";

type Tab = "lisa" | "kuu" | "aasta" | "ajalugu";

export function Dashboard({
  userId,
  email,
  onSignOut,
}: {
  userId: string;
  email: string;
  onSignOut: () => void;
}) {
  const [tab, setTab] = useState<Tab>("lisa");

  return (
    <div className="min-h-screen">
      <header className="border-b border-border sticky top-0 bg-background/80 backdrop-blur z-10">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Wallet className="size-4 text-primary" />
            </div>
            <span className="font-semibold tracking-tight">Lumen</span>
          </div>
          <nav className="flex items-center gap-1 text-sm">
            {([
              ["lisa", "Lisa"],
              ["kuu", "Kuu"],
              ["aasta", "Aasta"],
              ["ajalugu", "Ajalugu"],
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
            aria-label="Logi välja"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">
        {tab === "lisa" && <AddView userId={userId} email={email} />}
        {tab === "kuu" && <PeriodView mode="month" userId={userId} />}
        {tab === "aasta" && <PeriodView mode="year" userId={userId} />}
        {tab === "ajalugu" && <HistoryView userId={userId} />}
      </main>
    </div>
  );
}
