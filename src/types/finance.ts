export type TransactionType = 'income' | 'expense';

export type ExpenseCategory =
  | 'Food'
  | 'Shopping'
  | 'Transport'
  | 'Education'
  | 'Entertainment'
  | 'Bills'
  | 'Health'
  | 'Other';

export type IncomeCategory =
  | 'Salary'
  | 'Freelance'
  | 'Investments'
  | 'Gift'
  | 'Business'
  | 'Other';

export interface Transaction {
  id: string;
  name: string;
  amount: number;
  type: TransactionType;
  category: string;
  date: string; // YYYY-MM-DD
  description?: string;
  createdAt: number;
}

export interface Currency {
  code: string;
  symbol: string;
  name: string;
  locale: string;
}

export interface BudgetConfig {
  monthlyLimit: number;
}

export type ViewTab = 'dashboard' | 'transactions' | 'add' | 'analytics' | 'budget' | 'chat' | 'settings';
