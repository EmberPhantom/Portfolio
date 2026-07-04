'use client';

import IdentityHub from '../../../components/dashboard/IdentityHub';
import { Brain } from 'lucide-react';

export default function IntelligencePage() {
  return (
    <div className="w-full space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl">
      <div className="mb-12">
        <div className="flex items-center gap-4 mb-2">
          <Brain className="w-8 h-8 text-accent animate-pulse" />
          <h2 className="font-display text-4xl font-black text-text uppercase tracking-tighter">Intelligence Hub</h2>
        </div>
        <p className="text-text-muted text-sm tracking-wide uppercase">Entity Mapping & Persona Calibration</p>
      </div>

      <section>
        <IdentityHub />
      </section>
    </div>
  );
}
