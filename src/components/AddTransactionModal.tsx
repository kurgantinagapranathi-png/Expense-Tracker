import React, { useState } from 'react';
import { X, Plus, ArrowDownLeft, ArrowUpRight, CheckCircle2 } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../utils/constants';
import { TransactionType } from '../types/finance';

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
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

  // Switch default category when type switches
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

    // Reset fields
    setName('');
    setAmount('');
    setDescription('');
    setDate(getTodayISO());
    setErrors({});
    setShowSuccessToast(true);

    setTimeout(() => {
      setShowSuccessToast(false);
      if (onSuccess) onSuccess();
      onClose();
    }, 500);
  };

  if (!isOpen) return null;

  const currentCategories = type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 shadow-xl relative my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-100 dark:border-neutral-800">
          <div>
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              Add New Transaction
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              Record a new income credit or expense deduction
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Success Banner */}
        {showSuccessToast && (
          <div className="mt-4 p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-lg flex items-center gap-2 text-emerald-800 dark:text-emerald-300 text-xs font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            Transaction added successfully! Updating records...
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Type Selector (Segmented buttons) */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
              Transaction Type
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-neutral-100 dark:bg-neutral-800/80 rounded-lg">
              <button
                type="button"
                onClick={() => handleTypeChange('expense')}
                className={`py-2 px-3 text-xs font-medium rounded-md transition-all flex items-center justify-center gap-1.5 ${
                  type === 'expense'
                    ? 'bg-white dark:bg-neutral-900 text-rose-600 dark:text-rose-400 shadow-xs font-semibold'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
                }`}
              >
                <ArrowDownLeft className="w-3.5 h-3.5" />
                Expense (Outgoing)
              </button>
              <button
                type="button"
                onClick={() => handleTypeChange('income')}
                className={`py-2 px-3 text-xs font-medium rounded-md transition-all flex items-center justify-center gap-1.5 ${
                  type === 'income'
                    ? 'bg-white dark:bg-neutral-900 text-emerald-600 dark:text-emerald-400 shadow-xs font-semibold'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
                }`}
              >
                <ArrowUpRight className="w-3.5 h-3.5" />
                Income (Incoming)
              </button>
            </div>
          </div>

          {/* Transaction Name & Amount */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="tx-name" className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Transaction Name <span className="text-rose-500">*</span>
              </label>
              <input
                id="tx-name"
                type="text"
                placeholder="e.g. Grocery Store, Client Payment"
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
              <label htmlFor="tx-amount" className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Amount ({currencySymbol}) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-sm text-neutral-400 font-mono">
                  {currencySymbol}
                </span>
                <input
                  id="tx-amount"
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
              <label htmlFor="tx-category" className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Category <span className="text-rose-500">*</span>
              </label>
              <select
                id="tx-category"
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
              <label htmlFor="tx-date" className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Date <span className="text-rose-500">*</span>
              </label>
              <input
                id="tx-date"
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

          {/* Category Pill Presets for Quick Selection */}
          <div>
            <span className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1.5">
              Quick Category Select
            </span>
            <div className="flex flex-wrap gap-1.5">
              {currentCategories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
                    category === cat
                      ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 font-medium'
                      : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="tx-description" className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Description <span className="text-neutral-400 font-normal">(Optional)</span>
            </label>
            <textarea
              id="tx-description"
              rows={2}
              placeholder="Add payment method, notes, receipt reference..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-neutral-900 dark:focus:ring-neutral-200 transition-colors resize-none"
            />
          </div>

          {/* Action buttons */}
          <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-neutral-900 dark:bg-neutral-100 dark:text-neutral-900 rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Transaction
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
