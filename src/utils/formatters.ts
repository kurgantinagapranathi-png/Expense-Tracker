import { CURRENCIES } from './constants';
import { Transaction } from '../types/finance';

export const formatCurrency = (amount: number, currencyCode: string = 'INR'): string => {
  const currency = CURRENCIES.find((c) => c.code === currencyCode) || CURRENCIES[0];
  
  try {
    return new Intl.NumberFormat(currency.locale, {
      style: 'currency',
      currency: currency.code,
      maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
      minimumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency.symbol}${amount.toLocaleString()}`;
  }
};

export const formatDate = (dateStr: string): string => {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, (month || 1) - 1, day || 1);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

export const formatMonthYear = (dateStr: string): string => {
  if (!dateStr) return '';
  const [year, month] = dateStr.split('-').map(Number);
  const date = new Date(year, (month || 1) - 1, 1);
  return date.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
};

export const exportTransactionsToCSV = (transactions: Transaction[], currencySymbol: string = '₹') => {
  if (!transactions.length) return;

  const headers = ['ID', 'Date', 'Name', 'Type', 'Category', `Amount (${currencySymbol})`, 'Description'];
  const rows = transactions.map((t) => [
    `"${t.id}"`,
    `"${t.date}"`,
    `"${t.name.replace(/"/g, '""')}"`,
    `"${t.type}"`,
    `"${t.category}"`,
    t.amount.toFixed(2),
    `"${(t.description || '').replace(/"/g, '""')}"`,
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `FinanceFlow_Transactions_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
