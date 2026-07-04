'use client';

import { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  Loader2, 
  Send, 
  Trash2, 
  Edit2, 
  Check, 
  CheckCircle,
  AlertCircle,
  Copy,
  ExternalLink,
  Twitter,
  Linkedin,
  Globe,
  Instagram,
  RefreshCw,
  FolderOpen,
  Image
} from 'lucide-react';
import Link from 'next/link';

export default function ContentQueue() {
  const [drafts, setDrafts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Card specific states
  const [editingText, setEditingText] = useState({}); // draftId -> text
  const [editingSubreddit, setEditingSubreddit] = useState({}); // draftId -> subreddit
  const [publishing, setPublishing] = useState({}); // draftId -> boolean
  const [saving, setSaving] = useState({}); // draftId -> boolean
  const [linkedinModal, setLinkedinModal] = useState(null); // draft object if open
  
  // Google Drive photo picker states
  const [driveModalOpen, setDriveModalOpen] = useState(false);
  const [driveFiles, setDriveFiles] = useState([]);
  const [driveLoading, setDriveLoading] = useState(false);
  const [activeDraftForThumbnail, setActiveDraftForThumbnail] = useState(null);

  useEffect(() => {
    fetchQueue();
  }, []);

  async function fetchQueue() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/content/queue');
      if (!res.ok) throw new Error('Failed to retrieve draft review queue');
      const data = await res.json();
      
      // Filter out rejected drafts to keep queue clean, or show all
      // Let's filter to pending, needs_edit, failed, or posted (for visual feedback)
      const activeDrafts = data.filter(d => d.status !== 'rejected');
      setDrafts(activeDrafts || []);
      
      // Initialize edit texts and subreddits
      const editState = {};
      const subredditState = {};
      activeDrafts.forEach(d => {
        editState[d.id] = d.draft_text;
        subredditState[d.id] = d.reddit_subreddit || 'webdev';
      });
      setEditingText(editState);
      setEditingSubreddit(subredditState);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const handleTextChange = (id, text) => {
    setEditingText(prev => ({ ...prev, [id]: text }));
  };

  const handleSaveChanges = async (id) => {
    setSaving(prev => ({ ...prev, [id]: true }));
    try {
      const res = await fetch('/api/content/queue', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id, 
          draft_text: editingText[id],
          reddit_subreddit: editingSubreddit[id]
        })
      });
      
      if (!res.ok) throw new Error('Failed to save draft edits');
      alert('Changes saved successfully.');
      fetchQueue();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(prev => ({ ...prev, [id]: false }));
    }
  };

  const handleReject = async (id) => {
    if (!confirm('Are you sure you want to reject and archive this draft?')) return;
    try {
      const res = await fetch('/api/content/queue', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'rejected' })
      });
      
      if (!res.ok) throw new Error('Failed to reject draft');
      fetchQueue();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleApproveAndPost = async (draft) => {
    const id = draft.id;
    setPublishing(prev => ({ ...prev, [id]: true }));
    
    try {
      // Trigger Next.js publish route proxy
      const res = await fetch('/api/content/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ draft_id: id })
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || 'Publishing operation failed');
      }

      if (result.status === 'manual_required') {
        // LinkedIn Case: Open clipboard copy modal helper
        navigator.clipboard.writeText(result.draft_text);
        setLinkedinModal(draft);
      } else {
        // Successful post updates
        alert(`Draft published successfully to ${draft.platform.toUpperCase()}!`);
        fetchQueue();
      }

    } catch (err) {
      alert(`Publish Error: ${err.message}`);
      fetchQueue(); // refresh queue to show failed status
    } finally {
      setPublishing(prev => ({ ...prev, [id]: false }));
    }
  };

  const handleConfirmLinkedInPosted = async (id, manualUrl) => {
    try {
      const res = await fetch('/api/content/queue', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id, 
          status: 'posted', 
          external_post_url: manualUrl || 'https://linkedin.com' 
        })
      });

      if (!res.ok) throw new Error('Failed to update LinkedIn status');
      setLinkedinModal(null);
      fetchQueue();
    } catch (err) {
      alert(err.message);
    }
  };

  const openDrivePicker = async (draft) => {
    setActiveDraftForThumbnail(draft);
    setDriveModalOpen(true);
    setDriveLoading(true);
    try {
      const res = await fetch('/api/google-drive');
      if (!res.ok) throw new Error('Failed to retrieve drive files');
      const data = await res.json();
      setDriveFiles(data.files || []);
    } catch (err) {
      alert(err.message);
    } finally {
      setDriveLoading(false);
    }
  };

  const selectThumbnail = async (file) => {
    if (!activeDraftForThumbnail) return;
    const draftId = activeDraftForThumbnail.id;
    try {
      const res = await fetch('/api/content/queue', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: draftId, thumbnail_url: file.thumbnailLink })
      });
      if (!res.ok) throw new Error('Failed to save thumbnail association');
      setDriveModalOpen(false);
      fetchQueue();
    } catch (err) {
      alert(err.message);
    }
  };

  // Group drafts by source_id
  const getGroupedDrafts = () => {
    const grouped = {};
    drafts.forEach(draft => {
      const source = draft.content_sources;
      const sourceId = source?.id || 'standalone';
      if (!grouped[sourceId]) {
        grouped[sourceId] = {
          sourceInfo: source || { title: 'Standalone Drafts' },
          drafts: []
        };
      }
      grouped[sourceId].drafts.push(draft);
    });
    return Object.values(grouped);
  };

  const groupedGroups = getGroupedDrafts();

  // Color Styles per platform card
  const getPlatformCardStyle = (platform) => {
    switch (platform) {
      case 'twitter':
        return {
          headerBg: 'bg-white/[0.03] border-white/5',
          icon: <Twitter className="w-4 h-4 text-sky-400" />,
          accentBg: 'border-sky-500/20 hover:border-sky-500/40',
          title: 'X / Twitter'
        };
      case 'linkedin':
        return {
          headerBg: 'bg-[#0a66c2]/5 border-[#0a66c2]/10',
          icon: <Linkedin className="w-4 h-4 text-[#0a66c2]" />,
          accentBg: 'border-[#0a66c2]/20 hover:border-[#0a66c2]/40',
          title: 'LinkedIn'
        };
      case 'reddit':
        return {
          headerBg: 'bg-orange-500/5 border-orange-500/10',
          icon: <Globe className="w-4 h-4 text-orange-500" />,
          accentBg: 'border-orange-500/20 hover:border-orange-500/40',
          title: 'Reddit'
        };
      case 'instagram':
        return {
          headerBg: 'bg-purple-500/5 border-purple-500/10',
          icon: <Instagram className="w-4 h-4 text-purple-400" />,
          accentBg: 'border-purple-500/20 hover:border-purple-500/40',
          title: 'Instagram'
        };
      default:
        return {
          headerBg: 'bg-white/[0.03] border-white/5',
          icon: <Send className="w-4 h-4 text-accent" />,
          accentBg: 'border-accent/20 hover:border-accent/40',
          title: 'Threads'
        };
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'posted':
        return <span className="text-[9px] font-mono text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded-full uppercase font-bold">posted</span>;
      case 'failed':
        return <span className="text-[9px] font-mono text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-full uppercase font-bold animate-pulse">failed</span>;
      case 'needs_edit':
        return <span className="text-[9px] font-mono text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 px-2 py-0.5 rounded-full uppercase font-bold">needs edit</span>;
      default:
        return <span className="text-[9px] font-mono text-text-muted bg-bg border border-muted/10 px-2 py-0.5 rounded-full uppercase font-bold">pending review</span>;
    }
  };

  if (loading && drafts.length === 0) {
    return (
      <div className="h-96 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-12 h-12 text-accent animate-spin" />
        <span className="text-xs font-mono uppercase tracking-widest text-text-muted">Loading content queue...</span>
      </div>
    );
  }

  return (
    <div className="w-full pb-24 animate-in fade-in duration-500">
      {/* Navigation */}
      <div className="flex justify-between items-center mb-10">
        <Link
          href="/admin/content"
          className="text-accent/50 text-xs font-mono tracking-widest hover:text-accent transition-all flex items-center gap-2 group"
        >
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> BACK_TO_CMS
        </Link>
        <button
          onClick={fetchQueue}
          className="flex items-center gap-1.5 px-3 py-2 bg-surface border border-muted/20 hover:border-accent/30 text-xs text-text-muted hover:text-white rounded-xl transition-all font-mono"
        >
          <RefreshCw className="w-3.5 h-3.5" /> REFRESH
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 text-red-500 p-4 rounded-2xl mb-8 border border-red-500/20 font-mono text-sm">
          ERROR: {error}
        </div>
      )}

      {/* Main Queue Column */}
      {groupedGroups.length === 0 ? (
        <div className="bg-surface border border-muted/10 rounded-[2rem] p-12 text-center text-text-muted">
          <FolderOpen className="w-12 h-12 text-accent/30 mx-auto mb-4" />
          <p className="text-sm font-mono uppercase tracking-widest">Draft queue is empty.</p>
          <p className="text-xs text-text-muted/60 mt-1">Check back later or manually ingest a new document.</p>
        </div>
      ) : (
        <div className="space-y-12">
          {groupedGroups.map((group, index) => (
            <div 
              key={group.sourceInfo.id || index}
              className="bg-surface/20 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-8 space-y-6"
            >
              {/* Ingestion Source Header details */}
              <div className="border-b border-muted/10 pb-4 mb-6">
                <span className="text-[10px] font-mono text-accent uppercase tracking-widest font-black">
                  Ingested Source: {group.sourceInfo.source_type || 'Manual'}
                </span>
                <h3 className="font-display text-2xl font-black text-white uppercase tracking-tight mt-1">
                  {group.sourceInfo.title}
                </h3>
                {group.sourceInfo.url && (
                  <a
                    href={group.sourceInfo.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-accent font-mono mt-1 hover:underline"
                  >
                    View Source Document <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>

              {/* Grid: 5 Social Cards */}
              <div className="grid xl:grid-cols-5 lg:grid-cols-3 md:grid-cols-2 gap-6">
                {group.drafts.map((draft) => {
                  const cardConfig = getPlatformCardStyle(draft.platform);
                  const isModified = editingText[draft.id] !== draft.draft_text || editingSubreddit[draft.id] !== draft.reddit_subreddit;
                  const isPosted = draft.status === 'posted';

                  return (
                    <div
                      key={draft.id}
                      className={`bg-surface border rounded-[2rem] overflow-hidden flex flex-col justify-between shadow-xl transition-all duration-300 ${cardConfig.accentBg}`}
                    >
                      {/* Top platform bar */}
                      <div className={`px-5 py-4 border-b flex items-center justify-between ${cardConfig.headerBg}`}>
                        <div className="flex items-center gap-2">
                          {cardConfig.icon}
                          <span className="font-mono text-[10px] font-bold text-white uppercase tracking-wider">
                            {cardConfig.title}
                          </span>
                        </div>
                        {getStatusBadge(draft.status)}
                      </div>

                      {/* Thumbnail Preview */}
                      {draft.thumbnail_url && (
                        <div className="w-full h-32 bg-black/40 border-b border-muted/5 relative overflow-hidden shrink-0">
                          <img src={draft.thumbnail_url} alt="Thumbnail Preview" className="w-full h-full object-cover" />
                        </div>
                      )}

                      {/* Text editor */}
                      <div className="p-5 flex-1 flex flex-col gap-3">
                        <div className="flex items-center justify-between gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => openDrivePicker(draft)}
                            className="flex items-center gap-1 py-1.5 px-2 bg-bg hover:bg-white/5 border border-muted/10 text-[9px] font-mono text-text-muted hover:text-white rounded-lg transition-all uppercase tracking-wider font-bold"
                          >
                            <Image className="w-3.5 h-3.5 text-accent" /> {draft.thumbnail_url ? 'CHANGE_THUMBNAIL' : 'ATTACH_THUMBNAIL'}
                          </button>
                        </div>
                        {draft.platform === 'reddit' && (
                          <div className="flex flex-col gap-1 shrink-0">
                            <span className="text-[9px] font-mono text-text-muted uppercase tracking-widest font-black">Target Subreddit</span>
                            <input
                              type="text"
                              disabled={isPosted || publishing[draft.id]}
                              value={editingSubreddit[draft.id] || ''}
                              onChange={(e) => setEditingSubreddit(prev => ({ ...prev, [draft.id]: e.target.value }))}
                              className="w-full bg-bg/50 border border-muted/10 rounded-xl px-3 py-1.5 text-xs font-mono text-text outline-none focus:border-accent"
                              placeholder="webdev"
                            />
                          </div>
                        )}
                        <textarea
                          disabled={isPosted || publishing[draft.id]}
                          rows={12}
                          value={editingText[draft.id] || ''}
                          onChange={(e) => handleTextChange(draft.id, e.target.value)}
                          className="w-full flex-1 bg-bg/50 border border-muted/10 rounded-xl p-3 text-xs font-mono text-text outline-none resize-none focus:border-accent/40 disabled:opacity-75 scrollbar-thin"
                          placeholder="Draft text..."
                        />
                        
                        {/* Error logs if failed */}
                        {draft.status === 'failed' && draft.error_message && (
                          <div className="p-3 bg-red-500/5 border border-red-500/10 rounded-xl flex items-start gap-2 text-[10px] text-red-400 font-mono">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <span className="break-all">{draft.error_message}</span>
                          </div>
                        )}

                        {/* Live Post link if posted */}
                        {isPosted && draft.external_post_url && (
                          <a
                            href={draft.external_post_url}
                            target="_blank"
                            rel="noreferrer"
                            className="p-3 bg-green-500/5 hover:bg-green-500/10 border border-green-500/10 hover:border-green-500/30 transition-all rounded-xl flex items-center justify-between text-[10px] text-green-400 font-mono"
                          >
                            <span className="flex items-center gap-1.5 font-bold">
                              <CheckCircle className="w-3.5 h-3.5" /> LIVE_POST_URL
                            </span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>

                      {/* Card Action footer */}
                      <div className="px-5 pb-5 pt-2 flex items-center justify-between gap-3 border-t border-muted/5 mt-auto">
                        {!isPosted ? (
                          <>
                            {isModified ? (
                              <button
                                onClick={() => handleSaveChanges(draft.id)}
                                disabled={saving[draft.id]}
                                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-accent/15 hover:bg-accent hover:text-bg text-accent font-bold rounded-xl border border-accent/20 transition-all font-mono text-[9px] uppercase tracking-wider"
                              >
                                {saving[draft.id] ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                                SAVE_CHANGES
                              </button>
                            ) : (
                              <button
                                onClick={() => handleApproveAndPost(draft)}
                                disabled={publishing[draft.id]}
                                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-accent text-bg font-black rounded-xl hover:bg-accent/80 transition-all disabled:opacity-50 font-mono text-[9px] uppercase tracking-wider shadow-lg shadow-accent/10"
                              >
                                {publishing[draft.id] && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                {draft.platform === 'linkedin' ? 'COPY_&_LOG' : 'APPROVE_&_POST'}
                              </button>
                            )}
                            
                            <button
                              onClick={() => handleReject(draft.id)}
                              disabled={publishing[draft.id]}
                              className="p-2.5 bg-bg border border-muted/10 hover:border-red-500/20 hover:bg-red-500/5 text-text-muted hover:text-red-500 rounded-xl transition-all"
                              title="Reject Draft"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        ) : (
                          <div className="flex-1 text-center py-2 text-[9px] font-mono font-bold text-text-muted uppercase tracking-widest bg-bg/50 border border-muted/5 rounded-xl">
                            VERIFIED_POSTED
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* LinkedIn Clipboard manual assist overlay */}
      {linkedinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bg/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-[#0f1424] border border-muted/20 w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in scale-in duration-200 p-8 space-y-6">
            <div className="flex items-center gap-4 border-b border-muted/10 pb-4">
              <div className="p-2.5 bg-[#0a66c2]/10 rounded-xl flex items-center justify-center border border-[#0a66c2]/30">
                <Linkedin className="w-5 h-5 text-[#0a66c2]" />
              </div>
              <div>
                <h4 className="font-display text-xl font-black text-white uppercase tracking-tight">Manual Posting Assist</h4>
                <span className="text-[10px] text-text-muted font-mono tracking-wider">LinkedIn Integration Loop</span>
              </div>
            </div>

            <div className="p-4 bg-green-500/5 border border-green-500/10 text-green-400 rounded-2xl flex items-start gap-3">
              <CheckCircle className="w-5 h-5 shrink-0 text-green-400 mt-0.5" />
              <div>
                <p className="text-xs font-bold font-mono uppercase">COPIED_TO_CLIPBOARD</p>
                <p className="text-xs text-green-400/80 mt-1 leading-relaxed">
                  The AI LinkedIn post draft has been copied to your clipboard. Since LinkedIn does not support automated API triggers on free tiers, follow these steps to manually share:
                </p>
              </div>
            </div>

            <ol className="list-decimal list-inside text-xs font-mono text-text-muted space-y-2 border-b border-muted/10 pb-6 mb-6">
              <li>Open LinkedIn in your browser.</li>
              <li>Paste the clipboard draft text into a new share post.</li>
              <li>Add visual showcase attachments if needed.</li>
              <li>Publish, copy the live post URL, and input it below.</li>
            </ol>

            {/* Input Live Link to confirm and update status */}
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] text-text-muted mb-2 uppercase tracking-widest font-black">Live LinkedIn Post URL</label>
                <input
                  type="url"
                  id="linkedin-live-url"
                  className="w-full bg-bg border border-muted/20 rounded-xl px-4 py-2.5 text-text text-xs font-mono outline-none focus:border-accent"
                  placeholder="https://www.linkedin.com/posts/activity-12345"
                />
              </div>

              <div className="flex gap-4 items-center justify-end">
                <button
                  type="button"
                  onClick={() => setLinkedinModal(null)}
                  className="px-5 py-2.5 border border-muted/20 text-text-muted hover:text-white rounded-xl uppercase tracking-widest text-[9px] font-bold font-mono"
                >
                  DISMISS
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const inputEl = document.getElementById('linkedin-live-url');
                    const url = inputEl ? inputEl.value : '';
                    handleConfirmLinkedInPosted(linkedinModal.id, url);
                  }}
                  className="px-6 py-2.5 bg-accent text-bg font-black rounded-xl hover:bg-accent/80 transition-all uppercase tracking-widest text-[9px] font-mono shadow-lg shadow-accent/15"
                >
                  CONFIRM_&_MARK_POSTED
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Google Drive Photo Picker Modal */}
      {driveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bg/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-[#0f1424] border border-muted/20 w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in scale-in duration-200 flex flex-col max-h-[80vh]">
            <div className="px-8 py-6 border-b border-muted/10 flex items-center justify-between bg-[#13192c] shrink-0">
              <div className="flex items-center gap-3">
                <Image className="w-6 h-6 text-accent animate-pulse" />
                <div>
                  <h4 className="font-display text-xl font-black text-white uppercase tracking-tight">Select Asset from Drive</h4>
                  <span className="text-[10px] text-text-muted font-mono tracking-wider">Thumbnail / Cover Selector</span>
                </div>
              </div>
              <button
                onClick={() => setDriveModalOpen(false)}
                className="text-text-muted hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-8 overflow-y-auto flex-1 min-h-[250px] scrollbar-thin">
              {driveLoading ? (
                <div className="h-48 flex flex-col items-center justify-center gap-3">
                  <Loader2 className="w-8 h-8 text-accent animate-spin" />
                  <span className="text-[10px] font-mono uppercase tracking-widest text-text-muted font-black animate-pulse">Scanning Drive space...</span>
                </div>
              ) : driveFiles.length === 0 ? (
                <div className="text-center py-16 text-text-muted font-mono text-xs uppercase tracking-widest">
                  No images found inside the whitelisted Google Drive folder.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {driveFiles.map((file) => (
                    <div
                      key={file.id}
                      onClick={() => selectThumbnail(file)}
                      className="bg-bg/40 border border-muted/10 hover:border-accent/50 rounded-2xl overflow-hidden cursor-pointer hover:scale-[1.02] transition-all relative group"
                    >
                      <div className="w-full h-28 overflow-hidden bg-black relative">
                        <img src={file.thumbnailLink} alt={file.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      </div>
                      <div className="p-3 font-mono text-[9px] uppercase tracking-wider text-text-muted truncate">
                        {file.name}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="px-8 py-5 border-t border-muted/10 bg-[#13192c] flex items-center justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setDriveModalOpen(false)}
                className="px-5 py-2.5 bg-bg border border-muted/20 text-text-muted hover:text-white rounded-xl uppercase tracking-widest text-[9px] font-bold font-mono"
              >
                DISMISS
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
