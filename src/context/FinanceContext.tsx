import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Transaction } from '../types/finance';
import { CURRENCIES, INITIAL_DEMO_TRANSACTIONS } from '../utils/constants';

interface FinanceContextType {
  transactions: Transaction[];
  addTransaction: (data: Omit<Transaction, 'id' | 'createdAt'>) => void;
  deleteTransaction: (id: string) => void;
  clearAllTransactions: () => void;
  loadDemoData: () => void;
  currency: string;
  setCurrency: (code: string) => void;
  currencySymbol: string;
  monthlyBudget: number;
  setMonthlyBudget: (amount: number) => void;
  theme: 'light' | 'dark' | 'system';
  setTheme: (t: 'light' | 'dark' | 'system') => void;
  isDarkMode: boolean;
  // Computed analytics
  totalIncome: number;
  totalExpenses: number;
  totalBalance: number;
  thisMonthSpending: number;
  thisMonthIncome: number;
  transactionCount: number;
  remainingBudget: number;
  budgetProgressPercent: number;
  isOverBudget: boolean;
  isApproachingBudget: boolean;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

const STORAGE_KEYS = {
  TRANSACTIONS: 'financeflow_transactions_v1',
  CURRENCY: 'financeflow_currency_v1',
  BUDGET: 'financeflow_budget_v1',
  THEME: 'financeflow_theme_v1',
};

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Transactions state initialized from localStorage or default demo
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // ignore JSON parse error
    }
    return INITIAL_DEMO_TRANSACTIONS;
  });

  // 2. Currency (defaults to INR as requested)
  const [currency, setCurrencyState] = useState<string>(() => {
    try {
      return localStorage.getItem(STORAGE_KEYS.CURRENCY) || 'INR';
    } catch {
      return 'INR';
    }
  });

  // 3. Monthly Budget (defaults to 20000 as requested in demo example)
  const [monthlyBudget, setMonthlyBudgetState] = useState<number>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.BUDGET);
      if (stored) {
        const val = Number(stored);
        if (!isNaN(val) && val >= 0) return val;
      }
    } catch {
      // fallback
    }
    return 20000;
  });

  // 4. Theme
  const [theme, setThemeState] = useState<'light' | 'dark' | 'system'>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.THEME) as 'light' | 'dark' | 'system';
      if (stored === 'light' || stored === 'dark' || stored === 'system') {
        return stored;
      }
    } catch {
      // fallback
    }
    return 'system';
  });

  // Determine actual dark state
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    if (theme === 'dark') return true;
    if (theme === 'light') return false;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const updateActualTheme = () => {
      const dark = theme === 'dark' || (theme === 'system' && mediaQuery.matches);
      setIsDarkMode(dark);
      if (dark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    };

    updateActualTheme();
    try {
      localStorage.setItem(STORAGE_KEYS.THEME, theme);
    } catch {
      // ignore
    }

    const listener = () => {
      if (theme === 'system') {
        updateActualTheme();
      }
    };

    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  }, [theme]);

  // Persist transactions
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
    } catch {
      // ignore
    }
  }, [transactions]);

  // Persist currency
  const setCurrency = (code: string) => {
    setCurrencyState(code);
    try {
      localStorage.setItem(STORAGE_KEYS.CURRENCY, code);
    } catch {
      // ignore
    }
  };

  // Persist budget
  const setMonthlyBudget = (amount: number) => {
    const valid = Math.max(0, amount);
    setMonthlyBudgetState(valid);
    try {
      localStorage.setItem(STORAGE_KEYS.BUDGET, valid.toString());
    } catch {
      // ignore
    }
  };

  const setTheme = (t: 'light' | 'dark' | 'system') => {
    setThemeState(t);
  };

  // Actions
  const addTransaction = (data: Omit<Transaction, 'id' | 'createdAt'>) => {
    const newTx: Transaction = {
      ...data,
      id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      createdAt: Date.now(),
    };
    setTransactions((prev) => [newTx, ...prev]);
  };

  const deleteTransaction = (id: string) => {
    setTransactions((prev) => prev.filter((tx) => tx.id !== id));
  };

  const clearAllTransactions = () => {
    setTransactions([]);
  };

  const loadDemoData = () => {
    setTransactions(INITIAL_DEMO_TRANSACTIONS);
  };

  // Active currency symbol
  const currencySymbol = useMemo(() => {
    const cur = CURRENCIES.find((c) => c.code === currency);
    return cur ? cur.symbol : '₹';
  }, [currency]);

  // Current year & month for "this month" computations
  const currentYearMonth = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  }, []);

  // Computed metrics
  const {
    totalIncome,
    totalExpenses,
    totalBalance,
    thisMonthSpending,
    thisMonthIncome,
  } = useMemo(() => {
    let income = 0;
    let expense = 0;
    let curMonthExp = 0;
    let curMonthInc = 0;

    for (const tx of transactions) {
      if (tx.type === 'income') {
        income += tx.amount;
        if (tx.date.startsWith(currentYearMonth)) {
          curMonthInc += tx.amount;
        }
      } else {
        expense += tx.amount;
        if (tx.date.startsWith(currentYearMonth)) {
          curMonthExp += tx.amount;
        }
      }
    }

    return {
      totalIncome: income,
      totalExpenses: expense,
      totalBalance: income - expense,
      thisMonthSpending: curMonthExp,
      thisMonthIncome: curMonthInc,
    };
  }, [transactions, currentYearMonth]);

  const transactionCount = transactions.length;
  const remainingBudget = monthlyBudget - thisMonthSpending;
  const budgetProgressPercent = monthlyBudget > 0 ? (thisMonthSpending / monthlyBudget) * 100 : 0;
  const isOverBudget = monthlyBudget > 0 && thisMonthSpending > monthlyBudget;
  const isApproachingBudget = monthlyBudget > 0 && !isOverBudget && budgetProgressPercent >= 80;

  return (
    <FinanceContext.Provider
      value={{
        transactions,
        addTransaction,
        deleteTransaction,
        clearAllTransactions,
        loadDemoData,
        currency,
        setCurrency,
        currencySymbol,
        monthlyBudget,
        setMonthlyBudget,
        theme,
        setTheme,
        isDarkMode,
        totalIncome,
        totalExpenses,
        totalBalance,
        thisMonthSpending,
        thisMonthIncome,
        transactionCount,
        remainingBudget,
        budgetProgressPercent,
        isOverBudget,
        isApproachingBudget,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
};
