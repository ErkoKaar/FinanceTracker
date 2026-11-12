// The three answers at the top of a period, each in its own colour: what came in (income, mint),
// what went out (spent, sky, with the per-day strip), and the balance: money on hand when the period
// closes, split into what earlier periods carried over and what this one added or took. The Spent
// card is wider because it carries the strip.
import { AlertTriangle, Check } from "lucide-react";
import { Money, RollingMoney } from "@/components/Money";
import { DayStrip } from "@/components/DayStrip";
import { IconChip, KIND, type Kind } from "@/components/Zone";

type Strip = React.ComponentProps<typeof DayStrip>;

function Card({ kind, label, children }: { kind: Kind; label: string; children: React.ReactNode }) {
  return (
    <div className="glass flex flex-col rounded-[20px] p-5">
      <div className="flex items-center gap-2.5">
        <IconChip kind={kind} size="sm" />
        <h3 className="text-sm font-medium">{label}</h3>
      </div>
      {children}
    </div>
  );
}

const bigNumber = "mt-4 block text-[2rem] font-medium leading-none tracking-[-0.04em] sm:text-4xl";

export function SummaryCards({
  scope,
  income,
  spent,
  incomeByCategory,
  expenseCount,
  overPlan,
  plannedCategories,
  balance,
  strip,
}: {
  scope: "month" | "year";
  income: number;
  spent: number;
  incomeByCategory: { name: string; value: number }[];
  expenseCount: number;
  // Total overspend and how many categories caused it; null when the period has no plan.
  overPlan: { amount: number; categories: number } | null;
  plannedCategories: number;
  // Money on hand at the end of the period, earlier periods included (see closingBalance).
  balance: number;
  strip: Strip;
}) {
  const change = income - spent;

  return (
    <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_minmax(0,1fr)]">
      <Card kind="income" label="Income">
        <Money value={income} className={`${bigNumber} ${KIND.income.text}`} />
        {incomeByCategory.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">No income recorded yet.</p>
        ) : (
          <ul className="mt-4 space-y-1.5 text-sm">
            {incomeByCategory.slice(0, 3).map((c) => (
              <li key={c.name} className="flex items-baseline justify-between gap-3">
                <span className="truncate text-muted-foreground">{c.name}</span>
                <Money value={c.value} />
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card kind="spend" label="Spent">
        <Money value={spent} className={`${bigNumber} ${KIND.spend.text}`} />
        <p className="mt-3 text-sm text-muted-foreground">
          {expenseCount} {expenseCount === 1 ? "expense" : "expenses"}
          {overPlan && overPlan.categories > 0 && (
            <span className="mt-1 flex items-center gap-1.5 text-destructive">
              <AlertTriangle className="size-3.5 shrink-0" />
              <span>
                <Money value={overPlan.amount} /> over plan in {overPlan.categories}{" "}
                {overPlan.categories === 1 ? "category" : "categories"}
              </span>
            </span>
          )}
          {overPlan && overPlan.categories === 0 && plannedCategories > 0 && (
            <span className="mt-1 flex items-center gap-1.5">
              <Check className="size-3.5 shrink-0 text-primary" />
              Within plan so far
            </span>
          )}
        </p>
        <div className="mt-auto pt-5">
          <p className="mb-2 text-xs text-muted-foreground">Spending per {scope === "month" ? "day" : "month"}</p>
          <DayStrip {...strip} size="md" />
        </div>
      </Card>

      <Card kind="neutral" label="Balance">
        <RollingMoney value={balance} className={`${bigNumber} ${balance < 0 ? "text-destructive" : ""}`} />
        <ul className="mt-4 space-y-1.5 text-sm">
          <li className="flex items-baseline justify-between gap-3">
            <span className="truncate text-muted-foreground">Carried over</span>
            <Money value={balance - change} />
          </li>
          <li className="flex items-baseline justify-between gap-3">
            <span className="truncate text-muted-foreground">This {scope}</span>
            <Money value={change} />
          </li>
        </ul>
      </Card>
    </div>
  );
}
