// "History" tab: collapsible month/year accordion of past expenses/income, each group rendering PeriodPanel.
// Every group header carries its own small DayStrip, so the shape of each month is visible before opening it.
import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { useExpenses, useIncomes, useBudgets, type Expense, type Income, type Budget } from "@/lib/finance-data";
import { periodLabel, stripFor, type Period } from "@/lib/period";
import { PeriodPanel } from "@/components/PeriodPanel";
import { PeriodSkeleton } from "@/components/PeriodView";
import { DayStrip } from "@/components/DayStrip";
import { Money } from "@/components/Money";

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

  function periodOf(key: string): Period {
    const [y, m] = key.split("-");
    return granularity === "year" ? { kind: "year", year: Number(y) } : { kind: "month", year: Number(y), month: Number(m) };
  }

  if (expensesLoading || incomesLoading || budgetsLoading) {
    return <PeriodSkeleton />;
  }

  return (
    <div className="space-y-8">
      <header className="rise flex flex-wrap items-end justify-between gap-6">
        <h1 className="display text-[clamp(2.5rem,8vw,4.5rem)] font-bold">History</h1>
        <div role="group" aria-label="Group by" className="glass relative grid w-56 grid-cols-2 rounded-full p-1 text-sm">
          <span
            aria-hidden
            className={`absolute inset-y-1 left-1 w-[calc(50%-4px)] rounded-full bg-foreground/[0.1] transition-transform duration-200 ease-in-out motion-reduce:transition-none ${
              granularity === "year" ? "translate-x-full" : ""
            }`}
          />
          {(["month", "year"] as const).map((g) => (
            <button
              key={g}
              type="button"
              aria-pressed={granularity === g}
              onClick={() => setGranularity(g)}
              className={`relative rounded-full py-1.5 transition-colors ${
                granularity === g ? "text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {g === "month" ? "Months" : "Years"}
            </button>
          ))}
        </div>
      </header>

      {groups.length === 0 && (
        <div className="glass rounded-[20px] p-10 text-center text-sm text-muted-foreground">
          History is empty so far. Entries you add show up here grouped by month.
        </div>
      )}

      <div className="space-y-3">
        {groups.map(([key, items]) => {
          const total = items.reduce((a, e) => a + e.amount, 0);
          const isOpen = effectiveOpen === key;
          const incomeItems: Income[] = incomeGroups.get(key) ?? [];
          const incomeTotal = incomeItems.reduce((a, i) => a + i.amount, 0);
          // Budgets are inherently monthly, so they only apply to month-granularity groups.
          const budgetItems: Budget[] | undefined =
            granularity === "month" ? budgetGroups.get(key) ?? [] : undefined;
          const period = periodOf(key);
          const panelId = `history-${key}`;
          return (
            <section key={key} className="glass overflow-hidden rounded-[20px]">
              <button
                onClick={() => setOpen(isOpen ? null : key)}
                aria-expanded={isOpen}
                aria-controls={panelId}
                className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-x-6 gap-y-3 px-5 py-4 text-left transition-colors hover:bg-foreground/[0.03] sm:grid-cols-[11rem_minmax(0,1fr)_auto]"
              >
                <span className="display text-2xl font-semibold capitalize">{periodLabel(period)}</span>
                {/* The open panel shows the full-size strip, so the preview hides to avoid a duplicate. */}
                <span
                  className={`col-span-2 row-start-2 transition-opacity duration-200 sm:col-span-1 sm:row-start-auto ${
                    isOpen ? "max-sm:hidden sm:invisible sm:opacity-0" : ""
                  }`}
                >
                  <DayStrip {...stripFor(period, items)} size="sm" />
                </span>
                <span className="flex items-center gap-4 justify-self-end text-sm">
                  <span className="hidden text-primary sm:inline" title="Income">
                    +<Money value={incomeTotal} centsClassName="hidden" />
                  </span>
                  <Money value={-total} className="text-spend" centsClassName="text-[0.62em] text-spend/60" />
                  <ChevronDown
                    className={`size-4 text-muted-foreground transition-transform duration-200 ease-in-out motion-reduce:transition-none ${isOpen ? "rotate-180" : ""}`}
                    aria-hidden
                  />
                </span>
              </button>
              {isOpen && (
                <div id={panelId} className="rise border-t border-border p-5">
                  <PeriodPanel
                    period={period}
                    expenses={items as Expense[]}
                    incomes={incomeItems}
                    budgets={budgetItems}
                    showTrend={granularity === "year"}
                    embedded
                    userId={userId}
                  />
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
