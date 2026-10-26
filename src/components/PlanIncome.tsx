// The "+" side of a month's plan: PlanBalance does the sum (expected income − planned spending = what's
// left) and previews the effect of an amount you're still typing; ExpectedIncome lists and edits the
// named income lines that make up the expected income.
import { useState } from "react";
import { Plus, Pencil, Check, X, Trash2, Repeat } from "lucide-react";
import type { IncomePlan } from "@/lib/finance-data";
import { Money, RollingMoney } from "@/components/Money";
import { Panel } from "@/components/Panel";
import { IconChip } from "@/components/Zone";
import { field, fieldSm, rowActions, rowIconButton } from "@/lib/ui";

export function parseAmount(raw: string) {
  const n = parseFloat(raw.replace(",", "."));
  return n > 0 ? n : 0;
}

export function PlanBalance({
  income,
  planned,
  draftIncome,
  draftSpend,
  spentSoFar,
}: {
  income: number;
  planned: number;
  // Amounts typed into the add forms but not saved yet, so you can try a number before committing.
  draftIncome: number;
  draftSpend: number;
  // Current/past months only: what has actually been spent in planned categories.
  spentSoFar: number | null;
}) {
  const left = income - planned;
  const short = left < 0;
  const plannedShare = income > 0 ? Math.min(100, (planned / income) * 100) : planned > 0 ? 100 : 0;
  const hasDraft = draftIncome > 0 || draftSpend > 0;
  const leftWithDraft = left + draftIncome - draftSpend;

  return (
    <section aria-label="Plan balance" className="glass rounded-[20px] p-5 sm:p-6">
      <dl className="space-y-3 text-sm">
        <div className="flex items-center justify-between gap-3">
          <dt className="flex items-center gap-2.5">
            <IconChip kind="income" size="sm" />
            Expected income
          </dt>
          <dd className="money text-primary">
            +<Money value={income} />
          </dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="flex items-center gap-2.5">
            <IconChip kind="plan" size="sm" />
            Planned spending
          </dt>
          <dd className="text-gold">
            <Money value={-planned} />
          </dd>
        </div>
      </dl>

      <div className="mt-5 flex flex-wrap items-end justify-between gap-x-4 gap-y-1 border-t border-border pt-5">
        <p className={`text-sm ${short ? "text-destructive" : "text-muted-foreground"}`}>
          {short ? "Short by" : "Left after the plan"}
        </p>
        <RollingMoney
          value={Math.abs(left)}
          className={`text-4xl font-medium leading-none tracking-[-0.04em] sm:text-5xl ${short ? "text-destructive" : ""}`}

        />
      </div>

      {/* How much of the expected income the plan takes: gold = planned, mint = left over. */}
      <div className="mt-4 flex h-2 overflow-hidden rounded-full bg-foreground/[0.08]" aria-hidden>
        <span className={`h-full ${short ? "bg-destructive" : "bg-gold"}`} style={{ width: `${plannedShare}%` }} />
        {!short && income > 0 && <span className="h-full flex-1 bg-primary/70" />}
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        {income > 0
          ? `The plan takes ${Math.round((planned / income) * 100)}% of the expected income.`
          : "Add expected income to see what's left after the plan."}
      </p>

      {hasDraft && (
        <p className="mt-3 rounded-xl bg-foreground/[0.04] px-3 py-2 text-sm" aria-live="polite">
          With what you're typing:{" "}
          <Money value={Math.abs(leftWithDraft)} className={leftWithDraft < 0 ? "text-destructive" : "text-foreground"} />{" "}
          {leftWithDraft < 0 ? "short" : "left"}
        </p>
      )}
      {spentSoFar !== null && planned > 0 && (
        <p className="mt-3 text-xs text-muted-foreground">
          <Money value={spentSoFar} className={spentSoFar > planned ? "text-destructive" : "text-foreground"} /> spent so far in planned categories
        </p>
      )}
    </section>
  );
}

