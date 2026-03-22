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
      className="mb-6 p-5 bg-forge-surface border border-orange-500/30 rounded-xl space-y-4"
    >
      <h3 className="font-bold text-white">{category ? 'Edit Category' : 'New Category'}</h3>
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-gray-500 mb-1 uppercase tracking-wider font-mono">Name</label>
          <input
            type="text"
            required
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            className="w-full bg-forge-black border border-forge-muted/20 rounded-lg px-3 py-2 text-white text-sm focus:border-orange-500 outline-none"
            placeholder="e.g. AI Research"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1 uppercase tracking-wider font-mono">Description</label>
          <input
            type="text"
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            className="w-full bg-forge-black border border-forge-muted/20 rounded-lg px-3 py-2 text-white text-sm focus:border-orange-500 outline-none"
            placeholder="Optional short description"
          />
        </div>
      </div>
      <div>
        <label className="block text-xs text-gray-500 mb-2 uppercase tracking-wider font-mono">Color</label>
        <div className="flex gap-2 flex-wrap">
          {PRESET_COLORS.map(c => (
            <button
              key={c}
              type="button"
              onClick={() => setForm(f => ({ ...f, color: c }))}
              className={`w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 ${form.color === c ? 'border-white scale-110' : 'border-transparent'}`}
              style={{ backgroundColor: c }}
            />
          ))}
          <input
            type="color"
            value={form.color}
            onChange={e => setForm(f => ({ ...f, color: e.target.value }))}
            className="w-7 h-7 rounded-full cursor-pointer border-2 border-forge-muted/30 bg-transparent"
            title="Custom color"
          />
        </div>
      </div>
      <div className="flex gap-2 pt-2">
        <button type="submit" disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-forge-black text-sm font-bold rounded-lg hover:bg-orange-400 disabled:opacity-50">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {category ? 'Update' : 'Create'} Category
        </button>
        <button type="button" onClick={onCancel} className="px-4 py-2 text-gray-400 text-sm hover:text-white rounded-lg hover:bg-forge-muted/20">Cancel</button>
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

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-orange-500 animate-spin" /></div>;

  return (
    <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="font-display text-2xl font-bold text-white">Categories</h2>
          <p className="text-gray-400 text-sm mt-1">Organize your articles by research area, project, or event</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditingCategory(null); }}
          className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-forge-black font-bold rounded-lg hover:bg-orange-400 transition-colors"
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
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map(cat => (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-forge-surface border border-forge-muted/20 rounded-xl p-5 group hover:border-forge-muted/40 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: cat.color || '#F97316' }} />
                  <Hash className="w-4 h-4 text-gray-500" />
                  <h3 className="font-display font-bold text-white">{cat.name}</h3>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => { setEditingCategory(cat); setShowForm(false); }} className="p-1.5 text-gray-400 hover:text-orange-500 transition-colors">
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleDelete(cat.id)} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              {cat.description && <p className="text-sm text-gray-500 mb-3 line-clamp-2">{cat.description}</p>}
              <div className="text-xs font-mono text-gray-600">
                {cat['blog_posts']?.[0]?.count ?? 0} articles · /{cat.slug}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
