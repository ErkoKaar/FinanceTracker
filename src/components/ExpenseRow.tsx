// A single expense row in the Transactions list — view mode, or inline edit (amount/description/category).
// The date is the day heading above the row, so the row itself shows only what and how much.
import { useState } from "react";
import { Pencil, Check, X, Trash2, Repeat } from "lucide-react";
import type { Expense } from "@/lib/finance-data";
import { Money } from "@/components/Money";
import { IconChip } from "@/components/Zone";
import { fieldSm, rowActions, rowIconButton } from "@/lib/ui";

export function ExpenseRow({
  expense,
  categories,
  onSave,
  onDelete,
}: {
  expense: Expense;
  categories: string[];
  onSave: (updates: { amount: number; description: string; category: string }) => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [amount, setAmount] = useState(String(expense.amount));
  const [description, setDescription] = useState(expense.description);
  const [category, setCategory] = useState(expense.category);

  function startEdit() {
    setAmount(String(expense.amount));
    setDescription(expense.description);
    setCategory(expense.category);
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
      <li className="flex flex-wrap items-center gap-2 bg-foreground/[0.03] px-5 py-3">
        <input
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          inputMode="decimal"
          aria-label="Amount"
          className={`${fieldSm} money w-24`}
        />
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          aria-label="Description"
          className={`${fieldSm} min-w-[8rem] flex-1`}
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          aria-label="Category"
          className={`${fieldSm} max-w-full`}
        >
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
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
    <li className="group flex items-center gap-3 px-5 py-2.5">
      <IconChip kind="spend" size="sm" />
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm">{expense.description}</div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="truncate">{expense.category}</span>
          {expense.recurring_expense_id && (
            <Repeat className="size-3 shrink-0" aria-label="Recurring" />
          )}
        </div>
      </div>
      <Money value={-expense.amount} className="text-sm" />
      <div className={rowActions}>
        <button onClick={startEdit} className={rowIconButton} aria-label={`Edit ${expense.description}`}>
          <Pencil className="size-3.5" />
        </button>
        <button
          onClick={onDelete}
          className={`${rowIconButton} hover:text-destructive`}
          aria-label={`Delete ${expense.description}`}
        >
          <Trash2 className="size-3.5" />
        </button>
      </div>
    </li>
  );
}
