// Year-scoped trend chart (Year tab / History "By year" groups): Income/Expenses/Balance across
// the year's 12 months, or a single expense category's monthly spending when filtered.
import { useMemo, useState } from "react";
import { ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import type { Expense, Income } from "@/lib/finance-data";
import { formatEuro } from "@/components/Money";
import { Panel } from "@/components/Panel";
import { fieldSm } from "@/lib/ui";

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const tooltipStyle = {
  background: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: 12,
  fontSize: 12,
  fontFamily: "var(--font-mono)",
};

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

  const legend =
    view === "Overall"
      ? [
          { label: "Income", color: "var(--primary)" },
          { label: "Spent", color: "var(--spend)" },
          { label: "Left", color: "var(--foreground)", dashed: true },
        ]
      : [{ label: view, color: "var(--spend)" }];

  return (
    <Panel
      title="Trend"
      aside={
        <select
          value={view}
          onChange={(e) => setView(e.target.value)}
          aria-label="Show trend for"
          className={`${fieldSm} -my-1.5 text-xs`}
        >
          <option value="Overall">Overall</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      }
    >
      <ul className="flex flex-wrap gap-x-5 gap-y-1 px-5 text-xs text-muted-foreground">
        {legend.map((l) => (
          <li key={l.label} className="flex items-center gap-2">
            <span
              className="h-0 w-4 border-t-2"
              style={{ borderColor: l.color, borderStyle: l.dashed ? "dashed" : "solid" }}
              aria-hidden
            />
            {l.label}
          </li>
        ))}
      </ul>
      <div className="h-64 px-2 pb-4 pt-3">
        <ResponsiveContainer>
          <ComposedChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="trend-income" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.28} />
                <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="trend-expense" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--spend)" stopOpacity={0.22} />
                <stop offset="100%" stopColor="var(--spend)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="var(--border)" vertical={false} />
            <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis
              stroke="var(--muted-foreground)"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              width={52}
              tickFormatter={(v: number) => `€${Math.round(v).toLocaleString("en-GB")}`}
            />
            <Tooltip
              contentStyle={tooltipStyle}
              cursor={{ stroke: "var(--border)" }}
              formatter={(v: number) => formatEuro(v)}
            />
            {view === "Overall" ? (
              <>
                <Area
                  type="monotone"
                  dataKey="income"
                  name="Income"
                  stroke="var(--primary)"
                  strokeWidth={2}
                  fill="url(#trend-income)"
                />
                <Area
                  type="monotone"
                  dataKey="expense"
                  name="Spent"
                  stroke="var(--spend)"
                  strokeWidth={2}
                  fill="url(#trend-expense)"
                />
                <Line
                  type="monotone"
                  dataKey="balance"
                  name="Left"
                  stroke="var(--foreground)"
                  strokeOpacity={0.6}
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  dot={false}
                />
              </>
            ) : (
              <Area
                type="monotone"
                dataKey="spent"
                name={view}
                stroke="var(--spend)"
                strokeWidth={2}
                fill="url(#trend-expense)"
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </Panel>
  );
}
