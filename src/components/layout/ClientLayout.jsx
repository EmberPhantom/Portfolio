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
      <SmoothScroll>
        <div className="min-h-screen bg-forge-black selection:bg-orange-500/30">
          {children}
          <CustomCursor />
        </div>
      </SmoothScroll>
    );
  }

  return (
    <SmoothScroll>
      <div className="min-h-screen bg-forge-black flex selection:bg-orange-500/30">
        <Navbar />
        
        {/* Main Content Area */}
        <div className="flex-1 md:ml-20 lg:ml-64 relative min-h-screen flex flex-col pt-4 md:pt-12 pb-20 md:pb-0">
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
