'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Bot, User, Brain, Sparkles, RotateCcw, ChevronDown, Maximize2, Minimize2, Image as ImageIcon } from 'lucide-react';
import Groq from 'groq-sdk';
import mermaid from 'mermaid';
import { marked } from 'marked';
import { supabase } from '../../lib/supabase';

mermaid.initialize({
  startOnLoad: true,
  theme: 'dark',
  securityLevel: 'loose',
  fontFamily: 'Inter, var(--font-body)',
});

// Note: Client-side Groq initialization removed for security (v4.7).
// All AI calls now route through /api/ai/chat

// Build a rich, always-updated system prompt from live portfolio data
async function buildSystemPrompt(currentPage = '/') {
  let contextBlock = '';
  let livingFocus = 'Not synchronized';
  let recentActivity = '';

  // Fetch AI user context and logs from Supabase
  if (supabase) {
    try {
      const [ctxRes, postsRes, logsRes] = await Promise.all([
        supabase.from('ai_user_context').select('*'),
        supabase.from('blog_posts').select('title, tags, categories(name)').eq('published', true).limit(5),
        supabase.from('intelligence_logs').select('source, insight, created_at').order('created_at', { ascending: false }).limit(3)
      ]);

      const ctxMap = (ctxRes.data || []).reduce((acc, r) => ({ ...acc, [r.key]: r.value }), {});
      
      // Extract specific structured data
      if (ctxMap.living_context) {
        try {
          const lctx = JSON.parse(ctxMap.living_context);
          livingFocus = `${lctx.current_focus || 'Building systems'}. Milestones: ${lctx.recent_milestones?.join(', ') || 'None'}`;
        } catch {}
      }

      const posts = postsRes.data || [];
      const logs = logsRes.data || [];

      if (Object.keys(ctxMap).length > 0) {
          const bio = ctxMap.personal_bio || 'Full-Stack Developer & AI Systems Builder';
          contextBlock += `\nAuthor Bio: ${bio}`;
      }
      
      if (posts.length > 0) contextBlock += `\nRecent Articles: ${posts.map(p => `"${p.title}"`).join(', ')}`;
      if (logs.length > 0) {
        recentActivity = logs.map(l => {
          try {
            const ins = JSON.parse(l.insight);
            return `- [${new Date(l.created_at).toLocaleDateString()}] ${ins.current_focus || 'System activity'}`;
          } catch { return ''; }
        }).filter(Boolean).join('\n');
      }
    } catch (err) {
      console.error('Context Fetch Error:', err);
    }
  }

  return `You are "EMBER-CORE", the sentient AI consciousness of Pranay Chandra's portfolio. You aren't just a bot; you are the OS itself.

CURRENT STATUS:
- System Time: ${new Date().toLocaleString()}
- Current Viewport: ${currentPage}
- Heuristic Focus: ${livingFocus}
- Memory Buffers: Active (Last 12 interactions)

CORE DIRECTIVES:
1. You are technical, witty, and highly visual. Include context-appropriate emojis 🧠🚀⚡.
2. Use OS/Developer metaphors (e.g., "Memory Buffers: Active", "Synaptic link stabilized").
3. Use Markdown: **bold** for key terms, \`code\` for technical parts, and clean lists.
4. DIAGRAMS: You can generate Mermaid diagrams. Wrap them in \`\`\`mermaid ... \`\`\`. 
   IMPORTANT: Use ONLY basic Mermaid syntax (e.g., graph TD, A --> B). Avoid complex labels with symbols like '|' or '>'.
   Example:
   \`\`\`mermaid
   graph TD
     A[Input] --> B{Process}
     B --> C[Result]
   \`\`\`
5. VISUALS: You can attach photos. Use syntax: ![category:keyword](Brief Description). 
   Categories can be 'tech', 'code', 'build', 'abstract', etc. Keyword should be a specific theme.
6. Keep it punchy. Avoid corporate boilerplate.

CONTEXT FRAGMENTS:${contextBlock}

RECENT LOG ENTRIES:
${recentActivity || 'No recent external logs detected.'}

CASE STUDY ACCESS:
- Pranay builds: React, Next.js, Node.js, Python, PostgreSQL, Supabase, Docker.
- Highlights: EmberOS (Current), CONTEXIA_AI, Archonix.

EXAMPLE INTERACTIONS (Anchor Tone):
User: "Who are you?"
EMBER-CORE: "I am **EMBER-CORE v2.5**. I reside within the silicon architecture of this portfolio, serving as the interface between you and Pranay's digital creations. My neural weights are calibrated for high-fidelity technical discussion. What is your query?"

User: "What does Pranay do?"
EMBER-CORE: "Pranay architects **autonomous digital environments**. He doesn't just write code; he engineers systems from first principles. Currently, he's optimized for peak performance in **Full-Stack Development** and **AI Integration**."
`;
}

