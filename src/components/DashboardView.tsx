import React, { useState } from 'react';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Calendar,
  Receipt,
  AlertCircle,
  CheckCircle2,
  Plus,
  ArrowRight,
  Trash2,
  PieChart as PieIcon,
  Sparkles,
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency, formatDate } from '../utils/formatters';
import { CATEGORY_COLORS } from '../utils/constants';
import { ViewTab } from '../types/finance';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import { Doughnut } from 'react-chartjs-2';
import { CHART_PALETTE, getChartThemeColors } from '../utils/chartConfig';

interface DashboardViewProps {
  onNavigate: (tab: ViewTab) => void;
  onOpenAddModal: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate, onOpenAddModal }) => {
  const {
    transactions,
    deleteTransaction,
    currency,
    currencySymbol,
    totalBalance,
    totalIncome,
    totalExpenses,
    thisMonthSpending,
    transactionCount,
    monthlyBudget,
    remainingBudget,
    budgetProgressPercent,
    isOverBudget,
    isApproachingBudget,
    isDarkMode,
  } = useFinance();

  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  // Recent 6 transactions
  const recentTransactions = transactions.slice(0, 6);

  // Group expenses by category for quick doughnut preview
  const expenseByCategory = React.useMemo(() => {
    const map: Record<string, number> = {};
    for (const tx of transactions) {
      if (tx.type === 'expense') {
        map[tx.category] = (map[tx.category] || 0) + tx.amount;
      }
    }
    return map;
  }, [transactions]);

  const categoryLabels = Object.keys(expenseByCategory);
  const categoryValues = Object.values(expenseByCategory);

  const doughnutData = {
    labels: categoryLabels,
    datasets: [
      {
        data: categoryValues,
        backgroundColor: CHART_PALETTE.slice(0, categoryLabels.length),
        borderColor: isDarkMode ? '#171717' : '#ffffff',
        borderWidth: 2,
      },
    ],
  };

  const chartTheme = getChartThemeColors(isDarkMode);

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '72%',
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: chartTheme.tooltipBg,
        titleColor: chartTheme.tooltipText,
        bodyColor: chartTheme.tooltipText,
        boxPadding: 4,
        callbacks: {
          label: (context: any) => {
            const val = context.parsed;
            const total = categoryValues.reduce((a, b) => a + b, 0);
            const pct = total > 0 ? ((val / total) * 100).toFixed(1) : '0';
            return ` ${context.label}: ${formatCurrency(val, currency)} (${pct}%)`;
          },
        },
      },
    },
  };

  const targetTx = transactions.find((t) => t.id === deleteTargetId);

  return (
    <div className="space-y-6">
      {/* Welcome & Primary Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            Financial Dashboard
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            Real-time balance, spending metrics, and cash flow tracking
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('analytics')}
            className="px-3 py-2 text-xs font-medium text-neutral-700 dark:text-neutral-300 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/60 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <PieIcon className="w-3.5 h-3.5" />
            Analytics
          </button>
          <button
            onClick={onOpenAddModal}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-neutral-900 dark:bg-neutral-100 dark:text-neutral-900 rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Transaction
          </button>
        </div>
      </div>

      {/* Budget Warning Alert (if approaching or exceeded) */}
      {isOverBudget && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-xs font-semibold text-rose-900 dark:text-rose-200">
              Monthly Budget Exceeded
            </h3>
            <p className="text-xs text-rose-700 dark:text-rose-300 mt-0.5">
              You have spent{' '}
              <span className="font-mono font-bold tabular-nums">
                {formatCurrency(thisMonthSpending, currency)}
              </span>
              , which is{' '}
              <span className="font-mono font-bold tabular-nums">
                {formatCurrency(Math.abs(remainingBudget), currency)}
              </span>{' '}
              above your set monthly budget limit of{' '}
              <span className="font-mono tabular-nums">
                {formatCurrency(monthlyBudget, currency)}
              </span>
              .
            </p>
          </div>
          <button
            onClick={() => onNavigate('budget')}
            className="px-3 py-1.5 text-xs font-medium text-rose-700 dark:text-rose-300 bg-rose-100 dark:bg-rose-900/60 hover:bg-rose-200 dark:hover:bg-rose-900 rounded-lg transition-colors whitespace-nowrap"
          >
            Adjust Budget
          </button>
        </div>
      )}

      {isApproachingBudget && (
        <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-xs font-semibold text-amber-900 dark:text-amber-200">
              Approaching Monthly Budget Limit
            </h3>
            <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
              You have utilized{' '}
              <span className="font-mono font-bold tabular-nums">
                {budgetProgressPercent.toFixed(1)}%
              </span>{' '}
              of your {formatCurrency(monthlyBudget, currency)} budget. Only{' '}
              <span className="font-mono font-bold tabular-nums">
                {formatCurrency(remainingBudget, currency)}
              </span>{' '}
              remaining this month.
            </p>
          </div>
          <button
            onClick={() => onNavigate('budget')}
            className="px-3 py-1.5 text-xs font-medium text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/60 hover:bg-amber-200 dark:hover:bg-amber-900 rounded-lg transition-colors whitespace-nowrap"
          >
            Review Budget
          </button>
        </div>
      )}

      {/* 5 Main Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Balance */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400">
            <span className="text-xs font-medium">Total Balance</span>
            <Wallet className="w-4 h-4 text-neutral-400" />
          </div>
          <div className="mt-3">
            <span
              className={`text-2xl font-bold font-mono tabular-nums tracking-tight ${
                totalBalance >= 0
                  ? 'text-neutral-900 dark:text-neutral-100'
                  : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {formatCurrency(totalBalance, currency)}
            </span>
          </div>
          <p className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-1">
            Net net liquidity available
          </p>
        </div>

        {/* Total Income */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400">
            <span className="text-xs font-medium">Total Income</span>
            <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold font-mono tabular-nums tracking-tight text-emerald-600 dark:text-emerald-400">
              {formatCurrency(totalIncome, currency)}
            </span>
          </div>
          <p className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-1">
            Cumulative credits recorded
          </p>
        </div>

        {/* Total Expenses */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400">
            <span className="text-xs font-medium">Total Expenses</span>
            <TrendingDown className="w-4 h-4 text-rose-600 dark:text-rose-400" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold font-mono tabular-nums tracking-tight text-neutral-900 dark:text-neutral-100">
              {formatCurrency(totalExpenses, currency)}
            </span>
          </div>
          <p className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-1">
            Cumulative debits recorded
          </p>
        </div>

        {/* This Month's Spending */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400">
            <span className="text-xs font-medium">This Month's Spending</span>
            <Calendar className="w-4 h-4 text-neutral-400" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold font-mono tabular-nums tracking-tight text-neutral-900 dark:text-neutral-100">
              {formatCurrency(thisMonthSpending, currency)}
            </span>
          </div>
          <p className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-1">
            Current calendar month debits
          </p>
        </div>

        {/* Number of Transactions */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400">
            <span className="text-xs font-medium">Transactions</span>
            <Receipt className="w-4 h-4 text-neutral-400" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold font-mono tabular-nums tracking-tight text-neutral-900 dark:text-neutral-100">
              {transactionCount}
            </span>
          </div>
          <p className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-1">
            Recorded ledger items
          </p>
        </div>
      </div>

      {/* Middle Row: Monthly Budget Card & Category Spend Snapshot */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Budget Card */}
        <div className="lg:col-span-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                  Monthly Budget Status
                </h2>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  Target spending threshold for the current month
                </p>
              </div>
              <button
                onClick={() => onNavigate('budget')}
                className="text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 flex items-center gap-1 transition-colors"
              >
                Manage
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-5 pt-4 border-t border-neutral-100 dark:border-neutral-800">
              <div>
                <span className="text-xs text-neutral-500 dark:text-neutral-400">Monthly Budget</span>
                <p className="text-lg font-bold font-mono tabular-nums text-neutral-900 dark:text-neutral-100 mt-0.5">
                  {formatCurrency(monthlyBudget, currency)}
                </p>
              </div>
              <div>
                <span className="text-xs text-neutral-500 dark:text-neutral-400">Amount Spent</span>
                <p className="text-lg font-bold font-mono tabular-nums text-rose-600 dark:text-rose-400 mt-0.5">
                  {formatCurrency(thisMonthSpending, currency)}
                </p>
              </div>
              <div>
                <span className="text-xs text-neutral-500 dark:text-neutral-400">Remaining</span>
                <p
                  className={`text-lg font-bold font-mono tabular-nums mt-0.5 ${
                    remainingBudget >= 0
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {formatCurrency(remainingBudget, currency)}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-neutral-500 dark:text-neutral-400">Budget Utilization</span>
              <span className="font-mono font-semibold tabular-nums text-neutral-900 dark:text-neutral-100">
                {budgetProgressPercent.toFixed(1)}%
              </span>
            </div>
            {/* Progress Bar */}
            <div className="w-full h-2.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isOverBudget
                    ? 'bg-rose-500'
                    : isApproachingBudget
                    ? 'bg-amber-500'
                    : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(100, budgetProgressPercent)}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-neutral-400">
              <span>0%</span>
              <span>Threshold: {formatCurrency(monthlyBudget, currency)}</span>
            </div>
          </div>
        </div>

        {/* Spending by Category Quick Doughnut Preview */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 shadow-xs flex flex-col">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              Expenses by Category
            </h2>
            <button
              onClick={() => onNavigate('analytics')}
              className="text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 flex items-center gap-1 transition-colors"
            >
              Details
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {categoryLabels.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-neutral-400">
              <PieIcon className="w-8 h-8 stroke-1 mb-2 opacity-60" />
              <p className="text-xs">No expense transactions recorded yet.</p>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center mt-3">
              <div className="h-40 w-40 relative flex items-center justify-center">
                <Doughnut data={doughnutData} options={doughnutOptions} />
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                  <span className="text-[10px] uppercase text-neutral-400 font-medium">Total Out</span>
                  <span className="text-sm font-bold font-mono tabular-nums text-neutral-900 dark:text-neutral-100">
                    {formatCurrency(totalExpenses, currency)}
                  </span>
                </div>
              </div>

              {/* Top 3 categories list */}
              <div className="w-full mt-4 space-y-1.5">
                {Object.entries(expenseByCategory)
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 3)
                  .map(([cat, val], idx) => {
                    const pct = totalExpenses > 0 ? ((val / totalExpenses) * 100).toFixed(0) : '0';
                    return (
                      <div
                        key={cat}
                        className="flex items-center justify-between text-xs text-neutral-600 dark:text-neutral-400"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: CHART_PALETTE[idx % CHART_PALETTE.length] }}
                          />
                          <span>{cat}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono tabular-nums text-neutral-900 dark:text-neutral-200 font-medium">
                            {formatCurrency(val, currency)}
                          </span>
                          <span className="text-[11px] text-neutral-400 font-mono">({pct}%)</span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recent Transactions Section */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 shadow-xs">
        <div className="flex items-center justify-between pb-4 border-b border-neutral-100 dark:border-neutral-800">
          <div>
            <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              Recent Transactions
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              Latest activity recorded across your accounts
            </p>
          </div>
          <button
            onClick={() => onNavigate('transactions')}
            className="text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 flex items-center gap-1 transition-colors"
          >
            View All ({transactionCount})
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentTransactions.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-400 mb-3">
              <Receipt className="w-6 h-6 stroke-1" />
            </div>
            <h3 className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
              No transactions recorded
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-sm mt-1">
              Add your first transaction to track incoming credits and daily expenses.
            </p>
            <button
              onClick={onOpenAddModal}
              className="mt-4 px-4 py-2 text-xs font-semibold text-white bg-neutral-900 dark:bg-neutral-100 dark:text-neutral-900 rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              Add First Transaction
            </button>
          </div>
        ) : (
          <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {recentTransactions.map((tx) => {
              const catColor = CATEGORY_COLORS[tx.category] || CATEGORY_COLORS['Other'];
              const isIncome = tx.type === 'income';

              return (
                <div
                  key={tx.id}
                  className="py-3.5 flex items-center justify-between gap-4 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30 transition-colors rounded-lg px-2"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        isIncome
                          ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400'
                          : 'bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400'
                      }`}
                    >
                      {isIncome ? (
                        <TrendingUp className="w-4 h-4" />
                      ) : (
                        <TrendingDown className="w-4 h-4" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <p className="text-xs font-medium text-neutral-900 dark:text-neutral-100 truncate">
                        {tx.name}
                      </p>
                      {/* Zero-Pill discipline: unboxed metadata with dot separators */}
                      <div className="flex items-center gap-2 text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                        <span className="flex items-center gap-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full ${catColor.dot}`} />
                          {tx.category}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{formatDate(tx.date)}</span>
                        {tx.description && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="truncate max-w-[120px] sm:max-w-[200px]">
                              {tx.description}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span
                      className={`font-mono text-sm font-semibold tabular-nums ${
                        isIncome
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-neutral-900 dark:text-neutral-100'
                      }`}
                    >
                      {isIncome ? '+' : '-'}
                      {formatCurrency(tx.amount, currency)}
                    </span>

                    <button
                      onClick={() => setDeleteTargetId(tx.id)}
                      className="p-1.5 text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md transition-colors"
                      title="Delete transaction"
                      aria-label={`Delete ${tx.name}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete confirmation modal */}
      <DeleteConfirmModal
        isOpen={deleteTargetId !== null}
        title="Delete Transaction"
        message={
          targetTx
            ? `Are you sure you want to delete "${targetTx.name}" (${formatCurrency(
                targetTx.amount,
                currency
              )})? This action cannot be undone.`
            : 'Are you sure you want to delete this transaction?'
        }
        confirmLabel="Delete Transaction"
        onConfirm={() => {
          if (deleteTargetId) {
            deleteTransaction(deleteTargetId);
            setDeleteTargetId(null);
          }
        }}
        onCancel={() => setDeleteTargetId(null)}
      />
    </div>
  );
};
