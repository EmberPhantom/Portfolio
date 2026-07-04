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

  const [isTouchDevice, setIsTouchDevice] = useState(true); // Default true until checked to avoid flash

  useEffect(() => {
    const isTouch = 
      ('ontouchstart' in window) ||
      (navigator.maxTouchPoints > 0) ||
      (navigator.msMaxTouchPoints > 0);
    
    setIsTouchDevice(isTouch);
    if (isTouch) return;

    // Hide native cursor on desktop
    document.body.style.cursor = 'none';

    let lastTime = 0;
    const moveMouse = (e) => {
      const now = performance.now();
      if (now - lastTime < 16) return; // limit to ~60fps
      lastTime = now;
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
    const handleMouseEnter = () => {};

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

  if (isTouchDevice) return null;

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
            backgroundColor: cursorType === 'pointer' ? '#ffffff1a' : '#ffffff',
          }}
          transition={{ type: 'spring', stiffness: 250, damping: 20 }}
        />
      )}
    </motion.div>
  );
}
