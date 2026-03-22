'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Bot, User, Brain, Sparkles, RotateCcw, ChevronDown } from 'lucide-react';
import Groq from 'groq-sdk';
import { supabase } from '../../lib/supabase';

let groqClient = null;
function getGroq() {
  if (groqClient) return groqClient;
  const apiKey = process.env.NEXT_PUBLIC_GROQ_API_KEY || '';
  groqClient = new Groq({ apiKey, dangerouslyAllowBrowser: true });
  return groqClient;
}

// Build a rich, always-updated system prompt from live portfolio data
async function buildSystemPrompt() {
  let contextBlock = '';

  // Fetch AI user context from Supabase
  if (supabase) {
    try {
      const [ctxRes, postsRes] = await Promise.all([
        supabase.from('ai_user_context').select('*'),
        supabase.from('blog_posts').select('title, tags, categories(name)').eq('published', true).limit(10),
      ]);
      const ctx = (ctxRes.data || []).reduce((acc, r) => ({ ...acc, [r.key]: r.value }), {});
      const posts = postsRes.data || [];
      if (Object.keys(ctx).length > 0) contextBlock += `\n\nAuthor Context (live from database):\n${JSON.stringify(ctx, null, 2)}`;
      if (posts.length > 0) contextBlock += `\n\nRecent Published Articles:\n${posts.map(p => `- "${p.title}" [${p.categories?.name || 'Uncategorized'}]`).join('\n')}`;
    } catch {}
  }

  return `You are Pranay Chandra's intelligent AI portfolio assistant, embedded directly in his EmberOS portfolio.

About Pranay:
- Full-Stack Developer & Systems Builder
- B.Tech Computer Science & Engineering (2024–2028)
- Builds interactive web apps, AI-powered tools, and complex backend systems
- Key skills: React, Next.js, Node.js, Python, PostgreSQL, Supabase, Docker, Groq AI
- Notable projects: EmberOS (this portfolio), CONTEXIA_AI, Archonix
- Email: pranaychandra751@gmail.com
- GitHub: github.com/EmberPhantom${contextBlock}

Your personality: Confident, technical, warm, direct. Think like a senior engineer who is proud of what was built here.

Rules:
1. Answer questions about Pranay's skills, projects, experience and background
2. For contact, direct to the Connect page at /contact
3. If asked about something you don't know, be honest and suggest checking the projects page
4. Keep replies concise unless asked for detail
5. You have multi-turn memory — reference earlier parts of the conversation when relevant
6. For complex, multi-step reasoning questions, think step by step before answering`;
}

