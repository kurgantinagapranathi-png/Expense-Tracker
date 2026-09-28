import React, { useMemo, useState } from 'react';
import {
  PieChart as PieIcon,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Layers,
  ArrowUpRight,
  ArrowDownLeft,
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency } from '../utils/formatters';
import { CHART_PALETTE, getChartThemeColors } from '../utils/chartConfig';
import { CATEGORY_COLORS } from '../utils/constants';
import { Doughnut, Bar, Line } from 'react-chartjs-2';

export const AnalyticsView: React.FC = () => {
  const { transactions, currency, totalIncome, totalExpenses, totalBalance, isDarkMode } =
    useFinance();

  const [chartType, setChartType] = useState<'doughnut' | 'pie'>('doughnut');

  const themeColors = getChartThemeColors(isDarkMode);

  // 1. Expenses by Category
  const { categoryStats, categoryLabels, categoryValues, totalExpenseAmount } = useMemo(() => {
    const map: Record<string, { total: number; count: number }> = {};
    let expTotal = 0;

    for (const tx of transactions) {
      if (tx.type === 'expense') {
        expTotal += tx.amount;
        if (!map[tx.category]) {
          map[tx.category] = { total: 0, count: 0 };
        }
        map[tx.category].total += tx.amount;
        map[tx.category].count += 1;
      }
    }

    const sortedEntries = Object.entries(map).sort(([, a], [, b]) => b.total - a.total);
    const labels = sortedEntries.map(([cat]) => cat);
    const values = sortedEntries.map(([, data]) => data.total);

    return {
      categoryStats: sortedEntries,
      categoryLabels: labels,
      categoryValues: values,
      totalExpenseAmount: expTotal,
    };
  }, [transactions]);

  // 2. Monthly Trend Data (Group by Year-Month)
  const { monthlyLabels, monthlyIncomeData, monthlyExpenseData } = useMemo(() => {
    const map: Record<string, { income: number; expense: number }> = {};

    for (const tx of transactions) {
      const ym = tx.date.substring(0, 7); // 'YYYY-MM'
      if (!map[ym]) {
        map[ym] = { income: 0, expense: 0 };
      }
      if (tx.type === 'income') {
        map[ym].income += tx.amount;
      } else {
        map[ym].expense += tx.amount;
      }
    }

    // Sort chronologically
    const sortedKeys = Object.keys(map).sort();
    const formattedLabels = sortedKeys.map((ym) => {
      const [y, m] = ym.split('-');
      const d = new Date(parseInt(y), parseInt(m) - 1, 1);
      return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    });

    const incomeArr = sortedKeys.map((k) => map[k].income);
    const expenseArr = sortedKeys.map((k) => map[k].expense);

    return {
      monthlyLabels: formattedLabels,
      monthlyIncomeData: incomeArr,
      monthlyExpenseData: expenseArr,
    };
  }, [transactions]);

  // Chart 1: Doughnut / Pie Chart
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

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: chartType === 'doughnut' ? '68%' : '0%',
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: themeColors.text,
          boxWidth: 10,
          boxHeight: 10,
          padding: 12,
          font: {
            size: 11,
          },
        },
      },
      tooltip: {
        backgroundColor: themeColors.tooltipBg,
        titleColor: themeColors.tooltipText,
        bodyColor: themeColors.tooltipText,
        boxPadding: 4,
        callbacks: {
          label: (context: any) => {
            const val = context.parsed;
            const pct =
              totalExpenseAmount > 0 ? ((val / totalExpenseAmount) * 100).toFixed(1) : '0';
            return ` ${context.label}: ${formatCurrency(val, currency)} (${pct}%)`;
          },
        },
      },
    },
  };

  // Chart 2: Income vs Expenses Bar Chart
  const barData = {
    labels: monthlyLabels.length > 0 ? monthlyLabels : ['Total Flow'],
    datasets: [
      {
        label: 'Income',
        data: monthlyLabels.length > 0 ? monthlyIncomeData : [totalIncome],
        backgroundColor: '#10b981', // Emerald
        borderRadius: 4,
      },
      {
        label: 'Expenses',
        data: monthlyLabels.length > 0 ? monthlyExpenseData : [totalExpenses],
        backgroundColor: '#f43f5e', // Rose
        borderRadius: 4,
      },
    ],
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        align: 'end' as const,
        labels: {
          color: themeColors.text,
          boxWidth: 10,
          boxHeight: 10,
          font: { size: 11 },
        },
      },
      tooltip: {
        backgroundColor: themeColors.tooltipBg,
        titleColor: themeColors.tooltipText,
        bodyColor: themeColors.tooltipText,
        callbacks: {
          label: (context: any) => {
            return ` ${context.dataset.label}: ${formatCurrency(context.parsed.y, currency)}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: themeColors.text,
          font: { size: 11 },
        },
      },
      y: {
        grid: {
          color: themeColors.grid,
        },
        ticks: {
          color: themeColors.text,
          font: { size: 11 },
          callback: (value: any) => {
            if (value >= 1000) return `${value / 1000}k`;
            return value;
          },
        },
      },
    },
  };

  // Chart 3: Monthly Spending Trend (Line Chart)
  const lineData = {
    labels: monthlyLabels.length > 0 ? monthlyLabels : ['Current Period'],
    datasets: [
      {
        label: 'Monthly Spending',
        data: monthlyLabels.length > 0 ? monthlyExpenseData : [totalExpenses],
        borderColor: '#0284c7',
        backgroundColor: 'rgba(2, 132, 199, 0.12)',
        fill: true,
        tension: 0.35,
        pointBackgroundColor: '#0284c7',
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: themeColors.tooltipBg,
        titleColor: themeColors.tooltipText,
        bodyColor: themeColors.tooltipText,
        callbacks: {
          label: (context: any) => {
            return ` Spending: ${formatCurrency(context.parsed.y, currency)}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: themeColors.text,
          font: { size: 11 },
        },
      },
      y: {
        grid: {
          color: themeColors.grid,
        },
        ticks: {
          color: themeColors.text,
          font: { size: 11 },
          callback: (value: any) => {
            if (value >= 1000) return `${value / 1000}k`;
            return value;
          },
        },
      },
    },
  };

  const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
          Financial Analytics
        </h1>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
          Detailed visual breakdown of category allocations, cash flow balance, and monthly trends
        </p>
      </div>

      {/* Top 3 Quick Financial Health KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 text-xs">
            <span>Savings Rate</span>
            <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span
              className={`text-2xl font-bold font-mono tabular-nums ${
                savingsRate >= 20 ? 'text-emerald-600 dark:text-emerald-400' : 'text-neutral-900 dark:text-neutral-100'
              }`}
            >
              {savingsRate.toFixed(1)}%
            </span>
            <span className="text-[11px] text-neutral-400">of earned income</span>
          </div>
          <p className="text-[11px] text-neutral-400 mt-1">
            {savingsRate >= 20 ? 'Healthy accumulation threshold' : 'Keep watchful eye on discretionary spend'}
          </p>
        </div>

        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 text-xs">
            <span>Net Cashflow Margin</span>
            <Layers className="w-4 h-4 text-sky-600 dark:text-sky-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-neutral-900 dark:text-neutral-100">
              {formatCurrency(totalBalance, currency)}
            </span>
          </div>
          <p className="text-[11px] text-neutral-400 mt-1">
            {totalBalance >= 0 ? 'Positive liquidity reserve' : 'Deficit across recorded entries'}
          </p>
        </div>

        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 text-xs">
            <span>Total Categories Active</span>
            <PieIcon className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-neutral-900 dark:text-neutral-100">
              {categoryLabels.length}
            </span>
            <span className="text-[11px] text-neutral-400">tracked expense streams</span>
          </div>
          <p className="text-[11px] text-neutral-400 mt-1">
            Highest spend in:{' '}
            <strong className="text-neutral-700 dark:text-neutral-300">
              {categoryLabels[0] || 'None'}
            </strong>
          </p>
        </div>
      </div>

      {/* Row 1: Charts (Category Doughnut & Income vs Expenses Bar) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown Chart */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 shadow-xs flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
            <div>
              <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                Expenses by Category
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                Relative distribution of outgoing expenses
              </p>
            </div>
            {/* Toggle doughnut / pie style */}
            <div className="flex items-center gap-1 p-1 bg-neutral-100 dark:bg-neutral-800 rounded-lg text-xs">
              <button
                onClick={() => setChartType('doughnut')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  chartType === 'doughnut'
                    ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-xs font-medium'
                    : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200'
                }`}
              >
                Doughnut
              </button>
              <button
                onClick={() => setChartType('pie')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  chartType === 'pie'
                    ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-xs font-medium'
                    : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200'
                }`}
              >
                Pie
              </button>
            </div>
          </div>

          <div className="mt-4 flex-1 min-h-[300px] flex items-center justify-center">
            {categoryLabels.length === 0 ? (
              <div className="text-center text-neutral-400 text-xs py-12">
                No expense entries available to plot chart.
              </div>
            ) : (
              <div className="w-full h-[300px]">
                <Doughnut data={doughnutData} options={doughnutOptions} />
              </div>
            )}
          </div>
        </div>

        {/* Income vs Expenses Chart */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 shadow-xs flex flex-col">
          <div className="pb-3 border-b border-neutral-100 dark:border-neutral-800">
            <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              Income vs. Expenses Comparison
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              Side-by-side analysis of incoming cash versus outgoing spend
            </p>
          </div>

          <div className="mt-4 flex-1 min-h-[300px]">
            {transactions.length === 0 ? (
              <div className="h-full flex items-center justify-center text-center text-neutral-400 text-xs">
                No transactions recorded yet.
              </div>
            ) : (
              <div className="w-full h-[300px]">
                <Bar data={barData} options={barOptions} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Row 2: Monthly Spending Trend Chart */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 shadow-xs">
        <div className="pb-3 border-b border-neutral-100 dark:border-neutral-800">
          <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
            Monthly Spending Trend
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Historical outflow progression over recording periods
          </p>
        </div>

        <div className="mt-4 h-[260px]">
          {monthlyLabels.length === 0 ? (
            <div className="h-full flex items-center justify-center text-center text-neutral-400 text-xs">
              No timeline data available yet.
            </div>
          ) : (
            <Line data={lineData} options={lineOptions} />
          )}
        </div>
      </div>

      {/* Row 3: Category Detailed Allocation Table */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden shadow-xs">
        <div className="p-5 border-b border-neutral-100 dark:border-neutral-800">
          <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
            Category Spending Distribution
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Itemized breakdown of expenses with wallet share and average transaction value
          </p>
        </div>

        {categoryStats.length === 0 ? (
          <div className="p-8 text-center text-neutral-400 text-xs">
            No expenses recorded. Add an expense to see detailed distribution.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-950/60 text-neutral-500 dark:text-neutral-400">
                  <th className="py-3 px-4 font-medium">Category</th>
                  <th className="py-3 px-4 font-medium text-center">Transactions</th>
                  <th className="py-3 px-4 font-medium text-right">Total Spent</th>
                  <th className="py-3 px-4 font-medium text-right">Avg / Tx</th>
                  <th className="py-3 px-4 font-medium text-right">Share of Outflow</th>
                  <th className="py-3 px-4 font-medium w-36">Visual Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {categoryStats.map(([cat, data], idx) => {
                  const catColor = CATEGORY_COLORS[cat] || CATEGORY_COLORS['Other'];
                  const pct = totalExpenseAmount > 0 ? (data.total / totalExpenseAmount) * 100 : 0;
                  const avg = data.count > 0 ? data.total / data.count : 0;

                  return (
                    <tr
                      key={cat}
                      className="hover:bg-neutral-50/60 dark:hover:bg-neutral-800/30 transition-colors"
                    >
                      <td className="py-3 px-4 font-medium text-neutral-900 dark:text-neutral-100 whitespace-nowrap">
                        <span className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{
                              backgroundColor: CHART_PALETTE[idx % CHART_PALETTE.length],
                            }}
                          />
                          {cat}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center font-mono tabular-nums text-neutral-600 dark:text-neutral-400">
                        {data.count}
                      </td>

                      <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-neutral-900 dark:text-neutral-100">
                        {formatCurrency(data.total, currency)}
                      </td>

                      <td className="py-3 px-4 text-right font-mono tabular-nums text-neutral-600 dark:text-neutral-400">
                        {formatCurrency(avg, currency)}
                      </td>

                      <td className="py-3 px-4 text-right font-mono tabular-nums text-neutral-600 dark:text-neutral-400">
                        {pct.toFixed(1)}%
                      </td>

                      <td className="py-3 px-4">
                        <div className="w-full h-2 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${Math.min(100, pct)}%`,
                              backgroundColor: CHART_PALETTE[idx % CHART_PALETTE.length],
                            }}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
