// "History" tab: collapsible month/year accordion of past expenses, each group rendering PeriodPanel.
import { useMemo, useState } from "react";
import { useExpenses, useIncomes, useUpdateIncome, type Expense } from "@/lib/finance-data";
import { PeriodPanel } from "@/components/PeriodPanel";

export function HistoryView({ userId }: { userId: string }) {
  const { data: expensesAll = [], isLoading: expensesLoading } = useExpenses(userId);
  const { data: incomesAll = [], isLoading: incomesLoading } = useIncomes(userId);
  const updateIncome = useUpdateIncome(userId);
  const [granularity, setGranularity] = useState<"month" | "year">("month");
  const [open, setOpen] = useState<string | null | undefined>(undefined);

  const groups = useMemo(() => {
    const m = new Map<string, Expense[]>();
    expensesAll.forEach((e) => {
      const d = new Date(e.date);
      const key =
        granularity === "month"
          ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
          : String(d.getFullYear());
      const arr = m.get(key) ?? [];
      arr.push(e);
      m.set(key, arr);
    });
    return Array.from(m.entries()).sort((a, b) => (a[0] < b[0] ? 1 : -1));
  }, [expensesAll, granularity]);

  const effectiveOpen = open === undefined ? groups[0]?.[0] ?? null : open;

  // Year groups show the read-only sum of that year's months; month groups show (and allow
  // fixing) that specific month's recorded income.
  function incomeForKey(key: string): number {
    if (granularity === "year") {
      return incomesAll.filter((i) => i.year === Number(key)).reduce((a, i) => a + i.amount, 0);
    }
    const [y, m] = key.split("-").map(Number);
    return incomesAll.find((i) => i.year === y && i.month === m)?.amount ?? 0;
  }

  function pretty(key: string) {
    if (granularity === "year") return key;
    const [y, m] = key.split("-");
    return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString("en-GB", {
      month: "long",
      year: "numeric",
    });
  }

  if (expensesLoading || incomesLoading) return <p className="text-sm text-muted-foreground">Loading...</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold tracking-tight">History</h2>
        <div className="flex bg-card border border-border rounded-lg p-1 text-xs">
          {(["month", "year"] as const).map((g) => (
            <button
              key={g}
              onClick={() => setGranularity(g)}
              className={`px-3 py-1.5 rounded-md transition ${
                granularity === g ? "bg-secondary text-foreground" : "text-muted-foreground"
              }`}
            >
              {g === "month" ? "By month" : "By year"}
            </button>
          ))}
        </div>
      </div>

      {groups.length === 0 && (
        <div className="bg-card border border-border rounded-2xl p-10 text-center text-sm text-muted-foreground">
          History is empty so far.
        </div>
      )}

      <div className="space-y-3">
        {groups.map(([key, items]) => {
          const total = items.reduce((a, e) => a + e.amount, 0);
          const isOpen = effectiveOpen === key;
          return (
            <div key={key} className="bg-card border border-border rounded-2xl overflow-hidden">
              <button
                onClick={() => setOpen(isOpen ? null : key)}
                className="w-full px-5 py-4 flex items-center justify-between text-sm hover:bg-accent/40 transition"
              >
                <span className="capitalize">{pretty(key)}</span>
                <span className="flex items-center gap-4 text-muted-foreground">
                  <span>{items.length} entries</span>
                  <span className="tabular-nums text-foreground">€{total.toFixed(2)}</span>
                </span>
              </button>
              {isOpen && (
                <div className="border-t border-border p-5">
                  <PeriodPanel
                    title={pretty(key)}
                    expenses={items}
                    income={incomeForKey(key)}
                    editableIncome={granularity === "month"}
                    onUpdateIncome={
                      granularity === "month"
                        ? (n) => {
                            const [y, m] = key.split("-").map(Number);
                            updateIncome.mutate({ year: y, month: m, amount: n });
                          }
                        : undefined
                    }
                    userId={userId}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
