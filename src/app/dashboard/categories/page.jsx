'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, Folder, Loader2, Hash } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

const PRESET_COLORS = ['#F97316', '#3B82F6', '#10B981', '#8B5CF6', '#EC4899', '#F59E0B', '#06B6D4', '#EF4444'];

function CategoryForm({ category, onSave, onCancel }) {
  const [form, setForm] = useState({
    name: category?.name || '',
    description: category?.description || '',
    color: category?.color || '#F97316',
  });
  const [saving, setSaving] = useState(false);

  const generateSlug = (name) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!supabase || !form.name.trim()) return;
    setSaving(true);
    const payload = { ...form, slug: generateSlug(form.name) };
    try {
      if (category?.id) {
        await supabase.from('categories').update(payload).eq('id', category.id);
      } else {
        await supabase.from('categories').insert([payload]);
      }
      onSave();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.form
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      onSubmit={handleSubmit}
      className="mb-8 p-6 bg-surface border border-accent/20 rounded-2xl shadow-xl shadow-black/10 space-y-6"
    >
      <h3 className="font-bold text-white">{category ? 'Edit Category' : 'New Category'}</h3>
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-[10px] text-text-muted mb-2 uppercase tracking-widest font-black">Name</label>
          <input
            type="text"
            required
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            className="w-full bg-bg border border-muted/20 rounded-xl px-4 py-2.5 text-text text-sm focus:border-accent outline-none"
            placeholder="e.g. AI Research"
          />
        </div>
        <div>
          <label className="block text-[10px] text-text-muted mb-2 uppercase tracking-widest font-black">Description</label>
          <input
            type="text"
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            className="w-full bg-bg border border-muted/20 rounded-xl px-4 py-2.5 text-text text-sm focus:border-accent outline-none"
            placeholder="Optional short description"
          />
        </div>
      </div>
      <div>
        <label className="block text-[10px] text-text-muted mb-3 uppercase tracking-widest font-black">Color</label>
        <div className="flex gap-2 flex-wrap">
          {PRESET_COLORS.map(c => (
            <button
              key={c}
              type="button"
              onClick={() => setForm(f => ({ ...f, color: c }))}
              className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${form.color === c ? 'border-text scale-110' : 'border-transparent'}`}
              style={{ backgroundColor: c }}
            />
          ))}
          <input
            type="color"
            value={form.color}
            onChange={e => setForm(f => ({ ...f, color: e.target.value }))}
            className="w-8 h-8 rounded-full cursor-pointer border-2 border-muted/30 bg-transparent"
            title="Custom color"
          />
        </div>
      </div>
      <div className="flex gap-3 pt-4 border-t border-muted/10">
        <button type="submit" disabled={saving} className="flex items-center gap-2 px-6 py-2.5 bg-accent text-bg text-sm font-black rounded-xl hover:bg-accent/80 transition-all disabled:opacity-50">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {category ? 'Update' : 'Create'} Category
        </button>
        <button type="button" onClick={onCancel} className="px-6 py-2.5 text-text-muted text-sm font-medium hover:text-text rounded-xl hover:bg-muted/10 transition-colors">Cancel</button>
      </div>
    </motion.form>
  );
}

export default function DashboardCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  const fetchCategories = async () => {
    if (!supabase) { setLoading(false); return; }
    const { data } = await supabase.from('categories').select(`*, blog_posts(count)`).order('name');
    setCategories(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchCategories(); }, []);

  const handleDelete = async (id) => {
    if (!confirm('Delete this category? Posts in this category will be uncategorized.')) return;
    await supabase.from('categories').delete().eq('id', id);
    setCategories(prev => prev.filter(c => c.id !== id));
  };

  const handleFormSave = () => {
    setShowForm(false);
    setEditingCategory(null);
    fetchCategories();
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-accent animate-spin" /></div>;

  return (
    <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-10">
        <div>
          <h2 className="font-display text-3xl font-black text-text tracking-tight uppercase">Categories</h2>
          <p className="text-text-muted text-sm mt-1">Organize your thought ecosystem</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditingCategory(null); }}
          className="flex items-center gap-2 px-6 py-2.5 bg-accent text-bg font-black rounded-xl hover:bg-accent/80 transition-all shadow-lg shadow-accent/20 uppercase tracking-widest text-xs"
        >
          <Plus className="w-4 h-4" /> New Category
        </button>
      </div>

      {(showForm || editingCategory) && (
        <CategoryForm
          category={editingCategory}
          onSave={handleFormSave}
          onCancel={() => { setShowForm(false); setEditingCategory(null); }}
        />
      )}

      {categories.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <Folder className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No categories yet. Create one to organize your writing.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map(cat => (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-surface border border-muted/20 rounded-2xl p-6 group hover:border-accent/30 transition-all shadow-xl shadow-black/5"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: cat.color || '#F97316' }} />
                  <Hash className="w-4 h-4 text-accent/50 group-hover:text-accent transition-colors" />
                  <h3 className="font-display font-black text-text text-lg uppercase tracking-tight">{cat.name}</h3>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => { setEditingCategory(cat); setShowForm(false); }} className="p-1.5 text-text-muted hover:text-accent hover:bg-accent/10 rounded-lg transition-all">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(cat.id)} className="p-1.5 text-text-muted hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              {cat.description && <p className="text-sm text-text-muted mb-4 line-clamp-2 leading-relaxed">{cat.description}</p>}
              <div className="pt-4 border-t border-muted/5 text-[10px] font-black font-mono text-text-muted/60 uppercase tracking-widest flex items-center gap-2">
                <span className="text-accent">{cat['blog_posts']?.[0]?.count ?? 0}</span> articles · /{cat.slug}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
