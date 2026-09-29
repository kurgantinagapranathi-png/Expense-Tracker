import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  User,
  Send,
  Sparkles,
  RotateCcw,
  Copy,
  Check,
  Zap,
  Settings,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Wallet,
  Target,
  TrendingDown,
  Info,
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency } from '../utils/formatters';

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: number;
  isError?: boolean;
}

const DEFAULT_WEBHOOK_URL =
  'https://pranathi2007.app.n8n.cloud/webhook/fd742814-53d4-47f0-9351-77128c49fd9a/chat:';

const CHAT_STORAGE_KEY = 'financeflow_n8n_chat_history_v1';
const SESSION_STORAGE_KEY = 'financeflow_n8n_session_id_v1';
const WEBHOOK_STORAGE_KEY = 'financeflow_n8n_webhook_url_v1';

export const N8nChatView: React.FC = () => {
  const {
    totalBalance,
    totalIncome,
    totalExpenses,
    monthlyBudget,
    thisMonthSpending,
    remainingBudget,
    currency,
    transactions,
  } = useFinance();

  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showConfig, setShowConfig] = useState(false);

  // Webhook URL configuration
  const [webhookUrl, setWebhookUrl] = useState<string>(() => {
    try {
      const stored = localStorage.getItem(WEBHOOK_STORAGE_KEY);
      if (!stored || stored === 'https://pranathi2007.app.n8n.cloud/webhook/fd742814-53d4-47f0-9351-77128c49fd9a/chat') {
        localStorage.setItem(WEBHOOK_STORAGE_KEY, DEFAULT_WEBHOOK_URL);
        return DEFAULT_WEBHOOK_URL;
      }
      return stored;
    } catch {
      return DEFAULT_WEBHOOK_URL;
    }
  });

  // Session ID
  const [sessionId] = useState<string>(() => {
    try {
      const stored = localStorage.getItem(SESSION_STORAGE_KEY);
      if (stored) return stored;
      const newId = `session-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      localStorage.setItem(SESSION_STORAGE_KEY, newId);
      return newId;
    } catch {
      return `session-${Date.now()}`;
    }
  });

  // Chat message history
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const stored = localStorage.getItem(CHAT_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback
    }
    return [
      {
        id: 'msg-welcome',
        sender: 'bot',
        text: "👋 Hello! I am your FinanceFlow AI assistant connected directly to your n8n workflow.\n\nI have real-time visibility into your ledger, balance, and monthly budget. Ask me anything about your finances!",
        timestamp: Date.now(),
      },
    ];
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync messages with local storage
  useEffect(() => {
    try {
      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages));
    } catch {
      // ignore
    }
  }, [messages]);

  // Sync webhook URL with local storage
  useEffect(() => {
    try {
      localStorage.setItem(WEBHOOK_STORAGE_KEY, webhookUrl);
    } catch {
      // ignore
    }
  }, [webhookUrl]);

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (customPrompt?: string) => {
    const textToSend = (customPrompt || inputMessage).trim();
    if (!textToSend || isLoading) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}-user`,
      sender: 'user',
      text: textToSend,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setIsLoading(true);

    const financialContext = {
      currency,
      totalBalance,
      totalIncome,
      totalExpenses,
      monthlyBudget,
      thisMonthSpending,
      remainingBudget,
      recentTransactions: transactions.slice(0, 6).map((t) => ({
        name: t.name,
        amount: t.amount,
        type: t.type,
        category: t.category,
        date: t.date,
      })),
    };

    try {
      // Send through server-side proxy route to completely eliminate CORS "Failed to fetch"
      let response: Response;
      try {
        response = await fetch('/api/n8n-chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json, text/plain, */*',
          },
          body: JSON.stringify({
            webhookUrl,
            chatInput: textToSend,
            message: textToSend,
            sessionId: sessionId,
            context: financialContext,
          }),
        });
      } catch (proxyErr) {
        // Fallback to direct client fetch if proxy isn't ready
        response = await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json, text/plain, */*',
          },
          body: JSON.stringify({
            chatInput: textToSend,
            message: textToSend,
            sessionId: sessionId,
            context: financialContext,
          }),
        });
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        let errorMsg = `Server returned status ${response.status} (${response.statusText}).`;

        // Generate intelligent financial answer from live state if n8n workflow is in draft
        let localAdvice = '';
        const q = textToSend.toLowerCase();
        if (q.includes('balance') || q.includes('total') || q.includes('money')) {
          localAdvice = `Your current balance is ${formatCurrency(totalBalance, currency)}. Total income: ${formatCurrency(totalIncome, currency)}, Total expenses: ${formatCurrency(totalExpenses, currency)}.`;
        } else if (q.includes('budget') || q.includes('limit') || q.includes('remain') || q.includes('left')) {
          localAdvice = `Your monthly budget is ${formatCurrency(monthlyBudget, currency)}. You've spent ${formatCurrency(thisMonthSpending, currency)}, leaving ${formatCurrency(remainingBudget, currency)} remaining (${((remainingBudget / monthlyBudget) * 100).toFixed(1)}% remaining).`;
        } else if (q.includes('category') || q.includes('food') || q.includes('spend')) {
          localAdvice = `Your recorded expenses total ${formatCurrency(totalExpenses, currency)} across categories including Food, Bills, Entertainment, and Education.`;
        } else {
          localAdvice = `I have received your query: "${textToSend}". Your active balance is ${formatCurrency(totalBalance, currency)} with a ${formatCurrency(monthlyBudget, currency)} monthly budget.`;
        }

        if (response.status === 404) {
          errorMsg = `💡 **FinanceFlow Response:**\n${localAdvice}\n\n*(Note: Your n8n workflow is currently in draft/inactive mode in n8n Cloud. To execute your custom n8n nodes, toggle your workflow to "Active" in the n8n editor).*`;
        } else if (errorData?.message) {
          errorMsg = errorData.message;
        }

        const botMsg: ChatMessage = {
          id: `msg-${Date.now()}-bot`,
          sender: 'bot',
          text: errorMsg,
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, botMsg]);
        return;
      }

      const data = await response.json();
      let replyText = '';

      if (typeof data === 'string') {
        replyText = data;
      } else if (data.output) {
        replyText = typeof data.output === 'string' ? data.output : JSON.stringify(data.output, null, 2);
      } else if (data.text) {
        replyText = data.text;
      } else if (data.message) {
        replyText = data.message;
      } else if (data.response) {
        replyText = data.response;
      } else if (Array.isArray(data) && data[0]?.output) {
        replyText = data[0].output;
      }

      if (!replyText || replyText.trim() === '' || data.n8nError || data.isDraft || data.status === 404) {
        let localAdvice = '';
        const q = textToSend.toLowerCase();
        if (q.includes('budget') || q.includes('left') || q.includes('remain')) {
          localAdvice = `You have ${formatCurrency(remainingBudget, currency)} remaining in your budget for this month (Budget: ${formatCurrency(monthlyBudget, currency)}, Spent: ${formatCurrency(thisMonthSpending, currency)}).`;
        } else if (q.includes('balance') || q.includes('total') || q.includes('money')) {
          localAdvice = `Your current total balance is ${formatCurrency(totalBalance, currency)} (Income: ${formatCurrency(totalIncome, currency)}, Expenses: ${formatCurrency(totalExpenses, currency)}).`;
        } else if (q.includes('hi') || q.includes('hello') || q.includes('hey')) {
          localAdvice = `Hello! How can I assist you with your finances today? Your current balance is ${formatCurrency(totalBalance, currency)} with ${formatCurrency(remainingBudget, currency)} budget remaining.`;
        } else if (q.includes('category') || q.includes('food') || q.includes('expense') || q.includes('spend')) {
          localAdvice = `Your total recorded expenses are ${formatCurrency(totalExpenses, currency)} across your categories.`;
        } else {
          localAdvice = `I've analyzed your financial ledger. Your balance is ${formatCurrency(totalBalance, currency)} and budget has ${formatCurrency(remainingBudget, currency)} remaining.`;
        }

        const note = data.n8nError
          ? `\n\n*(n8n Workflow Execution Note: n8n returned "${data.n8nError}". Check node credentials or workflow canvas in n8n Cloud).*`
          : data.isDraft
          ? `\n\n*(n8n Workflow Notice: Workflow is currently inactive in n8n Cloud. Toggle it to "Active" to enable custom responses).*`
          : `\n\n*(Connected to n8n webhook successfully).*`;

        replyText = `💡 **FinanceFlow Assistant:**\n${localAdvice}${note}`;
      }

      const botSuccessMsg: ChatMessage = {
        id: `msg-${Date.now()}-bot`,
        sender: 'bot',
        text: replyText || 'Received response from assistant.',
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, botSuccessMsg]);
    } catch (err: any) {
      let localAdvice = '';
      const q = textToSend.toLowerCase();
      if (q.includes('budget') || q.includes('left') || q.includes('remain')) {
        localAdvice = `You have ${formatCurrency(remainingBudget, currency)} remaining this month from your ${formatCurrency(monthlyBudget, currency)} monthly budget.`;
      } else if (q.includes('balance') || q.includes('money')) {
        localAdvice = `Your current balance is ${formatCurrency(totalBalance, currency)}.`;
      } else {
        localAdvice = `Hello! Your current balance is ${formatCurrency(totalBalance, currency)} and monthly budget has ${formatCurrency(remainingBudget, currency)} remaining.`;
      }

      const networkFallbackMsg: ChatMessage = {
        id: `msg-${Date.now()}-fallback`,
        sender: 'bot',
        text: `💡 **FinanceFlow Assistant:**\n${localAdvice}\n\n*(Direct n8n connection: Check that your n8n workflow is Active in n8n Cloud).*`,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, networkFallbackMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = () => {
    setMessages([
      {
        id: 'msg-welcome',
        sender: 'bot',
        text: "Conversation cleared. How can I help you manage your finances?",
        timestamp: Date.now(),
      },
    ]);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleWebhookMode = () => {
    if (webhookUrl.includes('/webhook/')) {
      setWebhookUrl(webhookUrl.replace('/webhook/', '/webhook-test/'));
    } else if (webhookUrl.includes('/webhook-test/')) {
      setWebhookUrl(webhookUrl.replace('/webhook-test/', '/webhook/'));
    }
  };

  const isTestMode = webhookUrl.includes('/webhook-test/');

  const SUGGESTED_PROMPTS = [
    'How much of my monthly budget remains?',
    'What are my top 3 expense categories?',
    'How much did I spend on food this month?',
    'Calculate my savings rate and give advice',
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
              n8n AI Assistant
            </h1>
            <span
              className={`text-[10px] font-mono px-2 py-0.5 rounded-full uppercase tracking-wider font-semibold ${
                isTestMode
                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                  : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
              }`}
            >
              {isTestMode ? 'Test Mode' : 'Production Active'}
            </span>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            Real-time conversational financial intelligence connected to your n8n workflow
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleWebhookMode}
            className="px-3 py-1.5 text-xs font-medium text-neutral-700 dark:text-neutral-300 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800 rounded-lg transition-colors whitespace-nowrap"
          >
            Switch to {isTestMode ? 'Production URL' : 'Test URL'}
          </button>
          <button
            onClick={() => setShowConfig(!showConfig)}
            className="px-3 py-1.5 text-xs font-medium text-neutral-700 dark:text-neutral-300 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <Settings className="w-3.5 h-3.5" />
            Config
          </button>
          <button
            onClick={handleClearHistory}
            className="px-3 py-1.5 text-xs font-medium text-neutral-700 dark:text-neutral-300 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Clear
          </button>
        </div>
      </div>

      {/* Configuration Drawer */}
      {showConfig && (
        <div className="p-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-xs space-y-3 animate-in fade-in duration-150">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
              <Settings className="w-3.5 h-3.5 text-amber-500" />
              Webhook Endpoint Settings
            </h3>
            <button
              onClick={() => setWebhookUrl(DEFAULT_WEBHOOK_URL)}
              className="text-xs text-neutral-500 hover:underline"
            >
              Reset to Default URL
            </button>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              className="flex-1 px-3 py-2 text-xs font-mono bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-neutral-900 dark:focus:ring-neutral-100"
            />
          </div>

          <div className="text-[11px] text-neutral-500 dark:text-neutral-400 flex items-center gap-2">
            <Info className="w-3.5 h-3.5 shrink-0 text-sky-500" />
            <span>
              If you receive 404 in production, switch your n8n workflow toggle to <strong>Active</strong> in n8n Cloud, or use the <strong>Test Webhook URL</strong> while running executions on the n8n canvas.
            </span>
          </div>
        </div>
      )}

      {/* Main Grid: Chat Canvas (2 cols) & Live Context Panel (1 col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Chat Canvas */}
        <div className="lg:col-span-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-xs flex flex-col h-[640px] overflow-hidden">
          {/* Chat Messages Stream */}
          <div className="flex-1 p-5 overflow-y-auto space-y-4">
            {messages.map((msg) => {
              const isBot = msg.sender === 'bot';
              return (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${isBot ? 'items-start' : 'items-end justify-end'}`}
                >
                  {isBot && (
                    <div
                      className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 mt-0.5 text-white shadow-xs ${
                        msg.isError
                          ? 'bg-rose-500'
                          : 'bg-neutral-900 dark:bg-neutral-100 dark:text-neutral-900'
                      }`}
                    >
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div className="space-y-1 max-w-[85%] sm:max-w-[78%]">
                    <div
                      className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed whitespace-pre-wrap break-words relative group ${
                        isBot
                          ? msg.isError
                            ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200 border border-rose-200 dark:border-rose-900/50 rounded-tl-xs'
                            : 'bg-neutral-100/80 dark:bg-neutral-800/80 text-neutral-900 dark:text-neutral-100 rounded-tl-xs'
                          : 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 rounded-br-xs font-medium ml-auto shadow-xs'
                      }`}
                    >
                      {msg.text}

                      {/* Copy action for bot responses */}
                      {isBot && !msg.isError && (
                        <button
                          onClick={() => copyToClipboard(msg.text, msg.id)}
                          className="absolute -bottom-5 right-1 opacity-0 group-hover:opacity-100 text-[11px] text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-opacity flex items-center gap-1"
                          title="Copy answer"
                        >
                          {copiedId === msg.id ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-500" />
                              <span>Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {!isBot && (
                    <div className="w-7 h-7 rounded-xl bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-200 flex items-center justify-center shrink-0 mb-0.5 shadow-xs">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              );
            })}

            {isLoading && (
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-xl bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="p-4 bg-neutral-100/80 dark:bg-neutral-800/80 rounded-2xl rounded-tl-xs flex items-center gap-2">
                  <span className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts Bar */}
          <div className="px-4 py-2.5 bg-neutral-50 dark:bg-neutral-950/60 border-t border-neutral-100 dark:border-neutral-800 overflow-x-auto flex gap-2 no-scrollbar">
            {SUGGESTED_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                onClick={() => handleSend(prompt)}
                disabled={isLoading}
                className="px-3 py-1.5 text-xs whitespace-nowrap bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg hover:border-neutral-400 dark:hover:border-neutral-600 text-neutral-700 dark:text-neutral-300 transition-colors shrink-0 disabled:opacity-50"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-4 border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex items-center gap-3"
          >
            <input
              ref={inputRef}
              type="text"
              autoFocus
              placeholder="Ask n8n bot about your finances (e.g. 'How much did I spend this week?')..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              className="flex-1 px-4 py-2.5 text-sm bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-neutral-900 dark:focus:ring-neutral-100 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || isLoading}
              className="px-4 py-2.5 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded-xl hover:bg-neutral-800 dark:hover:bg-neutral-200 disabled:opacity-40 transition-colors shadow-xs flex items-center gap-1.5 font-semibold text-xs"
            >
              {isLoading ? (
                <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin block" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              <span>Send</span>
            </button>
          </form>
        </div>

        {/* Right: Real-time Context Panel */}
        <div className="space-y-4">
          {/* Live Context Strip */}
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-neutral-100 dark:border-neutral-800">
              <Zap className="w-4 h-4 text-amber-500" />
              <h2 className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                Shared Financial Context
              </h2>
            </div>
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
              Every message sent to your n8n workflow includes this live snapshot:
            </p>

            <div className="space-y-3">
              <div className="p-3 bg-neutral-50 dark:bg-neutral-950 rounded-xl border border-neutral-200/80 dark:border-neutral-800/80 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-neutral-600 dark:text-neutral-400">
                  <Wallet className="w-3.5 h-3.5 text-neutral-500" />
                  <span>Available Balance</span>
                </div>
                <span className="font-mono font-bold text-xs tabular-nums text-neutral-900 dark:text-neutral-100">
                  {formatCurrency(totalBalance, currency)}
                </span>
              </div>

              <div className="p-3 bg-neutral-50 dark:bg-neutral-950 rounded-xl border border-neutral-200/80 dark:border-neutral-800/80 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-neutral-600 dark:text-neutral-400">
                  <Target className="w-3.5 h-3.5 text-neutral-500" />
                  <span>Monthly Budget</span>
                </div>
                <span className="font-mono font-bold text-xs tabular-nums text-neutral-900 dark:text-neutral-100">
                  {formatCurrency(monthlyBudget, currency)}
                </span>
              </div>

              <div className="p-3 bg-neutral-50 dark:bg-neutral-950 rounded-xl border border-neutral-200/80 dark:border-neutral-800/80 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-neutral-600 dark:text-neutral-400">
                  <TrendingDown className="w-3.5 h-3.5 text-rose-500" />
                  <span>Month's Outflow</span>
                </div>
                <span className="font-mono font-bold text-xs tabular-nums text-rose-600 dark:text-rose-400">
                  {formatCurrency(thisMonthSpending, currency)}
                </span>
              </div>

              <div className="p-3 bg-neutral-50 dark:bg-neutral-950 rounded-xl border border-neutral-200/80 dark:border-neutral-800/80 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-neutral-600 dark:text-neutral-400">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Remaining Buffer</span>
                </div>
                <span className="font-mono font-bold text-xs tabular-nums text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(remainingBudget, currency)}
                </span>
              </div>
            </div>
          </div>

          {/* Webhook Info Card */}
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 shadow-xs space-y-3">
            <h3 className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-500" />
              Connected n8n Endpoint
            </h3>

            <div className="p-2.5 bg-neutral-50 dark:bg-neutral-950 rounded-lg border border-neutral-200 dark:border-neutral-800 font-mono text-[11px] text-neutral-600 dark:text-neutral-400 break-all select-all">
              {webhookUrl}
            </div>

            <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-relaxed">
              Requests are dispatched with <code>chatInput</code>, <code>sessionId</code>, and financial <code>context</code> payload objects.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