export function ExpectedIncome({
  lines,
  recurringIncome,
  onAdd,
  onUseRecurring,
  onSave,
  onDelete,
  onDraftChange,
  adding,
}: {
  lines: IncomePlan[];
  // Active recurring income this month, offered as a one-click starting point when there are no lines.
  recurringIncome: { name: string; amount: number }[];
  onAdd: (line: { name: string; amount: number }, done: () => void) => void;
  onUseRecurring: () => void;
  onSave: (id: string, updates: { name: string; amount: number }) => void;
  onDelete: (id: string) => void;
  onDraftChange: (amount: number) => void;
  adding: boolean;
}) {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const recurringTotal = recurringIncome.reduce((a, r) => a + r.amount, 0);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const n = parseAmount(amount);
    if (!name.trim() || !n) {
      setError("Fill in a name and an amount above 0.");
      return;
    }
    setError(null);
    onAdd({ name: name.trim(), amount: n }, () => {
      setName("");
      setAmount("");
      onDraftChange(0);
    });
  }

  return (
    <Panel title="Expected income" aside={lines.length > 0 && <Money value={lines.reduce((a, l) => a + l.amount, 0)} className="text-primary" />}>
      {lines.length === 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 pb-4 pt-1">
          <p className="text-sm text-muted-foreground">No expected income for this month yet.</p>
          {recurringTotal > 0 && (
            <button
              type="button"
              onClick={onUseRecurring}
              disabled={adding}
              className="inline-flex h-9 items-center gap-2 rounded-full bg-primary/15 px-3.5 text-sm font-medium text-primary transition-[background-color,transform] duration-150 hover:bg-primary/25 active:scale-[0.97] disabled:opacity-60"
            >
              <Repeat className="size-4" />
              <span>
                Use recurring income (<Money value={recurringTotal} centsClassName="hidden" />)
              </span>
            </button>
          )}
        </div>
      ) : (
        <ul className="px-5 pb-2">
          {lines.map((l) => (
            <IncomeLineRow key={l.id} line={l} onSave={(u) => onSave(l.id, u)} onDelete={() => onDelete(l.id)} />
          ))}
        </ul>
      )}

      <form onSubmit={submit} noValidate className="grid grid-cols-[minmax(0,1fr)_7rem_auto] gap-2 border-t border-border px-5 py-4">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Salary"
          aria-label="Income name"
          className={`${field} w-full`}
        />
        <input
          value={amount}
          onChange={(e) => {
            setAmount(e.target.value);
            setError(null);
            onDraftChange(parseAmount(e.target.value));
          }}
          placeholder="0.00"
          inputMode="decimal"
          autoComplete="off"
          aria-label="Income amount (€)"
          className={`${field} money w-full`}
        />
        <button
          type="submit"
          disabled={adding}
          aria-label="Add expected income"
          className="inline-flex size-[42px] items-center justify-center rounded-xl bg-primary text-primary-foreground transition hover:brightness-110 active:scale-[0.97] disabled:opacity-60"
        >
          <Plus className="size-4" strokeWidth={2.4} />
        </button>
        {error && (
          <p role="alert" className="col-span-3 text-xs text-destructive">
            {error}
          </p>
        )}
      </form>
    </Panel>
  );
}

function IncomeLineRow({
  line,
  onSave,
  onDelete,
}: {
  line: IncomePlan;
  onSave: (updates: { name: string; amount: number }) => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(line.name);
  const [amount, setAmount] = useState(String(line.amount));

  function save() {
    const n = parseAmount(amount);
    if (!name.trim() || !n) return;
    onSave({ name: name.trim(), amount: n });
    setEditing(false);
  }

  if (editing) {
    const keys = (e: React.KeyboardEvent) => {
      if (e.key === "Enter") save();
      if (e.key === "Escape") setEditing(false);
    };
    return (
      <li className="-mx-2 flex flex-wrap items-center gap-2 rounded-xl bg-foreground/[0.03] px-2 py-2">
        <input autoFocus value={name} onChange={(e) => setName(e.target.value)} onKeyDown={keys} aria-label="Name" className={`${fieldSm} min-w-[8rem] flex-1`} />
        <input value={amount} onChange={(e) => setAmount(e.target.value)} onKeyDown={keys} inputMode="decimal" aria-label="Amount" className={`${fieldSm} money w-24`} />
        <div className="ml-auto flex items-center">
          <button onClick={save} className={`${rowIconButton} hover:text-primary`} aria-label="Save">
            <Check className="size-4" />
          </button>
          <button onClick={() => setEditing(false)} className={rowIconButton} aria-label="Cancel">
            <X className="size-4" />
          </button>
        </div>
      </li>
    );
  }

  return (
    <li className="group flex items-center gap-3 py-1.5 text-sm">
      <span className="min-w-0 flex-1 truncate">{line.name}</span>
      <span className="money text-primary">
        +<Money value={line.amount} />
      </span>
      <div className={rowActions}>
        <button
          onClick={() => {
            setName(line.name);
            setAmount(String(line.amount));
            setEditing(true);
          }}
          className={rowIconButton}
          aria-label={`Edit ${line.name}`}
        >
          <Pencil className="size-3.5" />
        </button>
        <button onClick={onDelete} className={`${rowIconButton} hover:text-destructive`} aria-label={`Delete ${line.name}`}>
          <Trash2 className="size-3.5" />
        </button>
      </div>
    </li>
  );
}
