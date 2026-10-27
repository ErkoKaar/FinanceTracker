// Stand-in for src/lib/supabase.ts in the demo build (swapped in by vite.config.ts, never shipped in
// the real app). It answers the same query chains finance-data.ts uses — select/order/eq/in, insert,
// update, delete — from an in-memory copy of the sample data, saved to this browser's localStorage
// so a visitor's changes survive a reload. Nothing is sent anywhere.
import { createSeed, type Tables } from "./seed";
import { DEMO_STORAGE_KEY } from "./config";

type Row = Record<string, unknown>;

type Stored = {
  seededFor: string; // "YYYY-M": reseeded when the month changes so dates keep looking current
  tables: Tables;
  displayName: string;
};

function monthKey(d = new Date()) {
  return `${d.getFullYear()}-${d.getMonth()}`;
}

function load(): Stored {
  try {
    const raw = localStorage.getItem(DEMO_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Stored;
      if (parsed.seededFor === monthKey() && parsed.tables) return parsed;
    }
  } catch {
    // Private mode or corrupt data: start from the sample data again.
  }
  return { seededFor: monthKey(), tables: createSeed(), displayName: "Mari" };
}

const store = load();

function save() {
  try {
    localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(store));
  } catch {
    // Storage full or unavailable: changes still work until the page is closed.
  }
}

function newId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `id-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

type Operation =
  | { kind: "select" }
  | { kind: "insert"; rows: Row[] }
  | { kind: "update"; values: Row }
  | { kind: "delete" };

class Query implements PromiseLike<{ data: Row[] | null; error: null }> {
  private operation: Operation = { kind: "select" };
  private filters: ((row: Row) => boolean)[] = [];
  private sort: { column: string; ascending: boolean } | null = null;

  constructor(private table: string) {}

  select() {
    return this;
  }
  order(column: string, options?: { ascending?: boolean }) {
    this.sort = { column, ascending: options?.ascending ?? true };
    return this;
  }
  eq(column: string, value: unknown) {
    this.filters.push((row) => row[column] === value);
    return this;
  }
  in(column: string, values: unknown[]) {
    this.filters.push((row) => values.includes(row[column]));
    return this;
  }
  insert(rows: Row | Row[]) {
    this.operation = { kind: "insert", rows: Array.isArray(rows) ? rows : [rows] };
    return this;
  }
  // Only push_subscriptions upserts; the demo never registers for push, so it's a no-op.
  upsert() {
    return this;
  }
  update(values: Row) {
    this.operation = { kind: "update", values };
    return this;
  }
  delete() {
    this.operation = { kind: "delete" };
    return this;
  }

  private run() {
    const rows = (store.tables[this.table] ??= []);
    const matches = (row: Row) => this.filters.every((f) => f(row));

    switch (this.operation.kind) {
      case "insert": {
        const now = new Date().toISOString();
        for (const r of this.operation.rows) {
          const { user_id: _owner, ...rest } = r;
          rows.push({ id: newId(), created_at: now, ...rest });
        }
        save();
        return { data: null, error: null };
      }
      case "update": {
        for (const row of rows) if (matches(row)) Object.assign(row, this.operation.values);
        save();
        return { data: null, error: null };
      }
      case "delete": {
        store.tables[this.table] = rows.filter((row) => !matches(row));
        save();
        return { data: null, error: null };
      }
      default: {
        let result = rows.filter(matches).map((row) => ({ ...row }));
        if (this.sort) {
          const { column, ascending } = this.sort;
          result = result.sort((a, b) => {
            const x = String(a[column] ?? "");
            const y = String(b[column] ?? "");
            return (x < y ? -1 : x > y ? 1 : 0) * (ascending ? 1 : -1);
          });
        }
        return { data: result, error: null };
      }
    }
  }

  then<A = { data: Row[] | null; error: null }, B = never>(
    onFulfilled?: ((value: { data: Row[] | null; error: null }) => A | PromiseLike<A>) | null,
    onRejected?: ((reason: unknown) => B | PromiseLike<B>) | null
  ): PromiseLike<A | B> {
    return Promise.resolve().then(() => this.run()).then(onFulfilled, onRejected);
  }
}

function demoUser() {
  return { id: "demo-user", email: "mari@example.com", user_metadata: { display_name: store.displayName } };
}

type Listener = (event: string, session: { user: ReturnType<typeof demoUser> } | null) => void;
const listeners = new Set<Listener>();
let signedIn = true;

export const supabase = {
  from: (table: string) => new Query(table),
  auth: {
    getSession: async () => ({ data: { session: signedIn ? { user: demoUser() } : null } }),
    onAuthStateChange: (listener: Listener) => {
      listeners.add(listener);
      return { data: { subscription: { unsubscribe: () => listeners.delete(listener) } } };
    },
    signInWithPassword: async () => {
      signedIn = true;
      const session = { user: demoUser() };
      listeners.forEach((l) => l("SIGNED_IN", session));
      return { data: { session, user: session.user }, error: null };
    },
    signUp: async () => ({ data: { session: { user: demoUser() }, user: demoUser() }, error: null }),
    signOut: async () => {
      signedIn = false;
      listeners.forEach((l) => l("SIGNED_OUT", null));
      return { error: null };
    },
    updateUser: async ({ data }: { data: { display_name?: string } }) => {
      if (data.display_name) store.displayName = data.display_name;
      save();
      return { data: { user: demoUser() }, error: null };
    },
  },
  functions: {
    invoke: async () => ({ data: null, error: new Error("Bank connection isn't available in the demo.") }),
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- duck-typed stand-in for SupabaseClient
} as any;
