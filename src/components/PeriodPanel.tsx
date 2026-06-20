// Stat cards + category breakdowns + expense/income entry lists for a given period
// (a month, a year, or a history group). Used by PeriodView and HistoryView.
import { useMemo } from "react";
import { TrendingUp, TrendingDown, PiggyBank } from "lucide-react";
import {
  useCategories,
  useIncomeCategories,
  useUpdateExpense,
  useDeleteExpense,
  useUpdateIncome,
  useDeleteIncome,
  type Expense,
  type Income,
  type Budget,
} from "@/lib/finance-data";
import { StatCard } from "@/components/StatCard";
import { CategoryBreakdown } from "@/components/CategoryBreakdown";
import { TrendChart } from "@/components/TrendChart";
import { ExpenseRow } from "@/components/ExpenseRow";
import { IncomeRow } from "@/components/IncomeRow";

function groupByCategory(items: { category: string; amount: number }[]) {
  const m = new Map<string, number>();
  items.forEach((item) => m.set(item.category, (m.get(item.category) ?? 0) + item.amount));
  return Array.from(m, ([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
}

export function PeriodPanel({
  title,
  expenses,
  incomes,
  budgets,
  showTrend = false,
  userId,
}: {
  title: string;
  expenses: Expense[];
  incomes: Income[];
  // Pass for a single-month period to show Planned/Remaining columns (omit for a year period —
  // budgets are inherently monthly, so they don't apply there).
  budgets?: Budget[];
  // True for a full-year period (Year tab / History "By year" groups) — shows the month-by-month
  // trend chart, which needs a full year of data to be meaningful.
  showTrend?: boolean;
  userId: string;
}) {
  const { data: categories = [] } = useCategories(userId);
  const { data: incomeCategories = [] } = useIncomeCategories(userId);
  const updateExpense = useUpdateExpense(userId);
  const deleteExpense = useDeleteExpense(userId);
  const updateIncome = useUpdateIncome(userId);
  const deleteIncome = useDeleteIncome(userId);

  const total = expenses.reduce((a, e) => a + e.amount, 0);
  const income = incomes.reduce((a, i) => a + i.amount, 0);
  const balance = income - total;

  const budgetMap = useMemo(() => {
    if (!budgets) return undefined;
    const m: Record<string, number> = {};
    budgets.forEach((b) => (m[b.category] = b.amount));
    return m;
  }, [budgets]);

  // Include budgeted categories with zero spending so far this month, not just ones with expenses.
  const byExpenseCat = useMemo(() => {
    const spent = groupByCategory(expenses);
    if (!budgetMap) return spent;
    const spentNames = new Set(spent.map((s) => s.name));
    const budgetOnly = Object.keys(budgetMap)
      .filter((name) => !spentNames.has(name))
      .map((name) => ({ name, value: 0 }));
    return [...spent, ...budgetOnly].sort((a, b) => b.value - a.value);
  }, [expenses, budgetMap]);

  const byIncomeCat = useMemo(() => groupByCategory(incomes), [incomes]);

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between">
        <h2 className="text-2xl font-semibold tracking-tight capitalize">{title}</h2>
        <span className="text-xs text-muted-foreground">{expenses.length} entries</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={<TrendingUp className="size-4" />} label="Income" value={income} tone="up" />
        <StatCard icon={<TrendingDown className="size-4" />} label="Total expenses" value={total} tone="down" />
        <StatCard
          icon={<PiggyBank className="size-4" />}
          label="Balance"
          value={balance}
          tone={balance >= 0 ? "up" : "down"}
        />
      </div>

      {showTrend && <TrendChart expenses={expenses} incomes={incomes} categories={categories} />}

      <CategoryBreakdown
        title="Expenses by category"
        emptyLabel="No expenses yet."
        byCategory={byExpenseCat}
        total={total}
        budgets={budgetMap}
      />

      <CategoryBreakdown
        title="Income by category"
        emptyLabel="No income yet."
        byCategory={byIncomeCat}
        total={income}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {expenses.length > 0 && (
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-border text-sm font-medium">Entries</div>
            <ul>
              {expenses.slice(0, 20).map((e) => (
                <ExpenseRow
                  key={e.id}
                  expense={e}
                  categories={categories}
                  onSave={(updates) => updateExpense.mutate({ id: e.id, ...updates })}
                  onDelete={() => deleteExpense.mutate(e.id)}
                />
              ))}
            </ul>
          </div>
        )}

        {incomes.length > 0 && (
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-border text-sm font-medium">Income</div>
            <ul>
              {incomes.slice(0, 20).map((i) => (
                <IncomeRow
                  key={i.id}
                  income={i}
                  categories={incomeCategories}
                  onSave={(updates) => updateIncome.mutate({ id: i.id, ...updates })}
                  onDelete={() => deleteIncome.mutate(i.id)}
                />
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
