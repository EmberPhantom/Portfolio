import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTerminal } from '../../context/TerminalContext';
import { X, Terminal as TerminalIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function TerminalOverlay() {
  const { isTerminalMode, toggleTerminalMode } = useTerminal();
  const [history, setHistory] = useState([
    { type: 'system', text: 'FORGE OS v2.0 initialized.' },
    { type: 'system', text: "Type 'help' for a list of commands." }
  ]);
  const [input, setInput] = useState('');
  const inputRef = useRef(null);
  const bottomRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    if (isTerminalMode && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isTerminalMode]);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [history]);

  const handleCommand = (cmd) => {
    const trimmed = cmd.trim().toLowerCase();
    const newHistory = [...history, { type: 'user', text: `> ${cmd}` }];

    if (trimmed === 'help') {
      newHistory.push({ type: 'system', text: 'Available commands:' });
      newHistory.push({ type: 'system', text: '  about      - View about me' });
      newHistory.push({ type: 'system', text: '  skills     - View skills' });
      newHistory.push({ type: 'system', text: '  projects   - Navigate to projects' });
      newHistory.push({ type: 'system', text: '  contact    - Send a message' });
      newHistory.push({ type: 'system', text: '  clear      - Clear terminal' });
      newHistory.push({ type: 'system', text: '  exit       - Leave terminal mode' });
    } else if (trimmed === 'clear') {
      setHistory([]);
      setInput('');
      return;
    } else if (trimmed === 'exit') {
      toggleTerminalMode();
    } else if (trimmed === 'about') {
      newHistory.push({ type: 'system', text: 'Navigating to / (About)...' });
      router.push('/');
      toggleTerminalMode();
    } else if (trimmed === 'projects' || trimmed === 'work') {
      newHistory.push({ type: 'system', text: 'Navigating to /work...' });
      router.push('/work');
      toggleTerminalMode();
    } else if (trimmed === 'skills' || trimmed === 'lab') {
      newHistory.push({ type: 'system', text: 'Navigating to /lab...' });
      router.push('/lab');
      toggleTerminalMode();
    } else if (trimmed === 'contact') {
      newHistory.push({ type: 'system', text: 'Navigating to /contact...' });
      router.push('/contact');
      toggleTerminalMode();
    } else if (trimmed === 'sudo') {
        newHistory.push({ type: 'error', text: "Nice try. This incident will be reported."});
    } else if (trimmed !== '') {
      newHistory.push({ type: 'error', text: `Command not found: ${trimmed}` });
    }

    setHistory(newHistory);
    setInput('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleCommand(input);
    }
  };

  return (
    <AnimatePresence>
      {isTerminalMode && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8 bg-black/60 backdrop-blur-md"
        >
          <div className="w-full max-w-4xl h-[80vh] bg-[#0c0c0c] border border-orange-500/30 rounded-lg shadow-2xl flex flex-col overflow-hidden font-mono">
            {/* Terminal Header */}
            <div className="h-10 bg-[#1a1a1a] border-b border-orange-500/20 flex items-center justify-between px-4">
              <div className="flex items-center gap-2 text-orange-500 text-sm">
                <TerminalIcon className="w-4 h-4" />
                <span>visitor@forge-os:~</span>
              </div>
              <button 
                onClick={toggleTerminalMode}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Terminal Body */}
            <div 
              className="flex-1 p-4 overflow-y-auto text-sm sm:text-base cursor-text"
              onClick={() => inputRef.current?.focus()}
            >
              {history.map((entry, i) => (
                <div 
                  key={i} 
                  className={`mb-2 ${entry.type === 'error' ? 'text-red-400' : entry.type === 'system' ? 'text-orange-300' : 'text-white'}`}
                >
                  {entry.text}
                </div>
              ))}
              
              <div className="flex items-center mt-2 text-white">
                <span className="text-orange-500 mr-2">visitor@forge-os:~$</span>
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="flex-1 bg-transparent border-none outline-none text-white shadow-none focus:ring-0 p-0 m-0"
                  autoFocus
                  spellCheck="false"
                  autoComplete="off"
                />
              </div>
              <div ref={bottomRef} />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
