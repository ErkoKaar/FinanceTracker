// The three answers at the top of a period, each in its own colour: what came in (income, mint),
// what went out (spent, sky, with the per-day strip), and what is left (balance, plus the real bank
// balance when one is connected). The Spent card is wider because it carries the strip.
import { AlertTriangle, Check, Landmark } from "lucide-react";
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
  current,
  income,
  spent,
  incomeByCategory,
  expenseCount,
  overPlan,
  plannedCategories,
  bankBalance,
  strip,
}: {
  scope: "month" | "year";
  // The period you're living in (Overview) rather than a past one opened in History.
  current: boolean;
  income: number;
  spent: number;
  incomeByCategory: { name: string; value: number }[];
  expenseCount: number;
  // Total overspend and how many categories caused it; null when the period has no plan.
  overPlan: { amount: number; categories: number } | null;
  plannedCategories: number;
  bankBalance: number | null;
  strip: Strip;
}) {
  const balance = income - spent;

  return (
    <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_minmax(0,1fr)]">
      <Card kind="income" label="Income">
        <Money value={income} className={`${bigNumber} ${KIND.income.text}`} centsClassName="text-[0.5em] text-primary/60" />
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
        <Money value={spent} className={`${bigNumber} ${KIND.spend.text}`} centsClassName="text-[0.5em] text-spend/60" />
        <p className="mt-3 text-sm text-muted-foreground">
          {expenseCount} {expenseCount === 1 ? "expense" : "expenses"}
          {overPlan && overPlan.categories > 0 && (
            <span className="mt-1 flex items-center gap-1.5 text-destructive">
              <AlertTriangle className="size-3.5 shrink-0" />
              <span>
                <Money value={overPlan.amount} centsClassName="" /> over plan in {overPlan.categories}{" "}
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

      <Card kind="neutral" label={current ? (scope === "month" ? "Left this month" : "Left this year") : "Left over"}>
        <RollingMoney value={balance} className={`${bigNumber} ${balance < 0 ? "text-destructive" : ""}`} centsClassName="text-[0.5em] text-muted-foreground" />
        <p className="mt-3 text-sm text-muted-foreground">Income minus spending</p>
        {bankBalance !== null && (
          <div className="mt-auto flex items-center justify-between gap-3 border-t border-border pt-4 text-sm">
            <span className="flex items-center gap-2 text-muted-foreground">
              <Landmark className="size-4" />
              Bank balance
            </span>
            <Money value={bankBalance} className={bankBalance < 0 ? "text-destructive" : ""} />
          </div>
        )}
      </Card>
    </div>
  );
}
