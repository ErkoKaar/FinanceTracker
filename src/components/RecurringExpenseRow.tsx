// A single recurring expense template row — view mode, or inline edit (amount/description/category),
// plus an active/paused switch and delete. Mirrors ExpenseRow's edit pattern.
import { useState } from "react";
import { Pencil, Check, X, Trash2 } from "lucide-react";
import type { RecurringExpense } from "@/lib/finance-data";
import { Money } from "@/components/Money";
import { fieldSm, rowActions, rowIconButton } from "@/lib/ui";

export function RecurringExpenseRow({
  item,
  categories,
  onSave,
  onToggleActive,
  onDelete,
}: {
  item: RecurringExpense;
  categories: string[];
  onSave: (updates: { amount: number; description: string; category: string; day_of_month: number | null }) => void;
  onToggleActive: (active: boolean) => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [amount, setAmount] = useState(String(item.amount));
  const [description, setDescription] = useState(item.description);
  const [category, setCategory] = useState(item.category);
  const [dayOfMonth, setDayOfMonth] = useState(item.day_of_month ? String(item.day_of_month) : "");

  function startEdit() {
    setAmount(String(item.amount));
    setDescription(item.description);
    setCategory(item.category);
    setDayOfMonth(item.day_of_month ? String(item.day_of_month) : "");
    setEditing(true);
  }

  function save() {
    const n = parseFloat(amount.replace(",", "."));
    if (!n || n <= 0 || !description.trim() || !category) return;
    const day = dayOfMonth.trim() ? parseInt(dayOfMonth, 10) : null;
    if (day != null && (isNaN(day) || day < 1 || day > 31)) return;
    onSave({ amount: n, description: description.trim(), category, day_of_month: day });
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
        <input
          value={dayOfMonth}
          onChange={(e) => setDayOfMonth(e.target.value)}
          placeholder="Day"
          aria-label="Day of month (optional)"
          inputMode="numeric"
          className={`${fieldSm} money w-16`}
        />
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
    <li className="group flex items-center gap-3 px-5 py-3">
      <button
        type="button"
        role="switch"
        aria-checked={item.active}
        aria-label={`${item.description}: ${item.active ? "active" : "paused"}`}
        title={item.active ? "Active. Click to pause" : "Paused. Click to resume"}
        onClick={() => onToggleActive(!item.active)}
        className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${
          item.active ? "bg-primary/80" : "bg-foreground/15"
        }`}
      >
        <span
          className={`absolute left-0.5 top-0.5 size-4 rounded-full bg-background transition-transform duration-200 ease-in-out motion-reduce:transition-none ${
            item.active ? "translate-x-4" : ""
          }`}
        />
      </button>
      <div className="min-w-0 flex-1">
        <div className={`truncate text-sm ${item.active ? "" : "text-muted-foreground line-through"}`}>
          {item.description}
        </div>
        <div className="truncate text-xs text-muted-foreground">
          {item.category}, {item.day_of_month ? `due on day ${item.day_of_month}` : "applies as soon as seen"}
        </div>
      </div>
      <Money value={item.amount} className={`text-sm ${item.active ? "" : "text-muted-foreground"}`} />
      <div className={rowActions}>
        <button onClick={startEdit} className={rowIconButton} aria-label={`Edit ${item.description}`}>
          <Pencil className="size-3.5" />
        </button>
        <button
          onClick={onDelete}
          className={`${rowIconButton} hover:text-destructive`}
          aria-label={`Delete ${item.description}`}
        >
          <Trash2 className="size-3.5" />
        </button>
      </div>
    </li>
  );
}
