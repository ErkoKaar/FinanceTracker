// Glass container for a list or form: a quiet header line (title + optional right-side detail) and
// the content flush below it. The only "card" in the app; readouts sit directly on the backdrop.
export function Panel({
  title,
  aside,
  children,
  className = "",
}: {
  title: string;
  aside?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`glass overflow-hidden rounded-[20px] ${className}`}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-5 pb-3 pt-4">
        <h2 className="whitespace-nowrap text-sm font-medium">{title}</h2>
        {aside && <div className="text-xs text-muted-foreground">{aside}</div>}
      </div>
      {children}
    </section>
  );
}

export function EmptyNote({ children }: { children: React.ReactNode }) {
  return <p className="px-5 pb-6 pt-2 text-sm text-muted-foreground">{children}</p>;
}
