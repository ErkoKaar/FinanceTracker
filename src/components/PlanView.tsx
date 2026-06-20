// "Plan" tab: set how much you plan to spend per category this month. Feeds the Planned/Remaining
// columns on the Month view's "Expenses by category" table (see PeriodPanel/CategoryBreakdown).
import { useEffect, useMemo, useState } from "react";
import { useCategories, useBudgets, useSetBudget, useDeleteBudget } from "@/lib/finance-data";
import { BudgetRow } from "@/components/BudgetRow";

export function PlanView({ userId }: { userId: string }) {
  const { data: categories = [] } = useCategories(userId);
  const { data: budgetsAll = [] } = useBudgets(userId);
  const setBudget = useSetBudget(userId);
  const deleteBudget = useDeleteBudget(userId);

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const label = now.toLocaleDateString("en-GB", { month: "long", year: "numeric" });

  const budgets = useMemo(
    () => budgetsAll.filter((b) => b.year === year && b.month === month),
    [budgetsAll, year, month]
  );

  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");

  useEffect(() => {
    if (!category && categories.length > 0) setCategory(categories[0]);
  }, [categories, category]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const n = parseFloat(amount.replace(",", "."));
    if (!n || n <= 0 || !category) return;
    setBudget.mutate({ year, month, category, amount: n });
    setAmount("");
  }

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-3xl font-semibold tracking-tight">Plan</h1>
      <p className="text-muted-foreground mt-2 text-sm capitalize">
        Set how much you plan to spend per category in {label}.
      </p>

      <form onSubmit={submit} className="mt-8 bg-card border border-border rounded-2xl p-6 space-y-5">
        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground">Planned amount (€)</label>
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            inputMode="decimal"
            className="w-full bg-input border border-border rounded-lg px-3 py-3 text-2xl font-medium focus:outline-none focus:ring-2 focus:ring-ring/50"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full bg-input border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50"
          >
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          className="w-full bg-primary text-primary-foreground rounded-lg py-3 text-sm font-medium hover:opacity-90 transition"
        >
          Save plan
        </button>
      </form>

      {budgets.length > 0 && (
        <div className="mt-6 bg-card border border-border rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border text-sm font-medium capitalize">{label} plan</div>
          <ul>
            {budgets.map((b) => (
              <BudgetRow
                key={b.id}
                budget={b}
                onSave={(amount) => setBudget.mutate({ year, month, category: b.category, amount })}
                onDelete={() => deleteBudget.mutate(b.id)}
              />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
