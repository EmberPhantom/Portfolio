'use client';

import { useState, useEffect } from 'react';
import VisitorStats from '../../components/dashboard/VisitorStats';
import MessageInbox from '../../components/dashboard/MessageInbox';
import AIPersonalizedBriefing from '../../components/dashboard/AIPersonalizedBriefing';
import { supabase } from '../../lib/supabase';
import { motion } from 'framer-motion';
import { Brain, Activity, MessageSquare, Zap } from 'lucide-react';

export default function AdminHome() {
  const [isSimulated, setIsSimulated] = useState(false);

  useEffect(() => {
    if (!supabase) setIsSimulated(true);
  }, []);

  return (
    <div className="space-y-12 pb-24">
      {/* Hero Section */}
      <section className="relative">
        <div className="flex items-center gap-4 mb-8">
           <div className="w-12 h-12 bg-accent/20 border border-accent/40 rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(249,115,22,0.2)]">
              <Brain className="w-6 h-6 text-accent" />
           </div>
           <div>
              <h2 className="text-3xl font-display font-black text-white uppercase tracking-tighter">Command_Hub</h2>
              <p className="text-[10px] text-text-muted font-mono tracking-[0.3em] uppercase opacity-50">Operational_Status: Optimal</p>
           </div>
        </div>
        <AIPersonalizedBriefing />
      </section>

      {/* Grid Layout */}
      <div className="grid lg:grid-cols-2 gap-12">
        <section className="space-y-6">
           <div className="flex items-center gap-3 px-2">
              <Activity className="w-4 h-4 text-accent" />
              <h3 className="text-xs font-black text-white uppercase tracking-[0.2em]">Real-time Telemetry</h3>
           </div>
           <div className="bg-surface/20 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-8">
              <VisitorStats />
           </div>
        </section>

        <section className="space-y-6">
           <div className="flex items-center gap-3 px-2">
              <MessageSquare className="w-4 h-4 text-accent" />
              <h3 className="text-xs font-black text-white uppercase tracking-[0.2em]">Communication Sync</h3>
           </div>
           <div className="bg-surface/20 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-8">
              <MessageInbox />
           </div>
        </section>
      </div>
    </div>
  );
}
