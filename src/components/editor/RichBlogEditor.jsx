'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import TextAlign from '@tiptap/extension-text-align';
import Typography from '@tiptap/extension-typography';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import { createLowlight, common } from 'lowlight';
import EditorToolbar from './EditorToolbar';
import AIWritingPanel from './AIWritingPanel';
import DiagramBlock from './DiagramBlock';
import { Loader2, SplitSquareHorizontal, Eye, EyeOff } from 'lucide-react';

const lowlight = createLowlight(common);

export default function RichBlogEditor({ initialContent, onChange, onSave }) {
  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const [splitView, setSplitView] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [autoSaving, setAutoSaving] = useState(false);
  const autoSaveTimer = useRef(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        codeBlock: false, // use CodeBlockLowlight instead
        heading: { levels: [1, 2, 3] },
        link: false,      // use explicit Link extension below
      }),
      CodeBlockLowlight.configure({ lowlight }),
      Image.configure({ inline: false, allowBase64: true }),
      Link.configure({ openOnClick: false, linkOnPaste: true }),
      Placeholder.configure({ placeholder: 'Start writing your story here...' }),
      CharacterCount,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Typography,
      TaskList,
      TaskItem.configure({ nested: true }),
      DiagramBlock,
    ],
    content: initialContent || '',
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      const json = editor.getJSON();
      setWordCount(editor.storage.characterCount.words());
      onChange?.({ html, json, text: editor.getText() });

      // Auto-save debounce
      clearTimeout(autoSaveTimer.current);
      autoSaveTimer.current = setTimeout(async () => {
        setAutoSaving(true);
        await onSave?.({ html, json, text: editor.getText() }, 'autosave');
        setAutoSaving(false);
      }, 30000);
    },
    onSelectionUpdate: ({ editor }) => {
      const { from, to } = editor.state.selection;
      if (from !== to) {
        setSelectedText(editor.state.doc.textBetween(from, to, ' '));
      } else {
        setSelectedText('');
      }
    },
  });

  // Insert AI-generated content at cursor
  const insertAiContent = useCallback((text) => {
    if (!editor) return;
    const { from, to } = editor.state.selection;
    if (from !== to) {
      editor.chain().focus().deleteRange({ from, to }).insertContent(text).run();
    } else {
      editor.chain().focus().insertContent(text).run();
    }
  }, [editor]);

  const insertImage = useCallback((url) => {
    if (!editor || !url) return;
    editor.chain().focus().setImage({ src: url }).run();
  }, [editor]);

  useEffect(() => () => clearTimeout(autoSaveTimer.current), []);

  if (!editor) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-[600px] bg-[#0c0c0c] rounded-xl border border-forge-muted/20 overflow-hidden">
      {/* Editor Toolbar */}
      <EditorToolbar
        editor={editor}
        onAIToggle={() => setAiPanelOpen(!aiPanelOpen)}
        onInsertImage={insertImage}
        aiPanelOpen={aiPanelOpen}
        selectedText={selectedText}
      />

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Editor Pane */}
        <div className={`flex flex-col overflow-y-auto ${splitView ? 'w-1/2 border-r border-forge-muted/20' : 'flex-1'}`}>
          <EditorContent
            editor={editor}
            className="flex-1 px-8 py-6 prose prose-invert prose-orange max-w-none focus:outline-none
              prose-h1:text-4xl prose-h1:font-display prose-h1:font-black prose-h1:text-white prose-h1:tracking-tight
              prose-h2:text-2xl prose-h2:font-display prose-h2:font-bold prose-h2:text-white
              prose-h3:text-xl prose-h3:font-display prose-h3:font-semibold prose-h3:text-white
              prose-p:text-gray-300 prose-p:leading-relaxed prose-p:text-lg
              prose-code:text-orange-400 prose-code:bg-black/40 prose-code:rounded prose-code:px-1
              prose-pre:bg-black/60 prose-pre:border prose-pre:border-forge-muted/30 prose-pre:rounded-xl
              prose-blockquote:border-orange-500 prose-blockquote:border-l-4 prose-blockquote:text-gray-400
              prose-a:text-orange-400 prose-a:no-underline hover:prose-a:underline
              prose-strong:text-white prose-img:rounded-xl prose-img:max-w-full"
          />
        </div>

        {/* Live Preview Pane (split view) */}
        {splitView && (
          <div className="w-1/2 overflow-y-auto px-8 py-6 bg-[#080808]">
            <p className="text-xs font-mono text-gray-600 uppercase tracking-widest mb-4 border-b border-forge-muted/20 pb-2">Live Preview</p>
            <div
              className="prose prose-invert prose-orange max-w-none"
              dangerouslySetInnerHTML={{ __html: editor.getHTML() }}
            />
          </div>
        )}

        {/* AI Writing Assistance Panel */}
        {aiPanelOpen && (
          <AIWritingPanel
            selectedText={selectedText}
            editor={editor}
            onInsert={insertAiContent}
            onClose={() => setAiPanelOpen(false)}
          />
        )}
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between px-6 py-2 bg-[#0a0a0a] border-t border-forge-muted/20 text-xs font-mono text-gray-500">
        <div className="flex items-center gap-4">
          <span>{wordCount} words</span>
          <span>{Math.ceil(wordCount / 200)} min read</span>
          {autoSaving && (
            <span className="flex items-center gap-1 text-orange-500">
              <Loader2 className="w-3 h-3 animate-spin" /> Auto-saving...
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSplitView(!splitView)}
            className={`flex items-center gap-1 px-2 py-1 rounded transition-colors ${splitView ? 'text-orange-500' : 'hover:text-white'}`}
            title="Toggle Split View"
          >
            <SplitSquareHorizontal className="w-3.5 h-3.5" />
            Split
          </button>
        </div>
      </div>
    </div>
  );
}
