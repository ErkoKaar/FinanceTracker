// Category breakdown table + pie chart pair, used by PeriodPanel for both expenses and income.
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

const COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

export function CategoryBreakdown({
  title,
  emptyLabel,
  byCategory,
  total,
  budgets,
}: {
  title: string;
  emptyLabel: string;
  byCategory: { name: string; value: number }[];
  total: number;
  // When provided (even if empty), shows Planned/Remaining columns sourced from this category->amount
  // map; categories with no budget show "—". Omit entirely to hide those columns (e.g. year view).
  budgets?: Record<string, number>;
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      <div className="lg:col-span-3 bg-card border border-border rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border text-sm font-medium">{title}</div>
        {byCategory.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">{emptyLabel}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted-foreground">
                  <th className="px-5 py-2 font-normal whitespace-nowrap">Category</th>
                  <th className="px-5 py-2 font-normal text-right whitespace-nowrap">{budgets ? "Spent" : "Amount"}</th>
                  {budgets && <th className="px-5 py-2 font-normal text-right whitespace-nowrap">Planned</th>}
                  {budgets && <th className="px-5 py-2 font-normal text-right whitespace-nowrap">Remaining</th>}
                  <th className="px-5 py-2 font-normal text-right whitespace-nowrap">%</th>
                </tr>
              </thead>
              <tbody>
                {byCategory.map((c, i) => {
                  const planned = budgets?.[c.name];
                  const remaining = planned != null ? planned - c.value : null;
                  return (
                    <tr key={c.name} className="border-t border-border">
                      <td className="px-5 py-3 flex items-center gap-2.5 whitespace-nowrap">
                        <span className="size-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                        {c.name}
                      </td>
                      <td className="px-5 py-3 text-right tabular-nums whitespace-nowrap">€{c.value.toFixed(2)}</td>
                      {budgets && (
                        <td className="px-5 py-3 text-right tabular-nums text-muted-foreground whitespace-nowrap">
                          {planned != null ? `€${planned.toFixed(2)}` : "—"}
                        </td>
                      )}
                      {budgets && (
                        <td
                          className={`px-5 py-3 text-right tabular-nums whitespace-nowrap ${
                            remaining != null && remaining < 0 ? "text-destructive" : "text-muted-foreground"
                          }`}
                        >
                          {remaining != null ? `€${remaining.toFixed(2)}` : "—"}
                        </td>
                      )}
                      <td className="px-5 py-3 text-right tabular-nums text-muted-foreground whitespace-nowrap">
                        {total ? ((c.value / total) * 100).toFixed(0) : 0}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-5">
        <div className="text-sm font-medium mb-2">Breakdown</div>
        {byCategory.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-sm text-muted-foreground">No data</div>
        ) : (
          <div className="h-64">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={byCategory} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2}>
                  {byCategory.map((_, i) => (
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
  );
}
