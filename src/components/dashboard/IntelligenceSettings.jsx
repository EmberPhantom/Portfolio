'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, Folder, Image, Github, Save, Loader2, CheckCircle, Plus, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function IntelligenceSettings() {
  const [settings, setSettings] = useState({
    whitelisted_drive_folders: [],
    whitelisted_photo_albums: [],
    github_sync_enabled: true
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    try {
      const { data } = await supabase.from('intelligence_meta').select('*');
      if (data) {
        const newSettings = { ...settings };
        data.forEach(item => {
          newSettings[item.key] = item.value;
        });
        setSettings(newSettings);
      }
    } catch (err) {
      console.error('Error fetching intelligence settings:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const updates = Object.entries(settings).map(([key, value]) => ({
        key,
        value,
        updated_at: new Date().toISOString()
      }));
      
      const { error } = await supabase.from('intelligence_meta').upsert(updates, { onConflict: 'key' });
      
      if (!error) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch (err) {
      console.error('Error saving intelligence settings:', err);
    } finally {
      setSaving(false);
    }
  }

  const addWhitelistItem = (key) => {
    setSettings(prev => ({
      ...prev,
      [key]: [...prev[key], '']
    }));
  };

  const updateWhitelistItem = (key, index, value) => {
    setSettings(prev => {
      const newList = [...prev[key]];
      newList[index] = value;
      return { ...prev, [key]: newList };
    });
  };

  const removeWhitelistItem = (key, index) => {
    setSettings(prev => ({
      ...prev,
      [key]: prev[key].filter((_, i) => i !== index)
    }));
  };

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-accent" /></div>;

  return (
    <div className="bg-surface border border-muted/20 rounded-3xl p-8 shadow-xl shadow-black/10">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-accent/10 border border-accent/20 rounded-2xl">
          <Shield className="w-6 h-6 text-accent" />
        </div>
        <div className="flex-1">
          <h3 className="font-display text-xl font-black text-text tracking-tight uppercase">Privacy & Sync Scoping</h3>
          <p className="text-[10px] text-text-muted font-mono tracking-widest">INTELLIGENCE_QUARANTINE_CONTROL</p>
        </div>
      </div>

      <div className="space-y-8">
        {/* Drive Whitelisting */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Folder className="w-4 h-4 text-accent" />
            <h4 className="text-sm font-black text-text uppercase tracking-widest">Drive Folder Whitelist</h4>
          </div>
          <p className="text-xs text-text-muted mb-4 leading-relaxed">
            Specify the paths of folders the AI is allowed to "read" for project insights. (e.g. "/Projects/EmberOS")
          </p>
          <div className="space-y-2">
            {settings.whitelisted_drive_folders.map((folder, i) => (
              <div key={i} className="flex gap-2">
                <input
                  type="text"
                  value={folder}
                  onChange={e => updateWhitelistItem('whitelisted_drive_folders', i, e.target.value)}
                  placeholder="/Path/To/Folder"
                  className="flex-1 bg-bg border border-muted/20 rounded-xl px-4 py-2 text-sm text-text focus:border-accent outline-none"
                />
                <button onClick={() => removeWhitelistItem('whitelisted_drive_folders', i)} className="p-2 text-text-muted/40 hover:text-red-500 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            <button onClick={() => addWhitelistItem('whitelisted_drive_folders')} className="flex items-center gap-2 text-[10px] font-black text-text-muted hover:text-accent uppercase tracking-widest py-2 transition-all">
              <Plus className="w-3 h-3" /> Add Folder Path
            </button>
          </div>
        </section>

        {/* Photos Whitelisting */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Image className="w-4 h-4 text-accent" />
            <h4 className="text-sm font-black text-text uppercase tracking-widest">Photos Album Whitelist</h4>
          </div>
          <p className="text-xs text-text-muted mb-4 leading-relaxed">
            Only photos from these whitelisted album names will be analyzed for life events.
          </p>
          <div className="space-y-2">
            {settings.whitelisted_photo_albums.map((album, i) => (
              <div key={i} className="flex gap-2">
                <input
                  type="text"
                  value={album}
                  onChange={e => updateWhitelistItem('whitelisted_photo_albums', i, e.target.value)}
                  placeholder="Album Name"
                  className="flex-1 bg-bg border border-muted/20 rounded-xl px-4 py-2 text-sm text-text focus:border-accent outline-none"
                />
                <button onClick={() => removeWhitelistItem('whitelisted_photo_albums', i)} className="p-2 text-text-muted/40 hover:text-red-500 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            <button onClick={() => addWhitelistItem('whitelisted_photo_albums')} className="flex items-center gap-2 text-[10px] font-black text-text-muted hover:text-accent uppercase tracking-widest py-2 transition-all">
              <Plus className="w-3 h-3" /> Add Album Name
            </button>
          </div>
        </section>

        {/* GitHub Toggle */}
        <section className="flex items-center justify-between p-4 bg-bg/50 rounded-2xl border border-muted/10">
          <div className="flex items-center gap-4">
            <Github className="w-5 h-5 text-text" />
            <div>
              <h4 className="text-sm font-black text-text uppercase tracking-tight">GitHub Pulse Sync</h4>
              <p className="text-[10px] text-text-muted">Analyze commits for project momentum</p>
            </div>
          </div>
          <button 
            onClick={() => setSettings(prev => ({ ...prev, github_sync_enabled: !prev.github_sync_enabled }))}
            className={`w-12 h-6 rounded-full transition-all relative ${settings.github_sync_enabled ? 'bg-accent' : 'bg-muted/40'}`}
          >
            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${settings.github_sync_enabled ? 'left-7' : 'left-1'}`} />
          </button>
        </section>

        <button 
          onClick={handleSave}
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 px-8 py-4 bg-accent text-bg font-black rounded-2xl hover:bg-accent/90 disabled:opacity-50 transition-all uppercase tracking-[0.2em]"
        >
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : saved ? <CheckCircle className="w-5 h-5" /> : <Save className="w-5 h-5" />}
          {saved ? 'Settings Synchronized' : 'Apply Privacy Protocol'}
        </button>
      </div>
    </div>
  );
}
