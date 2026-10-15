// Mock data for the personal finance dashboard.
// In a real app this would come from the database via Prisma.

export type TxnType = "income" | "expense" | "transfer";

export interface Transaction {
  id: string;
  date: string; // ISO yyyy-mm-dd
  merchant: string;
  category: string;
  categoryIcon: string; // emoji
  account: string;
  type: TxnType;
  amount: number; // positive for income, negative for expense
  notes?: string;
  status: "completed" | "pending" | "failed";
  tags?: string[];
}

export const categories = [
  { name: "Housing", icon: "🏠", color: "#0d9488" },
  { name: "Food & Dining", icon: "🍽️", color: "#f59e0b" },
  { name: "Transport", icon: "🚗", color: "#3b82f6" },
  { name: "Entertainment", icon: "🎬", color: "#ec4899" },
  { name: "Shopping", icon: "🛍️", color: "#8b5cf6" },
  { name: "Health", icon: "❤️", color: "#ef4444" },
  { name: "Income", icon: "💰", color: "#16a34a" },
  { name: "Other", icon: "📦", color: "#6b7280" },
];

const merchants = [
  { name: "Whole Foods Market", category: "Food & Dining", icon: "🍽️" },
  { name: "Shell Gas Station", category: "Transport", icon: "🚗" },
  { name: "Netflix", category: "Entertainment", icon: "🎬" },
  { name: "Apartment Rent", category: "Housing", icon: "🏠" },
  { name: "Amazon", category: "Shopping", icon: "🛍️" },
  { name: "CVS Pharmacy", category: "Health", icon: "❤️" },
  { name: "Starbucks", category: "Food & Dining", icon: "🍽️" },
  { name: "Spotify", category: "Entertainment", icon: "🎬" },
  { name: "Costco", category: "Food & Dining", icon: "🍽️" },
  { name: "Uber", category: "Transport", icon: "🚗" },
  { name: "Target", category: "Shopping", icon: "🛍️" },
  { name: "Electric Bill", category: "Housing", icon: "🏠" },
  { name: "Apple Store", category: "Shopping", icon: "🛍️" },
  { name: "Chipotle", category: "Food & Dining", icon: "🍽️" },
  { name: "Movie Theater", category: "Entertainment", icon: "🎬" },
  { name: "Salary Deposit", category: "Income", icon: "💰" },
  { name: "Freelance Project", category: "Income", icon: "💰" },
  { name: "Gym Membership", category: "Health", icon: "❤️" },
  { name: "Internet Bill", category: "Housing", icon: "🏠" },
  { name: "Pet Supplies", category: "Other", icon: "📦" },
];

const accounts = ["Chase Checking •4521", "Chase Savings •8830", "Amex Credit •1009"];

function pick<T>(arr: T[], i: number): T {
  return arr[i % arr.length];
}

function rand(seed: number, max: number): number {
  const x = Math.sin(seed) * 10000;
  return Math.floor((x - Math.floor(x)) * max);
}

// Deterministic generator so the data is stable between SSR and client.
function buildTransactions(): Transaction[] {
  const txns: Transaction[] = [];
  const today = new Date("2026-10-15");
  // 60 transactions across last 90 days
  for (let i = 0; i < 60; i++) {
    const offsetDays = rand(i + 1, 90);
    const d = new Date(today);
    d.setDate(d.getDate() - offsetDays);
    const merchant = pick(merchants, i);
    const isIncome = merchant.category === "Income";
    const isTransfer = i % 17 === 0;
    const baseAmount = isIncome
      ? 1500 + rand(i + 100, 4000)
      : 5 + rand(i + 200, 380);
    txns.push({
      id: `tx_${i.toString().padStart(3, "0")}`,
      date: d.toISOString().slice(0, 10),
      merchant: merchant.name,
      category: merchant.category,
      categoryIcon: merchant.icon,
      account: pick(accounts, i),
      type: isIncome ? "income" : isTransfer ? "transfer" : "expense",
      amount: isIncome ? baseAmount : -baseAmount,
      status: i % 11 === 0 ? "pending" : "completed",
      tags: i % 4 === 0 ? ["recurring"] : [],
      notes: i % 5 === 0 ? `Note for ${merchant.name}` : undefined,
    });
  }
  return txns.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}

export const transactions: Transaction[] = buildTransactions();

export const kpis = {
  totalBalance: 24580.32,
  totalBalanceDelta: 12.5,
  income: 8420,
  incomeDelta: 8.2,
  expenses: 3180,
  expensesDelta: -3.4,
  savingsRate: 62,
  savingsRateDelta: 4.1,
};

// Monthly balance trend
export const balanceTrend = [
  { month: "May", balance: 18200, income: 7200, expenses: 2950 },
  { month: "Jun", balance: 19450, income: 7800, expenses: 2550 },
  { month: "Jul", balance: 21380, income: 8100, expenses: 3220 },
  { month: "Aug", balance: 22100, income: 7900, expenses: 3050 },
  { month: "Sep", balance: 23850, income: 8300, expenses: 3400 },
  { month: "Oct", balance: 24580, income: 8420, expenses: 3180 },
];

// Spending by category (donut)
export const spendingByCategory = [
  { name: "Housing", value: 38, amount: 1208.4 },
  { name: "Food & Dining", value: 22, amount: 699.6 },
  { name: "Transport", value: 14, amount: 445.2 },
  { name: "Entertainment", value: 10, amount: 318.0 },
  { name: "Other", value: 16, amount: 508.8 },
];

export const accountsSummary = [
  {
    id: "acc1",
    name: "Chase Checking",
    mask: "•••• 4521",
    type: "checking",
    balance: 8420.55,
    currency: "USD",
  },
  {
    id: "acc2",
    name: "Chase Savings",
    mask: "•••• 8830",
    type: "savings",
    balance: 14520.77,
    currency: "USD",
  },
  {
    id: "acc3",
    name: "Amex Credit",
    mask: "•••• 1009",
    type: "credit",
    balance: -1639.0,
    currency: "USD",
  },
];

export function formatCurrency(n: number, currency = "USD"): string {
  const sign = n < 0 ? "-" : "";
  return `${sign}$${Math.abs(n).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatCompact(n: number): string {
  if (Math.abs(n) >= 1000) return `$${(n / 1000).toFixed(1)}k`;
  return `$${n.toFixed(0)}`;
}
