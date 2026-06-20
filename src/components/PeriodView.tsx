// "Kuu"/"Aasta" tab: fetches expenses/incomes for the current month or year and renders PeriodPanel.
import { useMemo } from "react";
import { useExpenses, useIncomes, useUpdateIncome } from "@/lib/finance-data";
import { PeriodPanel } from "@/components/PeriodPanel";

export function PeriodView({ mode, userId }: { mode: "month" | "year"; userId: string }) {
  const { data: expensesAll = [], isLoading: expensesLoading } = useExpenses(userId);
  const { data: incomesAll = [], isLoading: incomesLoading } = useIncomes(userId);
  const updateIncome = useUpdateIncome(userId);
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const expenses = useMemo(
    () =>
      expensesAll.filter((e) => {
        const d = new Date(e.date);
        if (mode === "year") return d.getFullYear() === year;
        return d.getFullYear() === year && d.getMonth() + 1 === month;
      }),
    [expensesAll, mode, year, month]
  );

  // Year income is never edited directly — it's just the sum of that year's recorded months.
  const income = useMemo(() => {
    if (mode === "year") {
      return incomesAll.filter((i) => i.year === year).reduce((a, i) => a + i.amount, 0);
    }
    return incomesAll.find((i) => i.year === year && i.month === month)?.amount ?? 0;
  }, [incomesAll, mode, year, month]);

  const label =
    mode === "month"
      ? now.toLocaleDateString("et-EE", { month: "long", year: "numeric" })
      : String(year);

  if (expensesLoading || incomesLoading) return <p className="text-sm text-muted-foreground">Laadin...</p>;

  return (
    <PeriodPanel
      title={label}
      expenses={expenses}
      income={income}
      editableIncome={mode === "month"}
      onUpdateIncome={mode === "month" ? (n) => updateIncome.mutate({ year, month, amount: n }) : undefined}
      userId={userId}
    />
  );
}
