// A single row in PeriodPanel's "Income" list — view mode, or inline edit (amount/description/category).
// Mirrors ExpenseRow.
import { useState } from "react";
import { Pencil, Check, X, Trash2 } from "lucide-react";
import type { Income } from "@/lib/finance-data";

export function IncomeRow({
  income,
  categories,
  onSave,
  onDelete,
}: {
  income: Income;
  categories: string[];
  onSave: (updates: { amount: number; description: string; category: string }) => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [amount, setAmount] = useState(String(income.amount));
  const [description, setDescription] = useState(income.description);
  const [category, setCategory] = useState(income.category);

  function startEdit() {
    setAmount(String(income.amount));
    setDescription(income.description);
    setCategory(income.category);
    setEditing(true);
  }

  function save() {
    const n = parseFloat(amount.replace(",", "."));
    if (!n || n <= 0 || !description.trim() || !category) return;
    onSave({ amount: n, description: description.trim(), category });
    setEditing(false);
  }

  if (editing) {
    return (
      <li className="px-5 py-3 border-t border-border first:border-t-0 flex items-center gap-2 text-sm">
        <input
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          inputMode="decimal"
          className="w-20 bg-input border border-border rounded-md px-2 py-1 text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-ring/50"
        />
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="flex-1 bg-input border border-border rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="bg-input border border-border rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50"
        >
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <button onClick={save} className="text-muted-foreground hover:text-primary transition" aria-label="Save">
          <Check className="size-4" />
        </button>
        <button
          onClick={() => setEditing(false)}
          className="text-muted-foreground hover:text-foreground transition"
          aria-label="Cancel"
        >
          <X className="size-4" />
        </button>
      </li>
    );
  }

  return (
    <li className="px-5 py-3 border-t border-border first:border-t-0 flex items-center justify-between text-sm">
      <div>
        <div>{income.description}</div>
        <div className="text-xs text-muted-foreground">
          {income.category} · {new Date(income.date).toLocaleDateString("en-GB")}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="tabular-nums">€{income.amount.toFixed(2)}</span>
        <button onClick={startEdit} className="text-muted-foreground hover:text-foreground transition" aria-label="Edit">
          <Pencil className="size-4" />
        </button>
        <button onClick={onDelete} className="text-muted-foreground hover:text-destructive transition" aria-label="Delete">
          <Trash2 className="size-4" />
        </button>
      </div>
    </li>
  );
}