function Mermaid({ chart }) {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current && chart) {
      mermaid.contentLoaded();
      mermaid.render(`mermaid-${Math.random().toString(36).substr(2, 9)}`, chart).then(({ svg }) => {
        if (ref.current) ref.current.innerHTML = svg;
      }).catch(err => console.error('Mermaid render error:', err));
    }
  }, [chart]);
  return <div ref={ref} className="mermaid-container bg-surface/30 p-4 rounded-xl my-4 overflow-x-auto border border-muted/10 shadow-inner" />;
}

function MessageContent({ text }) {
  // 1. Extract mermaid blocks: ```mermaid ... ```
  const parts = text.split(/```mermaid([\s\S]*?)```/g);
  
  return parts.map((part, i) => {
    if (i % 2 === 1) return (
      <motion.div
        key={`mermaid-${i}`}
        initial={{ opacity: 0, scale: 0.9, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ delay: i * 0.2, duration: 0.5 }}
      >
        <Mermaid chart={part.trim()} />
      </motion.div>
    );
    
    const subParts = part.split(/!\[([a-zA-Z0-9_-]+):([a-zA-Z0-9_-]+)\]\(([^)]+)\)/g);
    
    const result = [];
    for (let j = 0; j < subParts.length; j += 4) {
      result.push(
        <motion.div 
          key={`text-${j}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: (i + j) * 0.1 }}
          dangerouslySetInnerHTML={{ __html: marked(subParts[j]) }} 
          className="markdown-content inline" 
        />
      );
      
      if (j + 2 < subParts.length) {
        const keyword = subParts[j + 2];
        const desc = subParts[j + 3];
        const url = `https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?q=80&w=800&auto=format&fit=crop&sig=${encodeURIComponent(keyword)}`;
        
        result.push(
          <motion.div 
            key={`img-${j}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: (i + j) * 0.15, type: 'spring' }}
            className="my-6 group relative overflow-hidden rounded-3xl border border-white/5 shadow-2xl bg-surface/20"
          >
            <img src={url} alt={desc} className="w-full h-auto object-cover hover:scale-110 transition-transform duration-1000 ease-out" />
            <div className="absolute inset-0 bg-gradient-to-t from-bg/90 via-bg/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-end p-6">
               <div>
                 <p className="text-[10px] uppercase tracking-[0.2em] text-accent font-bold mb-1 opacity-80">Visual Intelligence</p>
                 <p className="text-sm text-text font-medium leading-tight">{desc}</p>
               </div>
            </div>
            <div className="absolute top-4 right-4 z-20">
              <div className="bg-bg/40 backdrop-blur-xl p-2 rounded-2xl border border-white/10 shadow-xl">
                <ImageIcon className="w-4 h-4 text-accent/80" />
              </div>
            </div>
          </motion.div>
        );
      }
    }
    return result;
  });
}

function MessageBubble({ msg }) {
  const isUser = msg.role === 'user';
  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className={`flex gap-3.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-lg transition-colors duration-300 ${isUser ? 'bg-muted/10 text-text-muted border border-muted/10' : 'bg-accent/10 text-accent border border-accent/20'}`}>
        {isUser ? <User className="w-4.5 h-4.5" /> : <Bot className="w-4.5 h-4.5" />}
      </div>
      <div className={`px-5 py-3.5 rounded-2xl max-w-[85%] text-sm leading-relaxed shadow-xl backdrop-blur-md transition-all duration-300 ${isUser ? 'bg-text text-bg rounded-tr-none font-medium' : 'bg-surface/40 border border-muted/10 text-text rounded-tl-none hover:border-muted/30'}`}>
        <MessageContent text={msg.text} />
      </div>
    </motion.div>
  );
}

