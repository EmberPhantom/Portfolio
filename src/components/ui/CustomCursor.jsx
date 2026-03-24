import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export default function CustomCursor() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const updateMousePosition = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', updateMousePosition);
    return () => window.removeEventListener('mousemove', updateMousePosition);
  }, []);

  return (
    <motion.div
      className="fixed top-0 left-0 pointer-events-none z-[9999]"
      animate={{
        x: mousePosition.x,
        y: mousePosition.y,
      }}
      transition={{
        type: "tween",
        ease: "linear",
        duration: 0
      }}
    >
      <svg 
        width="20" 
        height="24" 
        viewBox="0 0 20 24" 
        fill="none" 
        style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <path 
          d="M1 1V21.5L7.5 15.5L11.5 22.5L14.5 21L10.5 14H18L1 1Z" 
          fill="var(--accent)"
          stroke="#FFFFFF"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
    </motion.div>
  );
}