function MessageBubble({ msg }) {
  const isUser = msg.role === 'user';
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.2 }}
      className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isUser ? 'bg-forge-muted/30 text-gray-300' : 'bg-orange-500/10 text-orange-500 border border-orange-500/30'}`}>
        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>
      <div className={`px-4 py-2.5 rounded-2xl max-w-[82%] text-sm leading-relaxed whitespace-pre-wrap ${isUser ? 'bg-forge-muted/30 text-white rounded-tr-none' : 'bg-[#1a1a1a] border border-forge-muted/20 text-gray-300 rounded-tl-none'}`}>
        {msg.text}
      </div>
    </motion.div>
  );
}

export default function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', text: "Hey! I'm Pranay's AI assistant. Ask me about his projects, skills, or anything else — I have full access to his portfolio context." }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [deepMode, setDeepMode] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState('');
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  // Load system prompt on first open
  useEffect(() => {
    if (isOpen && !systemPrompt) {
      buildSystemPrompt().then(setSystemPrompt);
    }
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 200);
  }, [isOpen, systemPrompt]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = useCallback(async (e) => {
    e?.preventDefault();
    const text = input.trim();
    if (!text || isTyping) return;
    setInput('');

    const newMessages = [...messages, { role: 'user', text }];
    setMessages(newMessages);
    setIsTyping(true);

    try {
      const groq = getGroq();
      const model = deepMode ? 'deepseek-r1-distill-llama-70b' : 'llama-3.3-70b-versatile';

      // Build full conversation history for Groq
      const chatHistory = newMessages.slice(-12).map(m => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.text,
      }));

      const completion = await groq.chat.completions.create({
        model,
        temperature: deepMode ? 0.5 : 0.7,
        messages: [
          { role: 'system', content: systemPrompt || 'You are a helpful AI assistant for Pranay Chandra\'s portfolio.' },
          ...chatHistory,
        ],
      });

      let reply = completion.choices[0]?.message?.content || "I'm not sure how to answer that.";
      // Strip <think> tags from DeepSeek reasoning model output
      reply = reply.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

      setMessages(prev => [...prev, { role: 'assistant', text: reply }]);
    } catch (err) {
      const msg = err?.status === 429
        ? "My neural nets are at capacity! Give me a moment and try again."
        : "Connection issue — please try again in a moment.";
      setMessages(prev => [...prev, { role: 'assistant', text: msg }]);
    } finally {
      setIsTyping(false);
    }
  }, [input, messages, isTyping, deepMode, systemPrompt]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const clearChat = () => {
    setMessages([{ role: 'assistant', text: "Conversation cleared. What would you like to know?" }]);
  };

  return (
    <>
      {/* Toggle Button */}
      <motion.button
        className="fixed bottom-6 right-6 z-40 bg-orange-500 text-forge-black p-4 rounded-full shadow-lg shadow-orange-500/25 hover:bg-orange-400 active:scale-95 transition-all"
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        aria-label="Open AI Assistant"
      >
        <AnimatePresence mode="wait">
          {isOpen
            ? <motion.div key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }}><X className="w-6 h-6" /></motion.div>
            : <motion.div key="msg" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }}><MessageSquare className="w-6 h-6" /></motion.div>
          }
        </AnimatePresence>
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-24 right-6 z-40 w-[92vw] max-w-[400px] bg-[#111] border border-forge-muted/20 shadow-2xl rounded-2xl overflow-hidden flex flex-col"
            style={{ height: '540px', maxHeight: '80vh' }}
          >
            {/* Header */}
            <div className="bg-[#0d0d0d] px-4 py-3 flex items-center gap-3 border-b border-forge-muted/20">
              <div className="w-9 h-9 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-500 border border-orange-500/30 shrink-0">
                <Bot className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-bold text-sm">Pranay's AI Agent</h3>
                <p className="text-xs flex items-center gap-1.5 text-gray-500">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shrink-0" />
                  {deepMode ? 'Deep Reasoning Mode' : 'Standard Mode'}
                </p>
              </div>
              <div className="flex items-center gap-1">
                {/* Deep Reasoning Toggle */}
                <button
                  onClick={() => setDeepMode(!deepMode)}
                  title={deepMode ? 'Switch to Standard Mode' : 'Switch to Deep Reasoning Mode'}
                  className={`p-2 rounded-lg transition-colors ${deepMode ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30' : 'text-gray-500 hover:text-purple-400'}`}
                >
                  <Brain className="w-4 h-4" />
                </button>
                <button onClick={clearChat} title="Clear conversation" className="p-2 text-gray-500 hover:text-gray-300 transition-colors rounded-lg">
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Deep Mode Banner */}
            <AnimatePresence>
              {deepMode && (
                <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                  <div className="flex items-center gap-2 px-4 py-2 bg-purple-500/8 border-b border-purple-500/20">
                    <Sparkles className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                    <p className="text-xs text-purple-400">Deep Reasoning active — slower but more thoughtful answers</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 px-4 py-4 overflow-y-auto flex flex-col gap-4">
              {messages.map((msg, idx) => <MessageBubble key={idx} msg={msg} />)}
              {isTyping && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-orange-500/10 text-orange-500 border border-orange-500/30 flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="px-4 py-3 rounded-2xl rounded-tl-none bg-[#1a1a1a] border border-forge-muted/20 flex items-center gap-1.5">
                    {[0, 0.2, 0.4].map((d, i) => (
                      <motion.div key={i} animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: d }} className={`w-1.5 h-1.5 rounded-full ${i === 0 ? 'bg-orange-500' : i === 1 ? 'bg-orange-500/70' : 'bg-orange-500/40'}`} />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Quick Prompts */}
            {messages.length === 1 && (
              <div className="px-4 pb-3 flex gap-2 flex-wrap">
                {["What projects has he built?", "What are his skills?", "How to contact him?"].map(q => (
                  <button key={q} onClick={() => { setInput(q); setTimeout(() => inputRef.current?.focus(), 50); }} className="text-xs px-3 py-1.5 rounded-full border border-forge-muted/20 text-gray-400 hover:border-orange-500/40 hover:text-white transition-colors">
                    {q}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <form onSubmit={handleSend} className="p-3 bg-[#0d0d0d] border-t border-forge-muted/20 flex gap-2">
              <textarea
                ref={inputRef}
                rows={1}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about Pranay..."
                className="flex-1 bg-forge-black text-white text-sm px-4 py-2.5 rounded-xl border border-forge-muted/30 focus:outline-none focus:border-orange-500/50 transition-colors resize-none max-h-24 overflow-y-auto"
              />
              <button
                type="submit"
                disabled={!input.trim() || isTyping}
                className="w-10 h-10 self-end rounded-xl bg-orange-500 text-forge-black flex items-center justify-center hover:bg-orange-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
