import React, { useState } from 'react';
import { FinanceProvider } from './context/FinanceContext';
import { ViewTab } from './types/finance';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { TransactionsView } from './components/TransactionsView';
import { AddTransactionView } from './components/AddTransactionView';
import { AnalyticsView } from './components/AnalyticsView';
import { BudgetView } from './components/BudgetView';
import { SettingsView } from './components/SettingsView';
import { N8nChatView } from './components/N8nChatView';
import { AddTransactionModal } from './components/AddTransactionModal';
import { N8nChatbot } from './components/N8nChatbot';

function AppContent() {
  const [currentTab, setCurrentTab] = useState<ViewTab>('dashboard');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-50 flex flex-col md:flex-row antialiased selection:bg-neutral-900 selection:text-white dark:selection:bg-neutral-100 dark:selection:text-neutral-900">
      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        onNavigate={setCurrentTab}
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Workspace Viewport */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <Header
          currentTab={currentTab}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          onOpenAddModal={() => setIsAddModalOpen(true)}
        />

        {/* Content Canvas */}
        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto pb-24 md:pb-12">
          {currentTab === 'dashboard' && (
            <DashboardView
              onNavigate={setCurrentTab}
              onOpenAddModal={() => setIsAddModalOpen(true)}
            />
          )}

          {currentTab === 'transactions' && (
            <TransactionsView onOpenAddModal={() => setIsAddModalOpen(true)} />
          )}

          {currentTab === 'add' && <AddTransactionView onNavigate={setCurrentTab} />}

          {currentTab === 'analytics' && <AnalyticsView />}

          {currentTab === 'budget' && <BudgetView />}

          {currentTab === 'chat' && <N8nChatView />}

          {currentTab === 'settings' && <SettingsView />}
        </main>
      </div>

      {/* Quick Add Transaction Modal (Triggerable anywhere) */}
      <AddTransactionModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />

      {/* Floating n8n AI Chatbot Widget */}
      <N8nChatbot />
    </div>
  );
}

export default function App() {
  return (
    <FinanceProvider>
      <AppContent />
    </FinanceProvider>
  );
}
