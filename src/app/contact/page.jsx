"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Play, Terminal as TerminalIcon, Save, Settings, X, FolderGit2, FileJson } from 'lucide-react';
import { sendEmail } from '../../lib/emailjs';

export default function ContactPage() {
  const [jsonInput, setJsonInput] = useState(`{\n  "name": "Visitor",\n  "email": "",\n  "subject": "Hello Build",\n  "message": "I would like to discuss..."\n}`);
  const [output, setOutput] = useState([
    { type: 'system', text: 'EmberOS Mail Relay initialized.' },
    { type: 'info', text: 'Awaiting payload compilation...' }
  ]);
  const [compiling, setCompiling] = useState(false);

  const handleRun = async () => {
    setCompiling(true);
    let parsed;
    
    try {
      parsed = JSON.parse(jsonInput);
      if (!parsed.email || !parsed.message) {
        throw new Error("Missing required fields: 'email' or 'message'");
      }

      setOutput(prev => [...prev, { type: 'system', text: '> Compiling payload...' }]);
      
      const result = await sendEmail({
        name: parsed.name,
        email: parsed.email,
        subject: parsed.subject,
        message: parsed.message
      });

      if (result.success || result.status === 200) {
        setOutput(prev => [...prev, 
          { type: 'success', text: '✓ Syntax valid.' },
          { type: 'system', text: '> Establishing secure connection...' },
          { type: 'success', text: `✓ Payload delivered successfully from ${parsed.email}.` }
        ]);
      } else {
        throw new Error("Transmission failed at the relay layer.");
      }
    } catch (e) {
      setOutput(prev => [...prev, 
        { type: 'system', text: '> Compiling payload...' },
        { type: 'error', text: `Compiler Error: ${e.message}` }
      ]);
    } finally {
      setCompiling(false);
    }
  };

  return (
    <div className="pt-24 pb-12 px-6 md:px-12 max-w-7xl mx-auto w-full min-h-screen flex flex-col">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-4xl md:text-6xl font-display font-bold text-text uppercase tracking-tighter mb-2">
          Initialize <span className="text-accent">Contact.</span>
        </h1>
        <p className="text-text-muted">Modify the JSON payload to transmit a secure message directly to my inbox.</p>
      </motion.div>

      {/* VS Code Theme IDE Layout */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        className="flex-1 w-full flex flex-col md:flex-row border border-muted/30 rounded-2xl overflow-hidden bg-bg shadow-2xl"
      >
        {/* Activity Bar (Sidebar) */}
        <div className="hidden md:flex flex-col items-center py-4 w-12 border-r border-muted/30 bg-surface">
          <div className="flex flex-col gap-6 text-text-muted">
            <FolderGit2 className="w-6 h-6 hover:text-text cursor-pointer transition-colors" />
            <Settings className="w-5 h-5 hover:text-text cursor-pointer transition-colors" />
          </div>
        </div>

        {/* Editor Pane */}
        <div className="flex-1 flex flex-col border-r border-muted/30">
          <div className="flex items-center bg-surface border-b border-muted/30 px-2 h-10">
            <div className="flex items-center gap-2 px-4 py-1.5 bg-bg text-accent text-sm font-mono border-t-2 border-accent">
              <FileJson className="w-4 h-4" />
              payload.json
              <X className="w-3 h-3 ml-2 text-text-muted hover:text-text cursor-pointer" />
            </div>
          </div>
          
          <div className="flex-1 flex relative">
            {/* Line Numbers */}
            <div className="w-12 py-4 flex flex-col items-end px-3 text-text-muted/50 font-mono text-sm bg-surface/50 select-none">
              {jsonInput.split('\n').map((_, i) => <span key={i}>{i + 1}</span>)}
            </div>
            
            <textarea
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              spellCheck="false"
              className="flex-1 bg-transparent text-text-muted font-mono text-sm p-4 outline-none resize-none leading-relaxed"
              style={{ tabSize: 2 }}
            />

            {/* Run Button Overlay */}
            <button 
              onClick={handleRun}
              disabled={compiling}
              className="absolute bottom-6 right-6 flex items-center gap-2 px-6 py-3 bg-accent hover:bg-accent-hover disabled:bg-muted disabled:text-text-muted/50 text-bg rounded-lg font-bold transition-all shadow-lg hover:shadow-accent/20"
            >
              <Play className="w-4 h-4" />
              {compiling ? 'COMPILING...' : 'RUN PAYLOAD'}
            </button>
          </div>
        </div>

        {/* Terminal Pane */}
        <div className="w-full md:w-[400px] flex flex-col bg-bg/50">
          <div className="flex items-center justify-between bg-surface border-b border-muted/30 px-4 h-10">
            <span className="text-text-muted text-xs font-mono uppercase tracking-widest flex items-center gap-2">
              <TerminalIcon className="w-4 h-4" /> Output
            </span>
            <div className="flex gap-2">
              <span className="w-3 h-3 rounded-full bg-forge-muted" />
              <span className="w-3 h-3 rounded-full bg-forge-muted" />
              <span className="w-3 h-3 rounded-full bg-forge-muted" />
            </div>
          </div>
          <div className="flex-1 p-4 font-mono text-sm overflow-y-auto flex flex-col gap-2">
            {output.map((line, i) => (
              <div 
                key={i} 
                className={`
                  ${line.type === 'system' ? 'text-gray-500' : ''}
                  ${line.type === 'info' ? 'text-blue-400' : ''}
                  ${line.type === 'success' ? 'text-green-500' : ''}
                  ${line.type === 'error' ? 'text-red-500' : ''}
                `}
              >
                {line.text}
              </div>
            ))}
            {compiling && <div className="text-orange-500 animate-pulse">_</div>}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
