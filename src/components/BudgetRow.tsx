// A single budgeted category row in the Plan tab — view mode, or inline edit of just the planned
// amount (category is fixed once set; to change it, delete and re-add via the form).
import { useState } from "react";
import { Pencil, Check, X, Trash2 } from "lucide-react";
import type { Budget } from "@/lib/finance-data";

export function BudgetRow({
  budget,
  onSave,
  onDelete,
}: {
  budget: Budget;
  onSave: (amount: number) => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [amount, setAmount] = useState(String(budget.amount));

  function save() {
    const n = parseFloat(amount.replace(",", "."));
    if (!n || n <= 0) return;
    onSave(n);
    setEditing(false);
  }

  return (
    <li className="px-5 py-3 border-t border-border first:border-t-0 flex items-center justify-between text-sm">
      <div>{budget.category}</div>
      <div className="flex items-center gap-3">
        {editing ? (
          <input
            autoFocus
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            inputMode="decimal"
            className="w-24 bg-input border border-border rounded-md px-2 py-1 text-sm tabular-nums text-right focus:outline-none focus:ring-2 focus:ring-ring/50"
          />
        ) : (
          <span className="tabular-nums">€{budget.amount.toFixed(2)}</span>
        )}
        {editing ? (
          <>
            <button onClick={save} className="text-muted-foreground hover:text-primary transition" aria-label="Save">
              <Check className="size-4" />
            </button>
            <button
              onClick={() => {
                setAmount(String(budget.amount));
                setEditing(false);
              }}
              className="text-muted-foreground hover:text-foreground transition"
              aria-label="Cancel"
            >
              <X className="size-4" />
            </button>
          </>
        ) : (
          <button onClick={() => setEditing(true)} className="text-muted-foreground hover:text-foreground transition" aria-label="Edit">
            <Pencil className="size-4" />
          </button>
        )}
        <button onClick={onDelete} className="text-muted-foreground hover:text-destructive transition" aria-label="Delete">
          <Trash2 className="size-4" />
        </button>
      </div>
    </li>
  );
}
