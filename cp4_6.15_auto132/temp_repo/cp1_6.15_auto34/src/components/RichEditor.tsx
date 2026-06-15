import React, { useRef, useCallback } from 'react';
import { Type, AlignLeft, Minus } from 'lucide-react';

interface RichEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const RichEditor: React.FC<RichEditorProps> = ({
  value,
  onChange,
  placeholder = '开始记录你的旅行故事...',
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertAtCursor = useCallback((prefix: string, suffix: string = '\n\n') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end) || '文本';
    
    const newText = value.substring(0, start) + prefix + selectedText + suffix + value.substring(end);
    onChange(newText);
    
    setTimeout(() => {
      textarea.focus();
      const newPos = start + prefix.length + selectedText.length;
      textarea.setSelectionRange(newPos, newPos);
    }, 0);
  }, [value, onChange]);

  const insertHeading = () => insertAtCursor('# ');
  const insertParagraph = () => insertAtCursor('', '\n\n');
  const insertDivider = () => insertAtCursor('---', '\n\n');

  const renderContent = (content: string) => {
    return content
      .split('\n')
      .map((line, index) => {
        if (line.startsWith('# ')) {
          return <h1 key={index} className="text-2xl font-display font-bold text-sand-800 mt-6 mb-3">{line.slice(2)}</h1>;
        }
        if (line.startsWith('## ')) {
          return <h2 key={index} className="text-xl font-display font-semibold text-sand-700 mt-5 mb-2">{line.slice(3)}</h2>;
        }
        if (line.startsWith('---')) {
          return <hr key={index} className="my-6 border-sand-200" />;
        }
        if (line.trim() === '') {
          return <br key={index} />;
        }
        return <p key={index} className="text-sand-700 leading-relaxed mb-3">{line}</p>;
      });
  };

  return (
    <div className="w-full">
      <div className="flex gap-2 mb-4 p-3 bg-sand-100/50 rounded-xl">
        <button
          onClick={insertHeading}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white hover:bg-sand-200/50 text-sand-700 text-sm font-medium transition-colors hover-lift"
          title="插入标题"
        >
          <Type className="w-4 h-4" />
          标题
        </button>
        <button
          onClick={insertParagraph}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white hover:bg-sand-200/50 text-sand-700 text-sm font-medium transition-colors hover-lift"
          title="插入段落"
        >
          <AlignLeft className="w-4 h-4" />
          段落
        </button>
        <button
          onClick={insertDivider}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white hover:bg-sand-200/50 text-sand-700 text-sm font-medium transition-colors hover-lift"
          title="插入分割线"
        >
          <Minus className="w-4 h-4" />
          分割线
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-sand-500 mb-2 block font-medium">编辑模式</label>
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full h-80 p-4 rounded-xl border border-sand-200 bg-white/70 focus:outline-none focus:ring-2 focus:ring-sand-400 focus:border-transparent resize-none text-sand-700 leading-relaxed font-mono text-sm custom-scrollbar"
          />
        </div>
        
        <div>
          <label className="text-xs text-sand-500 mb-2 block font-medium">预览模式</label>
          <div className="w-full h-80 p-4 rounded-xl border border-sand-200 bg-white/70 overflow-y-auto custom-scrollbar">
            {value ? renderContent(value) : (
              <p className="text-sand-400 italic">预览将在这里显示...</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
