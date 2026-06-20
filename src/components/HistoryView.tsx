// "History" tab: collapsible month/year accordion of past expenses/income, each group rendering PeriodPanel.
import { useMemo, useState } from "react";
import { useExpenses, useIncomes, useBudgets, type Expense, type Income, type Budget } from "@/lib/finance-data";
import { PeriodPanel } from "@/components/PeriodPanel";

function groupKey(dateStr: string, granularity: "month" | "year") {
  const d = new Date(dateStr);
  return granularity === "month"
    ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    : String(d.getFullYear());
}

function groupByKey<T extends { date: string }>(items: T[], granularity: "month" | "year") {
  const m = new Map<string, T[]>();
  items.forEach((item) => {
    const key = groupKey(item.date, granularity);
    const arr = m.get(key) ?? [];
    arr.push(item);
    m.set(key, arr);
  });
  return m;
}

// Budgets don't have a `date`, just year/month, so they get their own grouping key.
function groupBudgetsByKey(items: Budget[], granularity: "month" | "year") {
  const m = new Map<string, Budget[]>();
  items.forEach((item) => {
    const key = granularity === "month" ? `${item.year}-${String(item.month).padStart(2, "0")}` : String(item.year);
    const arr = m.get(key) ?? [];
    arr.push(item);
    m.set(key, arr);
  });
  return m;
}

export function HistoryView({ userId }: { userId: string }) {
  const { data: expensesAll = [], isLoading: expensesLoading } = useExpenses(userId);
  const { data: incomesAll = [], isLoading: incomesLoading } = useIncomes(userId);
  const { data: budgetsAll = [], isLoading: budgetsLoading } = useBudgets(userId);
  const [granularity, setGranularity] = useState<"month" | "year">("month");
  const [open, setOpen] = useState<string | null | undefined>(undefined);

  const expenseGroups = useMemo(() => groupByKey(expensesAll, granularity), [expensesAll, granularity]);
  const incomeGroups = useMemo(() => groupByKey(incomesAll, granularity), [incomesAll, granularity]);
  const budgetGroups = useMemo(() => groupBudgetsByKey(budgetsAll, granularity), [budgetsAll, granularity]);

  // A period appears in History if it has expenses OR income — not just expenses.
  const groups = useMemo(() => {
    const keys = new Set([...expenseGroups.keys(), ...incomeGroups.keys()]);
    return Array.from(keys)
      .map((key): [string, Expense[]] => [key, expenseGroups.get(key) ?? []])
      .sort((a, b) => (a[0] < b[0] ? 1 : -1));
  }, [expenseGroups, incomeGroups]);

  const effectiveOpen = open === undefined ? groups[0]?.[0] ?? null : open;

  function pretty(key: string) {
    if (granularity === "year") return key;
    const [y, m] = key.split("-");
    return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString("en-GB", {
      month: "long",
      year: "numeric",
    });
  }

  if (expensesLoading || incomesLoading || budgetsLoading) {
    return <p className="text-sm text-muted-foreground">Loading...</p>;
  }

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
          const incomeItems: Income[] = incomeGroups.get(key) ?? [];
          // Budgets are inherently monthly, so they only apply to month-granularity groups.
          const budgetItems: Budget[] | undefined =
            granularity === "month" ? budgetGroups.get(key) ?? [] : undefined;
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
                    expenses={items as Expense[]}
                    incomes={incomeItems}
                    budgets={budgetItems}
                    showTrend={granularity === "year"}
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
