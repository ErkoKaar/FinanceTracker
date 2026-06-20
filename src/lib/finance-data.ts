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

export type RecurringExpense = {
  id: string;
  description: string;
  amount: number;
  category: string;
  active: boolean;
};

export type RecurringIncome = {
  id: string;
  description: string;
  amount: number;
  active: boolean;
};

export type Income = {
  year: number;
  month: number; // 1-12
  amount: number;
};

// Fetches every recorded month's income for the user; year totals are summed client-side
// (same pattern as useExpenses below) since a year's income is just the sum of its months.
export function useIncomes(userId: string | undefined) {
  return useQuery({
    queryKey: ["incomes", userId],
    queryFn: async () => {
      const { data, error } = await supabase.from("incomes").select("year, month, amount");
      if (error) throw error;
      return data as Income[];
    },
    enabled: !!userId,
  });
}

export function useUpdateIncome(userId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (income: Income) => {
      const { error } = await supabase
        .from("incomes")
        .upsert({ user_id: userId, ...income }, { onConflict: "user_id,year,month" });
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

export function useRecurringExpenses(userId: string | undefined) {
  return useQuery({
    queryKey: ["recurring_expenses", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("recurring_expenses")
        .select("id, description, amount, category, active")
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
    mutationFn: async (item: Omit<RecurringExpense, "id" | "active">) => {
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
        .select("id, description, amount, active")
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
    mutationFn: async (item: Omit<RecurringIncome, "id" | "active">) => {
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

// Side-effect-only hook: each calendar month, materializes active recurring expenses into real
// `expenses` rows (once each, tracked via recurring_expense_id) and fills that month's income
// from active recurring incomes if it hasn't been set yet. Call once from Dashboard.
export function useApplyRecurring(userId: string | undefined) {
  const { data: recurringExpenses = [], isLoading: recurringExpensesLoading } = useRecurringExpenses(userId);
  const { data: recurringIncomes = [], isLoading: recurringIncomesLoading } = useRecurringIncomes(userId);
  const { data: expensesAll = [], isLoading: expensesLoading } = useExpenses(userId);
  const { data: incomesAll = [], isLoading: incomesLoading } = useIncomes(userId);
  const addExpense = useAddExpense(userId);
  const updateIncome = useUpdateIncome(userId);
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
      const key = `expense-${r.id}-${year}-${month}`;
      if (appliedRef.current.has(key)) continue;
      const alreadyApplied = expensesAll.some((e) => {
        if (e.recurring_expense_id !== r.id) return false;
        const d = new Date(e.date);
        return d.getFullYear() === year && d.getMonth() + 1 === month;
      });
      appliedRef.current.add(key);
      if (!alreadyApplied) {
        addExpense.mutate({
          amount: r.amount,
          description: r.description,
          category: r.category,
          date: now.toISOString(),
          recurring_expense_id: r.id,
        });
      }
    }

    const incomeKey = `income-${year}-${month}`;
    const hasIncome = incomesAll.some((i) => i.year === year && i.month === month);
    if (!hasIncome && !appliedRef.current.has(incomeKey)) {
      const activeIncomes = recurringIncomes.filter((r) => r.active);
      if (activeIncomes.length > 0) {
        appliedRef.current.add(incomeKey);
        const amount = activeIncomes.reduce((a, r) => a + r.amount, 0);
        updateIncome.mutate({ year, month, amount });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [readyToApply, recurringExpenses, recurringIncomes, expensesAll, incomesAll]);
}
