"use client";
import { createContext, useContext, useState } from 'react';

const TerminalContext = createContext(null);

export function TerminalProvider({ children }) {
  const [isTerminalMode, setIsTerminalMode] = useState(false);

  const toggleTerminalMode = () => {
    setIsTerminalMode((prev) => !prev);
  };

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
