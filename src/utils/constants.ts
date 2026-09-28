import { Currency, ExpenseCategory, IncomeCategory, Transaction } from '../types/finance';

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'Food',
  'Shopping',
  'Transport',
  'Education',
  'Entertainment',
  'Bills',
  'Health',
  'Other',
];

export const INCOME_CATEGORIES: IncomeCategory[] = [
  'Salary',
  'Freelance',
  'Investments',
  'Gift',
  'Business',
  'Other',
];

export const CURRENCIES: Currency[] = [
  { code: 'INR', symbol: '₹', name: 'Indian Rupee', locale: 'en-IN' },
  { code: 'USD', symbol: '$', name: 'US Dollar', locale: 'en-US' },
  { code: 'EUR', symbol: '€', name: 'Euro', locale: 'de-DE' },
  { code: 'GBP', symbol: '£', name: 'British Pound', locale: 'en-GB' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen', locale: 'ja-JP' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', locale: 'en-CA' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', locale: 'en-AU' },
  { code: 'AED', symbol: 'AED', name: 'UAE Dirham', locale: 'ar-AE' },
];

export const CATEGORY_COLORS: Record<string, { bg: string; text: string; dot: string; border: string }> = {
  Food: { bg: 'bg-amber-500/10', text: 'text-amber-700 dark:text-amber-400', dot: 'bg-amber-500', border: 'border-amber-200 dark:border-amber-900/40' },
  Shopping: { bg: 'bg-pink-500/10', text: 'text-pink-700 dark:text-pink-400', dot: 'bg-pink-500', border: 'border-pink-200 dark:border-pink-900/40' },
  Transport: { bg: 'bg-sky-500/10', text: 'text-sky-700 dark:text-sky-400', dot: 'bg-sky-500', border: 'border-sky-200 dark:border-sky-900/40' },
  Education: { bg: 'bg-indigo-500/10', text: 'text-indigo-700 dark:text-indigo-400', dot: 'bg-indigo-500', border: 'border-indigo-200 dark:border-indigo-900/40' },
  Entertainment: { bg: 'bg-purple-500/10', text: 'text-purple-700 dark:text-purple-400', dot: 'bg-purple-500', border: 'border-purple-200 dark:border-purple-900/40' },
  Bills: { bg: 'bg-orange-500/10', text: 'text-orange-700 dark:text-orange-400', dot: 'bg-orange-500', border: 'border-orange-200 dark:border-orange-900/40' },
  Health: { bg: 'bg-emerald-500/10', text: 'text-emerald-700 dark:text-emerald-400', dot: 'bg-emerald-500', border: 'border-emerald-200 dark:border-emerald-900/40' },
  Other: { bg: 'bg-neutral-500/10', text: 'text-neutral-700 dark:text-neutral-400', dot: 'bg-neutral-500', border: 'border-neutral-200 dark:border-neutral-800' },
  Salary: { bg: 'bg-emerald-500/10', text: 'text-emerald-700 dark:text-emerald-400', dot: 'bg-emerald-500', border: 'border-emerald-200 dark:border-emerald-900/40' },
  Freelance: { bg: 'bg-teal-500/10', text: 'text-teal-700 dark:text-teal-400', dot: 'bg-teal-500', border: 'border-teal-200 dark:border-teal-900/40' },
  Investments: { bg: 'bg-cyan-500/10', text: 'text-cyan-700 dark:text-cyan-400', dot: 'bg-cyan-500', border: 'border-cyan-200 dark:border-cyan-900/40' },
  Gift: { bg: 'bg-rose-500/10', text: 'text-rose-700 dark:text-rose-400', dot: 'bg-rose-500', border: 'border-rose-200 dark:border-rose-900/40' },
  Business: { bg: 'bg-blue-500/10', text: 'text-blue-700 dark:text-blue-400', dot: 'bg-blue-500', border: 'border-blue-200 dark:border-blue-900/40' },
};

// Generates dates for current month and recent weeks
const getISODateOffset = (daysAgo: number): string => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
};

export const INITIAL_DEMO_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx-1',
    name: 'Primary Salary Credit',
    amount: 35000,
    type: 'income',
    category: 'Salary',
    date: getISODateOffset(2),
    description: 'Monthly compensation from employer',
    createdAt: Date.now() - 86400000 * 2,
  },
  {
    id: 'tx-2',
    name: 'Website Design Project',
    amount: 5000,
    type: 'income',
    category: 'Freelance',
    date: getISODateOffset(4),
    description: 'Final milestone payment',
    createdAt: Date.now() - 86400000 * 4,
  },
  {
    id: 'tx-3',
    name: 'Apartment Electricity Bill',
    amount: 2850,
    type: 'expense',
    category: 'Bills',
    date: getISODateOffset(1),
    description: 'Power grid utility bill',
    createdAt: Date.now() - 86400000 * 1,
  },
  {
    id: 'tx-4',
    name: 'Monthly Grocery Run',
    amount: 4200,
    type: 'expense',
    category: 'Food',
    date: getISODateOffset(3),
    description: 'Whole foods & weekly pantry essentials',
    createdAt: Date.now() - 86400000 * 3,
  },
  {
    id: 'tx-5',
    name: 'Metro Transit Card Recharge',
    amount: 1200,
    type: 'expense',
    category: 'Transport',
    date: getISODateOffset(5),
    description: 'Monthly commuter card',
    createdAt: Date.now() - 86400000 * 5,
  },
  {
    id: 'tx-6',
    name: 'Online Tech Book & Course',
    amount: 1800,
    type: 'expense',
    category: 'Education',
    date: getISODateOffset(6),
    description: 'Distributed systems certification prep',
    createdAt: Date.now() - 86400000 * 6,
  },
  {
    id: 'tx-7',
    name: 'Weekend Cinema & Dinner',
    amount: 2100,
    type: 'expense',
    category: 'Entertainment',
    date: getISODateOffset(8),
    description: 'IMAX tickets and dinner with friends',
    createdAt: Date.now() - 86400000 * 8,
  },
  {
    id: 'tx-8',
    name: 'Pharmacy & Health Vitamins',
    amount: 900,
    type: 'expense',
    category: 'Health',
    date: getISODateOffset(10),
    description: 'Multivitamins and prescription refill',
    createdAt: Date.now() - 86400000 * 10,
  },
  {
    id: 'tx-9',
    name: 'Footwear & Casual Clothes',
    amount: 1500,
    type: 'expense',
    category: 'Shopping',
    date: getISODateOffset(12),
    description: 'Running shoes on sale',
    createdAt: Date.now() - 86400000 * 12,
  },
];

// Sum check of demo data:
// Incomes: 35000 + 5000 = 40,000
// Expenses: 2850 + 4200 + 1200 + 1800 + 2100 + 900 + 1500 = 14,550
// Balance: 40000 - 14550 = 25,450
// Default Monthly Budget: 20,000
