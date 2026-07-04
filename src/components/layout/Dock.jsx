'use client';

import { useState, useRef, Suspense } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from 'framer-motion';
import { 
  Home, 
  FolderGit2, 
  Briefcase, 
  Cpu, 
  Compass, 
  Mail, 
  Terminal as TerminalIcon 
} from 'lucide-react';
import { useTerminal } from '../../context/TerminalContext';

const dockLinks = [
  { name: "Home", href: "/", icon: Home },
  { name: "Projects", href: "/work", icon: FolderGit2 },
  { name: "Journey", href: "/journey", icon: Compass },
  { name: "Skills", href: "/journey?tab=skills", icon: Cpu },
  { name: "Contact", href: "/contact", icon: Mail },
];

export default function Dock() {
  return (
    <Suspense fallback={null}>
      <DockContent />
    </Suspense>
  );
}

function DockContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { toggleTerminalMode } = useTerminal();
  const mouseX = useMotionValue(Infinity);

  return (
    <motion.div
      initial={{ y: 100, x: '-50%', opacity: 0 }}
      animate={{ y: 0, x: '-50%', opacity: 1 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
      onMouseMove={(e) => mouseX.set(e.clientX)}
      onMouseLeave={() => mouseX.set(Infinity)}
      className="fixed bottom-6 left-1/2 z-50 flex items-center gap-2 px-3 py-2 rounded-full bg-surface/20 backdrop-blur-2xl border border-white/5 shadow-2xl scale-90 sm:scale-100 origin-bottom hover:border-white/10 transition-colors"
    >
      {/* Dynamic Page Links */}
      {dockLinks.map((link) => {
        const linkPath = link.href.split('?')[0];
        const linkTab = link.href.includes('?tab=') ? link.href.split('?tab=')[1] : null;
        const currentTab = searchParams.get('tab');

        const isActive = link.href === '/'
          ? pathname === '/'
          : linkTab 
            ? (pathname === linkPath && currentTab === linkTab)
            : (pathname === linkPath && !currentTab);

        return (
          <DockItem
            key={link.name}
            href={link.href}
            name={link.name}
            icon={link.icon}
            mouseX={mouseX}
            isActive={isActive}
          />
        );
      })}

      {/* Divider */}
      <div className="w-px h-5 bg-white/5 self-center mx-0.5" />

      {/* Terminal Mode Trigger */}
      <DockItem
        name="Terminal CLI"
        onClick={toggleTerminalMode}
        icon={TerminalIcon}
        mouseX={mouseX}
        isActive={false}
      />
    </motion.div>
  );
}

function DockItem({ href, name, icon: Icon, onClick, mouseX, isActive }) {
  const ref = useRef(null);
  const [hovered, setHovered] = useState(false);

  // Fisheye scale calculations based on distance to mouse pointer
  const distance = useTransform(mouseX, (val) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
    const centerX = bounds.x + bounds.width / 2;
    return val - centerX;
  });

  const scaleTransform = useTransform(distance, [-120, 0, 120], [1, 1.35, 1]);
  const scaleSpring = useSpring(scaleTransform, {
    stiffness: 250,
    damping: 18,
    mass: 0.15
  });

  const content = (
    <motion.div
      ref={ref}
      style={{ scale: scaleSpring }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`w-10 h-10 rounded-full flex items-center justify-center relative cursor-none transition-all group ${
        isActive 
          ? 'bg-accent/10 text-accent font-bold shadow-md shadow-accent/5' 
          : 'bg-transparent text-text-muted hover:text-text hover:bg-white/5'
      }`}
    >
      <Icon className={`w-5 h-5 transition-transform duration-300 group-hover:rotate-6`} />

      {/* Indicator active dot */}
      {isActive && (
        <motion.span 
          layoutId="dock-active-dot"
          className="absolute -bottom-1.5 w-1 h-1 bg-accent rounded-full shadow-[0_0_10px_var(--accent)]"
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        />
      )}

      {/* Glassmorphic Tooltip */}
      <AnimatePresence>
        {hovered && (
          <motion.span
            initial={{ opacity: 0, y: 10, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 10, x: '-50%' }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-full mb-3.5 left-1/2 px-3 py-1.5 text-[9px] uppercase tracking-widest font-black font-mono text-white bg-[#0a0a0a]/90 backdrop-blur-md border border-white/10 rounded-lg pointer-events-none whitespace-nowrap shadow-xl"
          >
            {name}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.div>
  );

  if (onClick) {
    return (
      <button onClick={onClick} aria-label={name} className="outline-none relative">
        {content}
      </button>
    );
  }

  return (
    <Link href={href} aria-label={name} className="relative">
      {content}
    </Link>
  );
}
