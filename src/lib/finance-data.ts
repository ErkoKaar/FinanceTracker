import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "./supabase";

export type Expense = {
  id: string;
  amount: number;
  description: string;
  category: string;
  date: string; // ISO
};

export function useIncome(userId: string | undefined) {
  return useQuery({
    queryKey: ["income", userId],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("income").single();
      if (error) throw error;
      return data.income as number;
    },
    enabled: !!userId,
  });
}

export function useUpdateIncome(userId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (income: number) => {
      const { error } = await supabase.from("profiles").update({ income }).eq("user_id", userId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["income", userId] }),
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
        .select("id, amount, description, category, date")
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
    mutationFn: async (expense: Omit<Expense, "id">) => {
      const { error } = await supabase.from("expenses").insert({ user_id: userId, ...expense });
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
