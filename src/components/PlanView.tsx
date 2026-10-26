// "Plan" tab: everything you set up ahead of time. "Budget" holds named plan lines (name, amount,
// category) for any month — the month switcher lets you plan ahead, and an empty month offers to copy
// the previous month's lines. The current month's lines feed the comparison on Overview.
// "Recurring" manages the fixed monthly expenses/income that useApplyRecurring turns into entries.
import { useEffect, useMemo, useState } from "react";
import { Plus, ChevronLeft, ChevronRight, Copy } from "lucide-react";
import {
  useCategories,
  useBudgets,
  useAddBudget,
  useUpdateBudget,
  useDeleteBudget,
  useCopyBudgets,
  useExpenses,
  useIncomePlans,
  useAddIncomePlans,
  useUpdateIncomePlan,
  useDeleteIncomePlan,
  useRecurringIncomes,
  type Budget,
} from "@/lib/finance-data";
import { PlanBalance, ExpectedIncome, parseAmount } from "@/components/PlanIncome";
import { BudgetRow } from "@/components/BudgetRow";
import { BudgetBar } from "@/components/BudgetBar";
import { RecurringView } from "@/components/RecurringView";
import { Money } from "@/components/Money";
import { Panel, EmptyNote } from "@/components/Panel";
import { field } from "@/lib/ui";

type Section = "budget" | "recurring";

const SECTIONS: [Section, string][] = [
  ["budget", "Budget"],
  ["recurring", "Recurring"],
];

