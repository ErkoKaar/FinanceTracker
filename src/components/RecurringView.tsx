// "Recurring" tab: manage recurring expense/income templates (add/edit/pause/delete). These are
// auto-applied into real Month/Year/History data each month by useApplyRecurring (called from Dashboard).
import { useState } from "react";
import { Plus } from "lucide-react";
import {
  useCategories,
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

export function RecurringView({ userId }: { userId: string }) {
  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Recurring</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Set up fixed monthly expenses and income — they're applied automatically each month.
        </p>
      </div>
      <RecurringExpensesCard userId={userId} />
      <RecurringIncomesCard userId={userId} />
    </div>
  );
}

function RecurringExpensesCard({ userId }: { userId: string }) {
  const { data: categories = [] } = useCategories(userId);
  const { data: items = [] } = useRecurringExpenses(userId);
  const addItem = useAddRecurringExpense(userId);
  const updateItem = useUpdateRecurringExpense(userId);
  const deleteItem = useDeleteRecurringExpense(userId);

  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(categories[0] ?? "");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const n = parseFloat(amount.replace(",", "."));
    const cat = category || categories[0];
    if (!n || n <= 0 || !description.trim() || !cat) return;
    addItem.mutate({ amount: n, description: description.trim(), category: cat });
    setAmount("");
    setDescription("");
  }

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-border text-sm font-medium">Recurring expenses</div>
      <form onSubmit={submit} className="p-5 flex flex-wrap gap-2">
        <input
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
          inputMode="decimal"
          className="w-24 bg-input border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50"
        />
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g. Rent"
          className="flex-1 min-w-[10rem] bg-input border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50"
        />
        <select
          value={category || categories[0] || ""}
          onChange={(e) => setCategory(e.target.value)}
          className="bg-input border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50"
        >
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <button
          type="submit"
          className="px-3 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition"
          aria-label="Add recurring expense"
        >
          <Plus className="size-4" />
        </button>
      </form>
      {items.length === 0 ? (
        <div className="px-5 pb-5 text-sm text-muted-foreground">No recurring expenses yet.</div>
      ) : (
        <ul>
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
    </div>
  );
}

function RecurringIncomesCard({ userId }: { userId: string }) {
  const { data: items = [] } = useRecurringIncomes(userId);
  const addItem = useAddRecurringIncome(userId);
  const updateItem = useUpdateRecurringIncome(userId);
  const deleteItem = useDeleteRecurringIncome(userId);

  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const n = parseFloat(amount.replace(",", "."));
    if (!n || n <= 0 || !description.trim()) return;
    addItem.mutate({ amount: n, description: description.trim() });
    setAmount("");
    setDescription("");
  }

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-border text-sm font-medium">Recurring income</div>
      <form onSubmit={submit} className="p-5 flex flex-wrap gap-2">
        <input
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
          inputMode="decimal"
          className="w-24 bg-input border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50"
        />
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g. Salary"
          className="flex-1 min-w-[10rem] bg-input border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50"
        />
        <button
          type="submit"
          className="px-3 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition"
          aria-label="Add recurring income"
        >
          <Plus className="size-4" />
        </button>
      </form>
      {items.length === 0 ? (
        <div className="px-5 pb-5 text-sm text-muted-foreground">No recurring income yet.</div>
      ) : (
        <ul>
          {items.map((item) => (
            <RecurringIncomeRow
              key={item.id}
              item={item}
              onSave={(updates) => updateItem.mutate({ id: item.id, ...updates })}
              onToggleActive={(active) => updateItem.mutate({ id: item.id, active })}
              onDelete={() => deleteItem.mutate(item.id)}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
