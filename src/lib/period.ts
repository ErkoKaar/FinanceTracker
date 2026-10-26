// Pure date-bucketing helpers shared by the Month/Year/History views: per-day and per-month totals
// (for the DayStrip) and day grouping for entry lists. All dates are bucketed in local time.

type Dated = { date: string; amount: number };

export type Period = { kind: "month"; year: number; month: number } | { kind: "year"; year: number };

export function periodLabel(period: Period) {
  return period.kind === "year"
    ? String(period.year)
    : new Date(period.year, period.month - 1, 1).toLocaleDateString("en-GB", { month: "long", year: "numeric" });
}

/** Per-day (month) or per-month (year) spending for the DayStrip, plus which cell is "now". */
export function stripFor(period: Period, expenses: Dated[]) {
  const now = new Date();
  const isCurrentYear = now.getFullYear() === period.year;
  if (period.kind === "year") {
    return {
      values: monthlyTotals(expenses, period.year),
      current: isCurrentYear ? now.getMonth() : null,
      unit: "month" as const,
      startLabel: "Jan",
      endLabel: "Dec",
    };
  }
  const monthName = new Date(period.year, period.month - 1, 1).toLocaleDateString("en-GB", { month: "short" });
  return {
    values: dailyTotals(expenses, period.year, period.month),
    current: isCurrentYear && now.getMonth() + 1 === period.month ? now.getDate() - 1 : null,
    unit: "day" as const,
    startLabel: `1 ${monthName}`,
    endLabel: `${daysInMonth(period.year, period.month)} ${monthName}`,
  };
}

export function daysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

/** Spending per day of `month` (1-12), index 0 = day 1. */
export function dailyTotals(items: Dated[], year: number, month: number) {
  const out = new Array<number>(daysInMonth(year, month)).fill(0);
  for (const item of items) {
    const d = new Date(item.date);
    if (d.getFullYear() === year && d.getMonth() + 1 === month) out[d.getDate() - 1] += item.amount;
  }
  return out;
}

/** Spending per month of `year`, index 0 = January. */
export function monthlyTotals(items: Dated[], year: number) {
  const out = new Array<number>(12).fill(0);
  for (const item of items) {
    const d = new Date(item.date);
    if (d.getFullYear() === year) out[d.getMonth()] += item.amount;
  }
  return out;
}

function dayKey(d: Date) {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

/** Groups already date-sorted entries into consecutive days labelled Today / Yesterday / "Mon 20 Oct". */
export function groupByDay<T extends { date: string }>(items: T[]) {
  const now = new Date();
  const today = dayKey(now);
  const yesterday = dayKey(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1));
  const groups: { key: string; label: string; items: T[] }[] = [];

  for (const item of items) {
    const d = new Date(item.date);
    const key = dayKey(d);
    let group = groups[groups.length - 1];
    if (!group || group.key !== key) {
      const label =
        key === today
          ? "Today"
          : key === yesterday
            ? "Yesterday"
            : d.toLocaleDateString("en-GB", {
                weekday: "short",
                day: "numeric",
                month: "short",
                ...(d.getFullYear() !== now.getFullYear() && { year: "numeric" }),
              });
      group = { key, label, items: [] };
      groups.push(group);
    }
    group.items.push(item);
  }
  return groups;
}
