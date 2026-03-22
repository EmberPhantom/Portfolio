'use client';

import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { NodeViewWrapper } from '@tiptap/react';
import { useState, useEffect, useRef } from 'react';
import { GitBranch, RefreshCw, Code2, Eye } from 'lucide-react';

// React component that renders inside the TipTap node
function DiagramNodeView({ node, updateAttributes }) {
  const [code, setCode] = useState(node.attrs.code || '');
  const [svg, setSvg] = useState('');
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const debounceRef = useRef(null);

  const renderDiagram = async (src) => {
    try {
      setError('');
      const mermaid = (await import('mermaid')).default;
      mermaid.initialize({ startOnLoad: false, theme: 'dark', themeVariables: { primaryColor: '#F97316', primaryTextColor: '#fff', primaryBorderColor: '#F97316', lineColor: '#6b7280', background: '#0a0a0a', mainBkg: '#141414' } });
      const uniqueId = `mermaid-${Date.now()}`;
      const { svg: rendered } = await mermaid.render(uniqueId, src);
      setSvg(rendered);
    } catch (e) {
      setError(e.message || 'Diagram syntax error');
    }
  };

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => renderDiagram(code), 600);
    return () => clearTimeout(debounceRef.current);
  }, [code]);

  const handleCodeChange = (val) => {
    setCode(val);
    updateAttributes({ code: val });
  };

  return (
    <NodeViewWrapper>
      <div className="my-6 rounded-xl border border-orange-500/20 bg-[#0d0d0d] overflow-hidden not-prose">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 bg-[#111] border-b border-forge-muted/20">
          <div className="flex items-center gap-2 text-orange-500">
            <GitBranch className="w-4 h-4" />
            <span className="text-xs font-mono font-bold uppercase tracking-widest">Mermaid Diagram</span>
          </div>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-colors"
          >
            {isEditing ? <><Eye className="w-3.5 h-3.5" /> Preview</> : <><Code2 className="w-3.5 h-3.5" /> Edit</>}
          </button>
        </div>

        {/* Code Editor */}
        {isEditing && (
          <textarea
            value={code}
            onChange={e => handleCodeChange(e.target.value)}
            rows={8}
            className="w-full bg-[#080808] text-green-400 font-mono text-sm px-4 py-3 outline-none resize-y border-b border-forge-muted/20"
            placeholder="Enter Mermaid diagram code..."
          />
        )}

        {/* Rendered Diagram */}
        <div className="p-4 flex justify-center bg-[#0a0a0a] min-h-[120px] items-center">
          {error ? (
            <div className="text-red-400 text-sm font-mono text-center">
              <p className="font-bold mb-1">⚠ Syntax Error</p>
              <p className="text-xs opacity-70">{error}</p>
            </div>
          ) : svg ? (
            <div dangerouslySetInnerHTML={{ __html: svg }} className="w-full flex justify-center" />
          ) : (
            <RefreshCw className="w-5 h-5 text-gray-600 animate-spin" />
          )}
        </div>
      </div>
    </NodeViewWrapper>
  );
}

// TipTap Node Extension
const DiagramBlock = Node.create({
  name: 'diagramBlock',
  group: 'block',
  atom: true,
  draggable: true,
  addAttributes() {
    return { code: { default: 'flowchart TD\n  A[Start] --> B[End]' } };
  },
  parseHTML() { return [{ tag: 'div[data-type="diagram"]' }]; },
  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'diagram' })];
  },
  addNodeView() {
    return ReactNodeViewRenderer(DiagramNodeView);
  },
});

export default DiagramBlock;
