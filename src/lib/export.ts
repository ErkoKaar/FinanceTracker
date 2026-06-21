// Personal backup: downloads every row the user owns (RLS-scoped, so plain select() is enough)
// as one JSON file. Not a sync/restore feature — just a safety net independent of Supabase backups.
import { supabase } from "./supabase";

export async function exportAllData() {
  const tables = [
    "expenses",
    "incomes",
    "categories",
    "income_categories",
    "recurring_expenses",
    "recurring_incomes",
    "budgets",
  ] as const;

  const results = await Promise.all(
    tables.map(async (table) => {
      const { data, error } = await supabase.from(table).select("*");
      if (error) throw error;
      return [table, data] as const;
    })
  );

  const payload = {
    exportedAt: new Date().toISOString(),
    ...Object.fromEntries(results),
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `financetracker-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
