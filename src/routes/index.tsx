import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Wallet, Plus, LogOut, Trash2, TrendingUp, TrendingDown, PiggyBank, Pencil, Check } from "lucide-react";
import { useAuth } from "@/lib/auth";
import {
  useIncome,
  useUpdateIncome,
  useCategories,
  useAddCategory,
  useExpenses,
  useAddExpense,
  useDeleteExpense,
  type Expense,
} from "@/lib/finance-data";

export const Route = createFileRoute("/")({
  component: App,
});

function FullScreenMessage({ text }: { text: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">{text}</div>
  );
}

function App() {
  const { user, loading, signIn, signUp, signOut } = useAuth();
  if (loading) return <FullScreenMessage text="Laadin..." />;
  return user ? (
    <Dashboard userId={user.id} email={user.email ?? ""} onSignOut={signOut} />
  ) : (
    <Login signIn={signIn} signUp={signUp} />
  );
}

/* ---------------- LOGIN ---------------- */
function Login({
  signIn,
  signUp,
}: {
  signIn: ReturnType<typeof useAuth>["signIn"];
  signUp: ReturnType<typeof useAuth>["signUp"];
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"login" | "register">("login");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setSubmitting(true);
    if (mode === "login") {
      const { error } = await signIn(email, password);
      if (error) setError(error.message);
    } else {
      const { data, error } = await signUp(email, password);
      if (error) setError(error.message);
      else if (!data.session) setInfo("Kontrolli emaili ja kinnita konto, enne kui sisse logid.");
    }
    setSubmitting(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[radial-gradient(ellipse_at_top,_oklch(0.22_0.02_165_/_0.4),_transparent_60%)]">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-10">
          <div className="size-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
            <Wallet className="size-7 text-primary" strokeWidth={1.8} />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Lumen</h1>
          <p className="text-xs text-muted-foreground mt-1">Personaalne rahahaldur</p>
        </div>

        <form onSubmit={submit} className="bg-card border border-border rounded-2xl p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">Email</label>
            <input
              autoFocus
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nt. mari@näide.ee"
              className="w-full bg-input border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">Parool</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-input border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50"
            />
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
          {info && <p className="text-xs text-primary">{info}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-primary text-primary-foreground rounded-lg py-2.5 text-sm font-medium hover:opacity-90 transition disabled:opacity-60"
          >
            {mode === "login" ? "Logi sisse" : "Registreeri"}
          </button>
          <button
            type="button"
            onClick={() => {
              setMode(mode === "login" ? "register" : "login");
              setError(null);
              setInfo(null);
            }}
            className="block w-full text-center text-xs text-muted-foreground hover:text-foreground transition"
          >
            {mode === "login" ? "Pole veel kontot? Registreeri" : "Juba kasutaja? Logi sisse"}
          </button>
        </form>
      </div>
    </div>
  );
}

/* ---------------- DASHBOARD ---------------- */
type Tab = "lisa" | "kuu" | "aasta" | "ajalugu";

function Dashboard({
  userId,
  email,
  onSignOut,
}: {
  userId: string;
  email: string;
  onSignOut: () => void;
}) {
  const [tab, setTab] = useState<Tab>("lisa");

  return (
    <div className="min-h-screen">
      <header className="border-b border-border sticky top-0 bg-background/80 backdrop-blur z-10">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Wallet className="size-4 text-primary" />
            </div>
            <span className="font-semibold tracking-tight">Lumen</span>
          </div>
          <nav className="flex items-center gap-1 text-sm">
            {([
              ["lisa", "Lisa"],
              ["kuu", "Kuu"],
              ["aasta", "Aasta"],
              ["ajalugu", "Ajalugu"],
            ] as [Tab, string][]).map(([k, label]) => (
              <button
                key={k}
                onClick={() => setTab(k)}
                className={`px-3 py-1.5 rounded-md transition ${
                  tab === k ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {label}
              </button>
            ))}
          </nav>
          <button
            onClick={onSignOut}
            className="text-muted-foreground hover:text-foreground transition p-2"
            aria-label="Logi välja"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">
        {tab === "lisa" && <AddView userId={userId} email={email} />}
        {tab === "kuu" && <PeriodView mode="month" userId={userId} />}
        {tab === "aasta" && <PeriodView mode="year" userId={userId} />}
        {tab === "ajalugu" && <HistoryView userId={userId} />}
      </main>
    </div>
  );
}

/* ---------------- ADD ---------------- */
function AddView({ userId, email }: { userId: string; email: string }) {
  const { data: categories = [] } = useCategories(userId);
  const addExpense = useAddExpense(userId);
  const addCategory = useAddCategory(userId);

  const [amount, setAmount] = useState("");
  const [desc, setDesc] = useState("");
  const [cat, setCat] = useState("");
  const [newCat, setNewCat] = useState("");
  const [showNew, setShowNew] = useState(false);

  useEffect(() => {
    if (!cat && categories.length > 0) setCat(categories[0]);
  }, [categories, cat]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const n = parseFloat(amount.replace(",", "."));
    if (!n || n <= 0 || !cat) return;
    addExpense.mutate({
      amount: n,
      description: desc.trim() || cat,
      category: cat,
      date: new Date().toISOString(),
    });
    setAmount("");
    setDesc("");
  }

  return (
    <div className="max-w-xl mx-auto">
      <p className="text-sm text-muted-foreground">Tere tulemast tagasi,</p>
      <h1 className="text-3xl font-semibold tracking-tight mt-1">{email.split("@")[0]} 👋</h1>
      <p className="text-muted-foreground mt-2 text-sm">Lisa uus kulutus allpool.</p>

      <form onSubmit={submit} className="mt-8 bg-card border border-border rounded-2xl p-6 space-y-5">
        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground">Summa (€)</label>
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0,00"
            inputMode="decimal"
            className="w-full bg-input border border-border rounded-lg px-3 py-3 text-2xl font-medium focus:outline-none focus:ring-2 focus:ring-ring/50"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground">Mida ostsid?</label>
          <input
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="nt. Kohv ja sai"
            className="w-full bg-input border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground">Kategooria</label>
          <div className="flex gap-2">
            <select
              value={cat}
              onChange={(e) => setCat(e.target.value)}
              className="flex-1 bg-input border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50"
            >
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setShowNew((v) => !v)}
              className="px-3 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-secondary transition"
              aria-label="Lisa kategooria"
            >
              <Plus className="size-4" />
            </button>
          </div>
          {showNew && (
            <div className="flex gap-2 pt-2">
              <input
                value={newCat}
                onChange={(e) => setNewCat(e.target.value)}
                placeholder="Uue kategooria nimi"
                className="flex-1 bg-input border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50"
              />
              <button
                type="button"
                onClick={() => {
                  if (newCat.trim()) {
                    addCategory.mutate(newCat.trim());
                    setCat(newCat.trim());
                    setNewCat("");
                    setShowNew(false);
                  }
                }}
                className="px-3 py-2 rounded-lg bg-secondary text-sm hover:bg-accent transition"
              >
                Lisa
              </button>
            </div>
          )}
        </div>

        <button
          type="submit"
          className="w-full bg-primary text-primary-foreground rounded-lg py-3 text-sm font-medium hover:opacity-90 transition"
        >
          Salvesta kulutus
        </button>
      </form>
    </div>
  );
}

/* ---------------- PERIOD ---------------- */
function PeriodView({ mode, userId }: { mode: "month" | "year"; userId: string }) {
  const { data: expensesAll = [], isLoading: expensesLoading } = useExpenses(userId);
  const { data: income = 0, isLoading: incomeLoading } = useIncome(userId);
  const now = new Date();
  const expenses = useMemo(
    () =>
      expensesAll.filter((e) => {
        const d = new Date(e.date);
        if (mode === "year") return d.getFullYear() === now.getFullYear();
        return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
      }),
    [expensesAll, mode]
  );
  const label =
    mode === "month"
      ? now.toLocaleDateString("et-EE", { month: "long", year: "numeric" })
      : String(now.getFullYear());

  if (expensesLoading || incomeLoading) return <p className="text-sm text-muted-foreground">Laadin...</p>;

  return <PeriodPanel title={label} expenses={expenses} income={income} editableIncome userId={userId} />;
}

function PeriodPanel({
  title,
  expenses,
  income,
  editableIncome = false,
  userId,
}: {
  title: string;
  expenses: Expense[];
  income: number;
  editableIncome?: boolean;
  userId: string;
}) {
  const updateIncome = useUpdateIncome(userId);
  const deleteExpense = useDeleteExpense(userId);

  const total = expenses.reduce((a, e) => a + e.amount, 0);
  const balance = income - total;

  const byCat = useMemo(() => {
    const m = new Map<string, number>();
    expenses.forEach((e) => m.set(e.category, (m.get(e.category) ?? 0) + e.amount));
    return Array.from(m, ([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [expenses]);

  const COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between">
        <h2 className="text-2xl font-semibold tracking-tight capitalize">{title}</h2>
        <span className="text-xs text-muted-foreground">{expenses.length} kannet</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          icon={<TrendingUp className="size-4" />}
          label="Sissetulek"
          value={income}
          editable={editableIncome}
          onSave={(n) => updateIncome.mutate(n)}
          tone="up"
        />
        <StatCard icon={<TrendingDown className="size-4" />} label="Kogukulutused" value={total} tone="down" />
        <StatCard
          icon={<PiggyBank className="size-4" />}
          label="Jääk"
          value={balance}
          tone={balance >= 0 ? "up" : "down"}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 bg-card border border-border rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border text-sm font-medium">Kulutused kategooriate kaupa</div>
          {byCat.length === 0 ? (
            <div className="p-10 text-center text-sm text-muted-foreground">Veel pole kulutusi.</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted-foreground">
                  <th className="px-5 py-2 font-normal">Kategooria</th>
                  <th className="px-5 py-2 font-normal text-right">Summa</th>
                  <th className="px-5 py-2 font-normal text-right">%</th>
                </tr>
              </thead>
              <tbody>
                {byCat.map((c, i) => (
                  <tr key={c.name} className="border-t border-border">
                    <td className="px-5 py-3 flex items-center gap-2.5">
                      <span
                        className="size-2.5 rounded-full"
                        style={{ background: COLORS[i % COLORS.length] }}
                      />
                      {c.name}
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums">€{c.value.toFixed(2)}</td>
                    <td className="px-5 py-3 text-right tabular-nums text-muted-foreground">
                      {total ? ((c.value / total) * 100).toFixed(0) : 0}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-5">
          <div className="text-sm font-medium mb-2">Jaotus</div>
          {byCat.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-sm text-muted-foreground">
              Andmed puuduvad
            </div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={byCat} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2}>
                    {byCat.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="var(--card)" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "var(--popover)",
                      border: "1px solid var(--border)",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                    formatter={(v: number) => `€${v.toFixed(2)}`}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {expenses.length > 0 && (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border text-sm font-medium">Kanded</div>
          <ul>
            {expenses.slice(0, 20).map((e) => (
              <li key={e.id} className="px-5 py-3 border-t border-border first:border-t-0 flex items-center justify-between text-sm">
                <div>
                  <div>{e.description}</div>
                  <div className="text-xs text-muted-foreground">
                    {e.category} · {new Date(e.date).toLocaleDateString("et-EE")}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="tabular-nums">€{e.amount.toFixed(2)}</span>
                  <button
                    onClick={() => deleteExpense.mutate(e.id)}
                    className="text-muted-foreground hover:text-destructive transition"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function StatCard({
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

/* ---------------- HISTORY ---------------- */
function HistoryView({ userId }: { userId: string }) {
  const { data: expensesAll = [], isLoading } = useExpenses(userId);
  const { data: income = 0 } = useIncome(userId);
  const [granularity, setGranularity] = useState<"month" | "year">("month");
  const [open, setOpen] = useState<string | null | undefined>(undefined);

  const groups = useMemo(() => {
    const m = new Map<string, Expense[]>();
    expensesAll.forEach((e) => {
      const d = new Date(e.date);
      const key =
        granularity === "month"
          ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
          : String(d.getFullYear());
      const arr = m.get(key) ?? [];
      arr.push(e);
      m.set(key, arr);
    });
    return Array.from(m.entries()).sort((a, b) => (a[0] < b[0] ? 1 : -1));
  }, [expensesAll, granularity]);

  const effectiveOpen = open === undefined ? groups[0]?.[0] ?? null : open;

  function pretty(key: string) {
    if (granularity === "year") return key;
    const [y, m] = key.split("-");
    return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString("et-EE", {
      month: "long",
      year: "numeric",
    });
  }

  if (isLoading) return <p className="text-sm text-muted-foreground">Laadin...</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold tracking-tight">Ajalugu</h2>
        <div className="flex bg-card border border-border rounded-lg p-1 text-xs">
          {(["month", "year"] as const).map((g) => (
            <button
              key={g}
              onClick={() => setGranularity(g)}
              className={`px-3 py-1.5 rounded-md transition ${
                granularity === g ? "bg-secondary text-foreground" : "text-muted-foreground"
              }`}
            >
              {g === "month" ? "Kuude kaupa" : "Aastate kaupa"}
            </button>
          ))}
        </div>
      </div>

      {groups.length === 0 && (
        <div className="bg-card border border-border rounded-2xl p-10 text-center text-sm text-muted-foreground">
          Ajalugu on veel tühi.
        </div>
      )}

      <div className="space-y-3">
        {groups.map(([key, items]) => {
          const total = items.reduce((a, e) => a + e.amount, 0);
          const isOpen = effectiveOpen === key;
          return (
            <div key={key} className="bg-card border border-border rounded-2xl overflow-hidden">
              <button
                onClick={() => setOpen(isOpen ? null : key)}
                className="w-full px-5 py-4 flex items-center justify-between text-sm hover:bg-accent/40 transition"
              >
                <span className="capitalize">{pretty(key)}</span>
                <span className="flex items-center gap-4 text-muted-foreground">
                  <span>{items.length} kannet</span>
                  <span className="tabular-nums text-foreground">€{total.toFixed(2)}</span>
                </span>
              </button>
              {isOpen && (
                <div className="border-t border-border p-5">
                  <PeriodPanel title={pretty(key)} expenses={items} income={income} userId={userId} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
