// "Recurring" section of the Plan tab: manage recurring expense/income templates (add/edit/pause/
// delete). These are auto-applied into real Month/Year/History data each month by useApplyRecurring
// (called from Dashboard).
import { useState } from "react";
import { Plus } from "lucide-react";
import {
  useCategories,
  useIncomeCategories,
  useRecurringExpenses,
  useAddRecurringExpense,
  useUpdateRecurringExpense,
  useDeleteRecurringExpense,
  useRecurringIncomes,
  useAddRecurringIncome,
  useUpdateRecurringIncome,
  useDeleteRecurringIncome,
} from "@/lib/finance-data";
import { RecurringExpenseRow } from "@/components/RecurringExpenseRow";
import { RecurringIncomeRow } from "@/components/RecurringIncomeRow";
import { Panel, EmptyNote } from "@/components/Panel";
import { Money } from "@/components/Money";
import { field } from "@/lib/ui";

export function RecurringView({ userId }: { userId: string }) {
  return (
    <div className="space-y-6">
      <RecurringExpensesCard userId={userId} />
      <RecurringIncomesCard userId={userId} />
    </div>
  );
}

type NewRecurring = { amount: number; description: string; category: string; day_of_month: number | null };

function monthlyTotal(items: { amount: number; active: boolean }[]) {
  return items.filter((i) => i.active).reduce((a, i) => a + i.amount, 0);
}

function RecurringExpensesCard({ userId }: { userId: string }) {
  const { data: categories = [] } = useCategories(userId);
  const { data: items = [] } = useRecurringExpenses(userId);
  const addItem = useAddRecurringExpense(userId);
  const updateItem = useUpdateRecurringExpense(userId);
  const deleteItem = useDeleteRecurringExpense(userId);

  return (
    <Panel
      title="Recurring expenses"
      aside={items.length > 0 && <span><Money value={monthlyTotal(items)} className="text-foreground" /> a month</span>}
    >
      <RecurringForm
        idPrefix="rec-exp"
        categories={categories}
        placeholder="e.g. Rent"
        submitLabel="Add recurring expense"
        onAdd={(item) => addItem.mutate(item)}
      />
      {items.length === 0 ? (
        <EmptyNote>No recurring expenses yet.</EmptyNote>
      ) : (
        <ul className="border-t border-border pb-2 pt-1">
          {items.map((item) => (
            <RecurringExpenseRow
              key={item.id}
              item={item}
              categories={categories}
              onSave={(updates) => updateItem.mutate({ id: item.id, ...updates })}
              onToggleActive={(active) => updateItem.mutate({ id: item.id, active })}
              onDelete={() => deleteItem.mutate(item.id)}
            />
          ))}
        </ul>
      )}
    </Panel>
  );
}

function RecurringIncomesCard({ userId }: { userId: string }) {
  const { data: categories = [] } = useIncomeCategories(userId);
  const { data: items = [] } = useRecurringIncomes(userId);
  const addItem = useAddRecurringIncome(userId);
  const updateItem = useUpdateRecurringIncome(userId);
  const deleteItem = useDeleteRecurringIncome(userId);

  return (
    <Panel
      title="Recurring income"
      aside={items.length > 0 && <span><Money value={monthlyTotal(items)} className="text-primary" /> a month</span>}
    >
      <RecurringForm
        idPrefix="rec-inc"
        categories={categories}
        placeholder="e.g. Salary"
        submitLabel="Add recurring income"
        onAdd={(item) => addItem.mutate(item)}
      />
      {items.length === 0 ? (
        <EmptyNote>No recurring income yet.</EmptyNote>
      ) : (
        <ul className="border-t border-border pb-2 pt-1">
          {items.map((item) => (
            <RecurringIncomeRow
              key={item.id}
              item={item}
              categories={categories}
              onSave={(updates) => updateItem.mutate({ id: item.id, ...updates })}
              onToggleActive={(active) => updateItem.mutate({ id: item.id, active })}
              onDelete={() => deleteItem.mutate(item.id)}
            />
          ))}
        </ul>
      )}
    </Panel>
  );
}

function RecurringForm({
  idPrefix,
  categories,
  placeholder,
  submitLabel,
  onAdd,
}: {
  idPrefix: string;
  categories: string[];
  placeholder: string;
  submitLabel: string;
  onAdd: (item: NewRecurring) => void;
}) {
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(categories[0] ?? "");
  const [dayOfMonth, setDayOfMonth] = useState("");
  const [error, setError] = useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const n = parseFloat(amount.replace(",", "."));
    const cat = category || categories[0];
    if (!n || n <= 0 || !description.trim() || !cat) {
      setError("Fill in an amount above 0 and a description.");
      return;
    }
    const day = dayOfMonth.trim() ? parseInt(dayOfMonth, 10) : null;
    if (day != null && (isNaN(day) || day < 1 || day > 31)) {
      setError("Day must be between 1 and 31, or left empty.");
      return;
    }
    setError(null);
    onAdd({ amount: n, description: description.trim(), category: cat, day_of_month: day });
    setAmount("");
    setDescription("");
    setDayOfMonth("");
  }

  const label = "text-xs text-muted-foreground";

  return (
    <form
      onSubmit={submit}
      noValidate
      className="grid grid-cols-2 gap-3 px-5 pb-5 sm:grid-cols-[6.5rem_5.5rem_minmax(0,1fr)_minmax(0,10rem)_auto] sm:items-end"
    >
      <div className="space-y-1.5">
        <label htmlFor={`${idPrefix}-amount`} className={label}>Amount (€)</label>
        <input
          id={`${idPrefix}-amount`}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
          inputMode="decimal"
          className={`${field} money w-full`}
        />
      </div>
      <div className="space-y-1.5">
        <label htmlFor={`${idPrefix}-day`} className={label}>Day</label>
        <input
          id={`${idPrefix}-day`}
          value={dayOfMonth}
          onChange={(e) => setDayOfMonth(e.target.value)}
          placeholder="Any"
          title="Day of month (optional). Leave blank to apply as soon as the month is seen"
          inputMode="numeric"
          className={`${field} money w-full`}
        />
      </div>
      <div className="col-span-2 space-y-1.5 sm:col-span-1">
        <label htmlFor={`${idPrefix}-desc`} className={label}>Description</label>
        <input
          id={`${idPrefix}-desc`}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={placeholder}
          className={`${field} w-full`}
        />
      </div>
      <div className="col-span-2 space-y-1.5 sm:col-span-1">
        <label htmlFor={`${idPrefix}-cat`} className={label}>Category</label>
        <select
          id={`${idPrefix}-cat`}
          value={category || categories[0] || ""}
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
        className="col-span-2 inline-flex h-[42px] items-center justify-center gap-1.5 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:brightness-110 active:scale-[0.97] sm:col-span-1 sm:w-[42px] sm:px-0"
        aria-label={submitLabel}
      >
        <Plus className="size-4" strokeWidth={2.4} />
        <span className="sm:sr-only">Add</span>
      </button>
      {error && (
        <p role="alert" className="col-span-2 text-xs text-destructive sm:col-span-5">
          {error}
        </p>
      )}
    </form>
  );
}
