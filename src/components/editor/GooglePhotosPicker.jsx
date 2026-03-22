'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, Camera, Search, RefreshCw, ChevronRight, ExternalLink } from 'lucide-react';

export default function GooglePhotosPicker({ onSelect, onClose }) {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [nextPageToken, setNextPageToken] = useState('');
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  const fetchPhotos = useCallback(async (pageToken = '') => {
    setLoading(true);
    setError('');
    try {
      const url = `/api/google-photos/media${pageToken ? `?pageToken=${pageToken}` : ''}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.error) {
        if (res.status === 401) {
          setError('not_connected');
        } else {
          setError(data.error);
        }
        return;
      }
      setPhotos(prev => pageToken ? [...prev, ...(data.mediaItems || [])] : (data.mediaItems || []));
      setNextPageToken(data.nextPageToken || '');
    } catch {
      setError('Failed to fetch photos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPhotos(); }, [fetchPhotos]);

  const filtered = photos.filter(p =>
    !search || p.filename?.toLowerCase().includes(search.toLowerCase()) || p.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-[#111] border border-forge-muted/20 rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-forge-muted/20">
            <div className="flex items-center gap-3">
              <Camera className="w-5 h-5 text-orange-500" />
              <div>
                <h2 className="font-display font-bold text-white">Google Photos</h2>
                <p className="text-xs text-gray-500">{photos.length} photos loaded</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => fetchPhotos()} className="p-2 text-gray-500 hover:text-white transition-colors">
                <RefreshCw className="w-4 h-4" />
              </button>
              <button onClick={onClose} className="p-2 text-gray-500 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="px-5 py-3 border-b border-forge-muted/20">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Filter by filename..."
                className="w-full bg-forge-black border border-forge-muted/20 rounded-lg pl-9 pr-4 py-2 text-white text-sm focus:border-orange-500 outline-none"
              />
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {error === 'not_connected' ? (
              <div className="text-center py-16">
                <Camera className="w-12 h-12 text-gray-700 mx-auto mb-4" />
                <p className="text-gray-400 mb-2">Google Photos not connected</p>
                <p className="text-gray-500 text-sm mb-4">Go to Settings → Google Photos Integration to connect your account.</p>
                <a href="/dashboard/settings" className="flex items-center gap-2 text-orange-500 hover:text-orange-400 text-sm justify-center">
                  Open Settings <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            ) : loading && photos.length === 0 ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
              </div>
            ) : error ? (
              <div className="text-center py-16">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16 text-gray-500">No photos found</div>
            ) : (
              <>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                  {filtered.map(photo => (
                    <button
                      key={photo.id}
                      onClick={() => { onSelect(`${photo.baseUrl}=w1200`); onClose(); }}
                      className="aspect-square rounded-xl overflow-hidden border-2 border-transparent hover:border-orange-500 transition-all group relative"
                    >
                      <img
                        src={`${photo.baseUrl}=w400`}
                        alt={photo.filename}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-end p-2">
                        <p className="text-white text-xs font-mono opacity-0 group-hover:opacity-100 truncate">{photo.filename}</p>
                      </div>
                    </button>
                  ))}
                </div>

                {nextPageToken && (
                  <button
                    onClick={() => fetchPhotos(nextPageToken)}
                    disabled={loading}
                    className="w-full mt-4 py-3 bg-forge-muted/20 text-gray-400 text-sm rounded-xl hover:bg-forge-muted/30 flex items-center justify-center gap-2 transition-colors"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4" />}
                    Load more photos
                  </button>
                )}
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
