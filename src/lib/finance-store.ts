import { useSyncExternalStore } from "react";

export type Expense = {
  id: string;
  amount: number;
  description: string;
  category: string;
  date: string; // ISO
};

export type FinanceState = {
  user: string | null;
  income: number;
  categories: string[];
  expenses: Expense[];
};

const KEY = "finance-state-v1";
const DEFAULT_CATEGORIES = ["Toit", "Transport", "Eluase", "Meelelahutus", "Tervis", "Muu"];

function load(): FinanceState {
  if (typeof window === "undefined") {
    return { user: null, income: 0, categories: DEFAULT_CATEGORIES, expenses: [] };
  }
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { user: null, income: 1500, categories: DEFAULT_CATEGORIES, expenses: [] };
}

let state: FinanceState = load();
const listeners = new Set<() => void>();

function emit() {
  if (typeof window !== "undefined") {
    localStorage.setItem(KEY, JSON.stringify(state));
  }
  listeners.forEach((l) => l());
}

export const store = {
  get: () => state,
  subscribe(l: () => void) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
  login(name: string) {
    state = { ...state, user: name };
    emit();
  },
  logout() {
    state = { ...state, user: null };
    emit();
  },
  setIncome(income: number) {
    state = { ...state, income };
    emit();
  },
  addCategory(c: string) {
    if (!c.trim() || state.categories.includes(c.trim())) return;
    state = { ...state, categories: [...state.categories, c.trim()] };
    emit();
  },
  addExpense(e: Omit<Expense, "id">) {
    const id = Math.random().toString(36).slice(2);
    state = { ...state, expenses: [{ id, ...e }, ...state.expenses] };
    emit();
  },
  deleteExpense(id: string) {
    state = { ...state, expenses: state.expenses.filter((x) => x.id !== id) };
    emit();
  },
};

const serverSnap: FinanceState = { user: null, income: 0, categories: DEFAULT_CATEGORIES, expenses: [] };
export function useFinance() {
  return useSyncExternalStore(store.subscribe, store.get, () => serverSnap);
}
