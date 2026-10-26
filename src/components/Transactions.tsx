// "Transactions" zone of a period: expenses and income in one list, newest first, grouped by day.
// Each row carries its direction (sky arrow out / mint arrow in, minus / plus amount), and the chips
// filter to just one kind.
import { useState } from "react";
import {
  useCategories,
  useIncomeCategories,
  useUpdateExpense,
  useDeleteExpense,
  useUpdateIncome,
  useDeleteIncome,
  type Expense,
  type Income,
} from "@/lib/finance-data";
import { groupByDay } from "@/lib/period";
import { ExpenseRow } from "@/components/ExpenseRow";
import { IncomeRow } from "@/components/IncomeRow";
import { ZoneHeading, TransactionsIcon } from "@/components/Zone";

const LIMIT = 12;

type Filter = "all" | "spend" | "income";
type Entry = { kind: "spend"; date: string; item: Expense } | { kind: "income"; date: string; item: Income };

export function Transactions({
  expenses,
  incomes,
  userId,
}: {
  expenses: Expense[];
  incomes: Income[];
  userId: string;
}) {
  const { data: categories = [] } = useCategories(userId);
  const { data: incomeCategories = [] } = useIncomeCategories(userId);
  const updateExpense = useUpdateExpense(userId);
  const deleteExpense = useDeleteExpense(userId);
  const updateIncome = useUpdateIncome(userId);
  const deleteIncome = useDeleteIncome(userId);

  const [filter, setFilter] = useState<Filter>("all");
  const [showAll, setShowAll] = useState(false);

  const entries: Entry[] = [
    ...(filter === "income" ? [] : expenses.map((e) => ({ kind: "spend" as const, date: e.date, item: e }))),
    ...(filter === "spend" ? [] : incomes.map((i) => ({ kind: "income" as const, date: i.date, item: i }))),
  ].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  const visible = showAll ? entries : entries.slice(0, LIMIT);
  const days = groupByDay(visible);

  const filters: [Filter, string, number][] = [
    ["all", "All", expenses.length + incomes.length],
    ["spend", "Spending", expenses.length],
    ["income", "Income", incomes.length],
  ];

  return (
    <section>
      <ZoneHeading kind="neutral" icon={TransactionsIcon} title="Transactions" />
      <div className="glass overflow-hidden rounded-[20px]">
        <div role="group" aria-label="Show" className="flex gap-1.5 overflow-x-auto px-4 pb-1 pt-4">
          {filters.map(([key, label, count]) => (
            <button
              key={key}
              type="button"
              aria-pressed={filter === key}
              onClick={() => {
                setFilter(key);
                setShowAll(false);
              }}
              className={`inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3 text-xs font-medium transition-[color,background-color,transform] duration-150 active:scale-[0.97] ${
                filter === key
                  ? "bg-foreground/[0.12] text-foreground"
                  : "text-muted-foreground hover:bg-foreground/[0.05] hover:text-foreground"
              }`}
            >
              {label}
              <span className="money text-[11px] text-muted-foreground">{count}</span>
            </button>
          ))}
        </div>

        {entries.length === 0 ? (
          <p className="px-5 pb-6 pt-3 text-sm text-muted-foreground">Nothing recorded here yet. Add an entry from the Add tab.</p>
        ) : (
          <div className="pb-2">
            {days.map((day) => (
              <div key={day.key}>
                <h3 className="px-5 pb-1 pt-4 text-xs font-medium text-muted-foreground">{day.label}</h3>
                <ul>
                  {day.items.map((entry) =>
                    entry.kind === "spend" ? (
                      <ExpenseRow
                        key={entry.item.id}
                        expense={entry.item}
                        categories={categories}
                        onSave={(updates) => updateExpense.mutate({ id: entry.item.id, ...updates })}
                        onDelete={() => deleteExpense.mutate(entry.item.id)}
                      />
                    ) : (
                      <IncomeRow
                        key={entry.item.id}
                        income={entry.item}
                        categories={incomeCategories}
                        onSave={(updates) => updateIncome.mutate({ id: entry.item.id, ...updates })}
                        onDelete={() => deleteIncome.mutate(entry.item.id)}
                      />
                    )
                  )}
                </ul>
              </div>
            ))}
          </div>
        )}

        {!showAll && entries.length > LIMIT && (
          <button
            onClick={() => setShowAll(true)}
            className="w-full border-t border-border px-5 py-3 text-sm text-muted-foreground transition-colors hover:bg-foreground/[0.03] hover:text-foreground"
          >
            Show all {entries.length}
          </button>
        )}
      </div>
    </section>
  );
}
