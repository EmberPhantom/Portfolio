"use client";
import { createContext, useContext, useState, useEffect } from 'react';

const TerminalContext = createContext(null);

export function TerminalProvider({ children }) {
  const [isTerminalMode, setIsTerminalMode] = useState(false);

  const toggleTerminalMode = () => {
    setIsTerminalMode((prev) => !prev);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Toggle on Ctrl+K or Cmd+K
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        toggleTerminalMode();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <TerminalContext.Provider value={{ isTerminalMode, toggleTerminalMode, setIsTerminalMode }}>
      {children}
    </TerminalContext.Provider>
  );
}

export function useTerminal() {
  const context = useContext(TerminalContext);
  if (!context) {
    throw new Error('useTerminal must be used within a TerminalProvider');
  }
  return context;
}
