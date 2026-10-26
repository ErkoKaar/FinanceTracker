// Euro amount in the app's money style: mono tabular digits, a real minus sign, and the cents set
// smaller and quieter so the whole euros carry the reading. RollingMoney animates (readouts only).
import { useCountUp } from "@/lib/use-count-up";

const whole = new Intl.NumberFormat("en-GB", { maximumFractionDigits: 0 });

function splitEuro(value: number) {
  const cents = Math.round(Math.abs(value) * 100);
  return {
    negative: value < 0 && cents > 0,
    euros: whole.format(Math.floor(cents / 100)),
    cents: String(cents % 100).padStart(2, "0"),
  };
}

/** Plain-text version for tooltips, aria-labels and chart labels. */
export function formatEuro(value: number) {
  const { negative, euros, cents } = splitEuro(value);
  return `${negative ? "−" : ""}€${euros}.${cents}`;
}

type MoneyProps = {
  value: number;
  className?: string;
  centsClassName?: string;
};

function MoneyText({ shown, label, className = "", centsClassName = "text-[0.62em] text-muted-foreground" }: {
  shown: number;
  label: number;
  className?: string;
  centsClassName?: string;
}) {
  const { negative, euros, cents } = splitEuro(shown);
  return (
    <span className={`money whitespace-nowrap ${className}`}>
      <span className="sr-only">{formatEuro(label)}</span>
      <span aria-hidden>
        {negative && "−"}€{euros}
        <span className={centsClassName}>.{cents}</span>
      </span>
    </span>
  );
}

export function Money({ value, ...rest }: MoneyProps) {
  return <MoneyText shown={value} label={value} {...rest} />;
}

export function RollingMoney({ value, ...rest }: MoneyProps) {
  const rolled = useCountUp(value);
  return <MoneyText shown={rolled} label={value} {...rest} />;
}
