// "Overview" tab: the current month (expenses, income, this month's plan, balance) via PeriodPanel.
import { useMemo } from "react";
import { useExpenses, useIncomes, useBudgets, useBankBalance } from "@/lib/finance-data";
import { closingBalance, type Period } from "@/lib/period";
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
  const bankBalance = useBankBalance(userId);
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

  const period: Period = { kind: "month", year, month };

  return (
    <PeriodPanel
      period={period}
      expenses={expenses}
      incomes={incomes}
      budgets={budgets}
      balance={closingBalance(period, expensesAll, incomesAll, bankBalance)}
      userId={userId}
    />
  );
}
