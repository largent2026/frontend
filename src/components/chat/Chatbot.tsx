'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { chatApi, type ChatMessage } from '@/lib/api';
import { getAccessToken } from '@/lib/auth';
import { useLocale } from '@/contexts/LocaleContext';

const PANEL_HEIGHT = 'min(85vh, 520px)';
const PANEL_WIDTH = 'min(100vw - 2rem, 400px)';

export function Chatbot() {
  const { t } = useTranslation();
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [error, setError] = useState<string | null>(null);
  const streamAbortRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    setInput('');
    setError(null);
    const userMsg: ChatMessage = { role: 'user', content: text };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);
    setStreamingContent('');

    const token = getAccessToken();
    const history = messages.map((m) => ({ role: m.role, content: m.content }));

    streamAbortRef.current = chatApi.chatStream(
      { message: text, locale, history },
      {
        onChunk: (chunk) => setStreamingContent((c) => c + chunk),
        onDone: () => {
          setStreamingContent((content) => {
            if (content) {
              setMessages((prev) => [...prev, { role: 'assistant', content }]);
            } else {
              setMessages((prev) => [
                ...prev,
                { role: 'assistant', content: t('chat.errorEmpty') },
              ]);
            }
            return '';
          });
          setLoading(false);
        },
        onError: (err) => {
          setMessages((prev) => [
            ...prev,
            { role: 'assistant', content: t('chat.errorResponse') },
          ]);
          setError(err.message);
          setLoading(false);
        },
      },
      token
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/20"
            onClick={() => setOpen(false)}
            aria-hidden
          />
        )}
      </AnimatePresence>

      <div
        className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3"
        style={{ fontFamily: 'system-ui, sans-serif' }}
      >
        <AnimatePresence mode="wait">
          {open ? (
            <motion.div
              key="panel"
              initial={{ opacity: 0, y: 20, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.96 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="flex flex-col rounded-2xl border border-border bg-background shadow-2xl"
              style={{
                width: PANEL_WIDTH,
                height: PANEL_HEIGHT,
              }}
            >
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <span className="text-sm font-medium text-foreground">
                  {t('chat.title')}
                </span>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-full p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                  aria-label={t('chat.close')}
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 && !loading && (
                  <div className="rounded-xl bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
                    {t('chat.welcome')}
                  </div>
                )}
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                        msg.role === 'user'
                          ? 'bg-foreground text-primary-foreground'
                          : 'bg-muted text-foreground'
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex justify-start">
                    <div className="max-w-[85%] rounded-2xl bg-muted px-4 py-2.5 text-sm text-foreground">
                      {streamingContent ? (
                        <p className="whitespace-pre-wrap break-words">{streamingContent}</p>
                      ) : (
                        <div className="flex items-center gap-1.5" aria-label={t('chat.typing')}>
                          <span className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce [animation-delay:-0.3s]" />
                          <span className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce [animation-delay:-0.15s]" />
                          <span className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce" />
                        </div>
                      )}
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {error && (
                <div className="px-4 py-1 text-xs text-red-600 dark:text-red-400">
                  {error}
                </div>
              )}

              <div className="border-t border-border p-3">
                <div className="flex gap-2">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={t('chat.placeholder')}
                    rows={1}
                    className="min-h-[44px] w-full resize-none rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20"
                    disabled={loading}
                    maxLength={2000}
                  />
                  <button
                    type="button"
                    onClick={sendMessage}
                    disabled={loading || !input.trim()}
                    className="flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-xl bg-foreground text-primary-foreground transition hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label={t('chat.send')}
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </button>
                </div>
                <p className="mt-2 text-center">
                  <a
                    href={`/${locale}/#contact`}
                    className="text-xs text-muted-foreground underline hover:text-foreground"
                  >
                    {t('chat.humanSupport')}
                  </a>
                </p>
              </div>
            </motion.div>
          ) : (
            <motion.button
              key="fab"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={() => setOpen(true)}
              className="flex h-14 w-14 items-center justify-center rounded-2xl bg-foreground text-primary-foreground shadow-lg transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-foreground/30"
              aria-label={t('chat.open')}
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
