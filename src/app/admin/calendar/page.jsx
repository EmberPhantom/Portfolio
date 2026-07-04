'use client';

import { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  Plus, 
  Trash2, 
  Edit2, 
  Loader2, 
  X,
  Clock,
  BookOpen
} from 'lucide-react';

export default function ContentCalendarDashboard() {
  const [events, setEvents] = useState([]);
  const [episodes, setEpisodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Calendar state
  const [currentDate, setCurrentDate] = useState(new Date());

  // Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [formData, setFormData] = useState({
    platform: 'twitter',
    title: '',
    notes: '',
    scheduled_for: '',
    status: 'planned',
    related_episode_id: ''
  });

  useEffect(() => {
    fetchEvents();
    fetchEpisodes();
  }, []);

  async function fetchEvents() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/calendar');
      if (!res.ok) throw new Error('Failed to fetch calendar plans');
      const data = await res.json();
      setEvents(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function fetchEpisodes() {
    try {
      const res = await fetch('/api/projects/episodes');
      if (res.ok) {
        const data = await res.json();
        setEpisodes(data || []);
      }
    } catch (err) {
      console.error('Failed to load episodes dropdown', err);
    }
  }

  // Monthly Calculations
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month, 1).getDay(); // 0 is Sunday, 1 is Monday...
  };

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  // Helper to filter events on a specific day
  const getEventsForDay = (dayNum) => {
    return events.filter(e => {
      const eDate = new Date(e.scheduled_for);
      return eDate.getDate() === dayNum && 
             eDate.getMonth() === currentDate.getMonth() && 
             eDate.getFullYear() === currentDate.getFullYear();
    });
  };

  const handleOpenCreate = (dayNum) => {
    setEditingEvent(null);
    
    // Set default schedule time to selected day at 09:00 local time
    let dateStr = '';
    if (dayNum) {
      const tempDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), dayNum, 9, 0);
      // adjust to timezone offset for datetime-local value
      const tzOffset = tempDate.getTimezoneOffset() * 60000;
      dateStr = new Date(tempDate.getTime() - tzOffset).toISOString().slice(0, 16);
    } else {
      dateStr = new Date().toISOString().slice(0, 16);
    }

    setFormData({
      platform: 'twitter',
      title: '',
      notes: '',
      scheduled_for: dateStr,
      status: 'planned',
      related_episode_id: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (evt, e) => {
    e.stopPropagation(); // prevent clicking on cell to create
    setEditingEvent(evt);
    setFormData({
      platform: evt.platform || 'twitter',
      title: evt.title || '',
      notes: evt.notes || '',
      scheduled_for: evt.scheduled_for ? evt.scheduled_for.substring(0, 16) : '',
      status: evt.status || 'planned',
      related_episode_id: evt.related_episode_id || ''
    });
    setIsModalOpen(true);
  };

  const handleInputChange = (key, val) => {
    setFormData(prev => ({ ...prev, [key]: val }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const payload = {
      ...formData,
      related_episode_id: formData.related_episode_id || null
    };

    try {
      let res;
      if (editingEvent) {
        res = await fetch('/api/calendar', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingEvent.id, ...payload })
        });
      } else {
        res = await fetch('/api/calendar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || 'Failed to save calendar plan');
      }

      setIsModalOpen(false);
      fetchEvents();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this calendar entry?')) return;
    
    setError(null);
    try {
      const res = await fetch(`/api/calendar?id=${id}`, {
        method: 'DELETE'
      });
      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || 'Failed to delete entry');
      }
      fetchEvents();
    } catch (err) {
      setError(err.message);
    }
  };

  const getPlatformClass = (platform) => {
    switch (platform) {
      case 'youtube': return 'bg-red-500/10 text-red-400 border border-red-500/20';
      case 'twitter': return 'bg-sky-500/10 text-sky-400 border border-sky-500/20';
      case 'linkedin': return 'bg-blue-600/10 text-blue-400 border border-blue-600/20';
      case 'reddit': return 'bg-orange-500/10 text-orange-400 border border-orange-500/20';
      default: return 'bg-purple-500/10 text-purple-400 border border-purple-500/20';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'posted': return 'bg-green-500/20 border border-green-500/40 text-green-300';
      case 'skipped': return 'bg-gray-500/20 border border-gray-500/40 text-gray-400';
      default: return 'bg-yellow-500/10 border border-yellow-500/20 text-yellow-400';
    }
  };

  // Build grid arrays
  const daysArray = [];
  // Add empty placeholders for padding first day offset
  for (let i = 0; i < firstDay; i++) {
    daysArray.push(null);
  }
  // Add actual days
  for (let i = 1; i <= daysInMonth; i++) {
    daysArray.push(i);
  }

  const monthNames = [
    "January", "February", "March", "April", "May", "June", 
    "July", "August", "September", "October", "November", "December"
  ];

  if (loading && events.length === 0) {
    return (
      <div className="h-96 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-12 h-12 text-accent animate-spin" />
        <span className="text-xs font-mono uppercase tracking-widest text-text-muted">Aligning release timelines...</span>
      </div>
    );
  }

  return (
    <div className="w-full pb-24 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="mb-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-4">
            <CalendarIcon className="w-8 h-8 text-accent animate-pulse" />
            <h2 className="font-display text-4xl font-black text-text uppercase tracking-tighter">Content planner</h2>
          </div>
          <p className="text-text-muted text-sm mt-2">Schedule clone projects releases, videos, and post drafts</p>
        </div>

        <button
          onClick={() => handleOpenCreate()}
          className="flex items-center gap-2 px-5 py-3 bg-accent text-bg font-black rounded-xl hover:bg-accent/80 transition-all uppercase tracking-widest text-[10px] shadow-lg shadow-accent/15"
        >
          <Plus className="w-4 h-4" /> PLAN_RELEASE_EVENT
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 text-red-500 p-4 rounded-2xl mb-8 border border-red-500/20 font-mono text-sm">
          ERROR: {error}
        </div>
      )}

      {/* Calendar View Container */}
      <div className="bg-surface rounded-[2.5rem] border border-muted/20 overflow-hidden shadow-xl">
        {/* Month Selector Bar */}
        <div className="px-8 py-5 border-b border-muted/10 bg-[#13192c] flex items-center justify-between">
          <button 
            onClick={prevMonth}
            className="px-4 py-2 bg-bg/50 border border-muted/10 text-text-muted hover:text-white rounded-lg text-xs font-mono tracking-widest uppercase font-bold"
          >
            PREV_MONTH
          </button>
          <h3 className="font-display text-2xl font-black text-white uppercase tracking-tight">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h3>
          <button 
            onClick={nextMonth}
            className="px-4 py-2 bg-bg/50 border border-muted/10 text-text-muted hover:text-white rounded-lg text-xs font-mono tracking-widest uppercase font-bold"
          >
            NEXT_MONTH
          </button>
        </div>

        {/* Days of Week label */}
        <div className="grid grid-cols-7 border-b border-muted/10 text-center font-mono text-[9px] uppercase tracking-widest font-black text-text-muted bg-[#0c101d]/50">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div key={d} className="py-3 border-r border-muted/10 last:border-0">{d}</div>
          ))}
        </div>

        {/* Grid Cells */}
        <div className="grid grid-cols-7 auto-rows-[120px] bg-bg/30">
          {daysArray.map((day, idx) => {
            const dayEvents = day ? getEventsForDay(day) : [];
            return (
              <div 
                key={idx}
                onClick={() => day && handleOpenCreate(day)}
                className={`p-3 border-r border-b border-muted/10 relative flex flex-col justify-start gap-1 overflow-y-auto select-none ${day ? 'cursor-pointer hover:bg-white/[0.01]' : 'bg-surface/5'}`}
              >
                {day && (
                  <span className="font-mono text-xs font-bold text-text-muted absolute right-3 top-3">
                    {day}
                  </span>
                )}

                {/* Day events badges list */}
                <div className="mt-5 space-y-1 w-full text-[9px] font-mono leading-tight">
                  {dayEvents.map(evt => (
                    <div 
                      key={evt.id}
                      onClick={(e) => handleOpenEdit(evt, e)}
                      className={`px-2 py-1 rounded border flex flex-col gap-0.5 truncate hover:scale-[1.01] transition-transform ${getPlatformClass(evt.platform)}`}
                    >
                      <div className="font-bold flex items-center justify-between gap-1">
                        <span className="truncate">{evt.title}</span>
                      </div>
                      <span className={`text-[7px] uppercase font-black tracking-wide w-fit px-1 rounded ${getStatusColor(evt.status)}`}>
                        {evt.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Plan Event Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bg/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-[#0f1424] border border-muted/20 w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in scale-in duration-200">
            {/* Header */}
            <div className="px-8 py-6 border-b border-muted/10 flex items-center justify-between bg-[#13192c] shrink-0">
              <h3 className="font-display text-2xl font-black text-white uppercase tracking-tight">
                {editingEvent ? 'Modify Plan Entry' : 'Plan Release Event'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-text-muted hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Scrollable Form */}
            <form onSubmit={handleSubmit} className="p-8 overflow-y-auto space-y-6 flex-1 text-sm text-text scrollbar-thin">
              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-[10px] text-text-muted mb-2 uppercase tracking-widest font-black">Target Channel</label>
                  <select
                    value={formData.platform}
                    onChange={e => handleInputChange('platform', e.target.value)}
                    className="w-full bg-bg border border-muted/20 rounded-xl px-4 py-2.5 text-text focus:border-accent outline-none"
                  >
                    <option value="youtube">YouTube</option>
                    <option value="twitter">X / Twitter</option>
                    <option value="linkedin">LinkedIn</option>
                    <option value="reddit">Reddit</option>
                    <option value="threads">Threads</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-text-muted mb-2 uppercase tracking-widest font-black">Plan Status</label>
                  <select
                    value={formData.status}
                    onChange={e => handleInputChange('status', e.target.value)}
                    className="w-full bg-bg border border-muted/20 rounded-xl px-4 py-2.5 text-text focus:border-accent outline-none"
                  >
                    <option value="planned">Planned / Scheduled</option>
                    <option value="posted">Posted / Released</option>
                    <option value="skipped">Skipped / Deferred</option>
                  </select>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-[10px] text-text-muted mb-2 uppercase tracking-widest font-black">Release Title</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={e => handleInputChange('title', e.target.value)}
                    className="w-full bg-bg border border-muted/20 rounded-xl px-4 py-2.5 text-text focus:border-accent outline-none"
                    placeholder="EmberOS Live logs overview"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-text-muted mb-2 uppercase tracking-widest font-black">Scheduled For</label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.scheduled_for}
                    onChange={e => handleInputChange('scheduled_for', e.target.value)}
                    className="w-full bg-bg border border-muted/20 rounded-xl px-4 py-2.5 text-text focus:border-accent outline-none font-mono text-xs text-text-muted"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-text-muted mb-2 uppercase tracking-widest font-black">Linked Episodes</label>
                <select
                  value={formData.related_episode_id}
                  onChange={e => handleInputChange('related_episode_id', e.target.value)}
                  className="w-full bg-bg border border-muted/20 rounded-xl px-4 py-2.5 text-text focus:border-accent outline-none"
                >
                  <option value="">-- No episode linkage --</option>
                  {episodes.map(ep => (
                    <option key={ep.id} value={ep.id}>{ep.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] text-text-muted mb-2 uppercase tracking-widest font-black flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> Notes / Release parameters
                </label>
                <textarea
                  rows={4}
                  value={formData.notes}
                  onChange={e => handleInputChange('notes', e.target.value)}
                  className="w-full bg-bg border border-muted/20 rounded-xl px-4 py-2.5 text-text focus:border-accent outline-none font-mono text-xs resize-none"
                  placeholder="Need to wrap up coding for RLS policies before this video launch..."
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 items-center justify-end border-t border-muted/10 pt-6">
                {editingEvent && (
                  <button
                    type="button"
                    onClick={(e) => handleDelete(editingEvent.id, e)}
                    className="mr-auto px-5 py-3 bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-bg rounded-xl uppercase tracking-widest text-[10px] font-black transition-all font-mono"
                  >
                    <Trash2 className="w-4 h-4 inline mr-1" /> DELETE
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-3 border border-muted/20 text-text-muted hover:text-white rounded-xl uppercase tracking-widest text-[10px] font-bold"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 px-8 py-3 bg-accent text-bg font-black rounded-xl hover:bg-accent/80 transition-all disabled:opacity-50 uppercase tracking-widest text-[10px] shadow-lg shadow-accent/15"
                >
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {saving ? 'SAVING_CHANGES...' : editingEvent ? 'APPLY_CHANGES' : 'CREATE_PLAN'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
