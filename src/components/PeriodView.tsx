// "Month"/"Year" tab: filters expenses/incomes for the current month or year and renders PeriodPanel.
import { useMemo } from "react";
import { useExpenses, useIncomes, useBudgets } from "@/lib/finance-data";
import { PeriodPanel } from "@/components/PeriodPanel";

export function PeriodView({ mode, userId }: { mode: "month" | "year"; userId: string }) {
  const { data: expensesAll = [], isLoading: expensesLoading } = useExpenses(userId);
  const { data: incomesAll = [], isLoading: incomesLoading } = useIncomes(userId);
  const { data: budgetsAll = [], isLoading: budgetsLoading } = useBudgets(userId);
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const inPeriod = (dateStr: string) => {
    const d = new Date(dateStr);
    if (mode === "year") return d.getFullYear() === year;
    return d.getFullYear() === year && d.getMonth() + 1 === month;
  };

  const expenses = useMemo(() => expensesAll.filter((e) => inPeriod(e.date)), [expensesAll, mode, year, month]);
  const incomes = useMemo(() => incomesAll.filter((i) => inPeriod(i.date)), [incomesAll, mode, year, month]);
  // Budgets are inherently monthly, so they only apply to the month view, not the year view.
  const budgets = useMemo(
    () => (mode === "month" ? budgetsAll.filter((b) => b.year === year && b.month === month) : undefined),
    [budgetsAll, mode, year, month]
  );

  const label =
    mode === "month"
      ? now.toLocaleDateString("en-GB", { month: "long", year: "numeric" })
      : String(year);

  if (expensesLoading || incomesLoading || budgetsLoading) {
    return <p className="text-sm text-muted-foreground">Loading...</p>;
  }

  return (
    <PeriodPanel
      title={label}
      expenses={expenses}
      incomes={incomes}
      budgets={budgets}
      showTrend={mode === "year"}
      userId={userId}
    />
  );
}
