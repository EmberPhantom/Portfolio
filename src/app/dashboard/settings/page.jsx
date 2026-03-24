'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings, KeyRound, Brain, Camera, Save, Loader2, CheckCircle, Plus, Trash2, Eye, EyeOff, ExternalLink, Shield } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import SyncScoping from '../../../components/dashboard/IntelligenceSettings';

function Section({ title, icon: Icon, children }) {
  return (
    <div className="bg-surface border border-muted/20 rounded-3xl p-8 shadow-xl shadow-black/10">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-accent/10 border border-accent/20 rounded-2xl">
          <Icon className="w-6 h-6 text-accent" />
        </div>
        <h3 className="font-display text-xl font-black text-text tracking-tight uppercase">{title}</h3>
      </div>
      {children}
    </div>
  );
}

// ── Password Reset ─────────────────────────────────────
function PasswordReset() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  const handleReset = async (e) => {
    e.preventDefault();
    if (!supabase || !email) return;
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/dashboard/reset-password`,
      });
      setMsg(error ? `Error: ${error.message}` : '✓ Reset link sent! Check your email.');
    } catch (err) {
      setMsg('Failed to send reset email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Section title="Password Reset" icon={KeyRound}>
      <p className="text-sm text-text-muted mb-6 leading-relaxed">Securely send a cryptographic reset link to your authorized administrative email address.</p>
      <form onSubmit={handleReset} className="flex flex-col sm:flex-row gap-4">
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="admin@emberos.id"
          required
          className="flex-1 bg-bg border border-muted/20 rounded-xl px-5 py-3 text-text text-sm focus:border-accent outline-none transition-all"
        />
        <button type="submit" disabled={loading} className="flex items-center justify-center gap-2 px-8 py-3 bg-accent text-bg text-sm font-black rounded-xl hover:bg-accent/80 disabled:opacity-50 transition-all uppercase tracking-widest">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />} Send Key
        </button>
      </form>
      {msg && <p className={`mt-3 text-sm ${msg.startsWith('✓') ? 'text-green-400' : 'text-red-400'}`}>{msg}</p>}
    </Section>
  );
}

// ── AI Context Memory Editor ──────────────────────────
function AIContextEditor() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null);
  const [saved, setSaved] = useState(null);

  useEffect(() => {
    if (!supabase) { setLoading(false); return; }
    supabase.from('ai_user_context').select('*').order('key').then(({ data }) => {
      setRows(data || []);
      setLoading(false);
    });
  }, []);

  const handleSaveRow = async (row) => {
    if (!supabase) return;
    setSaving(row.key);
    await supabase.from('ai_user_context').upsert({ key: row.key, value: row.value, updated_at: new Date().toISOString() }, { onConflict: 'key' });
    setSaving(null);
    setSaved(row.key);
    setTimeout(() => setSaved(null), 2000);
  };

  const handleAddRow = () => {
    setRows(prev => [...prev, { key: `custom_${Date.now()}`, value: '', isNew: true }]);
  };

  const handleDeleteRow = async (key) => {
    if (!confirm(`Delete context key "${key}"?`)) return;
    await supabase.from('ai_user_context').delete().eq('key', key);
    setRows(prev => prev.filter(r => r.key !== key));
  };

  if (loading) return <Section title="AI Memory" icon={Brain}><div className="flex justify-center py-6"><Loader2 className="w-6 h-6 animate-spin text-accent" /></div></Section>;

  return (
    <Section title="AI Memory Context" icon={Brain}>
      <p className="text-sm text-text-muted mb-8 leading-relaxed">These semantic markers are injected into Every AI interaction to maintain technical accuracy and personality persistence.</p>
      <div className="space-y-4">
        {rows.map((row, i) => (
          <div key={row.key} className="flex flex-col sm:flex-row gap-3 items-start group">
            <input
              type="text"
              value={row.key}
              onChange={e => setRows(prev => prev.map((r, idx) => idx === i ? { ...r, key: e.target.value } : r))}
              className="w-full sm:w-1/3 bg-bg border border-muted/20 rounded-xl px-4 py-2.5 text-accent font-mono text-[10px] font-black uppercase tracking-widest focus:border-accent outline-none"
              placeholder="CONTEXT_KEY"
            />
            <textarea
              value={row.value}
              onChange={e => setRows(prev => prev.map((r, idx) => idx === i ? { ...r, value: e.target.value } : r))}
              rows={2}
              className="flex-1 w-full bg-bg border border-muted/20 rounded-xl px-4 py-2.5 text-text/90 text-sm focus:border-accent outline-none resize-none transition-all"
              placeholder="Context value logic..."
            />
            <div className="flex sm:flex-col gap-2 w-full sm:w-auto self-stretch">
              <button 
                onClick={() => handleSaveRow(row)} 
                className="flex-1 sm:flex-none p-3 bg-accent/10 text-accent border border-accent/20 rounded-xl hover:bg-accent/20 transition-all shadow-sm"
                title="Save Context"
              >
                {saving === row.key ? <Loader2 className="w-4 h-4 animate-spin" /> : saved === row.key ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Save className="w-4 h-4" />}
              </button>
              <button 
                onClick={() => handleDeleteRow(row.key)} 
                className="flex-1 sm:flex-none p-3 text-text-muted/40 hover:text-red-500 hover:bg-red-500/10 border border-muted/10 hover:border-red-500/20 rounded-xl transition-all"
                title="Delete Context"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
      <button onClick={handleAddRow} className="mt-8 flex items-center gap-2 text-xs font-black text-text-muted hover:text-accent uppercase tracking-[0.2em] transition-all">
        <Plus className="w-4 h-4" /> Add custom record
      </button>
    </Section>
  );
}

// ── Google Photos OAuth ────────────────────────────────
function GooglePhotosSetup() {
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) { setLoading(false); return; }
    supabase.from('oauth_tokens').select('id').eq('provider', 'google_photos').then(({ data }) => {
      setConnected(data && data.length > 0);
      setLoading(false);
    });
  }, []);

  const handleConnect = () => {
    window.location.href = '/api/google-photos/auth';
  };

  const handleDisconnect = async () => {
    if (!confirm('Disconnect Google Photos?')) return;
    await supabase.from('oauth_tokens').delete().eq('provider', 'google_photos');
    setConnected(false);
  };

  return (
    <Section title="Asset Cloud (Google)" icon={Camera}>
      <p className="text-sm text-text-muted mb-8 leading-relaxed">
        Sync your Google Photos library to source high-resolution assets directly into your publications without intermediate staging.
      </p>
      <div className="flex flex-col sm:flex-row items-center justify-between gap-6 p-6 bg-bg/50 rounded-2xl border border-muted/20">
        <div className="flex items-center gap-4">
          <div className={`w-4 h-4 rounded-full shadow-lg ${connected ? 'bg-green-500 animate-pulse' : 'bg-text-muted/30'}`} />
          <div className="flex flex-col">
            <span className="text-sm text-text font-black uppercase tracking-tight">{connected ? 'Cloud Verified' : 'Connection Required'}</span>
            <span className="text-[10px] text-text-muted font-mono">{connected ? 'GOOGLE_PHOTOS_ACTIVE' : 'READY_FOR_AUTH'}</span>
          </div>
        </div>
        {loading ? <Loader2 className="w-6 h-6 animate-spin text-accent" /> : (
          connected ? (
            <button onClick={handleDisconnect} className="text-xs text-red-500 hover:text-red-400 font-black uppercase tracking-widest transition-all">Revoke Terminal Access</button>
          ) : (
            <button onClick={handleConnect} className="flex items-center gap-3 px-6 py-3 bg-blue-600 text-white text-xs font-black rounded-xl hover:bg-blue-500 transition-all uppercase tracking-widest shadow-xl shadow-blue-600/20">
              <ExternalLink className="w-4 h-4" /> Authorize Google Key
            </button>
          )
        )}
      </div>
      {!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID && (
        <p className="text-xs text-yellow-500/80 mt-3 p-3 bg-yellow-500/8 rounded-lg border border-yellow-500/20">
          ⚠ Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to .env.local to enable this feature. See the implementation plan for setup instructions.
        </p>
      )}
    </Section>
  );
}

// ── Main Settings Page ─────────────────────────────────
export default function DashboardSettings() {
  return (
    <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-3xl">
      <div className="mb-12">
        <div className="flex items-center gap-4 mb-2">
          <Settings className="w-8 h-8 text-accent animate-[spin_4s_linear_infinite]" />
          <h2 className="font-display text-4xl font-black text-text uppercase tracking-tighter">System Settings</h2>
        </div>
        <p className="text-text-muted text-sm tracking-wide uppercase">Core configuration and intelligence memory</p>
      </div>
      <div className="space-y-8">
        <PasswordReset />
        <AIContextEditor />
        <SyncScoping />
        <GooglePhotosSetup />
      </div>
    </div>
  );
}
