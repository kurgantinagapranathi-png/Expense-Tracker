import React, { useMemo, useState } from 'react';
import {
  Target,
  AlertCircle,
  CheckCircle2,
  TrendingDown,
  Calendar,
  Sparkles,
  Save,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency } from '../utils/formatters';
import { CATEGORY_COLORS } from '../utils/constants';

export const BudgetView: React.FC = () => {
  const {
    monthlyBudget,
    setMonthlyBudget,
    thisMonthSpending,
    remainingBudget,
    budgetProgressPercent,
    isOverBudget,
    isApproachingBudget,
    currency,
    currencySymbol,
    transactions,
  } = useFinance();

  const [inputBudget, setInputBudget] = useState(monthlyBudget.toString());
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState('');

  // Days left in current month calculation
  const { daysInMonth, daysRemaining, currentDay, monthName } = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const lastDay = new Date(year, month + 1, 0).getDate();
    const today = now.getDate();
    const remaining = Math.max(1, lastDay - today + 1);
    const mName = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    return {
      daysInMonth: lastDay,
      daysRemaining: remaining,
      currentDay: today,
      monthName: mName,
    };
  }, []);

  // Safe daily allowance
  const dailyAllowance = remainingBudget > 0 ? remainingBudget / daysRemaining : 0;

  // Breakdown of this month's spending by category
  const thisMonthCategorySpending = useMemo(() => {
    const now = new Date();
    const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const map: Record<string, number> = {};

    for (const tx of transactions) {
      if (tx.type === 'expense' && tx.date.startsWith(ym)) {
        map[tx.category] = (map[tx.category] || 0) + tx.amount;
      }
    }

    return Object.entries(map).sort(([, a], [, b]) => b - a);
  }, [transactions]);

  const handleSaveBudget = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(inputBudget);
    if (isNaN(val) || val <= 0) {
      setError('Please enter a valid positive budget amount');
      return;
    }
    setError('');
    setMonthlyBudget(val);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handlePreset = (delta: number) => {
    const current = parseFloat(inputBudget) || monthlyBudget || 0;
    const nextVal = Math.max(1000, current + delta);
    setInputBudget(nextVal.toString());
    setMonthlyBudget(nextVal);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
          Monthly Budget Planner
        </h1>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
          Set spending limits, prevent overspending, and track daily spending velocity for {monthName}
        </p>
      </div>

      {/* Warning Banners */}
      {isOverBudget && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-xs font-semibold text-rose-900 dark:text-rose-200">
              Critical Warning: Budget Limit Exceeded
            </h3>
            <p className="text-xs text-rose-700 dark:text-rose-300 mt-1 leading-relaxed">
              You have spent{' '}
              <strong className="font-mono tabular-nums">{formatCurrency(thisMonthSpending, currency)}</strong>,
              exceeding your target limit of{' '}
              <strong className="font-mono tabular-nums">{formatCurrency(monthlyBudget, currency)}</strong> by{' '}
              <strong className="font-mono tabular-nums">
                {formatCurrency(Math.abs(remainingBudget), currency)}
              </strong>
              . Restrict further non-essential outflows for the remaining {daysRemaining} days of {monthName}.
            </p>
          </div>
        </div>
      )}

      {isApproachingBudget && (
        <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-xs font-semibold text-amber-900 dark:text-amber-200">
              Caution: Approaching Budget Limit ({budgetProgressPercent.toFixed(1)}%)
            </h3>
            <p className="text-xs text-amber-700 dark:text-amber-300 mt-1 leading-relaxed">
              You have utilized over 80% of your allocated monthly spending threshold. You have{' '}
              <strong className="font-mono tabular-nums">{formatCurrency(remainingBudget, currency)}</strong>{' '}
              left for the remaining {daysRemaining} days.
            </p>
          </div>
        </div>
      )}

      {/* Main Budget Dashboard Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Progress Meter & Stats (2 columns) */}
        <div className="lg:col-span-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-neutral-100 dark:border-neutral-800">
              <div>
                <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                  {monthName} Budget Velocity
                </span>
                <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 mt-0.5">
                  Spending vs. Target Threshold
                </h2>
              </div>
              <span
                className={`text-xs px-2.5 py-1 rounded-md font-medium ${
                  isOverBudget
                    ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400'
                    : isApproachingBudget
                    ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400'
                    : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400'
                }`}
              >
                {isOverBudget ? 'Over Budget' : isApproachingBudget ? 'Approaching Limit' : 'Within Budget'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
              <div className="p-4 bg-neutral-50 dark:bg-neutral-950/60 rounded-xl border border-neutral-200/80 dark:border-neutral-800/80">
                <span className="text-xs text-neutral-500 dark:text-neutral-400">Monthly Budget</span>
                <p className="text-xl font-bold font-mono tabular-nums text-neutral-900 dark:text-neutral-100 mt-1">
                  {formatCurrency(monthlyBudget, currency)}
                </p>
                <span className="text-[11px] text-neutral-400 block mt-0.5">Planned ceiling</span>
              </div>

              <div className="p-4 bg-neutral-50 dark:bg-neutral-950/60 rounded-xl border border-neutral-200/80 dark:border-neutral-800/80">
                <span className="text-xs text-neutral-500 dark:text-neutral-400">Amount Spent</span>
                <p className="text-xl font-bold font-mono tabular-nums text-rose-600 dark:text-rose-400 mt-1">
                  {formatCurrency(thisMonthSpending, currency)}
                </p>
                <span className="text-[11px] text-neutral-400 block mt-0.5">
                  {budgetProgressPercent.toFixed(1)}% of total
                </span>
              </div>

              <div className="p-4 bg-neutral-50 dark:bg-neutral-950/60 rounded-xl border border-neutral-200/80 dark:border-neutral-800/80">
                <span className="text-xs text-neutral-500 dark:text-neutral-400">Remaining</span>
                <p
                  className={`text-xl font-bold font-mono tabular-nums mt-1 ${
                    remainingBudget >= 0
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {formatCurrency(remainingBudget, currency)}
                </p>
                <span className="text-[11px] text-neutral-400 block mt-0.5">
                  {remainingBudget >= 0 ? 'Surplus balance' : 'Overdraft deficit'}
                </span>
              </div>
            </div>
          </div>

          {/* Visual Progress Bar */}
          <div className="mt-8 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-neutral-700 dark:text-neutral-300">
                Progress: {budgetProgressPercent.toFixed(1)}%
              </span>
              <span className="font-mono text-neutral-500 dark:text-neutral-400 tabular-nums">
                {formatCurrency(thisMonthSpending, currency)} / {formatCurrency(monthlyBudget, currency)}
              </span>
            </div>

            <div className="w-full h-3.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden p-0.5">
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

            <div className="flex items-center justify-between text-[11px] text-neutral-400 pt-1">
              <span>Day {currentDay} of {daysInMonth}</span>
              <span>{daysRemaining} days remaining in month</span>
            </div>
          </div>

          {/* Daily Allowance Banner */}
          <div className="mt-6 p-4 bg-sky-50/60 dark:bg-sky-950/30 border border-sky-200/80 dark:border-sky-900/40 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-sky-100 dark:bg-sky-900/50 text-sky-700 dark:text-sky-300">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                  Recommended Daily Spend Allowance
                </p>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                  To stay within budget for the next {daysRemaining} days
                </p>
              </div>
            </div>
            <span className="text-base font-bold font-mono tabular-nums text-sky-700 dark:text-sky-300">
              {formatCurrency(dailyAllowance, currency)} / day
            </span>
          </div>
        </div>

        {/* Right: Budget Configuration Form */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 pb-4 border-b border-neutral-100 dark:border-neutral-800">
              <Target className="w-4 h-4 text-neutral-500" />
              <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                Set Monthly Budget
              </h2>
            </div>

            <form onSubmit={handleSaveBudget} className="mt-5 space-y-4">
              <div>
                <label
                  htmlFor="budget-amount-input"
                  className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1"
                >
                  Budget Limit ({currencySymbol})
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-sm text-neutral-400 font-mono">
                    {currencySymbol}
                  </span>
                  <input
                    id="budget-amount-input"
                    type="number"
                    min="1"
                    step="100"
                    value={inputBudget}
                    onChange={(e) => {
                      setInputBudget(e.target.value);
                      if (error) setError('');
                    }}
                    className="w-full pl-8 pr-3 py-2 text-sm font-mono tabular-nums bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-neutral-900 dark:focus:ring-neutral-200 transition-colors"
                  />
                </div>
                {error && <p className="text-xs text-rose-500 mt-1">{error}</p>}
              </div>

              {/* Quick Presets */}
              <div>
                <span className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1.5">
                  Quick Adjustments
                </span>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => handlePreset(1000)}
                    className="px-2 py-1.5 text-xs font-mono tabular-nums bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-md text-neutral-700 dark:text-neutral-300 transition-colors"
                  >
                    +1,000
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePreset(5000)}
                    className="px-2 py-1.5 text-xs font-mono tabular-nums bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-md text-neutral-700 dark:text-neutral-300 transition-colors"
                  >
                    +5,000
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePreset(10000)}
                    className="px-2 py-1.5 text-xs font-mono tabular-nums bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-md text-neutral-700 dark:text-neutral-300 transition-colors"
                  >
                    +10,000
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-neutral-900 dark:bg-neutral-100 dark:text-neutral-900 rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors flex items-center justify-center gap-1.5 shadow-xs"
              >
                <Save className="w-3.5 h-3.5" />
                Update Budget Limit
              </button>

              {saveSuccess && (
                <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-lg flex items-center gap-2 text-emerald-800 dark:text-emerald-300 text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Monthly budget updated successfully!</span>
                </div>
              )}
            </form>
          </div>

          <div className="mt-6 pt-4 border-t border-neutral-100 dark:border-neutral-800 text-[11px] text-neutral-400">
            Budget thresholds automatically persist to browser local storage and recalculate status indicators across all dashboard metrics.
          </div>
        </div>
      </div>

      {/* Category Spending This Month */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 shadow-xs">
        <div className="pb-4 border-b border-neutral-100 dark:border-neutral-800">
          <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
            This Month's Category Spending Breakdown
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Identify which categories are consuming the greatest portion of your {monthName} budget
          </p>
        </div>

        {thisMonthCategorySpending.length === 0 ? (
          <div className="py-8 text-center text-xs text-neutral-400">
            No expenses recorded for the current month yet.
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {thisMonthCategorySpending.map(([cat, amount]) => {
              const catColor = CATEGORY_COLORS[cat] || CATEGORY_COLORS['Other'];
              const pctOfBudget = monthlyBudget > 0 ? (amount / monthlyBudget) * 100 : 0;

              return (
                <div
                  key={cat}
                  className="p-4 rounded-xl border border-neutral-200/80 dark:border-neutral-800/80 bg-neutral-50/50 dark:bg-neutral-950/40"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 font-medium text-neutral-800 dark:text-neutral-200">
                      <span className={`w-2 h-2 rounded-full ${catColor.dot}`} />
                      {cat}
                    </span>
                    <span className="font-mono text-neutral-500 dark:text-neutral-400 tabular-nums">
                      {pctOfBudget.toFixed(1)}% of budget
                    </span>
                  </div>

                  <p className="text-base font-bold font-mono tabular-nums text-neutral-900 dark:text-neutral-100 mt-2">
                    {formatCurrency(amount, currency)}
                  </p>

                  <div className="w-full h-1.5 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden mt-3">
                    <div
                      className={`h-full rounded-full ${catColor.dot}`}
                      style={{ width: `${Math.min(100, pctOfBudget)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
