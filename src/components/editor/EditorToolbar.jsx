'use client';

import { useState, useRef } from 'react';
import {
  Bold, Italic, Strikethrough, Code, Heading1, Heading2, Heading3,
  List, ListOrdered, Quote, Minus, Link2, Image, AlignLeft, AlignCenter,
  AlignRight, CheckSquare, Table, BarChart2, GitBranch, Sparkles,
  Undo, Redo, Upload, Camera
} from 'lucide-react';
import dynamic from 'next/dynamic';
const GooglePhotosPicker = dynamic(() => import('./GooglePhotosPicker'), { ssr: false });

const ToolBtn = ({ onClick, active, title, children, className = '' }) => (
  <button
    type="button"
    onClick={onClick}
    title={title}
    className={`p-1.5 rounded transition-colors flex items-center justify-center shrink-0
      ${active ? 'bg-orange-500/20 text-orange-400' : 'text-gray-400 hover:text-white hover:bg-forge-muted/30'}
      ${className}`}
  >
    {children}
  </button>
);

const Divider = () => <div className="w-px h-5 bg-forge-muted/30 mx-1 self-center shrink-0" />;

export default function EditorToolbar({ editor, onAIToggle, onInsertImage, aiPanelOpen, selectedText }) {
  const [linkUrl, setLinkUrl] = useState('');
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [showImageInput, setShowImageInput] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [showChartInput, setShowChartInput] = useState(false);
  const [showPhotosPicker, setShowPhotosPicker] = useState(false);
  const fileInputRef = useRef(null);

  if (!editor) return null;

  const handleSetLink = () => {
    if (!linkUrl) { editor.chain().focus().unsetLink().run(); return; }
    editor.chain().focus().setLink({ href: linkUrl }).run();
    setLinkUrl(''); setShowLinkInput(false);
  };

  const handleInsertImage = () => {
    if (imageUrl) { onInsertImage(imageUrl); setImageUrl(''); setShowImageInput(false); }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => { onInsertImage(ev.target.result); };
    reader.readAsDataURL(file);
  };

  const insertDiagram = () => {
    editor.chain().focus().insertContent({
      type: 'diagramBlock',
      attrs: { code: 'flowchart TD\n  A[Start] --> B{Decision}\n  B -->|Yes| C[Result]\n  B -->|No| D[Other]' }
    }).run();
  };

  const insertTable = () => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  };

  return (
    <div className="bg-[#111] border-b border-forge-muted/20 px-3 py-2 flex flex-wrap items-center gap-0.5">
      {/* History */}
      <ToolBtn onClick={() => editor.chain().focus().undo().run()} title="Undo (Ctrl+Z)">
        <Undo className="w-4 h-4" />
      </ToolBtn>
      <ToolBtn onClick={() => editor.chain().focus().redo().run()} title="Redo (Ctrl+Shift+Z)">
        <Redo className="w-4 h-4" />
      </ToolBtn>

      <Divider />

      {/* Text Style */}
      <ToolBtn active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()} title="Bold (Ctrl+B)">
        <Bold className="w-4 h-4" />
      </ToolBtn>
      <ToolBtn active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()} title="Italic (Ctrl+I)">
        <Italic className="w-4 h-4" />
      </ToolBtn>
      <ToolBtn active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()} title="Strikethrough">
        <Strikethrough className="w-4 h-4" />
      </ToolBtn>
      <ToolBtn active={editor.isActive('code')} onClick={() => editor.chain().focus().toggleCode().run()} title="Inline Code">
        <Code className="w-4 h-4" />
      </ToolBtn>

      <Divider />

      {/* Headings */}
      <ToolBtn active={editor.isActive('heading', { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} title="Heading 1">
        <Heading1 className="w-4 h-4" />
      </ToolBtn>
      <ToolBtn active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} title="Heading 2">
        <Heading2 className="w-4 h-4" />
      </ToolBtn>
      <ToolBtn active={editor.isActive('heading', { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} title="Heading 3">
        <Heading3 className="w-4 h-4" />
      </ToolBtn>

      <Divider />

      {/* Alignment */}
      <ToolBtn active={editor.isActive({ textAlign: 'left' })} onClick={() => editor.chain().focus().setTextAlign('left').run()} title="Align Left">
        <AlignLeft className="w-4 h-4" />
      </ToolBtn>
      <ToolBtn active={editor.isActive({ textAlign: 'center' })} onClick={() => editor.chain().focus().setTextAlign('center').run()} title="Align Center">
        <AlignCenter className="w-4 h-4" />
      </ToolBtn>
      <ToolBtn active={editor.isActive({ textAlign: 'right' })} onClick={() => editor.chain().focus().setTextAlign('right').run()} title="Align Right">
        <AlignRight className="w-4 h-4" />
      </ToolBtn>

      <Divider />

      {/* Lists & Blocks */}
      <ToolBtn active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()} title="Bullet List">
        <List className="w-4 h-4" />
      </ToolBtn>
      <ToolBtn active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Numbered List">
        <ListOrdered className="w-4 h-4" />
      </ToolBtn>
      <ToolBtn active={editor.isActive('taskList')} onClick={() => editor.chain().focus().toggleTaskList().run()} title="Task / Checkbox List">
        <CheckSquare className="w-4 h-4" />
      </ToolBtn>
      <ToolBtn active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()} title="Blockquote">
        <Quote className="w-4 h-4" />
      </ToolBtn>
      <ToolBtn active={editor.isActive('codeBlock')} onClick={() => editor.chain().focus().toggleCodeBlock().run()} title="Code Block">
        <Code className="w-4 h-4" />
      </ToolBtn>
      <ToolBtn onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Divider">
        <Minus className="w-4 h-4" />
      </ToolBtn>

      <Divider />

      {/* Link */}
      <div className="relative flex items-center">
        <ToolBtn active={editor.isActive('link')} onClick={() => setShowLinkInput(!showLinkInput)} title="Insert Link">
          <Link2 className="w-4 h-4" />
        </ToolBtn>
        {showLinkInput && (
          <div className="absolute top-8 left-0 z-50 bg-[#1a1a1a] border border-forge-muted/30 rounded-lg p-2 flex gap-2 shadow-2xl min-w-64">
            <input
              type="url"
              value={linkUrl}
              onChange={e => setLinkUrl(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSetLink()}
              placeholder="https://..."
              autoFocus
              className="flex-1 bg-forge-black text-white text-sm px-3 py-1.5 rounded outline-none border border-forge-muted/30 focus:border-orange-500"
            />
            <button onClick={handleSetLink} className="px-3 py-1.5 bg-orange-500 text-forge-black text-sm font-bold rounded hover:bg-orange-400">Set</button>
            <button onClick={() => setShowLinkInput(false)} className="px-2 py-1.5 text-gray-400 text-sm hover:text-white">✕</button>
          </div>
        )}
      </div>

      {/* Image */}
      <div className="relative flex items-center">
        <ToolBtn onClick={() => setShowImageInput(!showImageInput)} title="Insert Image">
          <Image className="w-4 h-4" />
        </ToolBtn>
        {showImageInput && (
          <div className="absolute top-8 left-0 z-50 bg-[#1a1a1a] border border-forge-muted/30 rounded-lg p-3 shadow-2xl min-w-72 flex flex-col gap-2">
            <input
              type="url"
              value={imageUrl}
              onChange={e => setImageUrl(e.target.value)}
              placeholder="Paste image URL..."
              className="w-full bg-forge-black text-white text-sm px-3 py-1.5 rounded outline-none border border-forge-muted/30 focus:border-orange-500"
            />
            <div className="flex gap-2">
              <button onClick={handleInsertImage} className="px-3 py-1.5 bg-orange-500 text-forge-black text-sm font-bold rounded hover:bg-orange-400 flex-1">Insert URL</button>
              <button onClick={() => fileInputRef.current?.click()} className="px-3 py-1.5 bg-forge-muted/20 text-gray-300 text-sm rounded hover:bg-forge-muted/40 flex items-center gap-1">
                <Upload className="w-3.5 h-3.5" /> Upload
              </button>
              <button onClick={() => setShowImageInput(false)} className="px-2 py-1.5 text-gray-400 text-sm hover:text-white">✕</button>
            </div>
            <input type="file" ref={fileInputRef} accept="image/*" className="hidden" onChange={handleFileUpload} />
          </div>
        )}
      </div>

      <ToolBtn onClick={insertTable} title="Insert Table">
        <Table className="w-4 h-4" />
      </ToolBtn>

      {/* Diagram (Mermaid) */}
      <ToolBtn onClick={insertDiagram} title="Insert Flow Diagram (Mermaid)">
        <GitBranch className="w-4 h-4" />
      </ToolBtn>

      {/* Google Photos Picker */}
      <ToolBtn onClick={() => setShowPhotosPicker(true)} title="Insert from Google Photos">
        <Camera className="w-4 h-4" />
      </ToolBtn>

      {showPhotosPicker && (
        <GooglePhotosPicker
          onSelect={(url) => { onInsertImage(url); }}
          onClose={() => setShowPhotosPicker(false)}
        />
      )}

      <Divider />

      {/* AI Panel Toggle */}
      <ToolBtn
        active={aiPanelOpen}
        onClick={onAIToggle}
        title="AI Writing Assistant"
        className="ml-1 bg-orange-500/10 border border-orange-500/30 hover:bg-orange-500/20"
      >
        <Sparkles className="w-4 h-4 text-orange-400" />
        <span className="text-xs font-bold text-orange-400 ml-1 hidden sm:inline">AI</span>
      </ToolBtn>
    </div>
  );
}
