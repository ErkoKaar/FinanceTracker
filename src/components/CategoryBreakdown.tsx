// "Budget" zone of a period: spending per category. With a plan (month periods), categories that
// went over come first, each row says in words how much is over or left, and categories nobody
// planned for are listed separately underneath. Without a plan (years), it's spending per category.
import { AlertTriangle } from "lucide-react";
import { Money } from "@/components/Money";
import { BudgetBar } from "@/components/BudgetBar";
import { ZoneHeading } from "@/components/Zone";

type Row = { name: string; value: number };

export function CategoryBreakdown({
  byCategory,
  total,
  budgets,
}: {
  byCategory: Row[];
  total: number;
  // When provided (even if empty), rows compare spending against this category->amount plan.
  // Omit entirely for periods without budgets (years).
  budgets?: Record<string, number>;
}) {
  const largest = Math.max(0, ...byCategory.map((c) => c.value));

  if (!budgets) {
    return (
      <section>
        <ZoneHeading kind="spend" title="Spending by category" aside={<Money value={total} className="text-foreground" />} />
        <div className="glass rounded-[20px] px-5 py-2">
          {byCategory.length === 0 ? (
            <p className="py-4 text-sm text-muted-foreground">No expenses in this period.</p>
          ) : (
            <ul>
              {byCategory.map((c) => (
                <li key={c.name} className="py-3">
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="truncate font-medium">{c.name}</span>
                    <span className="flex items-baseline gap-2">
                      <span className="text-xs text-muted-foreground">{total ? Math.round((c.value / total) * 100) : 0}%</span>
                      <Money value={c.value} />
                    </span>
                  </div>
                  <BudgetBar value={c.value} relativeTo={largest} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    );
  }

  const planned = byCategory
    .filter((c) => budgets[c.name] != null)
    .sort((a, b) => {
      const overA = a.value - budgets[a.name];
      const overB = b.value - budgets[b.name];
      if (overA > 0 || overB > 0) return overB - overA;
      return b.value / budgets[b.name] - a.value / budgets[a.name];
    });
  const unplanned = byCategory.filter((c) => budgets[c.name] == null);
  const plannedTotal = Object.values(budgets).reduce((a, b) => a + b, 0);
  const overCount = planned.filter((c) => c.value > budgets[c.name]).length;

  return (
    <section>
      <ZoneHeading
        kind="plan"
        title="Budget"
        aside={
          plannedTotal > 0 && (
            <span>
              <Money value={planned.reduce((a, c) => a + c.value, 0)} className="text-foreground" /> of{" "}
              <Money value={plannedTotal} /> planned
            </span>
          )
        }
      />
      <div className="glass rounded-[20px] px-5 py-2">
        {planned.length === 0 ? (
          <p className="py-4 text-sm text-muted-foreground">
            No plan for this month yet. Set one in Plan to see how each category is doing.
          </p>
        ) : (
          <>
            {overCount > 0 && (
              <p className="flex items-center gap-2 pt-3 text-sm text-destructive">
                <AlertTriangle className="size-4 shrink-0" />
                {overCount} {overCount === 1 ? "category is" : "categories are"} over plan
              </p>
            )}
            <ul>
              {planned.map((c) => {
                const plan = budgets[c.name];
                const over = c.value > plan;
                return (
                  <li key={c.name} className="py-3">
                    <div className="flex items-baseline justify-between gap-3 text-sm">
                      <span className="truncate font-medium">{c.name}</span>
                      <span className="whitespace-nowrap">
                        <Money value={c.value} />
                        <span className="text-muted-foreground">
                          {" / "}
                          <Money value={plan} centsClassName="hidden" />
                        </span>
                      </span>
                    </div>
                    <BudgetBar value={c.value} planned={plan} />
                    <p className={`mt-1.5 text-xs ${over ? "text-destructive" : "text-muted-foreground"}`}>
                      {over ? (
                        <>
                          <Money value={c.value - plan} centsClassName="" /> over plan
                        </>
                      ) : (
                        <>
                          <Money value={plan - c.value} centsClassName="" /> left
                        </>
                      )}
                    </p>
                  </li>
                );
              })}
            </ul>
          </>
        )}

        {unplanned.length > 0 && (
          <div className="border-t border-border pb-1 pt-3">
            <h3 className="text-xs font-medium text-muted-foreground">Not in the plan</h3>
            <ul>
              {unplanned.map((c) => (
                <li key={c.name} className="py-3">
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="truncate font-medium">{c.name}</span>
                    <Money value={c.value} />
                  </div>
                  <BudgetBar value={c.value} relativeTo={largest} />
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
