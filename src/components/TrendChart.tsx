// Year-scoped trend chart (Year tab / History "By year" groups): Income/Expenses/Balance across
// the year's 12 months, or a single expense category's monthly spending when filtered.
import { useMemo, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import type { Expense, Income } from "@/lib/finance-data";

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function TrendChart({
  expenses,
  incomes,
  categories,
}: {
  expenses: Expense[];
  incomes: Income[];
  categories: string[];
}) {
  const [view, setView] = useState("Overall");

  const data = useMemo(() => {
    return MONTH_LABELS.map((label, i) => {
      const month = i + 1;
      if (view === "Overall") {
        const income = incomes
          .filter((x) => new Date(x.date).getMonth() + 1 === month)
          .reduce((a, x) => a + x.amount, 0);
        const expense = expenses
          .filter((x) => new Date(x.date).getMonth() + 1 === month)
          .reduce((a, x) => a + x.amount, 0);
        return { month: label, income, expense, balance: income - expense };
      }
      const spent = expenses
        .filter((x) => new Date(x.date).getMonth() + 1 === month && x.category === view)
        .reduce((a, x) => a + x.amount, 0);
      return { month: label, spent };
    });
  }, [expenses, incomes, view]);

  return (
    <div className="bg-card border border-border rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm font-medium">Trend</div>
        <select
          value={view}
          onChange={(e) => setView(e.target.value)}
          className="bg-input border border-border rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-ring/50"
        >
          <option value="Overall">Overall</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>
      <div className="h-64">
        <ResponsiveContainer>
          <LineChart data={data}>
            <CartesianGrid stroke="var(--border)" vertical={false} />
            <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} width={48} />
            <Tooltip
              contentStyle={{
                background: "var(--popover)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                fontSize: 12,
              }}
              formatter={(v: number) => `€${v.toFixed(2)}`}
            />
            {view === "Overall" ? (
              <>
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="income" name="Income" stroke="var(--primary)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="expense" name="Expenses" stroke="var(--destructive)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="balance" name="Balance" stroke="var(--chart-2)" strokeWidth={2} dot={false} />
              </>
            ) : (
              <Line type="monotone" dataKey="spent" name={view} stroke="var(--destructive)" strokeWidth={2} dot={false} />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