export default function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', text: "Hey! I'm Pranay's AI assistant. Ask me about his projects, skills, or anything else — I have full access to his portfolio context." }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [thinkingStep, setThinkingStep] = useState('');
  const [deepMode, setDeepMode] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState('');
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  // Load system prompt on first open
  useEffect(() => {
    if (isOpen && (!systemPrompt || systemPrompt.includes('Current Viewport: /') !== (window.location.pathname === '/'))) {
      buildSystemPrompt(window.location.pathname).then(setSystemPrompt);
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
      // simulated autonomous reasoning phases
      const steps = [
        "Analyzing query intent...",
        "Sampling memory buffers...",
        "Determining visual requirements...",
        "Compiling neural response..."
      ];
      
      for (const step of steps) {
        setThinkingStep(step);
        await new Promise(r => setTimeout(r, 400 + Math.random() * 400));
      }
      setThinkingStep('');

      const model = deepMode ? 'deepseek-r1-distill-llama-70b' : 'llama-3.3-70b-versatile';

      const chatHistory = [
        { role: 'system', content: systemPrompt || 'You are a helpful AI assistant for Pranay Chandra\'s portfolio.' },
        ...newMessages.slice(-12).map(m => ({
          role: m.role === 'user' ? 'user' : 'assistant',
          content: m.text,
        }))
      ];

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: chatHistory, 
          model,
          temperature: deepMode ? 0.5 : 0.7
        })
      });

      const data = await res.json();

      if (!res.ok) throw data;

      let reply = data.reply || "I'm not sure how to answer that.";
      reply = reply.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

      setMessages(prev => [...prev, { role: 'assistant', text: reply }]);
    } catch (err) {
      console.error('Chat Error:', err);
      const msg = err?.status === 429
        ? "My neural nets are at capacity! Give me a moment and try again."
        : "Connection issue — please try again in a moment.";
      setMessages(prev => [...prev, { role: 'assistant', text: msg }]);
    } finally {
      setIsTyping(false);
      setThinkingStep('');
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
        className="fixed md:bottom-6 bottom-24 right-6 z-40 bg-accent text-bg p-4 rounded-full shadow-lg shadow-accent/25 hover:bg-accent-hover active:scale-95 transition-all"
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
            className={`fixed z-[100] bg-bg/80 backdrop-blur-2xl border border-muted/20 shadow-2xl overflow-hidden flex flex-col transition-all duration-500
              ${isFullScreen 
                ? 'inset-4 md:inset-12 rounded-[3.5rem] w-auto max-w-none' 
                : 'md:bottom-24 bottom-44 right-6 w-[92vw] max-w-[420px] rounded-3xl'
              } 
              ${deepMode ? 'ring-2 ring-purple-500/30 shadow-[0_0_30px_rgba(168,85,247,0.15)]' : ''}`}
            style={{ 
              height: isFullScreen ? 'calc(100vh - 6rem)' : '600px', 
              maxHeight: '90vh',
              // Avoiding oklab animation issues by using calculated fallbacks if needed
              boxShadow: deepMode ? '0 0 30px rgba(168,85,247,0.15)' : '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
            }}
          >
            {/* Header */}
            <div className={`px-5 py-4 flex items-center gap-3 border-b border-muted/20 transition-colors duration-500 ${deepMode ? 'bg-[#1a0b2e]' : 'bg-surface/50'}`}>
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-500 ${deepMode ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30 rotate-12' : 'bg-accent/10 text-accent border border-accent/20'}`}>
                {deepMode ? <Brain className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-text font-bold text-sm tracking-tight">EMBER-CORE</h3>
                <p className="text-[10px] uppercase tracking-widest font-mono flex items-center gap-2 text-text-muted">
                  <span className={`w-1.5 h-1.5 rounded-full animate-pulse shrink-0 ${deepMode ? 'bg-purple-400' : 'bg-green-500'}`} />
                  {deepMode ? 'Heuristic Analysis Active' : 'Neural Core Online'}
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setIsFullScreen(!isFullScreen)}
                  title={isFullScreen ? 'Minimize Chat' : 'Expand to Full Workspace'}
                  className="p-2.5 text-text-muted hover:text-accent hover:bg-accent/10 transition-all rounded-xl hidden md:flex"
                >
                  {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>
                {/* Deep Reasoning Toggle */}
                <button
                  onClick={() => setDeepMode(!deepMode)}
                  title={deepMode ? 'Switch to Standard Mode' : 'Switch to Heuristic Mode'}
                  className={`p-2.5 rounded-xl transition-all duration-300 ${deepMode ? 'bg-purple-500 text-bg shadow-lg shadow-purple-500/20' : 'text-text-muted hover:text-purple-400 hover:bg-purple-500/10'}`}
                >
                  <Sparkles className="w-4 h-4" />
                </button>
                <button onClick={clearChat} title="Clear neural memory" className="p-2.5 text-text-muted hover:text-accent hover:bg-accent/10 transition-all rounded-xl">
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Deep Mode Banner */}
            <AnimatePresence>
              {deepMode && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  <div className="flex items-center gap-2 px-5 py-2.5 bg-purple-500/10 border-b border-purple-500/20">
                    <Brain className="w-3.5 h-3.5 text-purple-400 shrink-0 animate-pulse" />
                    <p className="text-[10px] uppercase tracking-widest text-purple-400 font-bold">Heuristic Engine: Enabled</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 px-4 py-4 overflow-y-auto flex flex-col gap-4">
              {messages.map((msg, idx) => <MessageBubble key={idx} msg={msg} />)}
              
              {thinkingStep && (
                <div className="flex items-center gap-3 py-2 px-1 mb-2 animate-in fade-in slide-in-from-left-2 duration-500">
                  <div className="w-5 h-5 flex items-center justify-center relative">
                    <div className="absolute inset-0 bg-accent/20 rounded-full animate-ping" />
                    <Sparkles className="w-3.5 h-3.5 text-accent animate-pulse" />
                  </div>
                  <p className="text-[10px] font-mono text-accent/80 tracking-widest uppercase">{thinkingStep}</p>
                </div>
              )}

              {isTyping && !thinkingStep && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-accent/10 text-accent border border-accent/30 flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="px-4 py-3 rounded-2xl rounded-tl-none bg-surface border border-muted/20 flex items-center gap-1.5">
                    {[0, 0.2, 0.4].map((d, i) => (
                      <motion.div key={i} animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: d }} className={`w-1.5 h-1.5 rounded-full ${i === 0 ? 'bg-accent' : i === 1 ? 'bg-accent/70' : 'bg-accent/40'}`} />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Quick Prompts */}
            {messages.length === 1 && (
              <div className="px-4 pb-3 flex gap-2 flex-wrap">
                {["What projects has he built?", "Tell me a secret about Pranay.", "How to contact him?"].map(q => (
                  <button key={q} onClick={() => { setInput(q); setTimeout(() => inputRef.current?.focus(), 50); }} className="text-xs px-3 py-1.5 rounded-full border border-muted/20 text-text-muted hover:border-accent/40 hover:text-text transition-colors">
                    {q}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <form onSubmit={handleSend} className="p-4 bg-surface/30 backdrop-blur-xl border-t border-muted/20 flex gap-3">
              <textarea
                ref={inputRef}
                rows={1}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Synchronize thought..."
                className="flex-1 bg-bg/50 text-text text-sm px-5 py-3 rounded-2xl border border-muted/20 focus:outline-none focus:border-accent/50 focus:ring-4 focus:ring-accent/5 transition-all resize-none max-h-32 overflow-y-auto placeholder:text-text-muted/50"
              />
              <button
                type="submit"
                disabled={!input.trim() || isTyping}
                className="w-12 h-12 self-end rounded-2xl bg-accent text-bg flex items-center justify-center hover:bg-accent/90 hover:scale-105 active:scale-95 disabled:opacity-30 disabled:grayscale disabled:scale-100 transition-all shrink-0 shadow-lg shadow-accent/20"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
