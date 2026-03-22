"use client";

import { TerminalProvider } from '../../context/TerminalContext';

export default function Providers({ children }) {
  return (
    <TerminalProvider>
      {children}
    </TerminalProvider>
  );
}
