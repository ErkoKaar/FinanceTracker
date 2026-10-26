// Spent-versus-plan bar. The faint track is the plan, the sky fill is what's been spent; once
// spending passes the plan the extra part turns coral and a gold tick marks where the plan ended.
// Without a plan, the fill is the category's size relative to `relativeTo` (the biggest category).
export function BudgetBar({ value, planned, relativeTo }: { value: number; planned?: number; relativeTo?: number }) {
  if (planned != null && planned > 0) {
    const scale = Math.max(value, planned);
    const within = (Math.min(value, planned) / scale) * 100;
    const over = value > planned ? ((value - planned) / scale) * 100 : 0;
    return (
      <div className="relative mt-2 flex h-2 overflow-hidden rounded-full bg-foreground/[0.08]" aria-hidden>
        <span className="h-full bg-spend" style={{ width: `${within}%` }} />
        {over > 0 && <span className="h-full bg-destructive" style={{ width: `${over}%` }} />}
        {over > 0 && (
          <span className="absolute inset-y-0 w-[2px] bg-gold" style={{ left: `calc(${within}% - 1px)` }} />
        )}
      </div>
    );
  }
  const share = relativeTo && relativeTo > 0 ? Math.max(2, (value / relativeTo) * 100) : 0;
  return (
    <div className="mt-2 h-2 overflow-hidden rounded-full bg-foreground/[0.05]" aria-hidden>
      <span className="block h-full rounded-full bg-spend/70" style={{ width: `${share}%` }} />
    </div>
  );
}
