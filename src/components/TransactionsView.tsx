import React, { useMemo, useState } from 'react';
import {
  Search,
  Filter,
  Download,
  Trash2,
  Plus,
  ArrowUpDown,
  TrendingUp,
  TrendingDown,
  RotateCcw,
  X,
  FileSpreadsheet,
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency, formatDate, exportTransactionsToCSV } from '../utils/formatters';
import { CATEGORY_COLORS, EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../utils/constants';
import { DeleteConfirmModal } from './DeleteConfirmModal';

interface TransactionsViewProps {
  onOpenAddModal: () => void;
}

type SortField = 'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc';

export const TransactionsView: React.FC<TransactionsViewProps> = ({ onOpenAddModal }) => {
  const {
    transactions,
    deleteTransaction,
    clearAllTransactions,
    loadDemoData,
    currency,
    currencySymbol,
  } = useFinance();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | 'income' | 'expense'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortField>('date-desc');

  // Confirmation modal states
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [showClearAllModal, setShowClearAllModal] = useState(false);

  // Available unique months from all transactions
  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    for (const tx of transactions) {
      if (tx.date) {
        months.add(tx.date.substring(0, 7)); // 'YYYY-MM'
      }
    }
    return Array.from(months).sort().reverse();
  }, [transactions]);

  // Combined categories for filter dropdown
  const allCategories = useMemo(() => {
    const set = new Set([...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES]);
    return Array.from(set);
  }, []);

  // Filter and sort transactions
  const filteredTransactions = useMemo(() => {
    return transactions
      .filter((tx) => {
        // Search filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = tx.name.toLowerCase().includes(q);
          const matchDesc = tx.description ? tx.description.toLowerCase().includes(q) : false;
          const matchCategory = tx.category.toLowerCase().includes(q);
          if (!matchName && !matchDesc && !matchCategory) return false;
        }

        // Type filter
        if (selectedType !== 'all' && tx.type !== selectedType) {
          return false;
        }

        // Category filter
        if (selectedCategory !== 'all' && tx.category !== selectedCategory) {
          return false;
        }

        // Month filter
        if (selectedMonth !== 'all' && !tx.date.startsWith(selectedMonth)) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'date-desc':
            return b.date.localeCompare(a.date) || b.createdAt - a.createdAt;
          case 'date-asc':
            return a.date.localeCompare(b.date) || a.createdAt - b.createdAt;
          case 'amount-desc':
            return b.amount - a.amount;
          case 'amount-asc':
            return a.amount - b.amount;
          default:
            return 0;
        }
      });
  }, [transactions, searchQuery, selectedType, selectedCategory, selectedMonth, sortBy]);

  // Compute total filtered sums for quick context
  const { filteredIncome, filteredExpense, filteredCount } = useMemo(() => {
    let inc = 0;
    let exp = 0;
    for (const tx of filteredTransactions) {
      if (tx.type === 'income') inc += tx.amount;
      else exp += tx.amount;
    }
    return {
      filteredIncome: inc,
      filteredExpense: exp,
      filteredCount: filteredTransactions.length,
    };
  }, [filteredTransactions]);

  const targetTx = transactions.find((t) => t.id === deleteTargetId);

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedType('all');
    setSelectedCategory('all');
    setSelectedMonth('all');
    setSortBy('date-desc');
  };

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    selectedType !== 'all' ||
    selectedCategory !== 'all' ||
    selectedMonth !== 'all';

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            Transaction History
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            Search, filter, inspect, and export your itemized financial ledger
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {transactions.length > 0 && (
            <>
              <button
                onClick={() => exportTransactionsToCSV(filteredTransactions, currencySymbol)}
                className="px-3 py-2 text-xs font-medium text-neutral-700 dark:text-neutral-300 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/60 rounded-lg transition-colors flex items-center gap-1.5"
                title="Export filtered records to CSV"
              >
                <Download className="w-3.5 h-3.5" />
                Export CSV ({filteredCount})
              </button>

              <button
                onClick={() => setShowClearAllModal(true)}
                className="px-3 py-2 text-xs font-medium text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 rounded-lg transition-colors flex items-center gap-1.5"
                title="Clear all recorded transactions"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear All
              </button>
            </>
          )}

          <button
            onClick={onOpenAddModal}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-neutral-900 dark:bg-neutral-100 dark:text-neutral-900 rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Transaction
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search Input */}
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by transaction name, note, or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-xs bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-neutral-900 dark:focus:ring-neutral-200 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Type Filter */}
          <div>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as any)}
              className="w-full px-3 py-2 text-xs bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-neutral-900 dark:focus:ring-neutral-200 transition-colors"
            >
              <option value="all">All Types (Income & Expense)</option>
              <option value="expense">Expenses Only (Outgoing)</option>
              <option value="income">Income Only (Incoming)</option>
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-neutral-900 dark:focus:ring-neutral-200 transition-colors"
            >
              <option value="all">All Categories</option>
              {allCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Month Filter */}
          <div>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-neutral-900 dark:focus:ring-neutral-200 transition-colors"
            >
              <option value="all">All Dates</option>
              {availableMonths.map((m) => (
                <option key={m} value={m}>
                  {new Date(`${m}-01`).toLocaleDateString('en-US', {
                    month: 'short',
                    year: 'numeric',
                  })}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Sub-bar: Sorting & Quick Stats */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-3 border-t border-neutral-100 dark:border-neutral-800 text-xs">
          <div className="flex items-center gap-3">
            <span className="text-neutral-500 dark:text-neutral-400">Sort by:</span>
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                onClick={() => setSortBy('date-desc')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  sortBy === 'date-desc'
                    ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 font-medium'
                    : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                }`}
              >
                Newest First
              </button>
              <button
                onClick={() => setSortBy('date-asc')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  sortBy === 'date-asc'
                    ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 font-medium'
                    : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                }`}
              >
                Oldest First
              </button>
              <button
                onClick={() => setSortBy('amount-desc')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  sortBy === 'amount-desc'
                    ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 font-medium'
                    : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                }`}
              >
                Amount (High → Low)
              </button>
              <button
                onClick={() => setSortBy('amount-asc')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  sortBy === 'amount-asc'
                    ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 font-medium'
                    : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                }`}
              >
                Amount (Low → High)
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3 text-neutral-500 dark:text-neutral-400">
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="text-xs text-neutral-900 dark:text-neutral-100 font-medium underline flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                Reset Filters
              </button>
            )}
            <span>
              Showing <strong className="text-neutral-900 dark:text-neutral-100">{filteredCount}</strong> of{' '}
              {transactions.length}
            </span>
          </div>
        </div>
      </div>

      {/* Filtered Net Summary strip */}
      {filteredCount > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="p-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg">
            <span className="text-[11px] text-neutral-500 dark:text-neutral-400">Filtered Inflow</span>
            <p className="text-sm font-semibold font-mono tabular-nums text-emerald-600 dark:text-emerald-400 mt-0.5">
              +{formatCurrency(filteredIncome, currency)}
            </p>
          </div>
          <div className="p-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg">
            <span className="text-[11px] text-neutral-500 dark:text-neutral-400">Filtered Outflow</span>
            <p className="text-sm font-semibold font-mono tabular-nums text-neutral-900 dark:text-neutral-100 mt-0.5">
              -{formatCurrency(filteredExpense, currency)}
            </p>
          </div>
          <div className="col-span-2 sm:col-span-1 p-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg">
            <span className="text-[11px] text-neutral-500 dark:text-neutral-400">Filtered Net Difference</span>
            <p
              className={`text-sm font-semibold font-mono tabular-nums mt-0.5 ${
                filteredIncome - filteredExpense >= 0
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {formatCurrency(filteredIncome - filteredExpense, currency)}
            </p>
          </div>
        </div>
      )}

      {/* Transactions Table / List */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden shadow-xs">
        {filteredTransactions.length === 0 ? (
          <div className="py-16 px-4 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-400 mb-3">
              <Search className="w-5 h-5 stroke-1" />
            </div>
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              No matching transactions found
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-sm mt-1">
              {hasActiveFilters
                ? 'Try adjusting your search query, type, category, or date filters.'
                : 'Your transaction register is currently empty. Add a transaction or restore demo data.'}
            </p>
            <div className="mt-4 flex items-center gap-2">
              {hasActiveFilters ? (
                <button
                  onClick={resetFilters}
                  className="px-3.5 py-2 text-xs font-medium text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-lg transition-colors"
                >
                  Clear All Filters
                </button>
              ) : (
                <>
                  <button
                    onClick={onOpenAddModal}
                    className="px-3.5 py-2 text-xs font-semibold text-white bg-neutral-900 dark:bg-neutral-100 dark:text-neutral-900 rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Record First Entry
                  </button>
                  <button
                    onClick={loadDemoData}
                    className="px-3.5 py-2 text-xs font-medium text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-lg transition-colors"
                  >
                    Load Demo Data
                  </button>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-950/60 text-neutral-500 dark:text-neutral-400">
                  <th className="py-3 px-4 font-medium">Date</th>
                  <th className="py-3 px-4 font-medium">Transaction Name & Details</th>
                  <th className="py-3 px-4 font-medium">Category</th>
                  <th className="py-3 px-4 font-medium">Type</th>
                  <th className="py-3 px-4 font-medium text-right">Amount</th>
                  <th className="py-3 px-4 font-medium text-center w-16">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {filteredTransactions.map((tx) => {
                  const catColor = CATEGORY_COLORS[tx.category] || CATEGORY_COLORS['Other'];
                  const isIncome = tx.type === 'income';

                  return (
                    <tr
                      key={tx.id}
                      className="hover:bg-neutral-50/60 dark:hover:bg-neutral-800/30 transition-colors group"
                    >
                      {/* Date */}
                      <td className="py-3.5 px-4 font-mono tabular-nums text-neutral-600 dark:text-neutral-400 whitespace-nowrap">
                        {formatDate(tx.date)}
                      </td>

                      {/* Name & Note */}
                      <td className="py-3.5 px-4">
                        <div className="min-w-0">
                          <p className="font-medium text-neutral-900 dark:text-neutral-100">
                            {tx.name}
                          </p>
                          {tx.description && (
                            <p className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate max-w-xs sm:max-w-md mt-0.5">
                              {tx.description}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Category - Zero Pill discipline: text with dot */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="flex items-center gap-1.5 text-neutral-700 dark:text-neutral-300">
                          <span className={`w-1.5 h-1.5 rounded-full ${catColor.dot}`} />
                          {tx.category}
                        </span>
                      </td>

                      {/* Type */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 font-medium ${
                            isIncome
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-neutral-600 dark:text-neutral-400'
                          }`}
                        >
                          {isIncome ? (
                            <>
                              <TrendingUp className="w-3 h-3" />
                              Income
                            </>
                          ) : (
                            <>
                              <TrendingDown className="w-3 h-3 text-rose-500" />
                              Expense
                            </>
                          )}
                        </span>
                      </td>

                      {/* Amount */}
                      <td className="py-3.5 px-4 text-right font-mono tabular-nums font-semibold whitespace-nowrap">
                        <span
                          className={
                            isIncome
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-neutral-900 dark:text-neutral-100'
                          }
                        >
                          {isIncome ? '+' : '-'}
                          {formatCurrency(tx.amount, currency)}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <button
                          onClick={() => setDeleteTargetId(tx.id)}
                          className="p-1.5 text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md transition-colors"
                          title="Delete transaction"
                          aria-label={`Delete ${tx.name}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Single Item Modal */}
      <DeleteConfirmModal
        isOpen={deleteTargetId !== null}
        title="Delete Transaction"
        message={
          targetTx
            ? `Are you sure you want to permanently delete "${targetTx.name}" (${formatCurrency(
                targetTx.amount,
                currency
              )})? This will recalculate your balance and charts.`
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

      {/* Clear All Modal */}
      <DeleteConfirmModal
        isOpen={showClearAllModal}
        title="Clear All Transactions"
        message="Are you sure you want to clear all transactions? This will reset your balance to zero and wipe all financial records. You can reload demo data anytime from Settings."
        confirmLabel="Yes, Clear Everything"
        onConfirm={() => {
          clearAllTransactions();
          setShowClearAllModal(false);
        }}
        onCancel={() => setShowClearAllModal(false)}
      />
    </div>
  );
};
