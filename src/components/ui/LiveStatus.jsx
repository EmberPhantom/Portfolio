import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Activity, Code, Music } from 'lucide-react';

export default function LiveStatus() {
  const [status, setStatus] = useState({ type: 'coding', text: 'Initializing System...', detail: 'Neural Link' });

  useEffect(() => {
    async function fetchStatus() {
      try {
        const res = await fetch('/api/status');
        const data = await res.json();
        if (data && data.text) {
          setStatus(data);
        }
      } catch (err) {
        console.error('Failed to fetch live status:', err);
      }
    }

    fetchStatus();
    const interval = setInterval(fetchStatus, 300000); // Update every 5 mins
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="inline-flex items-center gap-3 px-4 py-2 bg-surface/80 border border-muted/20 backdrop-blur-sm rounded-full mt-8"
    >
      <div className="relative flex items-center justify-center w-6 h-6 rounded-full bg-bg border border-muted/30">
        {status.type === 'coding' && <Code className="w-3 h-3 text-accent" />}
        {status.type === 'music' && <Music className="w-3 h-3 text-green-500" />}
        {status.type === 'system' && <Activity className="w-3 h-3 text-accent" />}
        
        {/* Pulsing ring */}
        <span className="absolute inset-0 rounded-full border border-accent/50 animate-ping opacity-75" style={{ animationDuration: '3s' }} />
      </div>
      
      <div className="flex flex-col text-left">
        <span className="text-xs text-text-muted font-mono uppercase tracking-wider">{status.type === 'coding' ? 'Now Coding' : status.type === 'music' ? 'Now Playing' : 'Status'}</span>
        <span className="text-sm text-text font-medium leading-none">{status.text} <span className="text-text-muted font-normal hidden sm:inline">— {status.detail}</span></span>
      </div>
    </motion.div>
  );
}
