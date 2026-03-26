"use client";
import { usePathname } from 'next/navigation';
import Navbar from './Navbar';
import CustomCursor from '../ui/CustomCursor';
import TerminalOverlay from '../ui/TerminalOverlay';
import AIAssistant from '../ui/AIAssistant';
import SmoothScroll from './SmoothScroll';
import { useVisitorTracker } from '../../hooks/useVisitorTracker';

export default function ClientLayout({ children }) {
  const pathname = usePathname();
  const isDashboard = pathname?.startsWith('/dashboard');

  // Track public visits
  useVisitorTracker(isDashboard);

  if (isDashboard) {
    return (
      <div className="min-h-screen bg-forge-black selection:bg-orange-500/30">
        {children}
        <CustomCursor />
      </div>
    );
  }

  return (
    <SmoothScroll>
      <div className="min-h-screen bg-forge-black flex selection:bg-orange-500/30 overflow-hidden relative">
        {/* Cinematic Backdrop Elements */}
        <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent/5 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-orange-500/10 rounded-full blur-[120px]" />
          <div className="absolute inset-0 bg-transparent opacity-[0.03] pointer-events-none transition-opacity duration-1000"
               style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, var(--muted) 1px, transparent 0)', backgroundSize: '40px 40px' }} />
          
          {/* Scanning Line Effect */}
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-accent/30 to-transparent animate-scan opacity-20" />
        </div>

        <Navbar />
        
        {/* Main Content Area */}
        <div className="relative z-10 flex-1 md:ml-20 lg:ml-64 min-h-screen flex flex-col pt-4 md:pt-12 pb-20 md:pb-0">
          <main className="flex-1 flex flex-col">
            {children}
          </main>
        </div>

        {/* Global Utilities */}
        <CustomCursor />
        <TerminalOverlay />
        <AIAssistant />
      </div>

    </SmoothScroll>
  );
}
