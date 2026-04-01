"use client";

import { useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { useRouter } from 'next/navigation';
import { Lock } from 'lucide-react';
import { motion } from 'framer-motion';

export default function DashboardLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    if (!supabase) {
      setError("Supabase not configured. Bypassing auth for demo format.");
      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-forge-black flex items-center justify-center p-6 relative overflow-hidden">
      {/* Ambient Background Glows */}
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-accent/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-accent/5 rounded-full blur-[120px] pointer-events-none" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-md w-full glass p-10 rounded-[2.5rem] premium-shadow border-muted/20 relative z-10"
      >
      <div className="w-16 h-16 bg-orange-500/10 border border-orange-500/30 rounded-full flex items-center justify-center mx-auto mb-6">
        <Lock className="w-8 h-8 text-accent animate-pulse" />
      </div>
      <h2 className="text-3xl font-display font-bold mb-6 text-text text-center uppercase tracking-tight">Admin Override</h2>
      
      {error && (
        <div className="bg-red-500/10 text-red-500 p-3 rounded-lg mb-6 text-sm border border-red-500/20 text-center font-mono">
          {error}
        </div>
      )}

      <form onSubmit={handleLogin} className="flex flex-col gap-4">
        <div>
          <label className="block text-gray-400 text-xs font-mono uppercase tracking-widest mb-2">Identifier</label>
          <input 
            type="email" 
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full bg-[#0a0a0a] border border-forge-muted/30 rounded-xl p-3 text-white outline-none focus:border-orange-500 transition-colors"
            placeholder="admin@emberos.com"
          />
        </div>
        <div>
          <label className="block text-gray-400 text-xs font-mono uppercase tracking-widest mb-2">Passcode</label>
          <input 
            type="password" 
            required
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full bg-[#0a0a0a] border border-forge-muted/30 rounded-xl p-3 text-white outline-none focus:border-orange-500 transition-colors"
            placeholder="••••••••••"
          />
        </div>
        <button 
          type="submit" 
          disabled={loading}
          className="mt-6 w-full bg-text text-bg font-bold py-4 rounded-2xl hover:bg-accent hover:text-bg transition-all transform hover:-translate-y-1 shadow-xl disabled:opacity-50 uppercase tracking-widest text-xs"
        >
          {loading ? 'AUTHENTICATING...' : 'INITIALIZE SESSION'}
        </button>
      </form>
      </motion.div>
    </div>
  );
}
