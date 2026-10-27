// Sample data for the public demo build: about fifteen months of believable spending and income,
// a named plan and expected income for this month, recurring items, a wishlist and a bank balance.
// Everything is dated relative to today, so the demo always looks like it's being used right now.

type Row = Record<string, unknown>;
export type Tables = Record<string, Row[]>;

const CATEGORIES = ["Food", "Transport", "Home", "Fun", "Health", "Subscriptions"];
const INCOME_CATEGORIES = ["Salary", "Freelance", "Gifts"];

// [description, min €, max €] per category; amounts are picked inside the range.
const SPENDING: Record<string, [string, number, number][]> = {
  Food: [
    ["Rimi", 14, 68],
    ["Selver", 18, 74],
    ["Coffee and a pastry", 4, 8],
    ["Lunch at Kohvik Komeet", 9, 17],
  ],
  Transport: [
    ["Bolt", 4, 13],
    ["Fuel", 42, 68],
  ],
  Home: [
    ["IKEA", 19, 86],
    ["Electricity", 46, 71],
  ],
  Fun: [
    ["Apollo Kino", 9, 21],
    ["Concert tickets", 32, 58],
    ["Board game", 27, 44],
  ],
  Health: [
    ["Apotheka", 6, 24],
    ["Gym day pass", 9, 12],
  ],
  Subscriptions: [["Spotify", 11.99, 11.99]],
};

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
}

export function createSeed(now = new Date()): Tables {
  const rand = seededRandom(20261027);
  const Y = now.getFullYear();
  const M = now.getMonth();
  const today = now.getDate();
  let id = 0;
  const nextId = (prefix: string) => `${prefix}-${++id}`;
  const at = (monthsAgo: number, day: number, hour = 12) => new Date(Y, M - monthsAgo, day, hour, 20).toISOString();
  const ym = (monthsAhead: number) => {
    const d = new Date(Y, M + monthsAhead, 1);
    return { year: d.getFullYear(), month: d.getMonth() + 1 };
  };
  const created = at(15, 1);

  const expenses: Row[] = [];
  const incomes: Row[] = [];

  for (let m = 0; m < 15; m++) {
    const days = m === 0 ? today : new Date(Y, M - m + 1, 0).getDate();
    expenses.push({ id: nextId("e"), amount: 640, description: "Rent", category: "Home", date: at(m, 1, 9), recurring_expense_id: "rec-rent" });
    if (days >= 3)
      incomes.push({ id: nextId("i"), amount: 2650, description: "Salary", category: "Salary", date: at(m, 3, 10), recurring_income_id: "rec-salary" });
    if (m % 2 === 0 && days >= 18)
      incomes.push({ id: nextId("i"), amount: Math.round(220 + rand() * 480), description: "Website project", category: "Freelance", date: at(m, 18), recurring_income_id: null });
    if (days >= 7)
      expenses.push({ id: nextId("e"), amount: 11.99, description: "Spotify", category: "Subscriptions", date: at(m, 7, 8), recurring_expense_id: null });

    for (let day = 1; day <= days; day++) {
      const count = rand() < 0.3 ? 0 : rand() < 0.72 ? 1 : 2;
      for (let k = 0; k < count; k++) {
        const category = CATEGORIES[Math.floor(rand() * (CATEGORIES.length - 1))];
        const options = SPENDING[category];
        const [description, lo, hi] = options[Math.floor(rand() * options.length)];
        const amount = Math.round((lo + rand() * (hi - lo)) * 100) / 100;
        expenses.push({ id: nextId("e"), amount, description, category, date: at(m, day, 9 + k * 6), recurring_expense_id: null });
      }
    }
  }

  const thisMonth = ym(0);
  const nextMonth = ym(1);

  return {
    expenses,
    incomes,
    categories: CATEGORIES.map((name, i) => ({ name, created_at: new Date(Y - 2, 0, 1 + i).toISOString() })),
    income_categories: INCOME_CATEGORIES.map((name, i) => ({ name, created_at: new Date(Y - 2, 0, 1 + i).toISOString() })),
    budgets: [
      { id: nextId("b"), ...thisMonth, category: "Home", amount: 640, name: "Rent", url: null, created_at: created },
      { id: nextId("b"), ...thisMonth, category: "Home", amount: 120, name: "Electricity and internet", url: null, created_at: created },
      { id: nextId("b"), ...thisMonth, category: "Food", amount: 320, name: "Groceries", url: null, created_at: created },
      { id: nextId("b"), ...thisMonth, category: "Food", amount: 90, name: "Eating out", url: null, created_at: created },
      { id: nextId("b"), ...thisMonth, category: "Transport", amount: 140, name: "Fuel and Bolt", url: null, created_at: created },
      { id: nextId("b"), ...thisMonth, category: "Fun", amount: 110, name: "Cinema and concerts", url: null, created_at: created },
      { id: nextId("b"), ...thisMonth, category: "Health", amount: 45, name: "Gym", url: null, created_at: created },
      { id: nextId("b"), ...nextMonth, category: "Fun", amount: 220, name: "Christmas gifts", url: null, created_at: created },
    ],
    income_plans: [
      { id: nextId("p"), ...thisMonth, name: "Salary", amount: 2650, created_at: created },
      { id: nextId("p"), ...thisMonth, name: "Website project", amount: 300, created_at: created },
    ],
    recurring_expenses: [
      { id: "rec-rent", description: "Rent", amount: 640, category: "Home", active: true, day_of_month: 1, created_at: created },
      { id: "rec-gym", description: "Gym membership", amount: 39, category: "Health", active: false, day_of_month: 5, created_at: created },
    ],
    recurring_incomes: [
      { id: "rec-salary", description: "Salary", amount: 2650, category: "Salary", active: true, day_of_month: 3, created_at: created },
    ],
    wishlist_items: [
      { id: nextId("w"), name: "Running shoes", price: 129.9, url: null, bought_at: null, created_at: at(1, 4) },
      { id: nextId("w"), name: "Noise-cancelling headphones", price: 349, url: null, bought_at: null, created_at: at(1, 12) },
      { id: nextId("w"), name: "Weekend in Riga", price: 2200, url: null, bought_at: null, created_at: at(0, 2) },
      { id: nextId("w"), name: "Desk lamp", price: 59, url: null, bought_at: at(1, 20), created_at: at(2, 1) },
    ],
    bank_connections: [
      {
        id: "bank-1",
        account_name: "Everyday account",
        valid_until: new Date(Y, M + 4, 1).toISOString(),
        last_synced_at: now.toISOString(),
        balance: 3184.27,
        created_at: created,
      },
    ],
    push_subscriptions: [],
  };
}
