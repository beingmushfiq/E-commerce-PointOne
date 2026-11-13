import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, X, Send, Bot, User as UserIcon, ShoppingBag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import { useCurrency } from '../contexts/CurrencyContext';
import type { ProductItem } from '../types/ui';

interface Message {
  sender: 'user' | 'assistant';
  text: string;
  products?: ProductItem[];
  intent?: string;
}

export const FloatingAiWidget: React.FC<{ onAddToCart?: (product: ProductItem) => void }> = ({
  onAddToCart,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const { formatPrice } = useCurrency();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'assistant',
      text: 'স্বাগতম! আমি CENTERPOINT ইন্টেলিজেন্ট অ্যাসিস্ট্যান্ট। কীভাবে আপনাকে সাহায্য করতে পারি? (Welcome! How may I assist your curation today?)',
    },
  ]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async (customPrompt?: string) => {
    const textToSend = customPrompt || input;
    if (!textToSend.trim() || loading) return;

    const userMsg: Message = { sender: 'user', text: textToSend };
    setMessages(prev => [...prev, userMsg]);
    if (!customPrompt) setInput('');
    setLoading(true);

    try {
      const res = await api.post('/ai/chat', { message: textToSend });
      const data = res.data?.data;

      const botMsg: Message = {
        sender: 'assistant',
        text: data?.response || 'আপনার অনুরোধটি প্রসেস করা হয়েছে।',
        products: data?.context?.products || [],
        intent: data?.intent,
      };

      setMessages(prev => [...prev, botMsg]);
    } catch {
      setMessages(prev => [
        ...prev,
        {
          sender: 'assistant',
          text: 'দুঃখিত, সংযোগে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন। (Connection error, please try again.)',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Action Trigger */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-40 p-4 rounded-full bg-zinc-900 text-amber-400 dark:bg-white dark:text-zinc-900 shadow-2xl flex items-center justify-center border border-amber-500/30 group"
        title="AI Shopping Concierge"
      >
        <Sparkles className="w-6 h-6 animate-pulse group-hover:rotate-12 transition-transform duration-300" />
      </motion.button>

      {/* Concierge Modal Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="fixed bottom-24 right-6 z-50 w-full max-w-[380px] sm:max-w-[420px] h-[550px] bg-white/95 dark:bg-[#121215]/95 backdrop-blur-2xl rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 bg-zinc-900 text-white flex items-center justify-between border-b border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500 text-zinc-950 flex items-center justify-center font-bold">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-sm tracking-wide">CENTERPOINT Concierge</h3>
                  <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 font-mono">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Local NLP · Bangla & English</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-zinc-400 hover:text-white p-1 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs leading-relaxed">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div className="flex items-start gap-2 max-w-[85%]">
                    {msg.sender === 'assistant' && (
                      <div className="w-6 h-6 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0 mt-0.5">
                        <Bot className="w-3.5 h-3.5" />
                      </div>
                    )}
                    <div
                      className={`p-3 rounded-2xl ${
                        msg.sender === 'user'
                          ? 'bg-zinc-900 text-white rounded-br-none'
                          : 'bg-zinc-100 dark:bg-zinc-800/80 text-zinc-800 dark:text-zinc-200 rounded-bl-none border border-zinc-200 dark:border-zinc-700/60'
                      }`}
                    >
                      {msg.text}
                    </div>
                    {msg.sender === 'user' && (
                      <div className="w-6 h-6 rounded-full bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200 flex items-center justify-center shrink-0 mt-0.5">
                        <UserIcon className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </div>

                  {/* Render Product Cards if Returned by AI */}
                  {msg.products && msg.products.length > 0 && (
                    <div className="mt-2 pl-8 w-full space-y-2">
                      {msg.products.slice(0, 2).map((prod) => (
                        <div
                          key={prod.id}
                          className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm"
                        >
                          <div className="flex items-center gap-2">
                            <img
                              src={prod.image_url || 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=100'}
                              alt=""
                              className="w-10 h-10 rounded-lg object-cover"
                            />
                            <div>
                              <p className="font-semibold text-zinc-900 dark:text-zinc-100 line-clamp-1">{prod.name}</p>
                              <p className="font-mono text-amber-600 dark:text-amber-400 font-bold">{formatPrice(prod.price)}</p>
                            </div>
                          </div>
                          {onAddToCart && (
                            <button
                              onClick={() => onAddToCart(prod)}
                              className="p-1.5 bg-zinc-900 hover:bg-black text-amber-400 rounded-lg transition"
                              title="Add to Bag"
                            >
                              <ShoppingBag className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {loading && (
                <div className="flex items-center gap-2 text-zinc-400 text-xs pl-8">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-bounce" />
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-bounce [animation-delay:0.2s]" />
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-bounce [animation-delay:0.4s]" />
                  <span>Thinking...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Chips */}
            <div className="px-4 py-2 border-t border-zinc-200 dark:border-zinc-800 flex items-center gap-1.5 overflow-x-auto text-[11px] whitespace-nowrap bg-zinc-50 dark:bg-zinc-900/50">
              <button
                onClick={() => handleSend('ঘড়ি দেখান (Show Watches)')}
                className="px-2.5 py-1 rounded-full bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 hover:border-amber-500 transition text-zinc-600 dark:text-zinc-300"
              >
                ⌚ ঘড়ি দেখান
              </button>
              <button
                onClick={() => handleSend('ডেলিভারি পলিসি কী? (Delivery Policy)')}
                className="px-2.5 py-1 rounded-full bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 hover:border-amber-500 transition text-zinc-600 dark:text-zinc-300"
              >
                🚚 ডেলিভারি পলিসি
              </button>
              <button
                onClick={() => handleSend('Featured products')}
                className="px-2.5 py-1 rounded-full bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 hover:border-amber-500 transition text-zinc-600 dark:text-zinc-300"
              >
                ✨ New Arrivals
              </button>
            </div>

            {/* Input Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="p-3 bg-white dark:bg-[#121215] border-t border-zinc-200 dark:border-zinc-800 flex items-center gap-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask in Bangla or English..."
                className="flex-1 bg-zinc-100 dark:bg-zinc-800 border-none rounded-xl px-3.5 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="p-2 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-black disabled:opacity-50 transition"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

