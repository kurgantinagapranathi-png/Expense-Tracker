import React from 'react';
import {
  LayoutDashboard,
  Receipt,
  PlusCircle,
  PieChart,
  Target,
  Settings,
  Wallet,
  Moon,
  Sun,
  X,
  CreditCard,
  Sparkles,
} from 'lucide-react';
import { ViewTab } from '../types/finance';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency } from '../utils/formatters';

interface SidebarProps {
  currentTab: ViewTab;
  onNavigate: (tab: ViewTab) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

interface NavItem {
  id: ViewTab;
  label: string;
  icon: React.ElementType;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'transactions', label: 'Transactions', icon: Receipt },
  { id: 'add', label: 'Add Transaction', icon: PlusCircle },
  { id: 'analytics', label: 'Analytics', icon: PieChart },
  { id: 'budget', label: 'Budget', icon: Target },
  { id: 'chat', label: 'n8n AI Chat', icon: Sparkles },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onNavigate,
  isOpenMobile,
  onCloseMobile,
}) => {
  const { totalBalance, currency, isDarkMode, setTheme } = useFinance();

  const handleNavClick = (tab: ViewTab) => {
    onNavigate(tab);
    onCloseMobile();
  };

  const navContent = (
    <div className="flex flex-col h-full justify-between p-4">
      {/* Brand & Main Navigation */}
      <div className="space-y-6">
        {/* Brand Lockup - Zone 1: Single text element wordmark */}
        <div className="flex items-center justify-between px-2 pt-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-neutral-900 dark:bg-neutral-100 flex items-center justify-center text-white dark:text-neutral-900 shadow-xs">
              <Wallet className="w-4 h-4" />
            </div>
            <span className="font-bold text-base tracking-tight text-neutral-900 dark:text-neutral-100">
              FinanceFlow
            </span>
          </div>
          {/* Mobile close button */}
          <button
            onClick={onCloseMobile}
            className="md:hidden p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-lg"
            aria-label="Close navigation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Balance Preview Card */}
        <div className="mx-1 p-3 bg-neutral-100/70 dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 rounded-xl">
          <span className="text-[11px] text-neutral-500 dark:text-neutral-400 font-medium">
            Available Balance
          </span>
          <p className="text-base font-bold font-mono tabular-nums text-neutral-900 dark:text-neutral-100 mt-0.5 truncate">
            {formatCurrency(totalBalance, currency)}
          </p>
        </div>

        {/* Navigation Links */}
        <nav className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap text-left ${
                  isActive
                    ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 font-semibold shadow-xs'
                    : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800/80 hover:text-neutral-900 dark:hover:text-neutral-100'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? '' : 'text-neutral-400'}`} />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer / Theme toggle & App info */}
      <div className="pt-4 border-t border-neutral-200/70 dark:border-neutral-800/80 space-y-3 px-2">
        <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
          <span>Appearance</span>
          <button
            onClick={() => setTheme(isDarkMode ? 'light' : 'dark')}
            className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 transition-colors"
            title={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
            aria-label="Toggle dark mode"
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>

        <div className="text-[11px] text-neutral-400 dark:text-neutral-500">
          FinanceFlow v1.0 · Local-First
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (Permanent, 240px wide) */}
      <aside className="hidden md:flex flex-col w-60 shrink-0 h-screen sticky top-0 bg-white dark:bg-neutral-950 border-r border-neutral-200 dark:border-neutral-800 z-30">
        {navContent}
      </aside>

      {/* Mobile Drawer Backdrop & Panel */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs md:hidden"
          onClick={onCloseMobile}
        >
          <div
            className="w-64 h-full bg-white dark:bg-neutral-950 shadow-2xl animate-in slide-in-from-left duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {navContent}
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation Bar (Persistent quick access on small screens) */}
      <nav
        aria-label="Mobile Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-neutral-950/95 backdrop-blur-md border-t border-neutral-200 dark:border-neutral-800 px-2 py-1.5 flex items-center justify-around"
      >
        <button
          onClick={() => handleNavClick('dashboard')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg text-[10px] font-medium transition-colors ${
            currentTab === 'dashboard'
              ? 'text-neutral-900 dark:text-neutral-100 font-semibold'
              : 'text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300'
          }`}
        >
          <LayoutDashboard className="w-4 h-4 mb-0.5" />
          <span>Dashboard</span>
        </button>

        <button
          onClick={() => handleNavClick('transactions')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg text-[10px] font-medium transition-colors ${
            currentTab === 'transactions'
              ? 'text-neutral-900 dark:text-neutral-100 font-semibold'
              : 'text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300'
          }`}
        >
          <Receipt className="w-4 h-4 mb-0.5" />
          <span>History</span>
        </button>

        {/* Center Prominent Add Button */}
        <button
          onClick={() => handleNavClick('add')}
          className="flex flex-col items-center justify-center -mt-4 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 w-11 h-11 rounded-full shadow-lg transition-transform active:scale-95"
          aria-label="Add transaction"
        >
          <PlusCircle className="w-6 h-6" />
        </button>

        <button
          onClick={() => handleNavClick('analytics')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg text-[10px] font-medium transition-colors ${
            currentTab === 'analytics'
              ? 'text-neutral-900 dark:text-neutral-100 font-semibold'
              : 'text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300'
          }`}
        >
          <PieChart className="w-4 h-4 mb-0.5" />
          <span>Analytics</span>
        </button>

        <button
          onClick={() => handleNavClick('budget')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg text-[10px] font-medium transition-colors ${
            currentTab === 'budget'
              ? 'text-neutral-900 dark:text-neutral-100 font-semibold'
              : 'text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300'
          }`}
        >
          <Target className="w-4 h-4 mb-0.5" />
          <span>Budget</span>
        </button>
      </nav>
    </>
  );
};
