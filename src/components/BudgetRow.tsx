// One named plan line in Plan → Budget, shown under its category group: view mode, or inline edit
// of its name, amount and category (moving it to another category moves it to that group).
import { useState } from "react";
import { Pencil, Check, X, Trash2 } from "lucide-react";
import type { Budget } from "@/lib/finance-data";
import { Money } from "@/components/Money";
import { fieldSm, rowActions, rowIconButton } from "@/lib/ui";

export function BudgetRow({
  budget,
  categories,
  onSave,
  onDelete,
}: {
  budget: Budget;
  categories: string[];
  onSave: (updates: { name: string; amount: number; category: string }) => void;
  onDelete: () => void;
}) {
  // Rows from before plan lines had names fall back to their category.
  const label = budget.name ?? budget.category;
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(label);
  const [amount, setAmount] = useState(String(budget.amount));
  const [category, setCategory] = useState(budget.category);

  function startEdit() {
    setName(label);
    setAmount(String(budget.amount));
    setCategory(budget.category);
    setEditing(true);
  }

  function save() {
    const n = parseFloat(amount.replace(",", "."));
    if (!n || n <= 0 || !category) return;
    onSave({ name: name.trim() || category, amount: n, category });
    setEditing(false);
  }

  if (editing) {
    return (
      <li className="-mx-2 flex flex-wrap items-center gap-2 rounded-xl bg-foreground/[0.03] px-2 py-2">
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") save();
            if (e.key === "Escape") setEditing(false);
          }}
          aria-label="Name"
          className={`${fieldSm} min-w-[8rem] flex-1`}
        />
        <input
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") save();
            if (e.key === "Escape") setEditing(false);
          }}
          inputMode="decimal"
          aria-label="Amount"
          className={`${fieldSm} money w-24`}
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          aria-label="Category"
          className={`${fieldSm} max-w-full`}
        >
          {categories.includes(category) ? null : <option value={category}>{category}</option>}
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
    <li className="group flex items-center gap-3 py-1.5 text-sm">
      <span className="min-w-0 flex-1 truncate text-muted-foreground">{label}</span>
      <Money value={budget.amount} />
      <div className={rowActions}>
        <button onClick={startEdit} className={rowIconButton} aria-label={`Edit ${label}`}>
          <Pencil className="size-3.5" />
        </button>
        <button onClick={onDelete} className={`${rowIconButton} hover:text-destructive`} aria-label={`Delete ${label}`}>
          <Trash2 className="size-3.5" />
        </button>
      </div>
    </li>
  );
}
