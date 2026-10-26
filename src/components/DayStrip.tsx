// The app's signature graphic: one thin bar per day of the month (or per month of the year), bar height
// = what was spent then, in the spending colour. Days still ahead are faint stubs and today is white,
// so the strip reads as "how far into the period we are and where the money went".
import { useEffect, useState } from "react";
import { formatEuro } from "@/components/Money";

// The grow-in plays for the first large strip of the session only; after that, switching tabs shows
// the strip immediately, since it's data you came to read.
let grownThisSession = false;

export function DayStrip({
  values,
  current,
  unit,
  startLabel,
  endLabel,
  size = "lg",
}: {
  values: number[];
  // Index of today / this month; later cells render as "not yet". null = the whole period is past.
  current: number | null;
  unit: "day" | "month";
  startLabel: string;
  endLabel: string;
  size?: "lg" | "md" | "sm";
}) {
  const [grow] = useState(() => size !== "sm" && !grownThisSession);
  useEffect(() => {
    if (grow) grownThisSession = true;
  }, [grow]);

  const max = Math.max(...values, 0);
  const peak = values.indexOf(max);
  const summary =
    max > 0
      ? `Spending per ${unit}. Highest: ${formatEuro(max)} on ${unit} ${peak + 1}.`
      : `No spending recorded per ${unit} yet.`;

  return (
    <figure className="w-full">
      <div
        role="img"
        aria-label={summary}
        className={`flex items-end ${
          size === "lg" ? "h-16 gap-[3px] sm:h-20 sm:gap-1" : size === "md" ? "h-12 gap-[2px] sm:gap-[3px]" : "h-7 gap-[2px]"
        }`}
      >
        {values.map((v, i) => {
          const future = current !== null && i > current;
          const isCurrent = i === current;
          // Square-root scale so one big day (rent) doesn't flatten the rest of the month; zero days
          // keep a short stub so the rhythm of the month stays visible.
          const height = v > 0 && max > 0 ? Math.max(12, Math.sqrt(v / max) * 100) : 6;
          return (
            <span
              key={i}
              title={future ? undefined : `${unit === "day" ? "Day" : "Month"} ${i + 1}: ${formatEuro(v)}`}
              style={{ height: `${height}%`, ["--i" as string]: i }}
              className={`${grow ? "bar-grow" : ""} flex-1 rounded-[2px] ${
                future
                  ? "bg-foreground/[0.07]"
                  : isCurrent
                    ? "bg-foreground"
                    : v > 0
                      ? "bg-spend/75"
                      : "bg-foreground/15"
              }`}
            />
          );
        })}
      </div>
      {size !== "sm" && (
        <figcaption className="mt-2 flex justify-between text-xs text-muted-foreground" aria-hidden>
          <span>{startLabel}</span>
          <span>{endLabel}</span>
        </figcaption>
      )}
    </figure>
  );
}
