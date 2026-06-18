import { useEffect, useRef, useState, useCallback } from 'react';
import {
  Bold, Italic, Underline, Heading1, Heading2, Heading3,
  List, ListOrdered, Quote, Undo2, Redo2, Check, MessageSquarePlus } from 'lucide-react';
import { useInkFlowStore } from '@/store/useInkFlowStore';
import { debounce } from '@/utils/debounce';
import { formatFullDateTime } from '@/utils/formatTime';

interface RichTextEditorProps {
  chapterId: string;
  onSelectionChange?: (startOffset: number, endOffset: number, plainText: string) => void;
  onAddComment?: () => void;
  showCommentBubble?: boolean;
  bubblePosition?: { top: number; left: number } | null;
}

type ToolbarAction = {
  key: string;
  icon: any;
  title: string;
  action?: string;
  value?: string;
  tag?: string;
};

const toolbarGroups: ToolbarAction[][] = [
  [
    { key: 'bold', icon: Bold, title: '加粗 (Ctrl+B)', action: 'bold' },
    { key: 'italic', icon: Italic, title: '斜体 (Ctrl+I)', action: 'italic' },
    { key: 'underline', icon: Underline, title: '下划线 (Ctrl+U)', action: 'underline' },
  ],
  [
    { key: 'h1', icon: Heading1, title: '一级标题', tag: 'H1' },
    { key: 'h2', icon: Heading2, title: '二级标题', tag: 'H2' },
    { key: 'h3', icon: Heading3, title: '三级标题', tag: 'H3' },
  ],
  [
    { key: 'ul', icon: List, title: '无序列表', action: 'insertUnorderedList' },
    { key: 'ol', icon: ListOrdered, title: '有序列表', action: 'insertOrderedList' },
    { key: 'quote', icon: Quote, title: '引用块', tag: 'BLOCKQUOTE' },
  ],
];

