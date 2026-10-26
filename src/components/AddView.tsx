// "Add" tab: add a one-off expense or income entry. A toggle switches between the two forms; both
// share EntryForm (big amount field, category chips with an inline "new category" input). Under the
// form, a compact look at the current month so you see the effect of what you just added.
import { useEffect, useMemo, useRef, useState } from "react";
import { Plus, Pencil, Check } from "lucide-react";
import {
  useCategories,
  useAddCategory,
  useIncomeCategories,
  useAddIncomeCategory,
  useAddExpense,
  useAddIncome,
  useExpenses,
  useIncomes,
} from "@/lib/finance-data";
import { field, primaryButton } from "@/lib/ui";
import { Money } from "@/components/Money";
import { DayStrip } from "@/components/DayStrip";
import { stripFor } from "@/lib/period";

type Kind = "expense" | "income";

export function AddView({
  userId,
  displayName,
  onUpdateDisplayName,
}: {
  userId: string;
  displayName: string;
  onUpdateDisplayName: (name: string) => void;
}) {
  const [kind, setKind] = useState<Kind>("expense");

  return (
    <div className="mx-auto max-w-xl">
      <div className="rise">
        <p className="text-sm text-muted-foreground">Welcome back,</p>
        <EditableName name={displayName} onSave={onUpdateDisplayName} />
      </div>

      <KindToggle kind={kind} onChange={setKind} />

      {kind === "expense" ? <AddExpenseForm userId={userId} /> : <AddIncomeForm userId={userId} />}

      <MonthPulse userId={userId} />
    </div>
  );
}

