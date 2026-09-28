import React, { useState } from 'react';
import { Plus, ArrowDownLeft, ArrowUpRight, CheckCircle2, History } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../utils/constants';
import { TransactionType, ViewTab } from '../types/finance';

interface AddTransactionViewProps {
  onNavigate: (tab: ViewTab) => void;
}

export const AddTransactionView: React.FC<AddTransactionViewProps> = ({ onNavigate }) => {
  const { addTransaction, currencySymbol } = useFinance();

  const getTodayISO = () => new Date().toISOString().split('T')[0];

  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<TransactionType>('expense');
  const [category, setCategory] = useState<string>('Food');
  const [date, setDate] = useState<string>(getTodayISO());
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    if (newType === 'expense') {
      setCategory('Food');
    } else {
      setCategory('Salary');
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = 'Transaction name is required';
    } else if (name.trim().length > 60) {
      newErrors.name = 'Name must be 60 characters or less';
    }

    const numAmount = parseFloat(amount);
    if (!amount || isNaN(numAmount)) {
      newErrors.amount = 'Please enter a valid amount';
    } else if (numAmount <= 0) {
      newErrors.amount = 'Amount must be greater than zero';
    } else if (numAmount > 100000000) {
      newErrors.amount = 'Amount exceeds maximum supported limit';
    }

    if (!date) {
      newErrors.date = 'Please pick a valid date';
    }

    if (!category) {
      newErrors.category = 'Please select a category';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    addTransaction({
      name: name.trim(),
      amount: parseFloat(amount),
      type,
      category,
      date,
      description: description.trim() || undefined,
    });

    setName('');
    setAmount('');
    setDescription('');
    setDate(getTodayISO());
    setErrors({});
    setShowSuccessToast(true);

    setTimeout(() => {
      setShowSuccessToast(false);
    }, 4000);
  };

  const currentCategories = type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            Record Transaction
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            Capture new expenses or income credits into your financial ledger
          </p>
        </div>
        <button
          onClick={() => onNavigate('transactions')}
          className="self-start sm:self-auto px-3 py-1.5 text-xs font-medium text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-lg transition-colors flex items-center gap-1.5"
        >
          <History className="w-3.5 h-3.5" />
          View History
        </button>
      </div>

      {showSuccessToast && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl flex items-center justify-between text-emerald-900 dark:text-emerald-200 text-xs font-medium">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>Transaction recorded successfully! Balances and charts updated.</span>
          </div>
          <button
            onClick={() => onNavigate('dashboard')}
            className="underline font-semibold hover:opacity-80 transition-opacity"
          >
            Go to Dashboard
          </button>
        </div>
      )}

      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 shadow-xs">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Transaction Type Segmented Toggle */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
              Transaction Direction
            </label>
            <div className="grid grid-cols-2 gap-2 p-1.5 bg-neutral-100 dark:bg-neutral-800/80 rounded-lg">
              <button
                type="button"
                onClick={() => handleTypeChange('expense')}
                className={`py-2 px-3 text-xs font-medium rounded-md transition-all flex items-center justify-center gap-2 ${
                  type === 'expense'
                    ? 'bg-white dark:bg-neutral-900 text-rose-600 dark:text-rose-400 shadow-xs font-semibold'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
                }`}
              >
                <ArrowDownLeft className="w-4 h-4" />
                Expense (Money Out)
              </button>
              <button
                type="button"
                onClick={() => handleTypeChange('income')}
                className={`py-2 px-3 text-xs font-medium rounded-md transition-all flex items-center justify-center gap-2 ${
                  type === 'income'
                    ? 'bg-white dark:bg-neutral-900 text-emerald-600 dark:text-emerald-400 shadow-xs font-semibold'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
                }`}
              >
                <ArrowUpRight className="w-4 h-4" />
                Income (Money In)
              </button>
            </div>
          </div>

          {/* Name & Amount */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="view-tx-name" className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Transaction Name <span className="text-rose-500">*</span>
              </label>
              <input
                id="view-tx-name"
                type="text"
                placeholder="e.g. Grocery store, Salary payout"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errors.name) setErrors((prev) => ({ ...prev, name: '' }));
                }}
                className={`w-full px-3 py-2 text-sm bg-neutral-50 dark:bg-neutral-950 border rounded-lg focus:outline-hidden focus:ring-1 transition-colors ${
                  errors.name
                    ? 'border-rose-400 focus:ring-rose-500'
                    : 'border-neutral-300 dark:border-neutral-700 focus:ring-neutral-900 dark:focus:ring-neutral-200'
                }`}
              />
              {errors.name && <p className="text-xs text-rose-500 mt-1">{errors.name}</p>}
            </div>

            <div>
              <label htmlFor="view-tx-amount" className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Amount ({currencySymbol}) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-sm text-neutral-400 font-mono">
                  {currencySymbol}
                </span>
                <input
                  id="view-tx-amount"
                  type="number"
                  step="any"
                  min="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value);
                    if (errors.amount) setErrors((prev) => ({ ...prev, amount: '' }));
                  }}
                  className={`w-full pl-8 pr-3 py-2 text-sm font-mono tabular-nums bg-neutral-50 dark:bg-neutral-950 border rounded-lg focus:outline-hidden focus:ring-1 transition-colors ${
                    errors.amount
                      ? 'border-rose-400 focus:ring-rose-500'
                      : 'border-neutral-300 dark:border-neutral-700 focus:ring-neutral-900 dark:focus:ring-neutral-200'
                  }`}
                />
              </div>
              {errors.amount && <p className="text-xs text-rose-500 mt-1">{errors.amount}</p>}
            </div>
          </div>

          {/* Category & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="view-tx-category" className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Category <span className="text-rose-500">*</span>
              </label>
              <select
                id="view-tx-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-neutral-900 dark:focus:ring-neutral-200 transition-colors"
              >
                {currentCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="view-tx-date" className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Date <span className="text-rose-500">*</span>
              </label>
              <input
                id="view-tx-date"
                type="date"
                value={date}
                onChange={(e) => {
                  setDate(e.target.value);
                  if (errors.date) setErrors((prev) => ({ ...prev, date: '' }));
                }}
                className={`w-full px-3 py-2 text-sm bg-neutral-50 dark:bg-neutral-950 border rounded-lg focus:outline-hidden focus:ring-1 transition-colors ${
                  errors.date
                    ? 'border-rose-400 focus:ring-rose-500'
                    : 'border-neutral-300 dark:border-neutral-700 focus:ring-neutral-900 dark:focus:ring-neutral-200'
                }`}
              />
              {errors.date && <p className="text-xs text-rose-500 mt-1">{errors.date}</p>}
            </div>
          </div>

          {/* Quick Category Chips */}
          <div>
            <span className="block text-xs text-neutral-500 dark:text-neutral-400 mb-2">
              Select from available categories
            </span>
            <div className="flex flex-wrap gap-2">
              {currentCategories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`px-3 py-1.5 text-xs rounded-lg transition-colors border ${
                    category === cat
                      ? 'bg-neutral-900 text-white border-neutral-900 dark:bg-neutral-100 dark:text-neutral-900 dark:border-neutral-100 font-semibold shadow-xs'
                      : 'bg-neutral-50 dark:bg-neutral-950/60 border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:border-neutral-300 dark:hover:border-neutral-700'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="view-tx-desc" className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Description / Notes <span className="text-neutral-400 font-normal">(Optional)</span>
            </label>
            <textarea
              id="view-tx-desc"
              rows={3}
              placeholder="Add any extra details, invoice numbers, merchant notes..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-neutral-900 dark:focus:ring-neutral-200 transition-colors"
            />
          </div>

          {/* Submit */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                setName('');
                setAmount('');
                setDescription('');
                setDate(getTodayISO());
                setErrors({});
              }}
              className="px-4 py-2 text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 transition-colors"
            >
              Reset Form
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-xs font-semibold text-white bg-neutral-900 dark:bg-neutral-100 dark:text-neutral-900 rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors flex items-center gap-2 shadow-xs"
            >
              <Plus className="w-4 h-4" />
              Save Transaction
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
