// TanStack Query hooks for reading/writing income, categories, and expenses via Supabase.
// RLS policies in supabase/schema.sql scope every row to the current user; queries don't filter manually.
import { useEffect, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "./supabase";

export type Expense = {
  id: string;
  amount: number;
  description: string;
  category: string;
  date: string; // ISO
  recurring_expense_id: string | null;
};

export type Budget = {
  id: string;
  year: number;
  month: number; // 1-12
  category: string;
  amount: number;
};

export type RecurringExpense = {
  id: string;
  description: string;
  amount: number;
  category: string;
  active: boolean;
  day_of_month: number | null; // 1-31; null = apply as soon as the new month is seen
};

export type RecurringIncome = {
  id: string;
  description: string;
  amount: number;
  category: string;
  active: boolean;
  day_of_month: number | null; // 1-31; null = apply as soon as the new month is seen
};

export type Income = {
  id: string;
  amount: number;
  description: string;
  category: string;
  date: string; // ISO
  recurring_income_id: string | null;
};

// Itemized income entries — mirrors Expense/useExpenses exactly. Month/year totals are summed
// client-side from these, same as expenses; there's no separate single editable "monthly income".
export function useIncomes(userId: string | undefined) {
  return useQuery({
    queryKey: ["incomes", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("incomes")
        .select("id, amount, description, category, date, recurring_income_id")
        .order("date", { ascending: false });
      if (error) throw error;
      return data as Income[];
    },
    enabled: !!userId,
  });
}

export function useAddIncome(userId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (income: Partial<Omit<Income, "id">> & Omit<Income, "id" | "recurring_income_id">) => {
      const { error } = await supabase.from("incomes").insert({ user_id: userId, ...income });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["incomes", userId] }),
  });
}

export function useUpdateIncome(userId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Pick<Income, "id"> & Partial<Omit<Income, "id">>) => {
      const { error } = await supabase.from("incomes").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["incomes", userId] }),
  });
}

export function useDeleteIncome(userId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("incomes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["incomes", userId] }),
  });
}

export function useCategories(userId: string | undefined) {
  return useQuery({
    queryKey: ["categories", userId],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("name").order("created_at");
      if (error) throw error;
      return data.map((c) => c.name) as string[];
    },
    enabled: !!userId,
  });
}

export function useAddCategory(userId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      const { error } = await supabase.from("categories").insert({ user_id: userId, name });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["categories", userId] }),
  });
}

// Separate category list for income (e.g. "Salary", "Freelance") — kept apart from expense
// categories since they don't belong in the same list.
export function useIncomeCategories(userId: string | undefined) {
  return useQuery({
    queryKey: ["income_categories", userId],
    queryFn: async () => {
      const { data, error } = await supabase.from("income_categories").select("name").order("created_at");
      if (error) throw error;
      return data.map((c) => c.name) as string[];
    },
    enabled: !!userId,
  });
}

export function useAddIncomeCategory(userId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      const { error } = await supabase.from("income_categories").insert({ user_id: userId, name });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["income_categories", userId] }),
  });
}

export function useExpenses(userId: string | undefined) {
  return useQuery({
    queryKey: ["expenses", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("expenses")
        .select("id, amount, description, category, date, recurring_expense_id")
        .order("date", { ascending: false });
      if (error) throw error;
      return data as Expense[];
    },
    enabled: !!userId,
  });
}

export function useAddExpense(userId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (expense: Partial<Omit<Expense, "id">> & Omit<Expense, "id" | "recurring_expense_id">) => {
      const { error } = await supabase.from("expenses").insert({ user_id: userId, ...expense });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["expenses", userId] }),
  });
}

export function useUpdateExpense(userId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Pick<Expense, "id"> & Partial<Omit<Expense, "id">>) => {
      const { error } = await supabase.from("expenses").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["expenses", userId] }),
  });
}

export function useDeleteExpense(userId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("expenses").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["expenses", userId] }),
  });
}

// How much the user plans to spend per category each month — powers the "Plan" tab and the
// Planned/Remaining columns on the Month view's expense breakdown. One row per category per month.
export function useBudgets(userId: string | undefined) {
  return useQuery({
    queryKey: ["budgets", userId],
    queryFn: async () => {
      const { data, error } = await supabase.from("budgets").select("id, year, month, category, amount");
      if (error) throw error;
      return data as Budget[];
    },
    enabled: !!userId,
  });
}

