// "Wishlist" tab: things you want to buy later, with what they cost in total and which ones this
// month's balance already covers. "Bought" turns an item into a real expense.
import { useMemo, useState } from "react";
import { Plus, Pencil, Check, X, Trash2, ExternalLink, ShoppingBag } from "lucide-react";
import {
  useWishlist,
  useAddWishlistItem,
  useUpdateWishlistItem,
  useDeleteWishlistItem,
  useBuyWishlistItem,
  useCategories,
  useExpenses,
  useIncomes,
  type WishlistItem,
} from "@/lib/finance-data";
import { Money, RollingMoney } from "@/components/Money";
import { Panel, EmptyNote } from "@/components/Panel";
import { field, fieldSm, rowActions, rowIconButton } from "@/lib/ui";

/** "example.com/x" → "https://example.com/x"; anything that isn't http(s) after that is rejected. */
function normalizeUrl(raw: string): string | null | undefined {
  const value = raw.trim();
  if (!value) return null;
  const withScheme = /^[a-z][a-z0-9+.-]*:/i.test(value) ? value : `https://${value}`;
  try {
    const url = new URL(withScheme);
    return url.protocol === "http:" || url.protocol === "https:" ? url.href : undefined;
  } catch {
    return undefined;
  }
}

function parsePrice(raw: string) {
  const n = parseFloat(raw.replace(",", "."));
  return n > 0 ? n : null;
}

