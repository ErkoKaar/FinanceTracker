// Small read-only stat card (income/expenses/balance) used by PeriodPanel.
export function StatCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  tone: "up" | "down";
}) {
  return (
    <div className="bg-card border border-border rounded-2xl p-5">
      <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
        <span className={tone === "up" ? "text-primary" : "text-destructive"}>{icon}</span>
        {label}
      </div>
      <div className={`mt-2 text-2xl font-semibold tabular-nums ${tone === "down" ? "text-foreground" : ""}`}>
        €{value.toFixed(2)}
      </div>
    </div>
  );
}