function KindToggle({ kind, onChange }: { kind: Kind; onChange: (k: Kind) => void }) {
  return (
    <div role="group" aria-label="Entry type" className="glass relative mt-8 grid w-56 grid-cols-2 rounded-full p-1 text-sm">
      <span
        aria-hidden
        className={`absolute inset-y-1 left-1 w-[calc(50%-4px)] rounded-full bg-foreground/[0.1] transition-transform duration-200 ease-in-out motion-reduce:transition-none ${
          kind === "income" ? "translate-x-full" : ""
        }`}
      />
      {(["expense", "income"] as const).map((k) => (
        <button
          key={k}
          type="button"
          aria-pressed={kind === k}
          onClick={() => onChange(k)}
          className={`relative rounded-full py-1.5 capitalize transition-colors ${
            kind === k ? "text-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {k}
        </button>
      ))}
    </div>
  );
}

function EditableName({ name, onSave }: { name: string; onSave: (name: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(name);

  function save() {
    const trimmed = value.trim();
    if (trimmed && trimmed !== name) onSave(trimmed);
    setEditing(false);
  }

  if (editing) {
    return (
      <input
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={save}
        onKeyDown={(e) => {
          if (e.key === "Enter") save();
          if (e.key === "Escape") {
            setValue(name);
            setEditing(false);
          }
        }}
        aria-label="Your name"
        className="display -mx-2 mt-1 w-full max-w-full rounded-xl border border-border bg-input px-2 py-1 text-[clamp(2.25rem,8vw,3.5rem)] font-bold focus:outline-none focus:ring-2 focus:ring-ring/45"
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        setValue(name);
        setEditing(true);
      }}
      className="group mt-1 flex max-w-full items-center gap-3 text-left"
      aria-label="Edit your name"
    >
      <h1 className="display break-words text-[clamp(2.25rem,8vw,3.5rem)] font-bold">{name}</h1>
      <Pencil className="size-4 shrink-0 text-muted-foreground opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100" />
    </button>
  );
}

function AddExpenseForm({ userId }: { userId: string }) {
  const { data: categories = [] } = useCategories(userId);
  const addExpense = useAddExpense(userId);
  const addCategory = useAddCategory(userId);
  return (
    <EntryForm
      kind="expense"
      categories={categories}
      descriptionLabel="What did you buy?"
      descriptionPlaceholder="e.g. Coffee and a pastry"
      submitLabel="Save expense"
      pending={addExpense.isPending}
      onAdd={(entry, callbacks) => addExpense.mutate(entry, callbacks)}
      onAddCategory={(name) => addCategory.mutate(name)}
    />
  );
}

function AddIncomeForm({ userId }: { userId: string }) {
  const { data: categories = [] } = useIncomeCategories(userId);
  const addIncome = useAddIncome(userId);
  const addCategory = useAddIncomeCategory(userId);
  return (
    <EntryForm
      kind="income"
      categories={categories}
      descriptionLabel="Where from?"
      descriptionPlaceholder="e.g. Salary"
      submitLabel="Save income"
      pending={addIncome.isPending}
      onAdd={(entry, callbacks) => addIncome.mutate(entry, callbacks)}
      onAddCategory={(name) => addCategory.mutate(name)}
    />
  );
}

type NewEntry = { amount: number; description: string; category: string; date: string };

function EntryForm({
  kind,
  categories,
  descriptionLabel,
  descriptionPlaceholder,
  submitLabel,
  pending,
  onAdd,
  onAddCategory,
}: {
  kind: Kind;
  categories: string[];
  descriptionLabel: string;
  descriptionPlaceholder: string;
  submitLabel: string;
  pending: boolean;
  onAdd: (entry: NewEntry, callbacks: { onSuccess: () => void; onError: () => void }) => void;
  onAddCategory: (name: string) => void;
}) {
  const [amount, setAmount] = useState("");
  const [desc, setDesc] = useState("");
  const [cat, setCat] = useState("");
  const [newCat, setNewCat] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [status, setStatus] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const savedTimer = useRef<number>();
  const amountRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!cat && categories.length > 0) setCat(categories[0]);
  }, [categories, cat]);

  useEffect(() => () => window.clearTimeout(savedTimer.current), []);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const n = parseFloat(amount.replace(",", "."));
    if (!n || n <= 0) {
      setStatus({ tone: "error", text: "Enter an amount above 0." });
      amountRef.current?.focus();
      return;
    }
    if (!cat) {
      setStatus({ tone: "error", text: "Pick a category first." });
      return;
    }
    setStatus(null);
    onAdd(
      { amount: n, description: desc.trim() || cat, category: cat, date: new Date().toISOString() },
      {
        onSuccess: () => {
          setAmount("");
          setDesc("");
          setStatus({ tone: "ok", text: kind === "expense" ? "Expense saved" : "Income saved" });
          window.clearTimeout(savedTimer.current);
          savedTimer.current = window.setTimeout(() => setStatus(null), 2200);
        },
        onError: () => setStatus({ tone: "error", text: "Couldn't save. Check your connection and try again." }),
      }
    );
  }

  function addNewCategory() {
    const name = newCat.trim();
    if (!name) return;
    onAddCategory(name);
    setCat(name);
    setNewCat("");
    setShowNew(false);
  }

  const saved = status?.tone === "ok";
  const chip =
    "inline-flex min-h-9 cursor-pointer items-center rounded-full border px-3.5 text-sm transition select-none active:scale-[0.97]";

  return (
    <form onSubmit={submit} noValidate className="glass mt-4 space-y-6 rounded-[20px] p-5 sm:p-6">
      <div>
        <label htmlFor="entry-amount" className="text-xs text-muted-foreground">
          Amount
        </label>
        <div className="mt-1 flex items-baseline gap-2 border-b border-border pb-2 transition-colors focus-within:border-primary/60">
          <span className="money text-3xl text-muted-foreground sm:text-4xl" aria-hidden>
            €
          </span>
          <input
            id="entry-amount"
            ref={amountRef}
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value);
              if (status?.tone === "error") setStatus(null);
            }}
            placeholder="0.00"
            inputMode="decimal"
            autoComplete="off"
            className="money w-full min-w-0 bg-transparent text-5xl font-medium tracking-[-0.04em] placeholder:text-foreground/20 focus:outline-none sm:text-6xl"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="entry-desc" className="text-xs text-muted-foreground">
          {descriptionLabel}
        </label>
        <input
          id="entry-desc"
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          placeholder={descriptionPlaceholder}
          className={`${field} w-full`}
        />
      </div>

      <fieldset className="space-y-2">
        <legend className="text-xs text-muted-foreground">Category</legend>
        <div className="flex flex-wrap gap-2 pt-2">
          {categories.map((c) => (
            <label key={c} className="contents">
              <input
                type="radio"
                name={`${kind}-category`}
                value={c}
                checked={cat === c}
                onChange={() => setCat(c)}
                className="peer sr-only"
              />
              <span
                className={`${chip} peer-focus-visible:ring-2 peer-focus-visible:ring-ring ${
                  cat === c
                    ? "border-primary/50 bg-primary/12 text-foreground"
                    : "border-border text-muted-foreground hover:border-foreground/20 hover:text-foreground"
                }`}
              >
                {c}
              </span>
            </label>
          ))}
          <button
            type="button"
            onClick={() => setShowNew((v) => !v)}
            aria-expanded={showNew}
            className={`${chip} gap-1 border-dashed border-border text-muted-foreground hover:text-foreground`}
          >
            <Plus className="size-3.5" />
            New
          </button>
        </div>
        {showNew && (
          <div className="flex gap-2 pt-2">
            <input
              autoFocus
              value={newCat}
              onChange={(e) => setNewCat(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addNewCategory();
                }
              }}
              placeholder="New category name"
              aria-label="New category name"
              className={`${field} min-w-0 flex-1`}
            />
            <button
              type="button"
              onClick={addNewCategory}
              className="rounded-xl bg-secondary px-4 text-sm transition hover:bg-accent"
            >
              Add
            </button>
          </div>
        )}
      </fieldset>

      <div>
        <button type="submit" disabled={pending} className={`${primaryButton} w-full`}>
          {saved ? (
            <>
              <Check className="size-4" strokeWidth={2.6} />
              {status.text}
            </>
          ) : (
            submitLabel
          )}
        </button>
        <p
          role="status"
          className={`mt-2 min-h-5 text-center text-xs ${status?.tone === "error" ? "text-destructive" : "sr-only"}`}
        >
          {status?.text}
        </p>
      </div>
    </form>
  );
}

function MonthPulse({ userId }: { userId: string }) {
  const { data: expenses = [] } = useExpenses(userId);
  const { data: incomes = [] } = useIncomes(userId);
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const { spent, balance, strip } = useMemo(() => {
    const inMonth = (d: string) => {
      const x = new Date(d);
      return x.getFullYear() === year && x.getMonth() + 1 === month;
    };
    const monthExpenses = expenses.filter((e) => inMonth(e.date));
    const spent = monthExpenses.reduce((a, e) => a + e.amount, 0);
    const income = incomes.filter((i) => inMonth(i.date)).reduce((a, i) => a + i.amount, 0);
    return { spent, balance: income - spent, strip: stripFor({ kind: "month", year, month }, monthExpenses) };
  }, [expenses, incomes, year, month]);

  const monthName = now.toLocaleDateString("en-GB", { month: "long" });

  return (
    <section aria-label={`${monthName} so far`} className="mt-10 px-1">
      <div className="flex items-baseline justify-between gap-4 text-sm">
        <span className="text-muted-foreground">{monthName} so far</span>
        <span className="text-muted-foreground">
          <Money value={spent} className="text-foreground" /> spent
        </span>
      </div>
      <div className="mt-3">
        <DayStrip {...strip} size="sm" />
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        Balance{" "}
        <Money value={balance} className={balance < 0 ? "text-destructive" : "text-foreground"} />
      </p>
    </section>
  );
}
