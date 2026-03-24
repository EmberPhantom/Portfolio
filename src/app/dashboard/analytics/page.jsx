'use client';

import { Activity, LayoutDashboard } from 'lucide-react';
import Link from 'next/link';

export default function AnalyticsPage() {
  return (
    <div className="h-[60vh] flex flex-col items-center justify-center text-center space-y-6">
      <div className="w-20 h-20 bg-accent/10 border border-accent/20 rounded-3xl flex items-center justify-center">
        <Activity className="w-10 h-10 text-accent animate-pulse" />
      </div>
      <div>
        <h2 className="text-3xl font-display font-black text-white uppercase tracking-tighter mb-2">Advanced Analytics</h2>
        <p className="text-text-muted max-w-sm mx-auto">This module is currently initializing. Real-time traffic data and behavioral insights will be available shortly.</p>
      </div>
      <Link href="/dashboard" className="px-6 py-3 bg-muted/10 border border-muted/20 rounded-xl text-xs font-mono tracking-widest uppercase hover:bg-muted/20 transition-all flex items-center gap-2">
        <LayoutDashboard className="w-4 h-4" /> Return to Overview
      </Link>
    </div>
  );
}
