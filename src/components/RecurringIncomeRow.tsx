// A single recurring income template row — view mode, or inline edit (amount/description),
// plus an active/paused toggle and delete. Mirrors RecurringExpenseRow without the category field.
import { useState } from "react";
import { Pencil, Check, X, Trash2 } from "lucide-react";
import type { RecurringIncome } from "@/lib/finance-data";

export function RecurringIncomeRow({
  item,
  onSave,
  onToggleActive,
  onDelete,
}: {
  item: RecurringIncome;
  onSave: (updates: { amount: number; description: string }) => void;
  onToggleActive: (active: boolean) => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [amount, setAmount] = useState(String(item.amount));
  const [description, setDescription] = useState(item.description);

  function startEdit() {
    setAmount(String(item.amount));
    setDescription(item.description);
    setEditing(true);
  }

  function save() {
    const n = parseFloat(amount.replace(",", "."));
    if (!n || n <= 0 || !description.trim()) return;
    onSave({ amount: n, description: description.trim() });
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
        <div className={item.active ? "" : "text-muted-foreground line-through"}>{item.description}</div>
        <div className="text-xs text-muted-foreground">monthly</div>
      </div>
      <div className="flex items-center gap-3">
        <span className="tabular-nums">€{item.amount.toFixed(2)}</span>
        <button
          onClick={() => onToggleActive(!item.active)}
          className="text-xs text-muted-foreground hover:text-foreground transition px-2 py-1 rounded-md border border-border"
        >
          {item.active ? "Active" : "Paused"}
        </button>
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
