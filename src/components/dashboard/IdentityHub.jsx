'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Fingerprint, User, Briefcase, MapPin, Tag, Plus, Trash2, Save, Loader2, CheckCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function IdentityHub() {
  const [mappings, setMappings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null);
  const [saved, setSaved] = useState(null);
  const [newEntry, setNewEntry] = useState({ category: 'person', description: '', mapping: '' });

  useEffect(() => {
    fetchMappings();
  }, []);

  async function fetchMappings() {
    try {
      const { data } = await supabase.from('identity_mappings').select('*').order('created_at', { ascending: false });
      setMappings(data || []);
    } catch (err) {
      console.error('Identity Fetch Error:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(entry) {
    setSaving(entry.id || 'new');
    try {
      const { data, error } = await supabase.from('identity_mappings').upsert({
        ...entry,
        updated_at: new Date().toISOString()
      }).select().single();

      if (!error) {
        if (!entry.id) {
          setMappings([data, ...mappings]);
          setNewEntry({ category: 'person', description: '', mapping: '' });
        }
        setSaved(entry.id || 'new');
        setTimeout(() => setSaved(null), 2000);
      }
    } catch (err) {
      console.error('Identity Save Error:', err);
    } finally {
      setSaving(null);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Forget this identity mapping?')) return;
    try {
      await supabase.from('identity_mappings').delete().eq('id', id);
      setMappings(mappings.filter(m => m.id !== id));
    } catch (err) {
      console.error('Identity Delete Error:', err);
    }
  }

  const categoryIcons = {
    person: User,
    project: Briefcase,
    location: MapPin,
    entity: Tag
  };

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-accent" /></div>;

  return (
    <div className="bg-surface border border-muted/20 rounded-3xl p-8 shadow-xl shadow-black/10">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-accent/10 border border-accent/20 rounded-2xl">
          <Fingerprint className="w-6 h-6 text-accent" />
        </div>
        <div>
          <h3 className="font-display text-xl font-black text-text tracking-tight uppercase">Identity Mapping Hub</h3>
          <p className="text-[10px] text-text-muted font-mono tracking-widest uppercase">Entity_Recognition_Calibration</p>
        </div>
      </div>

      <p className="text-sm text-text-muted mb-8 leading-relaxed">
        Help the AI recognize important entities in your life. Map generic descriptions (e.g. from Photos) to real names.
      </p>

      {/* New Entry Form */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 p-4 bg-bg/50 border border-dotted border-muted/30 rounded-2xl mb-8">
        <select 
          value={newEntry.category}
          onChange={e => setNewEntry({...newEntry, category: e.target.value})}
          className="bg-bg border border-muted/20 rounded-xl px-4 py-2 text-xs text-text focus:border-accent outline-none appearance-none"
        >
          <option value="person">Person</option>
          <option value="project">Project</option>
          <option value="location">Location</option>
          <option value="entity">Entity</option>
        </select>
        <input 
          placeholder="Visual Description (AI-detected)"
          value={newEntry.description}
          onChange={e => setNewEntry({...newEntry, description: e.target.value})}
          className="md:col-span-1 bg-bg border border-muted/20 rounded-xl px-4 py-2 text-xs text-text focus:border-accent outline-none"
        />
        <input 
          placeholder="Real Identity / Name"
          value={newEntry.mapping}
          onChange={e => setNewEntry({...newEntry, mapping: e.target.value})}
          className="md:col-span-1 bg-bg border border-muted/20 rounded-xl px-4 py-2 text-xs font-bold text-accent focus:border-accent outline-none"
        />
        <button 
          onClick={() => handleSave(newEntry)}
          disabled={saving === 'new' || !newEntry.description || !newEntry.mapping}
          className="flex items-center justify-center gap-2 bg-accent text-bg px-4 py-2 rounded-xl text-[10px] font-black uppercase hover:bg-accent/80 disabled:opacity-50 transition-all"
        >
          {saving === 'new' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />} Add Mapping
        </button>
      </div>

      {/* Mapping List */}
      <div className="space-y-4">
        {mappings.map((m) => {
          const Icon = categoryIcons[m.category] || Tag;
          return (
            <motion.div 
              key={m.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center justify-between p-4 bg-bg/30 border border-muted/10 rounded-2xl hover:border-muted/30 transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="p-2 bg-muted/10 rounded-lg">
                  <Icon className="w-4 h-4 text-text-muted" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-text uppercase tracking-tight">{m.mapping}</span>
                    <span className="text-[10px] px-2 py-0.5 bg-accent/10 text-accent rounded-full font-mono uppercase">{m.category}</span>
                  </div>
                  <p className="text-[10px] text-text-muted/60 mt-0.5 italic">Mapped from: "{m.description}"</p>
                </div>
              </div>
              <button 
                onClick={() => handleDelete(m.id)}
                className="opacity-0 group-hover:opacity-100 p-2 text-text-muted/20 hover:text-red-500 transition-all"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
