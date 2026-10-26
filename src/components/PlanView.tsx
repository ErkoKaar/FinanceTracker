// "Plan" tab: everything you set up ahead of time. "Budget" holds this month's named plan lines
// (name, amount, category), grouped by category and summed for the comparison on Overview;
// "Recurring" manages the fixed monthly expenses/income that useApplyRecurring turns into entries.
import { useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import {
  useCategories,
  useBudgets,
  useAddBudget,
  useUpdateBudget,
  useDeleteBudget,
  useExpenses,
  type Budget,
} from "@/lib/finance-data";
import { BudgetRow } from "@/components/BudgetRow";
import { BudgetBar } from "@/components/BudgetBar";
import { RecurringView } from "@/components/RecurringView";
import { Money, RollingMoney } from "@/components/Money";
import { Panel, EmptyNote } from "@/components/Panel";
import { field } from "@/lib/ui";

type Section = "budget" | "recurring";

const SECTIONS: [Section, string][] = [
  ["budget", "Budget"],
  ["recurring", "Recurring"],
];

export function PlanView({ userId }: { userId: string }) {
  const [section, setSection] = useState<Section>("budget");
  const label = new Date().toLocaleDateString("en-GB", { month: "long", year: "numeric" });

  return (
    <div className="mx-auto max-w-3xl">
      <header className="rise">
        <h1 className="display text-[clamp(2.5rem,8vw,4.5rem)] font-bold">Plan</h1>
        <p className="mt-3 max-w-[52ch] text-sm text-muted-foreground">
          {section === "budget"
            ? `Set how much you plan to spend per category in ${label}.`
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
        {section === "budget" && <BudgetSection userId={userId} label={label} />}
        {section === "recurring" && <RecurringView userId={userId} />}
      </div>
    </div>
  );
}

function BudgetSection({ userId, label }: { userId: string; label: string }) {
  const { data: categories = [] } = useCategories(userId);
  const { data: budgetsAll = [] } = useBudgets(userId);
  const { data: expensesAll = [] } = useExpenses(userId);
  const addBudget = useAddBudget(userId);
  const updateBudget = useUpdateBudget(userId);
  const deleteBudget = useDeleteBudget(userId);

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const budgets = useMemo(
    () => budgetsAll.filter((b) => b.year === year && b.month === month),
    [budgetsAll, year, month]
  );

  // Spent so far this month per category, so each category group shows how much of its plan is used.
  const spentByCategory = useMemo(() => {
    const m: Record<string, number> = {};
    for (const e of expensesAll) {
      const d = new Date(e.date);
      if (d.getFullYear() === year && d.getMonth() + 1 === month) m[e.category] = (m[e.category] ?? 0) + e.amount;
    }
    return m;
  }, [expensesAll, year, month]);

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

  const fieldLabel = "text-xs text-muted-foreground";

  return (
    <div className="space-y-6">
      {groups.length > 0 && (
        <div className="rise flex flex-wrap items-end gap-x-10 gap-y-3" style={{ ["--delay" as string]: "80ms" }}>
          <div>
            <p className="text-sm text-muted-foreground">Planned this month</p>
            <RollingMoney value={plannedTotal} className="mt-1 block text-5xl font-medium leading-none tracking-[-0.04em] text-gold" centsClassName="text-[0.5em] text-gold/60" />
          </div>
          <p className="pb-1 text-sm text-muted-foreground">
            <Money value={spentOnPlanned} className={spentOnPlanned > plannedTotal ? "text-destructive" : "text-foreground"} />{" "}
            spent in planned categories
          </p>
        </div>
      )}

      <form
        onSubmit={submit}
        noValidate
        className="glass grid grid-cols-2 gap-3 rounded-[20px] p-5 sm:grid-cols-[minmax(0,1fr)_7rem_minmax(0,10rem)_auto] sm:items-end sm:p-6"
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

      <Panel title={`${label} plan`} aside={groups.length > 0 && `${budgets.length} ${budgets.length === 1 ? "line" : "lines"}`}>
        {groups.length === 0 ? (
          <EmptyNote>No plan yet. Add what you expect to spend on above, for example rent or groceries.</EmptyNote>
        ) : (
          <div className="pb-2">
            {groups.map((g) => {
              const over = g.spent > g.planned;
              return (
                <section key={g.category} className="border-t border-border px-5 py-4 first:border-t-0 first:pt-1">
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <h3 className="truncate font-medium">{g.category}</h3>
                    <span className="whitespace-nowrap">
                      <Money value={g.spent} />
                      <span className="text-muted-foreground">
                        {" / "}
                        <Money value={g.planned} centsClassName="hidden" />
                      </span>
                    </span>
                  </div>
                  <BudgetBar value={g.spent} planned={g.planned} />
                  <p className={`mt-1.5 text-xs ${over ? "text-destructive" : "text-muted-foreground"}`}>
                    {over ? (
                      <>
                        <Money value={g.spent - g.planned} centsClassName="" /> over plan
                      </>
                    ) : (
                      <>
                        <Money value={g.planned - g.spent} centsClassName="" /> left
                      </>
                    )}
                  </p>
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
      </Panel>
    </div>
  );
}
