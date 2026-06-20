// Small editable stat card (income/expenses/balance) used by PeriodPanel.
import { useState } from "react";
import { Pencil, Check } from "lucide-react";

export function StatCard({
  icon,
  label,
  value,
  tone,
  editable = false,
  onSave,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  tone: "up" | "down";
  editable?: boolean;
  onSave?: (value: number) => void;
}) {
  const [edit, setEdit] = useState(false);
  const [v, setV] = useState(String(value));
  return (
    <div className="bg-card border border-border rounded-2xl p-5">
      <div className="flex items-center justify-between text-muted-foreground text-xs">
        <div className="flex items-center gap-1.5">
          <span className={tone === "up" ? "text-primary" : "text-destructive"}>{icon}</span>
          {label}
        </div>
        {editable && (
          <button
            onClick={() => {
              if (edit) {
                const n = parseFloat(v.replace(",", "."));
                if (!isNaN(n) && n >= 0) onSave?.(n);
              } else {
                setV(String(value));
              }
              setEdit(!edit);
            }}
            className="hover:text-foreground transition"
          >
            {edit ? <Check className="size-3.5" /> : <Pencil className="size-3.5" />}
          </button>
        )}
      </div>
      {edit ? (
        <input
          autoFocus
          value={v}
          onChange={(e) => setV(e.target.value)}
          className="mt-2 w-full bg-transparent text-2xl font-semibold tabular-nums focus:outline-none"
        />
      ) : (
        <div className={`mt-2 text-2xl font-semibold tabular-nums ${tone === "down" ? "text-foreground" : ""}`}>
          €{value.toFixed(2)}
        </div>
      )}
    </div>
  );
}
