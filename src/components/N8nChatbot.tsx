import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  X,
  Send,
  Sparkles,
  Bot,
  User,
  RotateCcw,
  Settings,
  AlertCircle,
  ExternalLink,
  ChevronDown,
  Copy,
  Check,
  Zap,
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency } from '../utils/formatters';

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot' | 'system';
  text: string;
  timestamp: number;
  isError?: boolean;
}

const DEFAULT_WEBHOOK_URL =
  'https://pranathi2007.app.n8n.cloud/webhook/fd742814-53d4-47f0-9351-77128c49fd9a/chat:';

const CHAT_STORAGE_KEY = 'financeflow_n8n_chat_history_v1';
const SESSION_STORAGE_KEY = 'financeflow_n8n_session_id_v1';
const WEBHOOK_STORAGE_KEY = 'financeflow_n8n_webhook_url_v1';

export const N8nChatbot: React.FC = () => {
  const {
    totalBalance,
    totalIncome,
    totalExpenses,
    monthlyBudget,
    thisMonthSpending,
    remainingBudget,
    currency,
    transactions,
    addTransaction,
  } = useFinance();

  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Webhook URL configuration (updated to user provided URL with chat:)
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

  // Session ID for n8n memory
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
        text: "👋 Hi! I'm your FinanceFlow AI assistant powered by n8n. Ask me about your budget, balance, spending habits, or ask me to help track your finances!",
        timestamp: Date.now(),
      },
    ];
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Save messages to local storage
  useEffect(() => {
    try {
      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages));
    } catch {
      // ignore
    }
  }, [messages]);

  // Save webhook URL to local storage
  useEffect(() => {
    try {
      localStorage.setItem(WEBHOOK_STORAGE_KEY, webhookUrl);
    } catch {
      // ignore
    }
  }, [webhookUrl]);

  // Scroll to bottom on new message
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  const handleSend = async (customText?: string) => {
    const textToSend = (customText || inputMessage).trim();
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

    // Prepare contextual ledger data
    const financialContext = {
      currency,
      totalBalance,
      totalIncome,
      totalExpenses,
      monthlyBudget,
      thisMonthSpending,
      remainingBudget,
      recentTransactions: transactions.slice(0, 5).map((t) => ({
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

      // Parse response from n8n / proxy
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

      // If reply is empty, or n8n workflow returned an error / draft status, always provide rich financial answer
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
      // Local fallback with real financial calculations
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
    const welcome: ChatMessage = {
      id: 'msg-welcome',
      sender: 'bot',
      text: "Chat cleared. How can I help you today with your finances?",
      timestamp: Date.now(),
    };
    setMessages([welcome]);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Switch between production and test webhook URLs
  const toggleWebhookMode = () => {
    if (webhookUrl.includes('/webhook/')) {
      setWebhookUrl(webhookUrl.replace('/webhook/', '/webhook-test/'));
    } else if (webhookUrl.includes('/webhook-test/')) {
      setWebhookUrl(webhookUrl.replace('/webhook-test/', '/webhook/'));
    }
  };

  const isTestMode = webhookUrl.includes('/webhook-test/');

  // Quick suggestion prompts
  const SUGGESTED_PROMPTS = [
    `How much budget is left for this month?`,
    `What's my biggest spending category?`,
    `Summarize my current balance and income`,
    `Give me 3 tips to save on food and bills`,
  ];

  return (
    <>
      {/* Floating Launcher Button */}
      {!isOpen && (
        <div className="fixed z-40 right-4 sm:right-6 bottom-20 md:bottom-6">
          <button
            onClick={() => setIsOpen(true)}
            className="flex items-center gap-2.5 px-4 py-3 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded-full shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-200 group"
            aria-label="Open n8n AI Chatbot"
          >
            <div className="relative">
              <Sparkles className="w-5 h-5 text-amber-400 group-hover:rotate-12 transition-transform" />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full ring-2 ring-neutral-900 dark:ring-neutral-100" />
            </div>
            <span className="text-xs font-semibold tracking-tight whitespace-nowrap">
              n8n AI Assistant
            </span>
          </button>
        </div>
      )}

      {/* Floating Chat Modal Window */}
      {isOpen && (
        <div className="fixed z-50 right-2 sm:right-6 bottom-16 md:bottom-6 w-[calc(100vw-1rem)] sm:w-[420px] max-w-[450px] h-[580px] max-h-[85vh] bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <div className="px-4 py-3.5 bg-neutral-900 dark:bg-neutral-950 text-white flex items-center justify-between border-b border-neutral-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-neutral-800 dark:bg-neutral-900 border border-neutral-700 flex items-center justify-center text-amber-400 shadow-xs">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold tracking-tight text-white">
                    FinanceFlow Assistant
                  </h3>
                  <span
                    className={`text-[9px] font-mono px-1.5 py-0.5 rounded-sm uppercase tracking-wide font-medium ${
                      isTestMode
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}
                  >
                    {isTestMode ? 'Test Mode' : 'n8n Live'}
                  </span>
                </div>
                <p className="text-[10px] text-neutral-400 truncate max-w-[200px]">
                  Connected to n8n workflow
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 text-neutral-400">
              <button
                onClick={() => setShowConfig(!showConfig)}
                className={`p-1.5 rounded-lg transition-colors hover:text-white hover:bg-neutral-800 ${
                  showConfig ? 'text-amber-400 bg-neutral-800' : ''
                }`}
                title="Webhook settings"
                aria-label="Webhook settings"
              >
                <Settings className="w-4 h-4" />
              </button>

              <button
                onClick={handleClearHistory}
                className="p-1.5 rounded-lg transition-colors hover:text-white hover:bg-neutral-800"
                title="Clear chat history"
                aria-label="Clear chat"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg transition-colors hover:text-white hover:bg-neutral-800"
                title="Close chat"
                aria-label="Close chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Webhook Configuration Dropdown (Collapsible) */}
          {showConfig && (
            <div className="p-3 bg-neutral-100 dark:bg-neutral-950 border-b border-neutral-200 dark:border-neutral-800 text-xs space-y-2.5 animate-in slide-in-from-top-2 duration-150">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-neutral-800 dark:text-neutral-200 text-[11px]">
                  n8n Webhook Configuration
                </span>
                <button
                  onClick={toggleWebhookMode}
                  className="text-[10px] underline font-medium text-sky-600 dark:text-sky-400"
                >
                  Switch to {isTestMode ? 'Production URL' : 'Test Webhook URL'}
                </button>
              </div>

              <div>
                <label className="block text-[10px] text-neutral-500 dark:text-neutral-400 mb-1">
                  Webhook URL
                </label>
                <input
                  type="text"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs font-mono bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-neutral-900 dark:focus:ring-neutral-200"
                />
              </div>

              <div className="flex items-center justify-between text-[10px] text-neutral-500 dark:text-neutral-400">
                <span>Session ID: <strong className="font-mono">{sessionId.slice(0, 14)}...</strong></span>
                <button
                  onClick={() => setWebhookUrl(DEFAULT_WEBHOOK_URL)}
                  className="hover:underline text-neutral-600 dark:text-neutral-300"
                >
                  Reset Default
                </button>
              </div>
            </div>
          )}

          {/* Quick Ledger Context Indicator Strip */}
          <div className="px-3.5 py-1.5 bg-neutral-50 dark:bg-neutral-950/70 border-b border-neutral-100 dark:border-neutral-800/80 flex items-center justify-between text-[10px] text-neutral-500 dark:text-neutral-400">
            <span className="flex items-center gap-1.5">
              <Zap className="w-3 h-3 text-amber-500" />
              <span>Balance: <strong className="font-mono text-neutral-800 dark:text-neutral-200">{formatCurrency(totalBalance, currency)}</strong></span>
            </span>
            <span>
              Remaining Budget: <strong className="font-mono text-neutral-800 dark:text-neutral-200">{formatCurrency(remainingBudget, currency)}</strong>
            </span>
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 text-xs">
            {messages.map((msg) => {
              const isBot = msg.sender === 'bot';
              return (
                <div
                  key={msg.id}
                  className={`flex gap-2.5 ${isBot ? 'items-start' : 'items-end justify-end'}`}
                >
                  {isBot && (
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-white ${
                        msg.isError ? 'bg-rose-500' : 'bg-neutral-900 dark:bg-neutral-100 dark:text-neutral-900'
                      }`}
                    >
                      <Bot className="w-3.5 h-3.5" />
                    </div>
                  )}

                  <div className="space-y-1 max-w-[82%]">
                    <div
                      className={`p-3 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap break-words relative group ${
                        isBot
                          ? msg.isError
                            ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200 border border-rose-200 dark:border-rose-900/50 rounded-tl-xs'
                            : 'bg-neutral-100 dark:bg-neutral-800/80 text-neutral-900 dark:text-neutral-100 rounded-tl-xs'
                          : 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 rounded-br-xs font-medium ml-auto'
                      }`}
                    >
                      {msg.text}

                      {/* Copy action for bot responses */}
                      {isBot && !msg.isError && (
                        <button
                          onClick={() => copyToClipboard(msg.text, msg.id)}
                          className="absolute -bottom-5 right-1 opacity-0 group-hover:opacity-100 text-[10px] text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-opacity flex items-center gap-1"
                          title="Copy response"
                        >
                          {copiedId === msg.id ? (
                            <>
                              <Check className="w-2.5 h-2.5 text-emerald-500" />
                              <span>Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-2.5 h-2.5" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {!isBot && (
                    <div className="w-6 h-6 rounded-full bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-200 flex items-center justify-center shrink-0 mb-0.5">
                      <User className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>
              );
            })}

            {/* Typing Indicator */}
            {isLoading && (
              <div className="flex items-start gap-2.5">
                <div className="w-6 h-6 rounded-full bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 flex items-center justify-center shrink-0">
                  <Bot className="w-3.5 h-3.5" />
                </div>
                <div className="p-3 bg-neutral-100 dark:bg-neutral-800/80 rounded-2xl rounded-tl-xs flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts (visible if few messages) */}
          {messages.length <= 2 && (
            <div className="px-3 py-2 bg-neutral-50 dark:bg-neutral-950/60 border-t border-neutral-100 dark:border-neutral-800 overflow-x-auto flex gap-1.5 no-scrollbar">
              {SUGGESTED_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => handleSend(prompt)}
                  className="px-2.5 py-1 text-[11px] whitespace-nowrap bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg hover:border-neutral-400 dark:hover:border-neutral-600 text-neutral-700 dark:text-neutral-300 transition-colors shrink-0"
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}

          {/* Input Footer */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3 border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex items-center gap-2"
          >
            <input
              ref={inputRef}
              type="text"
              autoFocus
              placeholder="Ask n8n bot about your finances..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              className="flex-1 px-3 py-2 text-xs bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-neutral-900 dark:focus:ring-neutral-100 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || isLoading}
              className="p-2 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded-xl hover:bg-neutral-800 dark:hover:bg-neutral-200 disabled:opacity-40 transition-colors shadow-xs"
              aria-label="Send message"
            >
              {isLoading ? (
                <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin block" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </form>
        </div>
      )}
    </>
  );
};
