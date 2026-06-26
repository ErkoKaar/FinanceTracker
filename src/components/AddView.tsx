// "Add" tab: add a one-off expense or income entry. A toggle switches between the two forms;
// the expense form includes the category picker and inline "new category" input.
import { useEffect, useState } from "react";
import { Plus, Pencil } from "lucide-react";
import {
  useCategories,
  useAddCategory,
  useIncomeCategories,
  useAddIncomeCategory,
  useAddExpense,
  useAddIncome,
} from "@/lib/finance-data";

export function AddView({
  userId,
  displayName,
  onUpdateDisplayName,
}: {
  userId: string;
  displayName: string;
  onUpdateDisplayName: (name: string) => void;
}) {
  const [kind, setKind] = useState<"expense" | "income">("expense");

  return (
    <div className="max-w-xl mx-auto">
      <p className="text-sm text-muted-foreground">Welcome back,</p>
      <EditableName name={displayName} onSave={onUpdateDisplayName} />
      <p className="text-muted-foreground mt-2 text-sm">Add a new expense or income below.</p>

      <div className="mt-6 flex bg-card border border-border rounded-lg p-1 text-xs w-fit">
        {(["expense", "income"] as const).map((k) => (
          <button
            key={k}
            onClick={() => setKind(k)}
            className={`px-3 py-1.5 rounded-md transition capitalize ${
              kind === k ? "bg-secondary text-foreground" : "text-muted-foreground"
            }`}
          >
            {k}
          </button>
        ))}
      </div>

      {kind === "expense" ? <AddExpenseForm userId={userId} /> : <AddIncomeForm userId={userId} />}
    </div>
  );
}

function EditableName({ name, onSave }: { name: string; onSave: (name: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(name);

  function save() {
    const trimmed = value.trim();
    if (trimmed && trimmed !== name) onSave(trimmed);
    setEditing(false);
  }

  if (editing) {
    return (
      <input
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={save}
        onKeyDown={(e) => {
          if (e.key === "Enter") save();
          if (e.key === "Escape") {
            setValue(name);
            setEditing(false);
          }
        }}
        className="mt-1 w-full max-w-full bg-input border border-border rounded-lg px-2 -mx-2 text-3xl font-semibold tracking-tight focus:outline-none focus:ring-2 focus:ring-ring/50"
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        setValue(name);
        setEditing(true);
      }}
      className="group mt-1 flex items-center gap-2 text-left max-w-full"
      aria-label="Edit your name"
    >
      <h1 className="text-3xl font-semibold tracking-tight break-words">{name} 👋</h1>
      <Pencil className="size-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition shrink-0" />
    </button>
  );
}

function AddExpenseForm({ userId }: { userId: string }) {
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
    <form onSubmit={submit} className="mt-4 bg-card border border-border rounded-2xl p-6 space-y-5">
      <div className="space-y-1.5">
        <label className="text-xs text-muted-foreground">Amount (€)</label>
        <input
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
          inputMode="decimal"
          className="w-full bg-input border border-border rounded-lg px-3 py-3 text-2xl font-medium focus:outline-none focus:ring-2 focus:ring-ring/50"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs text-muted-foreground">What did you buy?</label>
        <input
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          placeholder="e.g. Coffee and a pastry"
          className="w-full bg-input border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs text-muted-foreground">Category</label>
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
            aria-label="Add category"
          >
            <Plus className="size-4" />
          </button>
        </div>
        {showNew && (
          <div className="flex gap-2 pt-2">
            <input
              value={newCat}
              onChange={(e) => setNewCat(e.target.value)}
              placeholder="New category name"
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
              Add
            </button>
          </div>
        )}
      </div>

      <button
        type="submit"
        className="w-full bg-primary text-primary-foreground rounded-lg py-3 text-sm font-medium hover:opacity-90 transition"
      >
        Save expense
      </button>
    </form>
  );
}

function AddIncomeForm({ userId }: { userId: string }) {
  const { data: categories = [] } = useIncomeCategories(userId);
  const addIncome = useAddIncome(userId);
  const addCategory = useAddIncomeCategory(userId);

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
    addIncome.mutate({
      amount: n,
      description: desc.trim() || cat,
      category: cat,
      date: new Date().toISOString(),
    });
    setAmount("");
    setDesc("");
  }

  return (
    <form onSubmit={submit} className="mt-4 bg-card border border-border rounded-2xl p-6 space-y-5">
      <div className="space-y-1.5">
        <label className="text-xs text-muted-foreground">Amount (€)</label>
        <input
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
          inputMode="decimal"
          className="w-full bg-input border border-border rounded-lg px-3 py-3 text-2xl font-medium focus:outline-none focus:ring-2 focus:ring-ring/50"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs text-muted-foreground">Where from?</label>
        <input
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          placeholder="e.g. Salary"
          className="w-full bg-input border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs text-muted-foreground">Category</label>
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
            aria-label="Add category"
          >
            <Plus className="size-4" />
          </button>
        </div>
        {showNew && (
          <div className="flex gap-2 pt-2">
            <input
              value={newCat}
              onChange={(e) => setNewCat(e.target.value)}
              placeholder="New category name"
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
              Add
            </button>
          </div>
        )}
      </div>

      <button
        type="submit"
        className="w-full bg-primary text-primary-foreground rounded-lg py-3 text-sm font-medium hover:opacity-90 transition"
      >
        Save income
      </button>
    </form>
  );
}