export function WishlistView({ userId }: { userId: string }) {
  const { data: items = [], isLoading } = useWishlist(userId);
  const { data: categories = [] } = useCategories(userId);
  const { data: expenses = [] } = useExpenses(userId);
  const { data: incomes = [] } = useIncomes(userId);
  const updateItem = useUpdateWishlistItem(userId);
  const deleteItem = useDeleteWishlistItem(userId);
  const buyItem = useBuyWishlistItem(userId);
  const [buyError, setBuyError] = useState<string | null>(null);

  const open = useMemo(() => items.filter((i) => !i.bought_at).sort((a, b) => a.price - b.price), [items]);
  const bought = useMemo(
    () => items.filter((i) => i.bought_at).sort((a, b) => (a.bought_at! < b.bought_at! ? 1 : -1)),
    [items]
  );
  const total = open.reduce((a, i) => a + i.price, 0);

  // Same "balance this month" as the Month view: what's left of this month's income after spending.
  const balance = useMemo(() => {
    const now = new Date();
    const inMonth = (d: string) => {
      const x = new Date(d);
      return x.getFullYear() === now.getFullYear() && x.getMonth() === now.getMonth();
    };
    const income = incomes.filter((i) => inMonth(i.date)).reduce((a, i) => a + i.amount, 0);
    const spent = expenses.filter((e) => inMonth(e.date)).reduce((a, e) => a + e.amount, 0);
    return income - spent;
  }, [expenses, incomes]);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="rise">
        <h1 className="display text-[clamp(2.5rem,8vw,4.5rem)] font-bold">Wishlist</h1>
        <p className="mt-3 max-w-[52ch] text-sm text-muted-foreground">
          Things you want to buy later. Mark one as bought and it's added as an expense.
        </p>
      </header>

      {open.length > 0 && (
        <div className="rise flex flex-wrap items-end gap-x-10 gap-y-3" style={{ ["--delay" as string]: "80ms" }}>
          <div>
            <p className="text-sm text-muted-foreground">On your wishlist</p>
            <RollingMoney value={total} className="mt-1 block text-5xl font-medium leading-none tracking-[-0.04em] text-wish" />
          </div>
          <p className="pb-1 text-sm text-muted-foreground">
            <Money value={balance} className={balance < 0 ? "text-destructive" : "text-foreground"} /> left this month
          </p>
        </div>
      )}

      <AddWishlistForm userId={userId} />

      <Panel title="Wishlist" aside={open.length > 0 && `${open.length} ${open.length === 1 ? "item" : "items"}`}>
        {isLoading ? (
          <EmptyNote>Loading...</EmptyNote>
        ) : open.length === 0 ? (
          <EmptyNote>Nothing on your wishlist yet. Add something above to keep track of what it costs.</EmptyNote>
        ) : (
          <ul className="pb-2">
            {open.map((item) => (
              <WishlistRow
                key={item.id}
                item={item}
                fits={item.price <= balance}
                categories={categories}
                buying={buyItem.isPending && buyItem.variables?.item.id === item.id}
                onSave={(updates) => updateItem.mutate({ id: item.id, ...updates })}
                onDelete={() => deleteItem.mutate(item.id)}
                onBuy={(category) => {
                  setBuyError(null);
                  buyItem.mutate(
                    { item, category },
                    { onError: (e) => setBuyError(e instanceof Error ? e.message : "Couldn't save. Try again.") }
                  );
                }}
              />
            ))}
          </ul>
        )}
        {buyError && (
          <p role="alert" className="px-5 pb-4 text-xs text-destructive">
            {buyError}
          </p>
        )}
      </Panel>

      {bought.length > 0 && (
        <Panel title="Bought" aside={`${bought.length}`}>
          <ul className="pb-2">
            {bought.map((item) => (
              <li key={item.id} className="group flex items-center gap-3 px-5 py-2.5">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm text-muted-foreground">{item.name}</div>
                  <div className="text-xs text-muted-foreground/80">
                    {new Date(item.bought_at!).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                  </div>
                </div>
                <Money value={item.price} className="text-sm text-muted-foreground" />
                <div className={rowActions}>
                  <button
                    onClick={() => deleteItem.mutate(item.id)}
                    className={`${rowIconButton} hover:text-destructive`}
                    aria-label={`Remove ${item.name} from the bought list`}
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      )}
    </div>
  );
}

function AddWishlistForm({ userId }: { userId: string }) {
  const addItem = useAddWishlistItem(userId);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const n = parsePrice(price);
    const link = normalizeUrl(url);
    if (!name.trim() || !n) {
      setError("Fill in a name and a price above 0.");
      return;
    }
    if (link === undefined) {
      setError("The link doesn't look like a web address.");
      return;
    }
    setError(null);
    addItem.mutate(
      { name: name.trim(), price: n, url: link },
      {
        onSuccess: () => {
          setName("");
          setPrice("");
          setUrl("");
        },
        onError: () => setError("Couldn't save. Check your connection and try again."),
      }
    );
  }

  const label = "text-xs text-muted-foreground";

  return (
    <form
      onSubmit={submit}
      noValidate
      className="glass grid grid-cols-2 gap-3 rounded-[20px] p-5 sm:grid-cols-[minmax(0,1fr)_7rem_minmax(0,1fr)_auto] sm:items-end sm:p-6"
    >
      <div className="col-span-2 space-y-1.5 sm:col-span-1">
        <label htmlFor="wish-name" className={label}>What do you want?</label>
        <input
          id="wish-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Running shoes"
          className={`${field} w-full`}
        />
      </div>
      <div className="space-y-1.5">
        <label htmlFor="wish-price" className={label}>Price (€)</label>
        <input
          id="wish-price"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="0.00"
          inputMode="decimal"
          autoComplete="off"
          className={`${field} money w-full`}
        />
      </div>
      <div className="space-y-1.5">
        <label htmlFor="wish-url" className={label}>Link (optional)</label>
        <input
          id="wish-url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="shop.ee/..."
          inputMode="url"
          autoComplete="off"
          className={`${field} w-full`}
        />
      </div>
      <button
        type="submit"
        disabled={addItem.isPending}
        aria-label="Add to wishlist"
        className="col-span-2 inline-flex h-[42px] items-center justify-center gap-1.5 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:brightness-110 active:scale-[0.97] disabled:opacity-60 sm:col-span-1 sm:w-[42px] sm:px-0"
      >
        <Plus className="size-4" strokeWidth={2.4} />
        <span className="sm:sr-only">Add</span>
      </button>
      {error && (
        <p role="alert" className="col-span-2 text-xs text-destructive sm:col-span-4">
          {error}
        </p>
      )}
    </form>
  );
}

function WishlistRow({
  item,
  fits,
  categories,
  buying,
  onSave,
  onDelete,
  onBuy,
}: {
  item: WishlistItem;
  fits: boolean;
  categories: string[];
  buying: boolean;
  onSave: (updates: { name: string; price: number; url: string | null }) => void;
  onDelete: () => void;
  onBuy: (category: string) => void;
}) {
  const [mode, setMode] = useState<"view" | "edit" | "buy">("view");
  const [name, setName] = useState(item.name);
  const [price, setPrice] = useState(String(item.price));
  const [url, setUrl] = useState(item.url ?? "");
  const [category, setCategory] = useState(categories[0] ?? "");

  function startEdit() {
    setName(item.name);
    setPrice(String(item.price));
    setUrl(item.url ?? "");
    setMode("edit");
  }

  function save() {
    const n = parsePrice(price);
    const link = normalizeUrl(url);
    if (!name.trim() || !n || link === undefined) return;
    onSave({ name: name.trim(), price: n, url: link });
    setMode("view");
  }

  if (mode === "edit") {
    return (
      <li className="flex flex-wrap items-center gap-2 bg-foreground/[0.03] px-5 py-3">
        <input value={name} onChange={(e) => setName(e.target.value)} aria-label="Name" className={`${fieldSm} min-w-[8rem] flex-1`} />
        <input
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          inputMode="decimal"
          aria-label="Price"
          className={`${fieldSm} money w-24`}
        />
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          inputMode="url"
          placeholder="Link"
          aria-label="Link"
          className={`${fieldSm} min-w-[8rem] flex-1`}
        />
        <div className="ml-auto flex items-center">
          <button onClick={save} className={`${rowIconButton} hover:text-primary`} aria-label="Save">
            <Check className="size-4" />
          </button>
          <button onClick={() => setMode("view")} className={rowIconButton} aria-label="Cancel">
            <X className="size-4" />
          </button>
        </div>
      </li>
    );
  }

  // http(s) only, checked again at render time so an odd stored value never becomes a live link.
  const href = item.url && /^https?:\/\//i.test(item.url) ? item.url : null;

  return (
    <li className="group px-5 py-3">
      {/* Two lines (name + price, status + actions) so long names stay readable on a phone. */}
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1">
        <div className="flex min-w-0 items-center gap-1.5 text-sm">
          <span className="truncate">{item.name}</span>
          {href && (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex size-6 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground"
              aria-label={`Open link for ${item.name}`}
            >
              <ExternalLink className="size-3.5" />
            </a>
          )}
        </div>
        <Money value={item.price} className="text-right text-sm" />
        <div className="flex min-w-0 items-center gap-1 text-xs text-muted-foreground">
          {fits && <Check className="size-3 shrink-0 text-primary" strokeWidth={2.6} aria-hidden />}
          <span className="truncate">{fits ? "Fits this month" : "Not this month"}</span>
        </div>
        <div className="flex items-center justify-end gap-1">
          <div className={rowActions}>
            <button onClick={startEdit} className={rowIconButton} aria-label={`Edit ${item.name}`}>
              <Pencil className="size-3.5" />
            </button>
            <button onClick={onDelete} className={`${rowIconButton} hover:text-destructive`} aria-label={`Delete ${item.name}`}>
              <Trash2 className="size-3.5" />
            </button>
          </div>
          <button
            onClick={() => setMode(mode === "buy" ? "view" : "buy")}
            aria-expanded={mode === "buy"}
            className="ml-1 inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border border-border px-3 text-xs text-muted-foreground transition-colors hover:border-foreground/20 hover:text-foreground"
          >
            <ShoppingBag className="size-3.5" />
            Bought
          </button>
        </div>
      </div>

      {mode === "buy" && (
        <div className="rise mt-3 flex flex-wrap items-center gap-2 rounded-xl bg-foreground/[0.03] p-3 text-sm">
          <span className="text-muted-foreground">Add as an expense in</span>
          <select
            value={category || categories[0] || ""}
            onChange={(e) => setCategory(e.target.value)}
            aria-label="Expense category"
            className={fieldSm}
          >
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <div className="ml-auto flex items-center gap-1">
            <button
              onClick={() => onBuy(category || categories[0])}
              disabled={buying || categories.length === 0}
              className="inline-flex h-8 items-center gap-1.5 rounded-full bg-primary px-3.5 text-xs font-semibold text-primary-foreground transition hover:brightness-110 active:scale-[0.97] disabled:opacity-60"
            >
              <Check className="size-3.5" strokeWidth={2.6} />
              Add expense
            </button>
            <button onClick={() => setMode("view")} className={rowIconButton} aria-label="Cancel">
              <X className="size-4" />
            </button>
          </div>
        </div>
      )}
    </li>
  );
}
