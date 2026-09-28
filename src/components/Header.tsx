import React from 'react';
import { Menu, Plus, Sun, Moon, Globe } from 'lucide-react';
import { ViewTab } from '../types/finance';
import { useFinance } from '../context/FinanceContext';
import { CURRENCIES } from '../utils/constants';

interface HeaderProps {
  currentTab: ViewTab;
  onOpenMobileMenu: () => void;
  onOpenAddModal: () => void;
}

const TAB_TITLES: Record<ViewTab, string> = {
  dashboard: 'Dashboard',
  transactions: 'Transaction History',
  add: 'New Transaction',
  analytics: 'Visual Analytics',
  budget: 'Monthly Budget',
  settings: 'Settings & Data',
};

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onOpenMobileMenu,
  onOpenAddModal,
}) => {
  const { currency, setCurrency, isDarkMode, setTheme } = useFinance();

  return (
    <header className="sticky top-0 z-20 bg-white/90 dark:bg-neutral-950/90 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-800 px-4 sm:px-8 py-3.5 flex items-center justify-between">
      {/* Zone 1 & 2: Mobile toggle & Breadcrumb Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="md:hidden p-1.5 -ml-1 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
          <span className="hidden sm:inline font-medium">FinanceFlow</span>
          <span className="hidden sm:inline" aria-hidden="true">/</span>
          <span className="text-neutral-900 dark:text-neutral-100 font-semibold text-sm sm:text-xs">
            {TAB_TITLES[currentTab]}
          </span>
        </div>
      </div>

      {/* Zone 3: Actions (Currency selector, Dark mode toggle, Primary Add button) */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Quick Currency Selector */}
        <div className="relative flex items-center">
          <label htmlFor="currency-header-select" className="sr-only">
            Select Currency
          </label>
          <select
            id="currency-header-select"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="pl-2 pr-6 py-1.5 text-xs font-mono tabular-nums font-semibold bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-800 dark:text-neutral-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-neutral-900 dark:focus:ring-neutral-100 cursor-pointer appearance-none transition-colors"
          >
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.symbol} {c.code}
              </option>
            ))}
          </select>
          <span className="pointer-events-none absolute right-2 text-[10px] text-neutral-400">
            ▼
          </span>
        </div>

        {/* Theme Toggle */}
        <button
          onClick={() => setTheme(isDarkMode ? 'light' : 'dark')}
          className="p-1.5 text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
          title={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
          aria-label="Toggle dark mode"
        >
          {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Add Transaction Button */}
        <button
          onClick={onOpenAddModal}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-neutral-900 dark:bg-neutral-100 dark:text-neutral-900 rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors shadow-xs whitespace-nowrap"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Entry</span>
        </button>
      </div>
    </header>
  );
};
