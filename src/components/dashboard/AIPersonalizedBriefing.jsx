import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowRight, Brain, Target, Zap, Github, Image, Folder, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { getMockIntelligence } from '../../lib/intelligence/simulation';

export default function AIPersonalizedBriefing() {
  const [insight, setInsight] = useState(null);
  const [syncing, setSyncing] = useState(true);

  useEffect(() => {
    fetchBriefing();
  }, []);

  async function fetchBriefing() {
    setSyncing(true);
    try {
      let data = null;
      if (supabase) {
        const res = await fetch('/api/intelligence/sync');
        data = await res.json();
      }
      
      if (!data || data.error || !data.current_focus) {
        setInsight(getMockIntelligence());
      } else {
        setInsight(data);
      }
    } catch (err) {
      setInsight(getMockIntelligence());
    } finally {
      setSyncing(false);
    }
  }

  if (syncing && !insight) {
    return (
      <div className="p-10 bg-surface/30 backdrop-blur-xl border border-white/5 rounded-[2.5rem] flex flex-col items-center justify-center gap-6 h-64">
        <div className="relative">
          <Brain className="w-10 h-10 text-accent animate-pulse" />
          <div className="absolute inset-0 bg-accent/20 blur-xl animate-pulse" />
        </div>
        <p className="text-[10px] font-mono text-accent uppercase tracking-[0.5em]">Synchronizing_Intelligence</p>
      </div>
    );
  }

  if (!insight) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden group"
    >
      {/* Cinematic Glows */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/5 blur-[80px] pointer-events-none" />
      
      <div className="relative p-10 bg-surface/30 backdrop-blur-3xl border border-white/10 rounded-[3rem] shadow-2xl shadow-black/50 overflow-hidden">
        {/* Animated Scanning Line */}
        <motion.div 
          animate={{ y: [0, 400, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-accent/20 to-transparent pointer-events-none z-0"
        />

        <div className="relative z-10 flex flex-col lg:flex-row gap-12">
          
          {/* Main Insight Section */}
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 bg-accent text-bg rounded-2xl shadow-lg shadow-accent/20">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display text-2xl font-black text-white uppercase tracking-tight leading-none">Intelligence_Summary</h3>
                <span className="text-[9px] font-mono text-text-muted/60 uppercase tracking-widest mt-1 block">Persona_Calibration: ACTIVE</span>
              </div>
            </div>

            <div className="space-y-8">
              <div>
                <span className="text-[9px] font-black text-accent uppercase tracking-[0.3em] mb-3 block">Neural_Focus</span>
                <p className="text-3xl md:text-4xl font-display font-black text-white leading-[1.1] tracking-tight">{insight.current_focus}</p>
              </div>

              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-3 px-5 py-2.5 bg-white/5 border border-white/10 rounded-full backdrop-blur-md hover:border-accent/30 transition-colors">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-[10px] font-mono text-text uppercase tracking-widest">{insight.life_mood || 'Analyzing Vibe...'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Suggested Actions Panel */}
          <div className="w-full lg:w-96 bg-black/40 border border-white/5 rounded-[2.5rem] p-8 backdrop-blur-2xl">
            <h4 className="text-[10px] font-black text-text-muted uppercase tracking-[0.3em] mb-6 flex items-center gap-3">
              <Target className="w-4 h-4 text-accent" /> Momentum_Sequence
            </h4>
            <div className="space-y-4">
              {insight.suggested_actions?.map((action, i) => (
                <motion.button 
                  key={i}
                  whileHover={{ x: 8, backgroundColor: '#ffffff0d' }}
                  className="w-full flex items-center justify-between p-4 bg-white/3 border border-white/5 rounded-2xl text-left transition-all group border-transparent hover:border-accent/20"
                >
                  <span className="text-xs text-text/90 font-bold group-hover:text-accent transition-colors">{action}</span>
                  <ArrowRight className="w-4 h-4 text-accent translate-x-4 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all" />
                </motion.button>
              ))}
            </div>
          </div>
        </div>

        {/* Sync Status Footer */}
        <div className="mt-12 pt-8 border-t border-white/5 flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-6 text-[9px] font-mono text-text-muted/40 uppercase tracking-widest">
            <span className="flex items-center gap-2 hover:text-white transition-colors cursor-help"><Github className="w-3 h-3 text-accent" /> GitHub_Link: OK</span>
            <span className="flex items-center gap-2 hover:text-white transition-colors cursor-help"><Image className="w-3 h-3 text-accent" /> Photos_Sync: OK</span>
            <span className="flex items-center gap-2 hover:text-white transition-colors cursor-help"><Folder className="w-3 h-3 text-accent" /> Drive_Index: OK</span>
          </div>
          <button 
            onClick={fetchBriefing} 
            disabled={syncing}
            className="text-[9px] font-black text-accent uppercase tracking-[0.4em] hover:text-white transition-all flex items-center gap-3 group"
          >
             {syncing ? 'REFLECTING...' : 'Re-Sync_Intelligence'}
             <div className="w-1.5 h-1.5 rounded-full bg-accent group-hover:animate-ping" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
