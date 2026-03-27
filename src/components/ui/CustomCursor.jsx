import { useEffect, useState } from 'react';
import { motion, useSpring, useMotionValue } from 'framer-motion';

export default function CustomCursor() {
  const [isVisible, setIsVisible] = useState(false);
  const [cursorType, setCursorType] = useState('default'); // 'default', 'text', 'pointer'
  
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);
  
  const springConfig = { damping: 25, stiffness: 700, mass: 0.5 };
  const springX = useSpring(cursorX, springConfig);
  const springY = useSpring(cursorY, springConfig);

  useEffect(() => {
    // Hide native cursor
    document.body.style.cursor = 'none';

    const moveMouse = (e) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
      if (!isVisible) setIsVisible(true);
    };

    const handleMouseOver = (e) => {
      const target = e.target;
      const isInput = ['INPUT', 'TEXTAREA'].includes(target.tagName) || target.isContentEditable;
      const isClickable = target.closest('a') || target.closest('button') || target.classList.contains('interactive');
      
      if (isInput) setCursorType('text');
      else if (isClickable) setCursorType('pointer');
      else setCursorType('default');
    };

    const handleMouseLeave = () => setIsVisible(false);
    const handleMouseEnter = () => setIsVisible(true);

    window.addEventListener('mousemove', moveMouse);
    window.addEventListener('mouseover', handleMouseOver);
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);

    return () => {
      window.removeEventListener('mousemove', moveMouse);
      window.removeEventListener('mouseover', handleMouseOver);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
      document.body.style.cursor = 'auto';
    };
  }, [isVisible, cursorX, cursorY]);

  return (
    <motion.div
      className="fixed top-0 left-0 pointer-events-none z-[9999] hidden md:flex items-center justify-center mix-blend-difference"
      style={{
        x: springX,
        y: springY,
        translateX: "-50%",
        translateY: "-50%",
      }}
      animate={{
        opacity: isVisible ? 1 : 0,
        scale: isVisible ? 1 : 0,
      }}
    >
      {cursorType === 'text' ? (
        <motion.div 
          className="w-[2px] h-6 bg-accent rounded-full"
          initial={{ height: 0 }}
          animate={{ height: 24 }}
        />
      ) : (
        <motion.div 
          className={`rounded-full border border-white bg-white/10 ${cursorType === 'pointer' ? 'w-12 h-12' : 'w-4 h-4'}`}
          animate={{
            width: cursorType === 'pointer' ? 48 : 16,
            height: cursorType === 'pointer' ? 48 : 16,
            backgroundColor: cursorType === 'pointer' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 1)',
          }}
          transition={{ type: 'spring', stiffness: 250, damping: 20 }}
        />
      )}
    </motion.div>
  );
}
