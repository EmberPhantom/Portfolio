import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Activity, Code, Music } from 'lucide-react';

export default function LiveStatus() {
  const [status, setStatus] = useState({ type: 'coding', text: 'Building FORGE OS v2.0', detail: 'React & Tailwind' });
  const wakatimeKey = process.env.NEXT_PUBLIC_WAKATIME_API_KEY;
  const spotifyKey = process.env.NEXT_PUBLIC_SPOTIFY_API_KEY;

  useEffect(() => {
    // If user provides API keys later, they can hook up actual fetch calls here.
    // For free deployment without keys yet, we simulate a live status or show static fallback.
    if (!wakatimeKey && !spotifyKey) {
      const statuses = [
        { type: 'coding', text: 'Building EmberOS v2.5', detail: 'React & Tailwind' },
        { type: 'music', text: 'Listening to Synthwave', detail: 'Spotify' },
        { type: 'system', text: 'System Check Normal', detail: 'Uptime: 99.9%' }
      ];
      let i = 0;
      const interval = setInterval(() => {
        i = (i + 1) % statuses.length;
        setStatus(statuses[i]);
      }, 10000);
      return () => clearInterval(interval);
    }

    // Example actual fetch logic if keys exist (User will implement their own proxy/edge function to avoid CORS/leaks)
  }, [wakatimeKey, spotifyKey]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="inline-flex items-center gap-3 px-4 py-2 bg-surface/80 border border-muted/20 backdrop-blur-sm rounded-full mt-8"
    >
      <div className="relative flex items-center justify-center w-6 h-6 rounded-full bg-bg border border-muted/30">
        {status.type === 'coding' && <Code className="w-3 h-3 text-orange-500" />}
        {status.type === 'music' && <Music className="w-3 h-3 text-green-500" />}
        {status.type === 'system' && <Activity className="w-3 h-3 text-blue-500" />}
        
        {/* Pulsing ring */}
        <span className="absolute inset-0 rounded-full border border-orange-500/50 animate-ping opacity-75" style={{ animationDuration: '3s' }} />
      </div>
      
      <div className="flex flex-col text-left">
        <span className="text-xs text-text-muted font-mono uppercase tracking-wider">{status.type === 'coding' ? 'Now Coding' : status.type === 'music' ? 'Now Playing' : 'Status'}</span>
        <span className="text-sm text-text font-medium leading-none">{status.text} <span className="text-text-muted font-normal hidden sm:inline">— {status.detail}</span></span>
      </div>
    </motion.div>
  );
}