// Upsert: setting a budget for a category that already has one this month just updates it.
export function useSetBudget(userId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (budget: Omit<Budget, "id">) => {
      const { error } = await supabase
        .from("budgets")
        .upsert({ user_id: userId, ...budget }, { onConflict: "user_id,year,month,category" });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["budgets", userId] }),
  });
}

export function useDeleteBudget(userId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("budgets").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["budgets", userId] }),
  });
}

export function useRecurringExpenses(userId: string | undefined) {
  return useQuery({
    queryKey: ["recurring_expenses", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("recurring_expenses")
        .select("id, description, amount, category, active, day_of_month")
        .order("created_at");
      if (error) throw error;
      return data as RecurringExpense[];
    },
    enabled: !!userId,
  });
}

export function useAddRecurringExpense(userId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (
      item: Omit<RecurringExpense, "id" | "active" | "day_of_month"> & { day_of_month?: number | null }
    ) => {
      const { error } = await supabase.from("recurring_expenses").insert({ user_id: userId, ...item });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["recurring_expenses", userId] }),
  });
}

export function useUpdateRecurringExpense(userId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Pick<RecurringExpense, "id"> & Partial<Omit<RecurringExpense, "id">>) => {
      const { error } = await supabase.from("recurring_expenses").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["recurring_expenses", userId] }),
  });
}

export function useDeleteRecurringExpense(userId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("recurring_expenses").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["recurring_expenses", userId] }),
  });
}

export function useRecurringIncomes(userId: string | undefined) {
  return useQuery({
    queryKey: ["recurring_incomes", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("recurring_incomes")
        .select("id, description, amount, category, active, day_of_month")
        .order("created_at");
      if (error) throw error;
      return data as RecurringIncome[];
    },
    enabled: !!userId,
  });
}

export function useAddRecurringIncome(userId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (
      item: Omit<RecurringIncome, "id" | "active" | "day_of_month"> & { day_of_month?: number | null }
    ) => {
      const { error } = await supabase.from("recurring_incomes").insert({ user_id: userId, ...item });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["recurring_incomes", userId] }),
  });
}

export function useUpdateRecurringIncome(userId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Pick<RecurringIncome, "id"> & Partial<Omit<RecurringIncome, "id">>) => {
      const { error } = await supabase.from("recurring_incomes").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["recurring_incomes", userId] }),
  });
}

export function useDeleteRecurringIncome(userId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("recurring_incomes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["recurring_incomes", userId] }),
  });
}