export function PlanView({ userId }: { userId: string }) {
  const [section, setSection] = useState<Section>("budget");

  return (
    <div className="mx-auto max-w-3xl">
      <header className="rise">
        <h1 className="display text-[clamp(2.5rem,8vw,4.5rem)] font-bold">Plan</h1>
        <p className="mt-3 max-w-[52ch] text-sm text-muted-foreground">
          {section === "budget"
            ? "Set how much you plan to spend, for this month or the months ahead."
            : "Fixed monthly expenses and income. They're added automatically each month."}
        </p>
      </header>

      <div role="group" aria-label="Plan section" className="glass relative mt-6 grid w-64 max-w-full grid-cols-2 rounded-full p-1 text-sm">
        <span
          aria-hidden
          className="absolute inset-y-1 left-1 w-[calc((100%-8px)/2)] rounded-full bg-foreground/[0.1] transition-transform duration-200 ease-in-out motion-reduce:transition-none"
          style={{ transform: `translateX(${SECTIONS.findIndex(([k]) => k === section) * 100}%)` }}
        />
        {SECTIONS.map(([k, text]) => (
          <button
            key={k}
            type="button"
            aria-pressed={section === k}
            onClick={() => setSection(k)}
            className={`relative rounded-full py-1.5 transition-colors ${
              section === k ? "text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {text}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {section === "budget" && <BudgetSection userId={userId} />}
        {section === "recurring" && <RecurringView userId={userId} />}
      </div>
    </div>
  );
}

type YearMonth = { year: number; month: number }; // month 1-12

function shiftMonth({ year, month }: YearMonth, delta: number): YearMonth {
  const d = new Date(year, month - 1 + delta, 1);
  return { year: d.getFullYear(), month: d.getMonth() + 1 };
}

function monthName({ year, month }: YearMonth, withYear = true) {
  return new Date(year, month - 1, 1).toLocaleDateString("en-GB", withYear ? { month: "long", year: "numeric" } : { month: "long" });
}

function BudgetSection({ userId }: { userId: string }) {
  const { data: categories = [] } = useCategories(userId);
  const { data: budgetsAll = [] } = useBudgets(userId);
  const { data: expensesAll = [] } = useExpenses(userId);
  const addBudget = useAddBudget(userId);
  const updateBudget = useUpdateBudget(userId);
  const deleteBudget = useDeleteBudget(userId);
  const copyBudgets = useCopyBudgets(userId);
  const { data: incomePlansAll = [] } = useIncomePlans(userId);
  const { data: recurringIncomes = [] } = useRecurringIncomes(userId);
  const addIncomePlans = useAddIncomePlans(userId);
  const updateIncomePlan = useUpdateIncomePlan(userId);
  const deleteIncomePlan = useDeleteIncomePlan(userId);
  const [draftIncome, setDraftIncome] = useState(0);

  const now = new Date();
  const thisMonth: YearMonth = { year: now.getFullYear(), month: now.getMonth() + 1 };
  const [selected, setSelected] = useState<YearMonth>(thisMonth);
  const { year, month } = selected;
  const offset = (year - thisMonth.year) * 12 + (month - thisMonth.month); // 0 = this month, >0 = ahead
  const isFuture = offset > 0;
  const label = monthName(selected);

  const budgets = useMemo(
    () => budgetsAll.filter((b) => b.year === year && b.month === month),
    [budgetsAll, year, month]
  );

  const incomeLines = useMemo(
    () => incomePlansAll.filter((l) => l.year === year && l.month === month),
    [incomePlansAll, year, month]
  );

  const previous = shiftMonth(selected, -1);
  const previousLines = useMemo(
    () => budgetsAll.filter((b) => b.year === previous.year && b.month === previous.month),
    [budgetsAll, previous.year, previous.month]
  );
  const previousIncome = useMemo(
    () => incomePlansAll.filter((l) => l.year === previous.year && l.month === previous.month),
    [incomePlansAll, previous.year, previous.month]
  );
  // Copy only the halves this month is still missing, so nothing already planned gets duplicated.
  const copyable = {
    spending: budgets.length === 0 ? previousLines : [],
    income: incomeLines.length === 0 ? previousIncome : [],
  };
  const copyCount = copyable.spending.length + copyable.income.length;

  // Spent per category in the selected month, so each category group shows how much of its plan is
  // used. A future month has no spending yet, so it shows plain planned amounts instead.
  const spentByCategory = useMemo(() => {
    const m: Record<string, number> = {};
    if (isFuture) return m;
    for (const e of expensesAll) {
      const d = new Date(e.date);
      if (d.getFullYear() === year && d.getMonth() + 1 === month) m[e.category] = (m[e.category] ?? 0) + e.amount;
    }
    return m;
  }, [expensesAll, year, month, isFuture]);

  function copyPrevious() {
    const onError = () => setError("Couldn't copy the plan. Check your connection and try again.");
    copyBudgets.mutate(
      copyable.spending.map(({ category, amount, name }) => ({ year, month, category, amount, name })),
      { onError }
    );
    addIncomePlans.mutate(copyable.income.map(({ name, amount }) => ({ year, month, name, amount })), { onError });
  }

  // Plan lines grouped by category, biggest plan first. Spending is tracked per category, so the
  // bar and "left/over" live on the group; the named lines underneath are what the plan is made of.
  const groups = useMemo(() => {
    const m = new Map<string, Budget[]>();
    for (const b of budgets) m.set(b.category, [...(m.get(b.category) ?? []), b]);
    return Array.from(m, ([category, lines]) => ({
      category,
      lines,
      planned: lines.reduce((a, l) => a + l.amount, 0),
      spent: spentByCategory[category] ?? 0,
    })).sort((a, b) => b.planned - a.planned);
  }, [budgets, spentByCategory]);

  const plannedTotal = groups.reduce((a, g) => a + g.planned, 0);
  const spentOnPlanned = groups.reduce((a, g) => a + g.spent, 0);

  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!category && categories.length > 0) setCategory(categories[0]);
  }, [categories, category]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const n = parseFloat(amount.replace(",", "."));
    if (!n || n <= 0) {
      setError("Enter an amount above 0.");
      return;
    }
    if (!category) return;
    setError(null);
    addBudget.mutate(
      { year, month, category, amount: n, name: name.trim() || category },
      {
        onSuccess: () => {
          setName("");
          setAmount("");
        },
        onError: () => setError("Couldn't save. Check your connection and try again."),
      }
    );
  }

  // Switching month starts the forms fresh, so a half-typed amount isn't previewed against the wrong month.
  function goTo(target: YearMonth) {
    setSelected(target);
    setAmount("");
    setName("");
    setDraftIncome(0);
    setError(null);
  }

  const fieldLabel = "text-xs text-muted-foreground";

  const navButton =
    "inline-flex size-9 items-center justify-center rounded-full text-muted-foreground transition-[color,background-color,transform] duration-150 hover:bg-foreground/[0.06] hover:text-foreground active:scale-95";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <div className="glass flex items-center rounded-full p-1">
          <button type="button" onClick={() => goTo(shiftMonth(selected, -1))} className={navButton} aria-label="Previous month">
            <ChevronLeft className="size-4" />
          </button>
          <span className="min-w-[9.5rem] text-center text-sm font-medium" aria-live="polite">
            {label}
          </span>
          <button type="button" onClick={() => goTo(shiftMonth(selected, 1))} className={navButton} aria-label="Next month">
            <ChevronRight className="size-4" />
          </button>
        </div>
        {offset !== 0 ? (
          <button
            type="button"
            onClick={() => goTo(thisMonth)}
            className="text-sm text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
          >
            Back to this month
          </button>
        ) : (
          <span className="text-sm text-muted-foreground">This month</span>
        )}
      </div>

      <PlanBalance
        income={incomeLines.reduce((a, l) => a + l.amount, 0)}
        planned={plannedTotal}
        draftIncome={draftIncome}
        draftSpend={parseAmount(amount)}
        spentSoFar={isFuture ? null : spentOnPlanned}
      />

      {copyCount > 0 && (
        <div className="glass flex flex-wrap items-center justify-between gap-3 rounded-[20px] p-5">
          <p className="text-sm">
            {monthName(selected, false)} is missing {copyable.spending.length > 0 && copyable.income.length > 0 ? "a plan" : copyable.spending.length > 0 ? "planned spending" : "expected income"}.{" "}
            <span className="text-muted-foreground">
              {monthName(previous, false)} had {copyCount} {copyCount === 1 ? "line" : "lines"}.
            </span>
          </p>
          <button
            type="button"
            onClick={copyPrevious}
            disabled={copyBudgets.isPending || addIncomePlans.isPending}
            className="inline-flex h-10 items-center gap-2 rounded-full bg-gold/15 px-4 text-sm font-medium text-gold transition-[background-color,transform] duration-150 hover:bg-gold/25 active:scale-[0.97] disabled:opacity-60"
          >
            <Copy className="size-4" />
            Copy from {monthName(previous, false)}
          </button>
        </div>
      )}

      <ExpectedIncome
        key={`${year}-${month}`}
        lines={incomeLines}
        recurringIncome={recurringIncomes.filter((r) => r.active).map((r) => ({ name: r.description, amount: r.amount }))}
        adding={addIncomePlans.isPending}
        onAdd={(line, done) => addIncomePlans.mutate([{ year, month, ...line }], { onSuccess: done })}
        onUseRecurring={() =>
          addIncomePlans.mutate(
            recurringIncomes.filter((r) => r.active).map((r) => ({ year, month, name: r.description, amount: r.amount }))
          )
        }
        onSave={(id, updates) => updateIncomePlan.mutate({ id, ...updates })}
        onDelete={(id) => deleteIncomePlan.mutate(id)}
        onDraftChange={setDraftIncome}
      />


      <Panel title="Planned spending" aside={groups.length > 0 && <Money value={plannedTotal} className="text-gold" />}>
        {groups.length === 0 ? (
          <EmptyNote>No planned spending yet. Add what you expect to spend on below, for example rent or groceries.</EmptyNote>
        ) : (
          <div className="pb-2">
            {groups.map((g) => {
              const over = g.spent > g.planned;
              return (
                <section key={g.category} className="border-t border-border px-5 py-4 first:border-t-0 first:pt-1">
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <h3 className="truncate font-medium">{g.category}</h3>
                    {isFuture ? (
                      <Money value={g.planned} className="whitespace-nowrap" />
                    ) : (
                      <span className="whitespace-nowrap">
                        <Money value={g.spent} />
                        <span className="text-muted-foreground">
                          {" / "}
                          <Money value={g.planned} centsClassName="hidden" />
                        </span>
                      </span>
                    )}
                  </div>
                  {!isFuture && (
                    <>
                      <BudgetBar value={g.spent} planned={g.planned} />
                      <p className={`mt-1.5 text-xs ${over ? "text-destructive" : "text-muted-foreground"}`}>
                        {over ? (
                          <>
                            <Money value={g.spent - g.planned} /> over plan
                          </>
                        ) : (
                          <>
                            <Money value={g.planned - g.spent} /> left
                          </>
                        )}
                      </p>
                    </>
                  )}
                  <ul className="mt-2">
                    {g.lines.map((b) => (
                      <BudgetRow
                        key={b.id}
                        budget={b}
                        categories={categories}
                        onSave={(updates) => updateBudget.mutate({ id: b.id, ...updates })}
                        onDelete={() => deleteBudget.mutate(b.id)}
                      />
                    ))}
                  </ul>
                </section>
              );
            })}
          </div>
        )}
        <form
          onSubmit={submit}
          noValidate
          className="grid grid-cols-2 gap-3 border-t border-border px-5 py-4 sm:grid-cols-[minmax(0,1fr)_7rem_minmax(0,10rem)_auto] sm:items-end"
        >
          <div className="col-span-2 space-y-1.5 sm:col-span-1">
            <label htmlFor="plan-name" className={fieldLabel}>What is it for?</label>
            <input
              id="plan-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Groceries"
              className={`${field} w-full`}
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="plan-amount" className={fieldLabel}>Amount (€)</label>
            <input
              id="plan-amount"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                setError(null);
              }}
              placeholder="0.00"
              inputMode="decimal"
              autoComplete="off"
              className={`${field} money w-full`}
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="plan-category" className={fieldLabel}>Category</label>
            <select
              id="plan-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className={`${field} w-full`}
            >
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={addBudget.isPending}
            aria-label="Add to plan"
            className="col-span-2 inline-flex h-[42px] items-center justify-center gap-1.5 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:brightness-110 active:scale-[0.97] disabled:opacity-60 sm:col-span-1 sm:w-[42px] sm:px-0"
          >
            <Plus className="size-4" strokeWidth={2.4} />
            <span className="sm:sr-only">Add</span>
          </button>
          {error && (
            <p role="alert" className="col-span-2 text-xs text-destructive sm:col-span-4">
              {error}
            </p>
          )}
        </form>
      </Panel>
    </div>
  );
}
