import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Filler,
} from 'chart.js';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Filler
);

export const CHART_PALETTE = [
  '#0284c7', // Sky
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#10b981', // Emerald
  '#8b5cf6', // Purple
  '#f97316', // Orange
  '#6366f1', // Indigo
  '#14b8a6', // Teal
  '#64748b', // Slate
  '#e11d48', // Rose
];

export const getChartThemeColors = (isDark: boolean) => ({
  text: isDark ? '#94a3b8' : '#64748b',
  border: isDark ? '#334155' : '#e2e8f0',
  grid: isDark ? 'rgba(51, 65, 85, 0.4)' : 'rgba(226, 232, 240, 0.8)',
  tooltipBg: isDark ? '#0f172a' : '#1e293b',
  tooltipText: '#f8fafc',
});
