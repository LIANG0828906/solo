import { useState, useRef, useEffect, useCallback } from 'react';
import { Highlight, Note, Link } from './types';

interface Props {
  articleText: string;
  setArticleText: (text: string) => void;
  highlights: Highlight[];
  notes: Note[];
  links: Link[];
  onAddHighlight: (startOffset: number, endOffset: number, text: string) => void;
  onRemoveHighlight: (id: string) => void;
  onAddNote: (highlightId: string, content: string) => void;
  onRemoveNote: (id: string) => void;
  onCreateLink: (
    sourceId: string,
    sourceType: 'highlight' | 'note',
    targetId: string,
    targetType: 'highlight' | 'note',
  ) => void;
  flashHighlightId: string | null;
  onJumpToHighlight: (id: string) => void;
  sidebarOpen: boolean;
}

interface SelectionInfo {
  startOffset: number;
  endOffset: number;
  text: string;
  rect: DOMRect;
}

export default function NoteCollector({
  articleText,
  setArticleText,
  highlights,
  onRemoveHighlight,
  onAddHighlight,
  onAddNote,
  flashHighlightId,
}: Props) {
  const articleRef = useRef<HTMLDivElement>(null);
  const [selection, setSelection] = useState<SelectionInfo | null>(null);
  const [noteInput, setNoteInput] = useState<{
    highlightId: string;
    position: { top: number; left: number };
  } | null>(null);
  const [noteText, setNoteText] = useState('');
  const [isEditingArticle, setIsEditingArticle] = useState(false);

  const getCharOffset = useCallback((node: Node, offset: number): number => {
    if (!articleRef.current) return 0;
    const walker = document.createTreeWalker(articleRef.current, NodeFilter.SHOW_TEXT, null);
    let charCount = 0;
    let currentNode: Node | null = walker.nextNode();
    while (currentNode) {
      if (currentNode === node) {
        return charCount + offset;
      }
      if (currentNode.textContent) {
        charCount += currentNode.textContent.length;
      }
      currentNode = walker.nextNode();
    }
    return charCount;
  }, []);

  const handleMouseUp = useCallback(() => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || sel.rangeCount === 0) {
      setSelection(null);
      return;
    }
    const range = sel.getRangeAt(0);
    if (!articleRef.current?.contains(range.commonAncestorContainer)) {
      setSelection(null);
      return;
    }
    const startOffset = getCharOffset(range.startContainer, range.startOffset);
    const endOffset = getCharOffset(range.endContainer, range.endOffset);
    const text = sel.toString().trim();
    if (!text || startOffset === endOffset) {
      setSelection(null);
      return;
    }
    const rect = range.getBoundingClientRect();
    setSelection({ startOffset, endOffset, text, rect });
  }, [getCharOffset]);

  useEffect(() => {
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mousedown', (e) => {
      const target = e.target as HTMLElement;
      if (
        !target.closest('.floating-toolbar') &&
        !target.closest('.note-input-wrapper') &&
        !target.closest('.highlight-delete-btn')
      ) {
        // don't clear immediately, let mouseup handle it
      }
    });
    return () => document.removeEventListener('mouseup', handleMouseUp);
  }, [handleMouseUp]);

  const handleHighlightClick = () => {
    if (!selection) return;
    onAddHighlight(selection.startOffset, selection.endOffset, selection.text);
    window.getSelection()?.removeAllRanges();
    setSelection(null);
  };

  const handleNoteClick = () => {
    if (!selection) return;
    onAddHighlight(selection.startOffset, selection.endOffset, selection.text);
    const highlight = highlights.find(
      (h) =>
        h.startOffset <= selection.startOffset &&
        h.endOffset >= selection.endOffset,
    ) || highlights[highlights.length - 1];
    if (!highlight) {
      window.getSelection()?.removeAllRanges();
      setSelection(null);
      return;
    }
    const rect = selection.rect;
    setNoteInput({
      highlightId: highlight.id,
      position: { top: rect.bottom + window.scrollY + 8, left: rect.right + window.scrollX + 8 },
    });
    setNoteText('');
    window.getSelection()?.removeAllRanges();
    setSelection(null);
    setTimeout(() => {
      const input = document.querySelector('.note-input') as HTMLTextAreaElement;
      input?.focus();
    }, 50);
  };

  const handleNoteSubmit = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && noteInput) {
      e.preventDefault();
      if (noteText.trim()) {
        onAddNote(noteInput.highlightId, noteText.trim());
      }
      setNoteInput(null);
      setNoteText('');
    }
  };

  const renderMarkdown = (text: string): React.ReactNode => {
    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];
    let i = 0;
    let paraBuffer = '';
    let inCodeBlock = false;
    let codeLang = '';
    let codeBuffer = '';
    let inBlockquote = false;
    let quoteBuffer = '';
    let listBuffer: string[] = [];
    let listType: 'ul' | 'ol' | null = null;

    const flushParagraph = () => {
      if (paraBuffer.trim()) {
        elements.push(
          <p key={`p-${i}-${elements.length}`}>
            {renderWithHighlights(paraBuffer, getAccumulatedOffset())}
          </p>,
        );
        totalOffset += paraBuffer.length + 1;
      }
      paraBuffer = '';
    };

    const flushQuote = () => {
      if (quoteBuffer.trim()) {
        elements.push(
          <blockquote key={`q-${i}-${elements.length}`}>
            {renderWithHighlights(quoteBuffer, getAccumulatedOffset())}
          </blockquote>,
        );
        totalOffset += quoteBuffer.length + 1;
      }
      quoteBuffer = '';
      inBlockquote = false;
    };

    const flushList = () => {
      if (listBuffer.length > 0 && listType) {
        const ListTag = listType;
        elements.push(
          <ListTag key={`list-${i}-${elements.length}`}>
            {listBuffer.map((item, idx) => (
              <li key={idx}>
                {renderWithHighlights(item, getAccumulatedOffset())}
              </li>
            ))}
          </ListTag>,
        );
      }
      listBuffer = [];
      listType = null;
    };

    const getAccumulatedOffset = () => totalOffset;

    let totalOffset = 0;

    while (i < lines.length) {
      const line = lines[i];

      if (line.startsWith('```')) {
        if (!inCodeBlock) {
          flushParagraph();
          flushQuote();
          flushList();
          inCodeBlock = true;
          codeLang = line.slice(3).trim();
          codeBuffer = '';
          totalOffset += line.length + 1;
        } else {
          elements.push(
            <pre key={`code-${elements.length}`}>
              <code className={codeLang}>{codeBuffer}</code>
            </pre>,
          );
          totalOffset += codeBuffer.length + line.length + 2;
          inCodeBlock = false;
          codeLang = '';
          codeBuffer = '';
        }
        i++;
        continue;
      }

      if (inCodeBlock) {
        codeBuffer += (codeBuffer ? '\n' : '') + line;
        i++;
        continue;
      }

      if (/^#{1,6}\s/.test(line)) {
        flushParagraph();
        flushQuote();
        flushList();
        const match = line.match(/^(#{1,6})\s(.*)$/);
        if (match) {
          const level = match[1].length;
          const content = match[2];
          const HeadingTag = `h${level}` as keyof JSX.IntrinsicElements;
          const offset = totalOffset;
          elements.push(
            <HeadingTag key={`h-${i}`}>
              {renderWithHighlights(content, offset)}
            </HeadingTag>,
          );
          totalOffset += line.length + 1;
        }
        i++;
        continue;
      }

      if (line.startsWith('>')) {
        flushParagraph();
        flushList();
        if (!inBlockquote) {
          inBlockquote = true;
          quoteBuffer = line.slice(1).trim();
        } else {
          quoteBuffer += '\n' + line.slice(1).trim();
        }
        totalOffset += line.length + 1;
        i++;
        continue;
      } else if (inBlockquote) {
        flushQuote();
      }

      if (/^\s*[-*]\s/.test(line)) {
        flushParagraph();
        flushQuote();
        if (listType !== 'ul') flushList();
        listType = 'ul';
        listBuffer.push(line.replace(/^\s*[-*]\s/, ''));
        totalOffset += line.length + 1;
        i++;
        continue;
      }

      if (/^\s*\d+\.\s/.test(line)) {
        flushParagraph();
        flushQuote();
        if (listType !== 'ol') flushList();
        listType = 'ol';
        listBuffer.push(line.replace(/^\s*\d+\.\s/, ''));
        totalOffset += line.length + 1;
        i++;
        continue;
      }

      if (listType) {
        flushList();
      }

      if (line.trim() === '') {
        flushParagraph();
        totalOffset += 1;
        i++;
        continue;
      }

      paraBuffer += (paraBuffer ? '\n' : '') + line;
      i++;
    }

    flushParagraph();
    flushQuote();
    flushList();
    if (inCodeBlock && codeBuffer) {
      elements.push(
        <pre key={`code-end`}>
          <code>{codeBuffer}</code>
        </pre>,
      );
    }

    return elements;
  };

  const renderWithHighlights = (text: string, baseOffset: number): React.ReactNode => {
    if (highlights.length === 0) {
      return renderInlineMarkdown(text);
    }

    const relevantHighlights = highlights
      .filter(
        (h) =>
          h.startOffset < baseOffset + text.length && h.endOffset > baseOffset,
      )
      .sort((a, b) => a.startOffset - b.startOffset);

    if (relevantHighlights.length === 0) {
      return renderInlineMarkdown(text);
    }

    const parts: React.ReactNode[] = [];
    let cursor = 0;

    relevantHighlights.forEach((h, idx) => {
      const localStart = Math.max(0, h.startOffset - baseOffset);
      const localEnd = Math.min(text.length, h.endOffset - baseOffset);

      if (localStart > cursor) {
        parts.push(
          <span key={`text-${idx}-pre`}>
            {renderInlineMarkdown(text.slice(cursor, localStart))}
          </span>,
        );
      }

      if (localEnd > localStart) {
        const depth = Math.min(h.depth, 5);
        const alpha = 0.2 + depth * 0.1;
        const bgColor = `rgba(255, 255, 0, ${alpha})`;
        const isFlashing = flashHighlightId === h.id;
        parts.push(
          <span
            key={`hl-${h.id}`}
            id={`highlight-${h.id}`}
            className={`highlight-span ${isFlashing ? 'highlight-flash' : ''}`}
            style={{ backgroundColor: bgColor }}
          >
            {renderInlineMarkdown(text.slice(localStart, localEnd))}
            <button
              className="highlight-delete-btn"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onRemoveHighlight(h.id);
              }}
              title="删除高亮"
            >
              ×
            </button>
          </span>,
        );
      }

      cursor = localEnd;
    });

    if (cursor < text.length) {
      parts.push(
        <span key="text-end">{renderInlineMarkdown(text.slice(cursor))}</span>,
      );
    }

    return parts;
  };

  const renderInlineMarkdown = (text: string): React.ReactNode => {
    const segments: React.ReactNode[] = [];
    const regex = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        segments.push(text.slice(lastIndex, match.index));
      }
      const token = match[0];
      if (token.startsWith('`')) {
        segments.push(<code key={`c-${match.index}`}>{token.slice(1, -1)}</code>);
      } else if (token.startsWith('**')) {
        segments.push(<strong key={`b-${match.index}`}>{token.slice(2, -2)}</strong>);
      } else if (token.startsWith('*')) {
        segments.push(<em key={`i-${match.index}`}>{token.slice(1, -1)}</em>);
      }
      lastIndex = match.index + token.length;
    }

    if (lastIndex < text.length) {
      segments.push(text.slice(lastIndex));
    }

    return segments.length > 0 ? segments : text;
  };

  const toolbarStyle = selection
    ? {
        top: selection.rect.top + window.scrollY - 44,
        left: Math.max(
          10,
          selection.rect.left + window.scrollX + selection.rect.width / 2 - 80,
        ),
      }
    : null;

  return (
    <>
      <div className="article-input-area">
        <label className="article-input-label" htmlFor="article-input">
          文章内容（支持 Markdown）
        </label>
        {isEditingArticle ? (
          <textarea
            id="article-input"
            className="article-textarea"
            value={articleText}
            onChange={(e) => setArticleText(e.target.value)}
            onBlur={() => setIsEditingArticle(false)}
            autoFocus
          />
        ) : (
          <div
            className="article-textarea"
            onClick={() => setIsEditingArticle(true)}
            style={{ cursor: 'pointer', whiteSpace: 'pre-wrap', overflow: 'hidden' }}
          >
            {articleText.slice(0, 150)}
            {articleText.length > 150 ? '...（点击编辑）' : '（点击编辑）'}
          </div>
        )}
      </div>
      <div ref={articleRef} className="article-content">
        {renderMarkdown(articleText)}
      </div>
      {toolbarStyle && (
        <div className="floating-toolbar" style={toolbarStyle}>
          <button className="toolbar-btn" onMouseDown={(e) => {
            e.preventDefault();
            handleHighlightClick();
          }}>
            高亮
          </button>
          <button className="toolbar-btn" onMouseDown={(e) => {
            e.preventDefault();
            handleNoteClick();
          }}>
            笔记
          </button>
        </div>
      )}
      {noteInput && (
        <div className="note-input-wrapper" style={noteInput.position}>
          <textarea
            className="note-input"
            placeholder="输入笔记内容，Enter 提交..."
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            onKeyDown={handleNoteSubmit}
            onBlur={() => {
              setTimeout(() => {
                if (noteText.trim() && noteInput) {
                  onAddNote(noteInput.highlightId, noteText.trim());
                }
                setNoteInput(null);
                setNoteText('');
              }, 150);
            }}
            rows={3}
          />
          <div className="note-input-hint">按 Enter 提交 · Shift+Enter 换行</div>
        </div>
      )}
    </>
  );
}
