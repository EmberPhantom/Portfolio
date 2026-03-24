'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowRight, Brain, Target, Zap, Github, Image, Folder, Loader2 } from 'lucide-react';

export default function AIPersonalizedBriefing() {
  const [insight, setInsight] = useState(null);
  const [syncing, setSyncing] = useState(true);

  useEffect(() => {
    fetchBriefing();
  }, []);

  async function fetchBriefing() {
    setSyncing(true);
    try {
      const res = await fetch('/api/intelligence/sync');
      const data = await res.json();
      if (data && !data.error) {
        setInsight(data);
      }
    } catch (err) {
      console.error('Briefing Fetch Error:', err);
    } finally {
      setSyncing(false);
    }
  }

  if (syncing && !insight) {
    return (
      <div className="p-8 bg-surface border border-accent/20 rounded-3xl flex flex-col items-center justify-center gap-4 animate-pulse">
        <Brain className="w-8 h-8 text-accent animate-bounce" />
        <p className="text-xs font-black text-accent uppercase tracking-[0.3em]">Synchronizing Intelligence...</p>
      </div>
    );
  }

  if (!insight) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden group"
    >
      {/* Background Glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent pointer-events-none" />
      
      <div className="relative p-8 bg-surface border border-muted/20 rounded-3xl shadow-2xl shadow-black/20">
        <div className="flex flex-col md:flex-row gap-8">
          
          {/* Main Insight Section */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-accent text-bg rounded-lg">
                <Sparkles className="w-4 h-4" />
              </div>
              <h3 className="font-display text-xl font-black text-text uppercase tracking-tight">Morning Intelligence Briefing</h3>
            </div>

            <div className="space-y-6">
              <div>
                <span className="text-[10px] font-black text-accent uppercase tracking-widest mb-2 block">Current Focus</span>
                <p className="text-2xl font-bold text-text leading-tight">{insight.current_focus}</p>
              </div>

              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2 px-4 py-2 bg-bg/50 border border-muted/10 rounded-full">
                  <Zap className="w-3 h-3 text-yellow-500" />
                  <span className="text-xs text-text-muted">{insight.life_mood || 'Analyzing Vibe...'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Suggested Actions Panel */}
          <div className="w-full md:w-80 bg-bg/50 border border-muted/10 rounded-2xl p-6">
            <h4 className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-4 flex items-center gap-2">
              <Target className="w-3 h-3" /> Momentum Suggestions
            </h4>
            <div className="space-y-3">
              {insight.suggested_actions?.map((action, i) => (
                <motion.button 
                  key={i}
                  whileHover={{ x: 5 }}
                  className="w-full flex items-center justify-between p-3 bg-surface border border-muted/10 rounded-xl text-left hover:border-accent/50 transition-all group"
                >
                  <span className="text-xs text-text/80 font-medium pr-4">{action}</span>
                  <ArrowRight className="w-3 h-3 text-accent opacity-0 group-hover:opacity-100 transition-opacity" />
                </motion.button>
              ))}
            </div>
          </div>
        </div>

        {/* Sync Status Footer */}
        <div className="mt-8 pt-6 border-t border-muted/10 flex items-center justify-between">
          <div className="flex items-center gap-4 text-[10px] font-mono text-text-muted/50">
            <span className="flex items-center gap-1"><Github className="w-3 h-3" /> GitHub OK</span>
            <span className="flex items-center gap-1"><Image className="w-3 h-3" /> Photos OK</span>
            <span className="flex items-center gap-1"><Folder className="w-3 h-3" /> Drive OK</span>
          </div>
          <button 
            onClick={fetchBriefing} 
            disabled={syncing}
            className="text-[10px] font-black text-accent uppercase tracking-widest hover:underline disabled:opacity-50"
          >
            {syncing ? 'Reflecting...' : 'Force Sync Intelligence'}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
