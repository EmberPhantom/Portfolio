'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings, KeyRound, Brain, Camera, Save, Loader2, CheckCircle, Plus, Trash2, Eye, EyeOff, ExternalLink } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

function Section({ title, icon: Icon, children }) {
  return (
    <div className="bg-forge-surface border border-forge-muted/20 rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-orange-500/10 rounded-lg">
          <Icon className="w-5 h-5 text-orange-500" />
        </div>
        <h3 className="font-display text-lg font-bold text-white">{title}</h3>
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
      <p className="text-sm text-gray-400 mb-4">Send a password reset link to your email address.</p>
      <form onSubmit={handleReset} className="flex gap-3">
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="your@email.com"
          required
          className="flex-1 bg-forge-black border border-forge-muted/20 rounded-lg px-4 py-2 text-white text-sm focus:border-orange-500 outline-none"
        />
        <button type="submit" disabled={loading} className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-forge-black text-sm font-bold rounded-lg hover:bg-orange-400 disabled:opacity-50 transition-colors">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />} Send Link
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

  if (loading) return <Section title="AI Memory" icon={Brain}><Loader2 className="w-5 h-5 animate-spin text-orange-500" /></Section>;

  return (
    <Section title="AI Memory Context" icon={Brain}>
      <p className="text-sm text-gray-400 mb-4">These key-value pairs are injected into every AI interaction — keeping your assistants accurate and personalized.</p>
      <div className="space-y-3">
        {rows.map((row, i) => (
          <div key={row.key} className="flex gap-2 items-start">
            <input
              type="text"
              value={row.key}
              onChange={e => setRows(prev => prev.map((r, idx) => idx === i ? { ...r, key: e.target.value } : r))}
              className="w-1/3 bg-forge-black border border-forge-muted/20 rounded-lg px-3 py-2 text-orange-500 font-mono text-xs focus:border-orange-500 outline-none"
              placeholder="key"
            />
            <textarea
              value={row.value}
              onChange={e => setRows(prev => prev.map((r, idx) => idx === i ? { ...r, value: e.target.value } : r))}
              rows={2}
              className="flex-1 bg-forge-black border border-forge-muted/20 rounded-lg px-3 py-2 text-gray-300 text-sm focus:border-orange-500 outline-none resize-none"
              placeholder="value..."
            />
            <div className="flex flex-col gap-1">
              <button onClick={() => handleSaveRow(row)} className="p-2 bg-orange-500/10 text-orange-500 rounded-lg hover:bg-orange-500/20 transition-colors" title="Save">
                {saving === row.key ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : saved === row.key ? <CheckCircle className="w-3.5 h-3.5 text-green-500" /> : <Save className="w-3.5 h-3.5" />}
              </button>
              <button onClick={() => handleDeleteRow(row.key)} className="p-2 text-gray-600 hover:text-red-500 rounded-lg hover:bg-red-500/10 transition-colors" title="Delete">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
      <button onClick={handleAddRow} className="mt-4 flex items-center gap-2 text-sm text-gray-400 hover:text-orange-500 transition-colors">
        <Plus className="w-4 h-4" /> Add context entry
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
    <Section title="Google Photos Integration" icon={Camera}>
      <p className="text-sm text-gray-400 mb-4">
        Connect your Google Photos library to insert images directly into blog posts with the photo picker, without uploading to a separate storage.
      </p>
      <div className="flex items-center justify-between p-4 bg-forge-black rounded-xl border border-forge-muted/20">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${connected ? 'bg-green-500' : 'bg-gray-600'}`} />
          <span className="text-sm text-gray-300 font-mono">{connected ? 'Google Photos Connected' : 'Not Connected'}</span>
        </div>
        {loading ? <Loader2 className="w-4 h-4 animate-spin text-orange-500" /> : (
          connected ? (
            <button onClick={handleDisconnect} className="text-sm text-red-400 hover:text-red-300 font-mono">Disconnect</button>
          ) : (
            <button onClick={handleConnect} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-500 transition-colors">
              <ExternalLink className="w-4 h-4" /> Connect with Google
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
    <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-2xl">
      <div className="mb-8">
        <h2 className="font-display text-2xl font-bold text-white flex items-center gap-2">
          <Settings className="w-6 h-6 text-orange-500" /> Settings
        </h2>
        <p className="text-gray-400 text-sm mt-1">Manage authentication, AI memory, and integrations</p>
      </div>
      <div className="space-y-6">
        <PasswordReset />
        <AIContextEditor />
        <GooglePhotosSetup />
      </div>
    </div>
  );
}