// Side-effect-only hook: for the current calendar month, materializes active recurring expenses
// and incomes into real `expenses`/`incomes` rows (once each, tracked via recurring_*_id so
// revisiting the app never duplicates them). Call once from Dashboard.
export function useApplyRecurring(userId: string | undefined) {
  const { data: recurringExpenses = [], isLoading: recurringExpensesLoading } = useRecurringExpenses(userId);
  const { data: recurringIncomes = [], isLoading: recurringIncomesLoading } = useRecurringIncomes(userId);
  const { data: expensesAll = [], isLoading: expensesLoading } = useExpenses(userId);
  const { data: incomesAll = [], isLoading: incomesLoading } = useIncomes(userId);
  const addExpense = useAddExpense(userId);
  const addIncome = useAddIncome(userId);
  const appliedRef = useRef(new Set<string>());

  // Wait until all four queries have actually resolved at least once — otherwise this could see
  // the still-empty default arrays and wrongly conclude "not applied yet", inserting duplicates.
  const readyToApply =
    !!userId && !recurringExpensesLoading && !recurringIncomesLoading && !expensesLoading && !incomesLoading;

  useEffect(() => {
    if (!readyToApply) return;
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    for (const r of recurringExpenses) {
      if (!r.active) continue;
      // No day set = apply as soon as seen; otherwise wait until that day of the month arrives.
      if (r.day_of_month != null && now.getDate() < r.day_of_month) continue;
      const key = `expense-${r.id}-${year}-${month}`;
      if (appliedRef.current.has(key)) continue;
      const alreadyApplied = expensesAll.some((e) => {
        if (e.recurring_expense_id !== r.id) return false;
        const d = new Date(e.date);
        return d.getFullYear() === year && d.getMonth() + 1 === month;
      });
      appliedRef.current.add(key);
      if (!alreadyApplied) {
        const appliedDate = r.day_of_month ? new Date(year, month - 1, r.day_of_month) : now;
        addExpense.mutate({
          amount: r.amount,
          description: r.description,
          category: r.category,
          date: appliedDate.toISOString(),
          recurring_expense_id: r.id,
        });
      }
    }

    for (const r of recurringIncomes) {
      if (!r.active) continue;
      if (r.day_of_month != null && now.getDate() < r.day_of_month) continue;
      const key = `income-${r.id}-${year}-${month}`;
      if (appliedRef.current.has(key)) continue;
      const alreadyApplied = incomesAll.some((i) => {
        if (i.recurring_income_id !== r.id) return false;
        const d = new Date(i.date);
        return d.getFullYear() === year && d.getMonth() + 1 === month;
      });
      appliedRef.current.add(key);
      if (!alreadyApplied) {
        const appliedDate = r.day_of_month ? new Date(year, month - 1, r.day_of_month) : now;
        addIncome.mutate({
          amount: r.amount,
          description: r.description,
          category: r.category,
          date: appliedDate.toISOString(),
          recurring_income_id: r.id,
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [readyToApply, recurringExpenses, recurringIncomes, expensesAll, incomesAll]);
}

const CARRYOVER_DESCRIPTION = "Eelmise kuu ülejääk";

// Side-effect-only hook: the first time the app is opened in a new calendar month, adds an income
// row equal to the previous month's balance (income - expenses), labeled "Eelmise kuu ülejääk" -
// only when that balance is positive. Not tied to a recurring_income row (duplicate guard is the
// description + current month, same idea as the recurring_*_id check in useApplyRecurring). Call
// once from Dashboard, alongside useApplyRecurring.
export function useApplyPreviousMonthCarryover(userId: string | undefined) {
  const { data: expensesAll = [], isLoading: expensesLoading } = useExpenses(userId);
  const { data: incomesAll = [], isLoading: incomesLoading } = useIncomes(userId);
  const addIncome = useAddIncome(userId);
  const appliedRef = useRef(new Set<string>());

  const readyToApply = !!userId && !expensesLoading && !incomesLoading;

  useEffect(() => {
    if (!readyToApply) return;
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const key = `carryover-${year}-${month}`;
    if (appliedRef.current.has(key)) return;

    const prevDate = new Date(year, month - 2, 1);
    const prevYear = prevDate.getFullYear();
    const prevMonth = prevDate.getMonth() + 1;

    const inMonth = (dateStr: string, y: number, m: number) => {
      const d = new Date(dateStr);
      return d.getFullYear() === y && d.getMonth() + 1 === m;
    };
    const prevIncomeTotal = incomesAll
      .filter((i) => inMonth(i.date, prevYear, prevMonth))
      .reduce((sum, i) => sum + i.amount, 0);
    const prevExpenseTotal = expensesAll
      .filter((e) => inMonth(e.date, prevYear, prevMonth))
      .reduce((sum, e) => sum + e.amount, 0);
    const prevBalance = prevIncomeTotal - prevExpenseTotal;

    const alreadyApplied = incomesAll.some(
      (i) => i.description === CARRYOVER_DESCRIPTION && inMonth(i.date, year, month)
    );

    appliedRef.current.add(key);
    if (!alreadyApplied && prevBalance > 0) {
      addIncome.mutate({
        amount: prevBalance,
        description: CARRYOVER_DESCRIPTION,
        category: "Other",
        date: new Date(year, month - 1, 1).toISOString(),
        recurring_income_id: null,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [readyToApply, incomesAll, expensesAll]);
}

// Bank accounts connected via Enable Banking (rows are written by the bank-connect/bank-sync
// Edge Functions; the client only reads status and deletes on disconnect — see src/lib/bank.ts
// for starting/completing the connection flow).
export type BankConnection = {
  id: string;
  account_name: string;
  valid_until: string; // ISO — consent expiry; the user must re-authorize at the bank after this
  last_synced_at: string | null;
  balance: number | null; // real balance reported by the bank, refreshed on every sync
};

export function useBankConnections(userId: string | undefined) {
  return useQuery({
    queryKey: ["bank_connections", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bank_connections")
        .select("id, account_name, valid_until, last_synced_at, balance")
        .order("created_at");
      if (error) throw error;
      return data as BankConnection[];
    },
    enabled: !!userId,
  });
}

export function useDisconnectBank(userId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase.from("bank_connections").delete().in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["bank_connections", userId] }),
  });
}
