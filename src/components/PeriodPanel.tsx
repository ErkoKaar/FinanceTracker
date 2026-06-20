// Stat cards + category breakdown table/pie chart + transaction list for a given period
// (a month, a year, or a history group). Used by PeriodView and HistoryView.
import { useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { TrendingUp, TrendingDown, PiggyBank, Trash2 } from "lucide-react";
import { useDeleteExpense, type Expense } from "@/lib/finance-data";
import { StatCard } from "@/components/StatCard";

export function PeriodPanel({
  title,
  expenses,
  income,
  editableIncome = false,
  onUpdateIncome,
  userId,
}: {
  title: string;
  expenses: Expense[];
  income: number;
  editableIncome?: boolean;
  onUpdateIncome?: (amount: number) => void;
  userId: string;
}) {
  const deleteExpense = useDeleteExpense(userId);

  const total = expenses.reduce((a, e) => a + e.amount, 0);
  const balance = income - total;

  const byCat = useMemo(() => {
    const m = new Map<string, number>();
    expenses.forEach((e) => m.set(e.category, (m.get(e.category) ?? 0) + e.amount));
    return Array.from(m, ([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [expenses]);

  const COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between">
        <h2 className="text-2xl font-semibold tracking-tight capitalize">{title}</h2>
        <span className="text-xs text-muted-foreground">{expenses.length} entries</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          icon={<TrendingUp className="size-4" />}
          label="Income"
          value={income}
          editable={editableIncome}
          onSave={onUpdateIncome}
          tone="up"
        />
        <StatCard icon={<TrendingDown className="size-4" />} label="Total expenses" value={total} tone="down" />
        <StatCard
          icon={<PiggyBank className="size-4" />}
          label="Balance"
          value={balance}
          tone={balance >= 0 ? "up" : "down"}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 bg-card border border-border rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border text-sm font-medium">Expenses by category</div>
          {byCat.length === 0 ? (
            <div className="p-10 text-center text-sm text-muted-foreground">No expenses yet.</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted-foreground">
                  <th className="px-5 py-2 font-normal">Category</th>
                  <th className="px-5 py-2 font-normal text-right">Amount</th>
                  <th className="px-5 py-2 font-normal text-right">%</th>
                </tr>
              </thead>
              <tbody>
                {byCat.map((c, i) => (
                  <tr key={c.name} className="border-t border-border">
                    <td className="px-5 py-3 flex items-center gap-2.5">
                      <span
                        className="size-2.5 rounded-full"
                        style={{ background: COLORS[i % COLORS.length] }}
                      />
                      {c.name}
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums">€{c.value.toFixed(2)}</td>
                    <td className="px-5 py-3 text-right tabular-nums text-muted-foreground">
                      {total ? ((c.value / total) * 100).toFixed(0) : 0}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-5">
          <div className="text-sm font-medium mb-2">Breakdown</div>
          {byCat.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-sm text-muted-foreground">
              No data
            </div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={byCat} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2}>
                    {byCat.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="var(--card)" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "var(--popover)",
                      border: "1px solid var(--border)",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                    formatter={(v: number) => `€${v.toFixed(2)}`}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {expenses.length > 0 && (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border text-sm font-medium">Entries</div>
          <ul>
            {expenses.slice(0, 20).map((e) => (
              <li key={e.id} className="px-5 py-3 border-t border-border first:border-t-0 flex items-center justify-between text-sm">
                <div>
                  <div>{e.description}</div>
                  <div className="text-xs text-muted-foreground">
                    {e.category} · {new Date(e.date).toLocaleDateString("en-GB")}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="tabular-nums">€{e.amount.toFixed(2)}</span>
                  <button
                    onClick={() => deleteExpense.mutate(e.id)}
                    className="text-muted-foreground hover:text-destructive transition"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
