'use client';

import { useState, useCallback } from 'react';
import { Sparkles, X, Loader2, Wand2, BookOpen, ZoomIn, ZoomOut, PlusCircle, LightbulbIcon, Copy, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { improveWriting, simplifyText, expandText, summarizeText, generateSection, generateHeadlines } from '../../lib/blog-ai';
import { motion, AnimatePresence } from 'framer-motion';

const AI_ACTIONS = [
  { id: 'improve', label: 'Improve Writing', icon: Wand2, desc: 'Polish grammar, flow & clarity', color: 'text-blue-400', needsSelection: true },
  { id: 'simplify', label: 'Simplify', icon: ZoomIn, desc: 'Explain in simpler terms', color: 'text-green-400', needsSelection: true },
  { id: 'expand', label: 'Expand', icon: ZoomOut, desc: 'Add more depth & examples', color: 'text-purple-400', needsSelection: true },
  { id: 'summarize', label: 'Summarize', icon: BookOpen, desc: 'Condense to key points', color: 'text-yellow-400', needsSelection: true },
  { id: 'generate', label: 'Generate Section', icon: PlusCircle, desc: 'Write new content from a prompt', color: 'text-orange-400', needsSelection: false },
  { id: 'headlines', label: 'Headline Ideas', icon: LightbulbIcon, desc: 'Get 5 headline options', color: 'text-pink-400', needsSelection: false },
];

export default function AIWritingPanel({ selectedText, editor, onInsert, onClose }) {
  const [activeAction, setActiveAction] = useState(null);
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState('');
  const [headlines, setHeadlines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [promptVisible, setPromptVisible] = useState(true);

  const runAction = useCallback(async (actionId) => {
    const action = AI_ACTIONS.find(a => a.id === actionId);
    if (!action) return;

    const inputText = action.needsSelection ? selectedText : prompt;
    if (!inputText?.trim()) return;

    setActiveAction(actionId);
    setLoading(true);
    setResult('');
    setHeadlines([]);

    try {
      if (actionId === 'improve') setResult(await improveWriting(inputText));
      else if (actionId === 'simplify') setResult(await simplifyText(inputText));
      else if (actionId === 'expand') setResult(await expandText(inputText));
      else if (actionId === 'summarize') setResult(await summarizeText(inputText));
      else if (actionId === 'generate') setResult(await generateSection(inputText));
      else if (actionId === 'headlines') setHeadlines(await generateHeadlines(inputText));
    } finally {
      setLoading(false);
    }
  }, [selectedText, prompt]);

  const handleInsert = () => {
    if (result) { onInsert(result); setResult(''); }
  };

  const handleCopy = async (text) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleInsertHeadline = (headline) => {
    editor?.chain().focus().setContent(`<h1>${headline}</h1>`).run();
    setHeadlines([]);
  };

  return (
    <motion.div
      initial={{ x: 320, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 320, opacity: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="w-80 flex flex-col bg-[#111] border-l border-forge-muted/20 overflow-y-auto shrink-0"
    >
      {/* Panel Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-forge-muted/20 bg-[#0d0d0d]">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-orange-500" />
          <span className="font-bold text-white text-sm">AI Writing Assistant</span>
        </div>
        <button onClick={onClose} className="p-1 text-gray-500 hover:text-white transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Selection Context */}
      {selectedText && (
        <div className="mx-3 mt-3 p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
          <p className="text-xs text-orange-400 font-mono font-bold mb-1 uppercase tracking-wider">Selected Text</p>
          <p className="text-sm text-gray-300 line-clamp-3">{selectedText}</p>
        </div>
      )}

      {/* Action Grid */}
      <div className="p-3 space-y-1.5">
        <p className="text-xs font-mono text-gray-600 uppercase tracking-widest mb-2">Choose Action</p>
        {AI_ACTIONS.map((action) => {
          const Icon = action.icon;
          const disabled = action.needsSelection && !selectedText;
          return (
            <button
              key={action.id}
              onClick={() => runAction(action.id)}
              disabled={disabled || loading}
              className={`w-full flex items-start gap-3 p-3 rounded-lg text-left transition-all group
                ${activeAction === action.id && loading ? 'bg-orange-500/10 border border-orange-500/30' : 'hover:bg-forge-muted/20 border border-transparent'}
                ${disabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <Icon className={`w-4 h-4 shrink-0 mt-0.5 ${action.color}`} />
              <div>
                <p className="text-sm font-medium text-white">{action.label}</p>
                <p className="text-xs text-gray-500">{disabled ? 'Select text first' : action.desc}</p>
              </div>
              {activeAction === action.id && loading && (
                <Loader2 className="w-4 h-4 animate-spin text-orange-500 ml-auto shrink-0 mt-0.5" />
              )}
            </button>
          );
        })}
      </div>

      {/* Generate / Headline Custom Prompt */}
      <div className="px-3 pb-3">
        <button
          onClick={() => setPromptVisible(!promptVisible)}
          className="w-full flex items-center justify-between text-xs font-mono text-gray-500 uppercase tracking-widest mb-2"
        >
          <span>Custom Prompt</span>
          {promptVisible ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
        {promptVisible && (
          <div className="space-y-2">
            <textarea
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              placeholder="Describe the section you want to write, or the topic for headlines..."
              rows={3}
              className="w-full bg-forge-black border border-forge-muted/30 rounded-lg px-3 py-2 text-sm text-gray-300 font-body outline-none focus:border-orange-500 resize-none"
            />
            <div className="flex gap-2">
              <button
                onClick={() => runAction('generate')}
                disabled={!prompt.trim() || loading}
                className="flex-1 py-1.5 bg-orange-500 text-forge-black text-xs font-bold rounded-lg hover:bg-orange-400 disabled:opacity-40 transition-colors"
              >
                Generate
              </button>
              <button
                onClick={() => runAction('headlines')}
                disabled={!prompt.trim() || loading}
                className="flex-1 py-1.5 bg-forge-muted/20 text-gray-300 text-xs font-bold rounded-lg hover:bg-forge-muted/40 disabled:opacity-40 transition-colors"
              >
                Headlines
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Result Area */}
      <AnimatePresence>
        {(result || headlines.length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mx-3 mb-3 p-3 bg-[#0a0a0a] border border-forge-muted/20 rounded-lg"
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-mono text-gray-500 uppercase tracking-wider">Result</p>
              <button onClick={() => handleCopy(result || headlines.join('\n'))} className="text-gray-500 hover:text-white p-1">
                {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>

            {result && (
              <div className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto mb-3">
                {result}
              </div>
            )}

            {headlines.length > 0 && (
              <div className="space-y-2 max-h-48 overflow-y-auto mb-3">
                {headlines.map((h, i) => (
                  <button
                    key={i}
                    onClick={() => handleInsertHeadline(h)}
                    className="w-full text-left text-sm text-white p-2 rounded-lg hover:bg-orange-500/10 border border-forge-muted/20 hover:border-orange-500/30 transition-colors"
                  >
                    <span className="text-orange-500 font-mono text-xs mr-2">{i + 1}.</span>
                    {h}
                  </button>
                ))}
              </div>
            )}

            {result && (
              <div className="flex gap-2">
                <button
                  onClick={handleInsert}
                  className="flex-1 py-1.5 bg-orange-500 text-forge-black text-xs font-bold rounded-lg hover:bg-orange-400 transition-colors"
                >
                  Insert into Editor
                </button>
                <button onClick={() => { setResult(''); setActiveAction(null); }} className="py-1.5 px-3 text-gray-500 text-xs rounded-lg hover:text-white hover:bg-forge-muted/20">
                  Clear
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
