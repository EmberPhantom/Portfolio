"use client";
import { usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';
import Navbar from './Navbar';
import Dock from './Dock';
import CustomCursor from '../ui/CustomCursor';
import { useVisitorTracker } from '../../hooks/useVisitorTracker';

const TerminalOverlay = dynamic(() => import('../ui/TerminalOverlay'), { ssr: false });
const AIAssistant = dynamic(() => import('../ui/AIAssistant'), { ssr: false });

export default function ClientLayout({ children }) {
  const pathname = usePathname();
  const isAdminPath = pathname?.startsWith('/admin');

  // Track public visits
  useVisitorTracker(isAdminPath);

  if (isAdminPath) {
    return (
      <div className="min-h-screen bg-forge-black selection:bg-orange-500/30">
        {children}
        <CustomCursor />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-forge-black flex selection:bg-orange-500/30 overflow-hidden relative">
      {/* Cinematic Backdrop Elements */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[var(--glow-1)] rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[var(--glow-2)] rounded-full blur-[120px]" />
        <div className="absolute inset-0 bg-transparent opacity-[0.03] pointer-events-none transition-opacity duration-1000"
             style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, var(--muted) 1px, transparent 0)', backgroundSize: '40px 40px' }} />
        
      </div>

      <Navbar />

      {/* Main Content Area */}
      <div className="relative z-10 flex-1 min-h-screen flex flex-col pt-16 pb-20">
        <main className="flex-1 flex flex-col">
          {children}
        </main>
      </div>

      {/* Global Utilities */}
      <CustomCursor />
      <TerminalOverlay />
      <AIAssistant />
      <Dock />
    </div>
  );
}
