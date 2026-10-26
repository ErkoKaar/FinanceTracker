// "Overview" tab: the current month (expenses, income, this month's plan, bank balance) via PeriodPanel.
import { useMemo } from "react";
import { useExpenses, useIncomes, useBudgets, useBankConnections } from "@/lib/finance-data";
import { PeriodPanel } from "@/components/PeriodPanel";

// Placeholder in the shape of the title and summary cards, so the page doesn't jump when data arrives.
export function PeriodSkeleton() {
  return (
    <div className="animate-pulse space-y-8" aria-busy="true" aria-label="Loading">
      <div className="h-14 w-3/5 rounded-2xl bg-foreground/[0.06] md:h-20" />
      <div className="grid gap-4 md:grid-cols-[1fr_1.4fr_1fr]">
        <div className="h-44 rounded-[20px] bg-foreground/[0.05]" />
        <div className="h-44 rounded-[20px] bg-foreground/[0.05]" />
        <div className="h-44 rounded-[20px] bg-foreground/[0.05]" />
      </div>
    </div>
  );
}

export function PeriodView({ userId }: { userId: string }) {
  const { data: expensesAll = [], isLoading: expensesLoading } = useExpenses(userId);
  const { data: incomesAll = [], isLoading: incomesLoading } = useIncomes(userId);
  const { data: budgetsAll = [], isLoading: budgetsLoading } = useBudgets(userId);
  const { data: bankConnections = [] } = useBankConnections(userId);
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const inMonth = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.getFullYear() === year && d.getMonth() + 1 === month;
  };

  const expenses = useMemo(() => expensesAll.filter((e) => inMonth(e.date)), [expensesAll, year, month]);
  const incomes = useMemo(() => incomesAll.filter((i) => inMonth(i.date)), [incomesAll, year, month]);
  const budgets = useMemo(
    () => budgetsAll.filter((b) => b.year === year && b.month === month),
    [budgetsAll, year, month]
  );

  if (expensesLoading || incomesLoading || budgetsLoading) {
    return <PeriodSkeleton />;
  }

  // Real balance straight from the bank — a "now" number, so it only belongs on the current
  // month (Overview), not on history periods. Null when no account has reported one yet.
  const withBalance = bankConnections.filter((c) => c.balance !== null);
  const bankBalance = withBalance.length > 0 ? withBalance.reduce((sum, c) => sum + (c.balance ?? 0), 0) : null;

  return (
    <PeriodPanel
      period={{ kind: "month", year, month }}
      expenses={expenses}
      incomes={incomes}
      budgets={budgets}
      bankBalance={bankBalance}
      userId={userId}
    />
  );
}