export default function RichTextEditor({ chapterId, onSelectionChange, onAddComment, showCommentBubble, bubblePosition }: RichTextEditorProps) {
  const chapterContent = useInkFlowStore((s) => s.chapterContents[chapterId]);
  const updateChapterContent = useInkFlowStore((s) => s.updateChapterContent);

  const editorRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [wordCount, setWordCount] = useState(0);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [activeTags, setActiveTags] = useState<Set<string>>(new Set());
  const [isSaving, setIsSaving] = useState(false);

  const saveTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const currentContentRef = useRef('');

  const stripHtml = (html: string) => html.replace(/<[^>]+>/g, '');

  const debouncedSave = useCallback(
    debounce((content: string) => {
      setIsSaving(true);
      updateChapterContent(chapterId, content);
      setIsSaving(false);
      setShowSaveSuccess(true);
      setTimeout(() => setShowSaveSuccess(false), 1500);
    }, 300),
    [chapterId, updateChapterContent]
  );

  useEffect(() => {
    if (editorRef.current && chapterContent) {
      if (editorRef.current.innerHTML !== chapterContent.content) {
        editorRef.current.innerHTML = chapterContent.content;
        currentContentRef.current = chapterContent.content;
        setWordCount(stripHtml(chapterContent.content).length);
      }
    }
  }, [chapterId, chapterContent?.content, chapterContent?.lastSavedAt]);

  useEffect(() => {
    saveTimerRef.current = setInterval(() => {
      const current = editorRef.current?.innerHTML;
      if (
        current &&
        current !== currentContentRef.current &&
        current !== chapterContent?.content
      ) {
        debouncedSave(current);
      }
    }, 30000);

    return () => {
      if (saveTimerRef.current) clearInterval(saveTimerRef.current);
    };
  }, [chapterId, chapterContent?.content, debouncedSave]);

  const checkActiveTags = useCallback(() => {
    const tags = new Set<string>();
    try {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;
      let node: Node | null = selection.anchorNode;
      while (node) {
        if (node instanceof HTMLElement) {
          const tag = node.tagName;
          if (['B', 'STRONG', 'I', 'EM', 'U', 'H1', 'H2', 'H3', 'UL', 'OL', 'BLOCKQUOTE', 'LI'].includes(tag)) {
            if (tag === 'B' || tag === 'STRONG') tags.add('bold');
            else if (tag === 'I' || tag === 'EM') tags.add('italic');
            else if (tag === 'U') tags.add('underline');
            else tags.add(tag.toLowerCase());
          }
        }
        node = node.parentNode;
      }
    } catch (e) {}
    setActiveTags(tags);
  }, []);

  const handleInput = () => {
    const html = editorRef.current?.innerHTML || '';
    currentContentRef.current = html;
    setWordCount(stripHtml(html).length);
    debouncedSave(html);
    checkActiveTags();
  };

  const execFormat = (action?: string, value?: string) => {
    document.execCommand(action!, false, value);
    editorRef.current?.focus();
    checkActiveTags();
  };

  const execBlockTag = (tag: string) => {
    document.execCommand('formatBlock', false, tag);
    editorRef.current?.focus();
    handleInput();
    checkActiveTags();
  };

  const handleToolbarClick = (item: ToolbarAction) => {
    if (item.action) {
      execFormat(item.action, item.value);
    } else if (item.tag) {
      execBlockTag(item.tag);
    }
  };

  const handleSelect = () => {
    checkActiveTags();
    if (!onSelectionChange) return;
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    const range = selection.getRangeAt(0);
    const editorEl = editorRef.current;
    if (!editorEl) return;
    if (editorEl.contains(range.startContainer)) {
      const before = document.createRange();
      before.selectNodeContents(editorEl);
      before.setEnd(range.startContainer, range.startOffset);
      const startOffset = before.toString().length;
      const endOffset = startOffset + range.toString().length;
      if (startOffset !== endOffset) {
        onSelectionChange(startOffset, endOffset, selection.toString());
      }
    }
  };

  const handleUndo = () => execFormat('undo');
  const handleRedo = () => execFormat('redo');
  const handleForceSave = () => {
    const html = editorRef.current?.innerHTML || '';
    if (html !== chapterContent?.content) {
      setIsSaving(true);
      updateChapterContent(chapterId, html);
      currentContentRef.current = html;
      setIsSaving(false);
      setShowSaveSuccess(true);
      setTimeout(() => setShowSaveSuccess(false), 1500);
    }
  };

  const paragraphCount = editorRef.current?.querySelectorAll('p, h1, h2, h3, blockquote, li').length || 0;

  return (
    <div
      ref={containerRef}
      className="flex flex-col h-full bg-white overflow-hidden relative"
      style={{ borderRadius: '12px', border: '1px solid #E2E8F0' }}
    >
      <div
        className="flex items-center flex-wrap gap-1 px-3 py-2 border-b border-gray-100"
        style={{ background: '#FAFBFC' }}
      >
        {toolbarGroups.map((group, gi) => (
          <div key={gi} className="flex items-center gap-0.5">
            {group.map((item) => {
              const Icon = item.icon;
              const isActive =
                activeTags.has(item.key) ||
                (item.tag && activeTags.has(item.tag.toLowerCase()));
              return (
                <button
                  key={item.key}
                  onClick={() => handleToolbarClick(item)}
                  onMouseDown={(e) => e.preventDefault()}
                  title={item.title}
                  className="p-1.5 rounded transition-all active:scale-[0.96]"
                  style={{
                    background: isActive ? '#E2E8F0' : 'transparent',
                    color: isActive ? '#6366F1' : '#475569',
                    borderRadius: '4px',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.background = '#E2E8F0';
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <Icon size={15} />
                </button>
              );
            })}
            {gi < toolbarGroups.length - 1 && (
              <div className="w-px h-5 mx-1.5 bg-gray-200" />
            )}
          </div>
        ))}
        <div className="w-px h-5 mx-1.5 bg-gray-200" />
        <button
          onMouseDown={(e) => e.preventDefault()}
          onClick={handleUndo}
          title="撤销 (Ctrl+Z)"
          className="p-1.5 rounded hover:bg-gray-200 text-gray-500 transition-all active:scale-[0.96]"
          style={{ borderRadius: '4px' }}
        >
          <Undo2 size={15} />
        </button>
        <button
          onMouseDown={(e) => e.preventDefault()}
          onClick={handleRedo}
          title="重做 (Ctrl+Y)"
          className="p-1.5 rounded hover:bg-gray-200 text-gray-500 transition-all active:scale-[0.96]"
          style={{ borderRadius: '4px' }}
        >
          <Redo2 size={15} />
        </button>
        <div className="flex-1" />
        <button
          onClick={handleForceSave}
          className="flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-all active:scale-[0.96]"
          style={{
            color: showSaveSuccess ? '#10B981' : '#6366F1',
            background: showSaveSuccess ? 'rgba(16,185,129,0.1)' : 'rgba(99,102,241,0.08)',
          }}
        >
          <Check
            size={14}
            style={{
              opacity: showSaveSuccess ? 1 : isSaving ? 0.5 : 0.7,
              animation: showSaveSuccess ? 'checkPulse 0.5s ease' : 'none',
            }}
          />
          <span>
            {isSaving ? '保存中...' : showSaveSuccess ? '已保存' : '立即保存'}
          </span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto relative">
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={handleInput}
          onSelect={handleSelect}
          onKeyUp={checkActiveTags}
          onMouseUp={handleSelect}
          className="inkflow-editor outline-none px-8 py-8 prose-sm max-w-none min-h-full relative"
          style={{
            fontFamily:
              '"Source Han Serif CN", "Noto Serif SC", Georgia, "Times New Roman", serif',
            fontSize: '15px',
            lineHeight: '1.9',
            color: '#1F2937',
            caretColor: '#6366F1',
          }}
          spellCheck={false}
        />

        {showCommentBubble && bubblePosition && onAddComment && (
          <button
            onClick={onAddComment}
            className="absolute z-20 flex items-center gap-1 px-2.5 py-1.5 text-white text-xs font-medium rounded-lg transition-all active:scale-[0.96] shadow-lg hover:shadow-xl"
            style={{
              top: bubblePosition.top,
              left: bubblePosition.left,
              background: '#6366F1',
              transform: 'translateY(-100%) translateY(-8px)',
              animation: 'bubbleIn 0.2s ease-out',
            }}
          >
            <MessageSquarePlus size={13} />
            添加评论
          </button>
        )}
      </div>

      <div
        className="flex items-center justify-between px-4 py-2 border-t border-gray-100 text-xs"
        style={{ background: '#FAFBFC', color: '#64748B' }}
      >
        <div className="flex items-center gap-4">
          <span>
            字数：<span className="font-medium" style={{ color: '#334155' }}>{wordCount}</span> 字
          </span>
          <span>段落：{paragraphCount}</span>
        </div>
        <div className="flex items-center gap-2">
          {chapterContent?.lastSavedAt && (
            <span className="text-gray-400">
              最后保存：{formatFullDateTime(chapterContent.lastSavedAt)}
            </span>
          )}
        </div>
      </div>

      <style>{`
        .inkflow-editor h1 {
          font-size: 1.875rem;
          font-weight: 700;
          margin: 1.5em 0 0.8em;
          line-height: 1.3;
          color: #1E293B;
        }
        .inkflow-editor h2 {
          font-size: 1.5rem;
          font-weight: 700;
          margin: 1.2em 0 0.6em;
          line-height: 1.3;
          color: #1E293B;
        }
        .inkflow-editor h3 {
          font-size: 1.25rem;
          font-weight: 600;
          margin: 1em 0 0.5em;
          line-height: 1.4;
          color: #1E293B;
        }
        .inkflow-editor p {
          margin: 0.8em 0;
          text-indent: 2em;
        }
        .inkflow-editor blockquote {
          margin: 1em 0;
          padding: 0.8em 1.2em;
          border-left: 4px solid #6366F1;
          background: rgba(99,102,241,0.06);
          color: #475569;
          font-style: italic;
          border-radius: 0 8px 8px 0;
        }
        .inkflow-editor ul,
        .inkflow-editor ol {
          margin: 0.8em 0;
          padding-left: 2em;
        }
        .inkflow-editor ul { list-style: disc; }
        .inkflow-editor ol { list-style: decimal; }
        .inkflow-editor li {
          margin: 0.4em 0;
        }
        .inkflow-editor strong, .inkflow-editor b { font-weight: 700; }
        .inkflow-editor em, .inkflow-editor i { font-style: italic; }
        .inkflow-editor u { text-decoration: underline; }
        .inkflow-editor a { color: #6366F1; text-decoration: underline; }
        .inkflow-editor:empty::before {
          content: '开始你的创作吧...';
          color: #CBD5E1;
        }

        @keyframes checkPulse {
          0% { transform: scale(0.8); opacity: 0; }
          50% { transform: scale(1.3); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes bubbleIn {
          from { opacity: 0; transform: translateY(calc(-100% - 4px)) scale(0.9); }
          to { opacity: 1; transform: translateY(calc(-100% - 8px)) scale(1); }
        }
      `}</style>
    </div>
  );
}
