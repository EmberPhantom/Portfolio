import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTerminal } from '../../context/TerminalContext';
import { X, Terminal as TerminalIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function TerminalOverlay() {
  const { isTerminalMode, toggleTerminalMode } = useTerminal();
  const [history, setHistory] = useState([
    { type: 'system', text: 'EMBER OS [Version 2.1.0-STABLE]' },
    { type: 'system', text: '(c) 2026 Pranay Chandra. All rights reserved.' },
    { type: 'system', text: '---' },
    { type: 'system', text: "Core kernel engaged. Type 'help' to begin transmission." }
  ]);
  const [input, setInput] = useState('');
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [commandHistory, setCommandHistory] = useState([]);
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
      newHistory.push({ type: 'info', text: '  ls / dir     - List directories' });
      newHistory.push({ type: 'info', text: '  cd <dir>     - Change directory' });
      newHistory.push({ type: 'info', text: '  whoami       - User identity' });
      newHistory.push({ type: 'info', text: '  blog         - Read latest entries' });
      newHistory.push({ type: 'info', text: '  contact      - Open comms channel' });
      newHistory.push({ type: 'info', text: '  date         - System time' });
      newHistory.push({ type: 'info', text: '  clear        - Flush buffer' });
      newHistory.push({ type: 'info', text: '  exit / close - Terminate session' });
    } else if (trimmed === 'ls' || trimmed === 'dir') {
      newHistory.push({ type: 'system', text: 'Directory of /root:' });
      newHistory.push({ type: 'info', text: '  work/  lab/  blog/  contact/  identity.pgp' });
    } else if (trimmed === 'whoami') {
      newHistory.push({ type: 'system', text: 'NAME: Pranay Chandra' });
      newHistory.push({ type: 'system', text: 'ROLE: Systems Builder / AI Architect' });
      newHistory.push({ type: 'system', text: 'LOCATION: Neo-Delhi Node' });
      newHistory.push({ type: 'system', text: 'STATUS: Searching for meaningful patterns...' });
    } else if (trimmed === 'date') {
      newHistory.push({ type: 'system', text: new Date().toString() });
    } else if (trimmed.startsWith('cd ')) {
      const dir = trimmed.split(' ')[1];
      if (['work', 'lab', 'blog', 'contact'].includes(dir)) {
        newHistory.push({ type: 'system', text: `Jumping to /${dir}...` });
        router.push(`/${dir === 'contact' ? 'contact' : dir}`);
        setTimeout(() => toggleTerminalMode(), 500);
      } else {
        newHistory.push({ type: 'error', text: `Directory not found: ${dir}` });
      }
    } else if (trimmed === 'blog') {
        newHistory.push({ type: 'system', text: 'Accessing Journal Feed...' });
        router.push('/blog');
        setTimeout(() => toggleTerminalMode(), 500);
    } else if (trimmed === 'clear' || trimmed === 'cls') {
      setHistory([]);
      setInput('');
      return;
    } else if (trimmed === 'exit' || trimmed === 'close') {
      toggleTerminalMode();
    } else if (trimmed === 'sudo') {
       newHistory.push({ type: 'error', text: "ADMIN OVERRIDE: NICE TRY. Incident recorded in core-log-0x42."});
    } else if (trimmed !== '') {
      newHistory.push({ type: 'error', text: `Command not found: ${trimmed}. Type 'help' for manual.` });
    }

    setHistory(newHistory);
    setCommandHistory(prev => [cmd, ...prev].slice(0, 50));
    setHistoryIndex(-1);
    setInput('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleCommand(input);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (historyIndex < commandHistory.length - 1) {
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        setInput(commandHistory[newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > -1) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setInput(newIndex === -1 ? '' : commandHistory[newIndex]);
      }
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
          <div className="w-full max-w-4xl h-[80vh] bg-[#0c0c0c] border border-accent/30 rounded-lg shadow-2xl flex flex-col overflow-hidden font-mono relative">
            {/* Scanline Overlay */}
            <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%] z-20 opacity-30" />
            
            {/* Terminal Header */}
            <div className="h-10 bg-[#1a1a1a] border-b border-accent/20 flex items-center justify-between px-4 shrink-0 z-30">
              <div className="flex items-center gap-2 text-accent text-sm">
                <TerminalIcon className="w-4 h-4" />
                <span>visitor@ember-os:~</span>
              </div>
              <button 
                onClick={toggleTerminalMode}
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Close Terminal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Terminal Body */}
            <div 
              className="flex-1 p-4 overflow-y-auto text-sm sm:text-base cursor-text relative z-10 scroll-smooth selection:bg-accent/30"
              onClick={() => inputRef.current?.focus()}
            >
              {history.map((entry, i) => (
                <div 
                  key={i} 
                  className={`mb-2 ${entry.type === 'error' ? 'text-red-400' : entry.type === 'info' ? 'text-accent/80' : entry.type === 'system' ? 'text-accent' : 'text-white'}`}
                >
                  {entry.text}
                </div>
              ))}
              
              <div className="flex items-center mt-2 text-white">
                <span className="text-accent mr-2">visitor@ember-os:~$</span>
                <div className="flex-1 relative">
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="w-full bg-transparent border-none outline-none text-white shadow-none focus:ring-0 p-0 m-0 relative z-30 caret-transparent"
                    autoFocus
                    spellCheck="false"
                    autoComplete="off"
                  />
                  {/* Blinking Cursor */}
                  <div className="absolute left-0 top-0 h-full flex items-center pointer-events-none">
                    <span className="opacity-0">{input}</span>
                    <motion.div 
                      animate={{ opacity: [1, 0] }}
                      transition={{ duration: 0.8, repeat: Infinity }}
                      className="w-2.5 h-[1.2em] bg-accent ml-0.5"
                    />
                  </div>
                </div>
              </div>
              <div ref={bottomRef} className="h-4" />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
