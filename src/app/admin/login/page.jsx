"use client";
 
import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { useRouter } from 'next/navigation';
import { Lock } from 'lucide-react';
import { motion } from 'framer-motion';
 
export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isDev, setIsDev] = useState(false);
  const [clickCount, setClickCount] = useState(0);
  const [showBypassDirectly, setShowBypassDirectly] = useState(false);
  const router = useRouter();

  const handleIconClick = () => {
    const newCount = clickCount + 1;
    setClickCount(newCount);
    if (newCount >= 5) {
      setShowBypassDirectly(true);
    }
  };

  useEffect(() => {
    setIsDev(window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const errorParam = params.get('error');
      if (errorParam === 'unauthorized') {
        setError("Unauthorized: Your account does not have admin privileges (UUID mismatch).");
      } else if (errorParam === 'auth-failed') {
        setError("Authentication failed. Please verify your credentials.");
      }
    }
  }, []);

  const withTimeout = (promise, ms = 6000) => {
    return Promise.race([
      promise,
      new Promise((_, reject) => setTimeout(() => reject(new Error("Connection timeout")), ms))
    ]);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    if (!supabase) {
      setError("Supabase not configured. Bypassing auth for demo format.");
      setTimeout(() => {
        window.location.href = '/admin';
      }, 1500);
      return;
    }

    try {
      const { error } = await withTimeout(supabase.auth.signInWithPassword({ email, password }), 6000);
      
      if (error) {
        const msg = error.message || "";
        if (msg.includes("fetch") || msg.includes("Failed to fetch") || msg.includes("NetworkError") || msg.includes("unreachable") || msg.includes("getaddrinfo") || msg.includes("timeout")) {
          setError("Unable to reach the authentication server. Your Supabase project might be paused, deleted, or you have a network connection issue.");
        } else {
          setError(error.message);
        }
        setLoading(false);
      } else {
        window.location.href = '/admin';
      }
    } catch (err) {
      console.error("Login auth error:", err);
      const msg = err.message || "";
      if (msg.includes("fetch") || msg.includes("Failed to fetch") || msg.includes("NetworkError") || msg.includes("unreachable") || msg.includes("getaddrinfo") || msg.includes("timeout") || msg.includes("Timeout")) {
        setError("Unable to reach the authentication server (Connection Timeout). Your Supabase project might be paused, deleted, or you have a network connection issue.");
      } else {
        setError(err.message || "An unexpected error occurred during login.");
      }
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);

    if (!supabase) {
      setError("Supabase not configured. Bypassing auth for demo format.");
      setTimeout(() => {
        window.location.href = '/admin';
      }, 1500);
      return;
    }

    try {
      const { error } = await withTimeout(supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      }), 6000);

      if (error) {
        const msg = error.message || "";
        if (msg.includes("fetch") || msg.includes("Failed to fetch") || msg.includes("NetworkError") || msg.includes("unreachable") || msg.includes("getaddrinfo") || msg.includes("timeout")) {
          setError("Failed to connect to Google OAuth service. Your Supabase server may be unreachable.");
        } else {
          setError(error.message);
        }
        setLoading(false);
      }
    } catch (err) {
      console.error("Google OAuth error:", err);
      setError("Failed to connect to Google OAuth service. Your Supabase server may be unreachable.");
      setLoading(false);
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
      <div 
        onClick={handleIconClick}
        className="w-16 h-16 bg-orange-500/10 border border-orange-500/30 rounded-full flex items-center justify-center mx-auto mb-6 cursor-pointer select-none"
      >
        <Lock className="w-8 h-8 text-accent animate-pulse" />
      </div>
      <h2 className="text-3xl font-display font-bold mb-6 text-text text-center uppercase tracking-tight">Admin Override</h2>
      
      {error && (
        <div className="flex flex-col gap-3 mb-6">
          <div className="bg-red-500/10 text-red-500 p-3 rounded-lg text-sm border border-red-500/20 text-center font-mono">
            {error}
          </div>
          {(error.includes("reach") || error.includes("unreachable") || error.includes("connect") || error.includes("fetch") || error.includes("Failed to fetch") || error.includes("getaddrinfo")) && (
            <button
              type="button"
              onClick={() => {
                document.cookie = "emberos_offline_bypass=true; path=/; max-age=86400";
                setError("Bypassing authentication for offline/local demo mode...");
                setTimeout(() => {
                  window.location.href = '/admin';
                }, 1000);
              }}
              className="w-full bg-orange-500/10 hover:bg-orange-500/20 text-orange-500 border border-orange-500/30 font-bold py-3 rounded-2xl transition-all uppercase tracking-widest text-xs cursor-pointer"
            >
              Bypass Auth (Demo Mode)
            </button>
          )}
        </div>
      )}

      {/* Google Sign-in Button */}
      <button
        type="button"
        onClick={handleGoogleLogin}
        disabled={loading}
        className="w-full flex items-center justify-center gap-3 bg-white/5 hover:bg-white/10 text-white font-bold py-4 rounded-2xl border border-white/10 hover:border-white/20 transition-all shadow-xl disabled:opacity-50 uppercase tracking-widest text-xs"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
        </svg>
        {loading ? 'AUTHENTICATING...' : 'SIGN IN WITH GOOGLE'}
      </button>

      <div className="flex items-center my-6">
        <div className="flex-1 border-t border-muted/10" />
        <span className="px-4 text-xs font-mono uppercase text-gray-500 tracking-widest">or passcode</span>
        <div className="flex-1 border-t border-muted/10" />
      </div>

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
      {(isDev || showBypassDirectly) && (
        <div className="mt-8 text-center border-t border-white/5 pt-6">
          <button
            type="button"
            onClick={() => {
              document.cookie = "emberos_offline_bypass=true; path=/; max-age=86400";
              setError("Bypassing authentication for offline/local demo mode...");
              setTimeout(() => {
                window.location.href = '/admin';
              }, 1000);
            }}
            className="text-xs text-orange-500/60 hover:text-orange-500 font-mono uppercase tracking-widest transition-colors cursor-pointer underline"
          >
            Bypass Auth (Demo Mode)
          </button>
        </div>
      )}
      </motion.div>
    </div>
  );
}
