// Shared Tailwind class strings for form controls, so every input/select/button family looks the same.

export const field =
  "rounded-xl border border-border bg-input px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/70 transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-ring/45";

export const fieldSm =
  "rounded-lg border border-border bg-input px-2.5 py-1.5 text-sm text-foreground transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-ring/45";

export const primaryButton =
  "inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:brightness-110 active:scale-[0.98] disabled:opacity-60";

export const rowIconButton =
  "inline-flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-foreground/[0.06] hover:text-foreground";

// Row actions: always visible on touch screens, revealed on hover/focus where a pointer can hover.
export const rowActions =
  "flex items-center -mr-2 transition-opacity [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 [@media(hover:hover)]:group-focus-within:opacity-100";
