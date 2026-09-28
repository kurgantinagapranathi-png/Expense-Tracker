import React, { useRef, useState } from 'react';
import {
  Moon,
  Sun,
  Globe,
  Download,
  Upload,
  RotateCcw,
  Trash2,
  CheckCircle2,
  HardDrive,
  Info,
  ShieldCheck,
  FileSpreadsheet,
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { CURRENCIES } from '../utils/constants';
import { formatCurrency, exportTransactionsToCSV } from '../utils/formatters';
import { DeleteConfirmModal } from './DeleteConfirmModal';

export const SettingsView: React.FC = () => {
  const {
    currency,
    setCurrency,
    currencySymbol,
    theme,
    setTheme,
    transactions,
    clearAllTransactions,
    loadDemoData,
    addTransaction,
    totalBalance,
    monthlyBudget,
  } = useFinance();

  const [showClearModal, setShowClearModal] = useState(false);
  const [showResetDemoModal, setShowResetDemoModal] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Export JSON backup
  const handleExportJSON = () => {
    const backupData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      currency,
      monthlyBudget,
      transactions,
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `financeflow-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('JSON backup downloaded successfully!');
  };

  // Import JSON backup
  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed.transactions)) {
          // Replace or append
          clearAllTransactions();
          parsed.transactions.forEach((tx: any) => {
            if (tx.name && tx.amount && tx.type && tx.category && tx.date) {
              addTransaction({
                name: tx.name,
                amount: Number(tx.amount),
                type: tx.type,
                category: tx.category,
                date: tx.date,
                description: tx.description,
              });
            }
          });
          if (parsed.currency) setCurrency(parsed.currency);
          showToast(`Restored ${parsed.transactions.length} transactions from backup!`);
        } else {
          showToast('Invalid backup file structure.');
        }
      } catch {
        showToast('Failed to parse backup JSON file.');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
          Preferences & Settings
        </h1>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
          Configure currency standards, interface themes, backup snapshots, and ledger maintenance
        </p>
      </div>

      {toastMsg && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl flex items-center gap-2 text-emerald-800 dark:text-emerald-300 text-xs font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Currency Selection Section */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-neutral-100 dark:border-neutral-800">
          <Globe className="w-4 h-4 text-neutral-500" />
          <div>
            <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              Primary Currency Standard
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Default is Indian Rupee (₹). All current and future transactions display in the selected currency.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {CURRENCIES.map((c) => {
            const isSelected = currency === c.code;
            return (
              <button
                key={c.code}
                onClick={() => {
                  setCurrency(c.code);
                  showToast(`Currency changed to ${c.name} (${c.symbol})`);
                }}
                className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'border-neutral-900 bg-neutral-50 dark:border-neutral-100 dark:bg-neutral-800/60 shadow-xs'
                    : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 bg-white dark:bg-neutral-900'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-base font-bold font-mono text-neutral-900 dark:text-neutral-100">
                    {c.symbol}
                  </span>
                  <span className="text-[11px] font-mono text-neutral-400 uppercase">
                    {c.code}
                  </span>
                </div>
                <span className="text-xs text-neutral-600 dark:text-neutral-300 mt-2 truncate">
                  {c.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Theme Preference Section */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-neutral-100 dark:border-neutral-800">
          <Moon className="w-4 h-4 text-neutral-500" />
          <div>
            <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              Interface Color Theme
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Select between high-contrast dark theme, clean crisp light theme, or automatic system sync
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => setTheme('light')}
            className={`p-3.5 rounded-xl border text-center transition-all flex flex-col items-center gap-2 ${
              theme === 'light'
                ? 'border-neutral-900 bg-neutral-50 dark:border-neutral-100 dark:bg-neutral-800/60 shadow-xs font-semibold'
                : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700'
            }`}
          >
            <Sun className="w-5 h-5 text-amber-500" />
            <span className="text-xs text-neutral-900 dark:text-neutral-100">Light Mode</span>
          </button>

          <button
            onClick={() => setTheme('dark')}
            className={`p-3.5 rounded-xl border text-center transition-all flex flex-col items-center gap-2 ${
              theme === 'dark'
                ? 'border-neutral-900 bg-neutral-50 dark:border-neutral-100 dark:bg-neutral-800/60 shadow-xs font-semibold'
                : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700'
            }`}
          >
            <Moon className="w-5 h-5 text-indigo-400" />
            <span className="text-xs text-neutral-900 dark:text-neutral-100">Dark Mode</span>
          </button>

          <button
            onClick={() => setTheme('system')}
            className={`p-3.5 rounded-xl border text-center transition-all flex flex-col items-center gap-2 ${
              theme === 'system'
                ? 'border-neutral-900 bg-neutral-50 dark:border-neutral-100 dark:bg-neutral-800/60 shadow-xs font-semibold'
                : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700'
            }`}
          >
            <HardDrive className="w-5 h-5 text-neutral-500" />
            <span className="text-xs text-neutral-900 dark:text-neutral-100">System Sync</span>
          </button>
        </div>
      </div>

      {/* Data Management & Export Section */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-neutral-100 dark:border-neutral-800">
          <HardDrive className="w-4 h-4 text-neutral-500" />
          <div>
            <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              Data Persistence & Backups
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              All transactions remain stored safely in your browser via localStorage. Export anytime to CSV or JSON.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* CSV Export */}
          <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950/40 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-neutral-900 dark:text-neutral-100 font-semibold text-xs">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>Export as Spreadsheet (CSV)</span>
              </div>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1">
                Download itemized transactions formatted for Microsoft Excel, Google Sheets, or Apple Numbers.
              </p>
            </div>
            <button
              onClick={() => {
                exportTransactionsToCSV(transactions, currencySymbol);
                showToast('CSV export downloaded successfully!');
              }}
              disabled={transactions.length === 0}
              className="mt-4 px-3.5 py-2 text-xs font-medium text-neutral-900 dark:text-neutral-100 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-700/80 rounded-lg transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              Download CSV ({transactions.length} rows)
            </button>
          </div>

          {/* JSON Backup & Restore */}
          <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950/40 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-neutral-900 dark:text-neutral-100 font-semibold text-xs">
                <ShieldCheck className="w-4 h-4 text-sky-600" />
                <span>Full JSON Backup & Restore</span>
              </div>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1">
                Download a complete JSON database snapshot to migrate across devices or browser profiles.
              </p>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <button
                onClick={handleExportJSON}
                className="flex-1 px-3 py-2 text-xs font-medium text-neutral-900 dark:text-neutral-100 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-700/80 rounded-lg transition-colors flex items-center justify-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                Backup JSON
              </button>
              <label className="flex-1 px-3 py-2 text-xs font-medium text-neutral-900 dark:text-neutral-100 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-700/80 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer">
                <Upload className="w-3.5 h-3.5" />
                Restore JSON
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={handleImportJSON}
                />
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Danger Zone & Demo Data */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-neutral-100 dark:border-neutral-800">
          <Trash2 className="w-4 h-4 text-rose-500" />
          <div>
            <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              Ledger Management & Reset
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Restore default demo transactions or wipe ledger records completely
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 bg-neutral-50 dark:bg-neutral-950/60 rounded-xl border border-neutral-200/80 dark:border-neutral-800/80">
          <div>
            <h3 className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
              Reset to Sample Demo Data
            </h3>
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
              Populates realistic transactions with initial balance of ₹25,450 (Income: ₹40,000, Expenses: ₹14,550).
            </p>
          </div>
          <button
            onClick={() => setShowResetDemoModal(true)}
            className="px-3.5 py-2 text-xs font-medium text-neutral-700 dark:text-neutral-300 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reload Demo Data
          </button>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 bg-rose-50/50 dark:bg-rose-950/20 rounded-xl border border-rose-200 dark:border-rose-900/40">
          <div>
            <h3 className="text-xs font-semibold text-rose-900 dark:text-rose-200">
              Clear All Recorded Transactions
            </h3>
            <p className="text-[11px] text-rose-700/80 dark:text-rose-400 mt-0.5">
              Permanently purges all transactions from local storage. Balances will return to 0.
            </p>
          </div>
          <button
            onClick={() => setShowClearModal(true)}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear All Data
          </button>
        </div>
      </div>

      {/* Confirmation Modals */}
      <DeleteConfirmModal
        isOpen={showClearModal}
        title="Clear All Ledger Data"
        message="Are you sure you want to permanently erase all transactions? This will reset all your balance cards and charts to zero. This cannot be undone."
        confirmLabel="Yes, Erase Everything"
        onConfirm={() => {
          clearAllTransactions();
          setShowClearModal(false);
          showToast('All transaction records cleared.');
        }}
        onCancel={() => setShowClearModal(false)}
      />

      <DeleteConfirmModal
        isOpen={showResetDemoModal}
        title="Reload Sample Demo Data"
        message="This will overwrite current ledger records with sample transactions (Balance: ₹25,450, Income: ₹40,000, Expenses: ₹14,550). Are you sure?"
        confirmLabel="Reload Demo Data"
        isDestructive={false}
        onConfirm={() => {
          loadDemoData();
          setShowResetDemoModal(false);
          showToast('Sample demo data successfully reloaded!');
        }}
        onCancel={() => setShowResetDemoModal(false)}
      />
    </div>
  );
};
