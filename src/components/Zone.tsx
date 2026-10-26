// Building blocks that give each kind of information its own fixed colour and icon, so the same
// thing always looks the same wherever it appears: income (mint), spending (sky), plan (gold),
// wishlist (violet). ZoneHeading names a section of a page; IconChip is the coloured square.
import { ArrowDownLeft, ArrowUpRight, Target, Gift, Wallet, ArrowLeftRight, type LucideIcon } from "lucide-react";

export type Kind = "income" | "spend" | "plan" | "wish" | "neutral";

export const KIND: Record<Kind, { icon: LucideIcon; text: string; chip: string; bar: string }> = {
  income: { icon: ArrowDownLeft, text: "text-primary", chip: "bg-primary/15 text-primary", bar: "bg-primary" },
  spend: { icon: ArrowUpRight, text: "text-spend", chip: "bg-spend/15 text-spend", bar: "bg-spend" },
  plan: { icon: Target, text: "text-gold", chip: "bg-gold/15 text-gold", bar: "bg-gold" },
  wish: { icon: Gift, text: "text-wish", chip: "bg-wish/15 text-wish", bar: "bg-wish" },
  neutral: { icon: Wallet, text: "text-foreground", chip: "bg-foreground/10 text-foreground", bar: "bg-foreground" },
};

export const TransactionsIcon = ArrowLeftRight;

export function IconChip({ kind, icon, size = "md" }: { kind: Kind; icon?: LucideIcon; size?: "sm" | "md" }) {
  const Icon = icon ?? KIND[kind].icon;
  return (
    <span
      aria-hidden
      className={`inline-flex shrink-0 items-center justify-center ${KIND[kind].chip} ${
        size === "sm" ? "size-7 rounded-lg" : "size-9 rounded-xl"
      }`}
    >
      <Icon className={size === "sm" ? "size-3.5" : "size-4"} strokeWidth={2.2} />
    </span>
  );
}

export function ZoneHeading({
  kind,
  icon,
  title,
  aside,
}: {
  kind: Kind;
  icon?: LucideIcon;
  title: string;
  aside?: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
      <h2 className="flex items-center gap-3">
        <IconChip kind={kind} icon={icon} />
        <span className="display text-2xl font-semibold sm:text-[1.75rem]">{title}</span>
      </h2>
      {aside && <div className="text-sm text-muted-foreground">{aside}</div>}
    </div>
  );
}
