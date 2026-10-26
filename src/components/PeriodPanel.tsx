// Everything about one period (a month, or a year / month inside History), always in the same three
// zones and the same order: the summary cards (income, spent, left), the plan comparison (or
// spending per category for years) and the transactions list. Used by PeriodView and HistoryView.
import { useMemo } from "react";
import { useCategories, type Expense, type Income, type Budget } from "@/lib/finance-data";
import { periodLabel, stripFor, type Period } from "@/lib/period";
import { SummaryCards } from "@/components/SummaryCards";
import { CategoryBreakdown } from "@/components/CategoryBreakdown";
import { Transactions } from "@/components/Transactions";
import { TrendChart } from "@/components/TrendChart";

function groupByCategory(items: { category: string; amount: number }[]) {
  const m = new Map<string, number>();
  items.forEach((item) => m.set(item.category, (m.get(item.category) ?? 0) + item.amount));
  return Array.from(m, ([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
}

export function PeriodPanel({
  period,
  expenses,
  incomes,
  budgets,
  showTrend = false,
  bankBalance = null,
  embedded = false,
  userId,
}: {
  period: Period;
  expenses: Expense[];
  incomes: Income[];
  // Pass for a single-month period to compare spending against the plan (omit for a year period —
  // budgets are inherently monthly, so they don't apply there).
  budgets?: Budget[];
  // True for a full-year period (History "Years" groups) — shows the month-by-month trend chart,
  // which needs a full year of data to be meaningful.
  showTrend?: boolean;
  // Real account balance from the bank (sum across connected accounts). Only passed on the
  // current-month view — it's a "now" number, meaningless on year/history periods.
  bankBalance?: number | null;
  // Inside a History accordion: the group header already names the period, so no page title.
  embedded?: boolean;
  userId: string;
}) {
  const { data: categories = [] } = useCategories(userId);

  const total = expenses.reduce((a, e) => a + e.amount, 0);
  const income = incomes.reduce((a, i) => a + i.amount, 0);

  const budgetMap = useMemo(() => {
    if (!budgets) return undefined;
    const m: Record<string, number> = {};
    // A category can have several named plan lines; the comparison uses their sum.
    budgets.forEach((b) => (m[b.category] = (m[b.category] ?? 0) + b.amount));
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
  const strip = useMemo(() => stripFor(period, expenses), [period, expenses]);

  const overPlan = useMemo(() => {
    if (!budgetMap) return null;
    let amount = 0;
    let count = 0;
    for (const c of byExpenseCat) {
      const plan = budgetMap[c.name];
      if (plan != null && c.value > plan) {
        amount += c.value - plan;
        count++;
      }
    }
    return { amount, categories: count };
  }, [budgetMap, byExpenseCat]);

  return (
    <div className="space-y-10 md:space-y-12">
      {!embedded && (
        <h1 className="rise display text-[clamp(2.5rem,8vw,4.5rem)] font-bold capitalize">{periodLabel(period)}</h1>
      )}

      <SummaryCards
        scope={period.kind}
        current={!embedded}
        income={income}
        spent={total}
        incomeByCategory={byIncomeCat}
        expenseCount={expenses.length}
        overPlan={overPlan}
        plannedCategories={budgetMap ? Object.keys(budgetMap).length : 0}
        bankBalance={bankBalance}
        strip={strip}
      />

      {showTrend && <TrendChart expenses={expenses} incomes={incomes} categories={categories} />}

      <div className="grid items-start gap-10 lg:grid-cols-2 lg:gap-8">
        <CategoryBreakdown byCategory={byExpenseCat} total={total} budgets={budgetMap} />
        <Transactions expenses={expenses} incomes={incomes} userId={userId} />
      </div>
    </div>
  );
}
