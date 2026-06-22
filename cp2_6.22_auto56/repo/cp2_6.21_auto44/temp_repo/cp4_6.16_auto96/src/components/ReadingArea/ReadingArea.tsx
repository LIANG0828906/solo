import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Highlighter, StickyNote, X, Check, Loader2 } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { ReaderEngine } from '@/modules/reader/ReaderEngine';
import { colorMap } from '@/utils/helpers';
import Button from '@/components/Button/Button';
import type { Chapter, Highlight, Note, HighlightColor } from '@/types';
import './ReadingArea.css';

interface ReadingAreaProps {
  chapter: Chapter;
  memberId: string;
  isTransitioning: boolean;
  transitionDirection: 'left' | 'right';
}

interface SelectionInfo {
  text: string;
  startOffset: number;
  endOffset: number;
  rect: DOMRect;
}

const HIGHLIGHT_COLORS: HighlightColor[] = ['yellow', 'green', 'pink'];

const ReadingArea = ({ chapter, memberId, isTransitioning, transitionDirection }: ReadingAreaProps) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [selection, setSelection] = useState<SelectionInfo | null>(null);
  const [showToolbar, setShowToolbar] = useState(false);
  const [toolbarPosition, setToolbarPosition] = useState({ top: 0, left: 0 });
  const [selectedColor, setSelectedColor] = useState<HighlightColor>('yellow');
  const [showNotePopup, setShowNotePopup] = useState(false);
  const [noteContent, setNoteContent] = useState('');
  const [notePopupPosition, setNotePopupPosition] = useState({ top: 0, left: 0 });
  const [loadingNoteId, setLoadingNoteId] = useState<string | null>(null);

  const chapterId = chapter.id;

  const loadChapterData = useCallback(async () => {
    if (!chapterId || !memberId) return;

    const chapterHighlights = ReaderEngine.getHighlightsByChapter(chapterId, memberId);
    const chapterNotes = useAppStore.getState().notes.filter(n => 
      chapterHighlights.some(h => h.id === n.highlightId)
    );

    setHighlights(chapterHighlights);
    setNotes(chapterNotes);
  }, [chapterId, memberId]);

  useEffect(() => {
    if (!chapterId || !memberId) return;

    const timer = setTimeout(() => {
      loadChapterData();
    }, 150);

    return () => clearTimeout(timer);
  }, [chapterId, memberId, loadChapterData]);

  const hasNote = useCallback((highlightId: string) => {
    return notes.some(n => n.highlightId === highlightId && n.memberId === memberId);
  }, [notes, memberId]);

  const getNoteContent = useCallback((highlightId: string) => {
    const note = notes.find(n => n.highlightId === highlightId && n.memberId === memberId);
    return note?.content || '';
  }, [notes, memberId]);

  const getSelectionOffsets = useCallback((range: Range, container: HTMLElement) => {
    const preSelectionRange = document.createRange();
    preSelectionRange.selectNodeContents(container);
    preSelectionRange.setEnd(range.startContainer, range.startOffset);
    const startOffset = preSelectionRange.toString().length;
    const endOffset = startOffset + range.toString().length;
    return { startOffset, endOffset };
  }, []);

  const handleTextSelection = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !contentRef.current) {
      setShowToolbar(false);
      setSelection(null);
      return;
    }

    const range = selection.getRangeAt(0);
    const text = range.toString().trim();
    
    if (!text) {
      setShowToolbar(false);
      setSelection(null);
      return;
    }

    const container = contentRef.current;
    if (!container.contains(range.commonAncestorContainer)) {
      setShowToolbar(false);
      setSelection(null);
      return;
    }

    const { startOffset, endOffset } = getSelectionOffsets(range, container);
    const rect = range.getBoundingClientRect();

    setSelection({ text, startOffset, endOffset, rect });
    setToolbarPosition({
      top: rect.top - 50 + window.scrollY,
      left: rect.left + rect.width / 2 - 100,
    });
    setShowToolbar(true);
  }, [getSelectionOffsets]);

  useEffect(() => {
    document.addEventListener('selectionchange', handleTextSelection);
    document.addEventListener('mousedown', (e) => {
      const toolbar = document.querySelector('.selection-toolbar');
      const notePopup = document.querySelector('.note-popup');
      if (toolbar && !toolbar.contains(e.target as Node) && 
          notePopup && !notePopup.contains(e.target as Node)) {
        setTimeout(() => {
          const selection = window.getSelection();
          if (selection?.isCollapsed) {
            setShowToolbar(false);
            setSelection(null);
          }
        }, 100);
      }
    });

    return () => {
      document.removeEventListener('selectionchange', handleTextSelection);
    };
  }, [handleTextSelection]);

  const handleHighlight = useCallback(() => {
    if (!selection || !memberId || !chapterId) return;

    const highlight = ReaderEngine.createHighlight(
      chapterId,
      memberId,
      selection.startOffset,
      selection.endOffset,
      selectedColor,
      selection.text
    );

    setHighlights(prev => [...prev, highlight].sort((a, b) => a.startOffset - b.startOffset));
    
    window.getSelection()?.removeAllRanges();
    setShowToolbar(false);
    setSelection(null);
  }, [selection, memberId, chapterId, selectedColor]);

  const handleAddNote = useCallback(() => {
    if (!selection) return;

    const rect = selection.rect;
    setNotePopupPosition({
      top: rect.bottom + 10 + window.scrollY,
      left: rect.left + window.scrollX,
    });
    setNoteContent('');
    setShowNotePopup(true);
    setShowToolbar(false);
  }, [selection]);

  const handleSaveNote = useCallback(async () => {
    if (!selection || !memberId || !chapterId || !noteContent.trim()) return;

    setLoadingNoteId('creating');

    const existingHighlight = highlights.find(
      h => h.startOffset === selection.startOffset && 
           h.endOffset === selection.endOffset &&
           h.memberId === memberId
    );

    let newHighlight: Highlight;

    if (!existingHighlight) {
      newHighlight = ReaderEngine.createHighlight(
        chapterId,
        memberId,
        selection.startOffset,
        selection.endOffset,
        selectedColor,
        selection.text
      );
      setHighlights(prev => [...prev, newHighlight].sort((a, b) => a.startOffset - b.startOffset));
    } else {
      newHighlight = existingHighlight;
    }

    await new Promise(resolve => setTimeout(resolve, 100));

    const note = ReaderEngine.createNote(newHighlight.id, memberId, noteContent.trim());
    setNotes(prev => [...prev, note]);

    setLoadingNoteId(null);
    setShowNotePopup(false);
    setNoteContent('');
    window.getSelection()?.removeAllRanges();
    setSelection(null);
  }, [selection, memberId, chapterId, noteContent, selectedColor, highlights]);

  const handleCloseNotePopup = useCallback(() => {
    setShowNotePopup(false);
    setNoteContent('');
    if (selection) {
      setToolbarPosition({
        top: selection.rect.top - 50 + window.scrollY,
        left: selection.rect.left + selection.rect.width / 2 - 100,
      });
      setShowToolbar(true);
    }
  }, [selection]);

  const handleHighlightClick = useCallback((highlight: Highlight, e: React.MouseEvent) => {
    e.stopPropagation();
    const note = notes.find(n => n.highlightId === highlight.id && n.memberId === memberId);
    
    if (note) {
      const rect = (e.target as HTMLElement).getBoundingClientRect();
      setNotePopupPosition({
        top: rect.bottom + 10 + window.scrollY,
        left: rect.left + window.scrollX,
      });
      setNoteContent(note.content);
      setShowNotePopup(true);
      setLoadingNoteId(highlight.id);
      setTimeout(() => setLoadingNoteId(null), 100);
    }
  }, [notes, memberId]);

  const renderContentWithHighlights = useMemo(() => {
    if (!chapter) return null;

    const content = chapter.content;
    const sortedHighlights = [...highlights].sort((a, b) => a.startOffset - b.startOffset);

    const paragraphs = content.split('\n\n');
    let currentOffset = 0;

    return paragraphs.map((paragraph, pIndex) => {
      const paragraphStart = currentOffset;
      const paragraphEnd = paragraphStart + paragraph.length;

      const paragraphHighlights = sortedHighlights.filter(
        h => h.startOffset < paragraphEnd && h.endOffset > paragraphStart
      );

      let lastIndex = 0;
      const parts: React.ReactNode[] = [];

      paragraphHighlights.forEach((highlight, hIndex) => {
        const relStart = Math.max(0, highlight.startOffset - paragraphStart);
        const relEnd = Math.min(paragraph.length, highlight.endOffset - paragraphStart);

        if (relStart > lastIndex) {
          parts.push(
            <span key={`text-${pIndex}-${hIndex}-before`}>
              {paragraph.slice(lastIndex, relStart)}
            </span>
          );
        }

        const highlightText = paragraph.slice(relStart, relEnd);
        const hasNoteMarker = hasNote(highlight.id);

        parts.push(
          <span
            key={`highlight-${highlight.id}`}
            className={`highlight-span highlight-${highlight.color}`}
            onClick={(e) => handleHighlightClick(highlight, e)}
            title={hasNoteMarker ? getNoteContent(highlight.id) : undefined}
          >
            {highlightText}
            {hasNoteMarker && (
              <span className="highlight-note-marker" />
            )}
          </span>
        );

        lastIndex = relEnd;
      });

      if (lastIndex < paragraph.length) {
        parts.push(
          <span key={`text-${pIndex}-after`}>
            {paragraph.slice(lastIndex)}
          </span>
        );
      }

      currentOffset = paragraphEnd + 2;

      return <p key={`p-${pIndex}`}>{parts}</p>;
    });
  }, [chapter, highlights, hasNote, getNoteContent, handleHighlightClick]);

  const getAnimationClass = () => {
    if (!isTransitioning) return '';
    if (transitionDirection === 'left') return 'slide-enter-left';
    if (transitionDirection === 'right') return 'slide-enter-right';
    return '';
  };

  if (!chapter) {
    return (
      <div className="reading-area">
        <div className="reading-area-container">
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px' }}>
            <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto 16px' }} />
            加载中...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`reading-area ${getAnimationClass()}`}>
      <div className="reading-area-container">
        <h1 className="reading-chapter-title">{chapter.title}</h1>
        <div className="reading-chapter-subtitle">第 {chapter.chapterNumber} 章</div>
        <div className="reading-content" ref={contentRef}>
          {renderContentWithHighlights}
        </div>
      </div>

      {showToolbar && selection && (
        <div
          className="selection-toolbar-wrapper"
          style={{ top: toolbarPosition.top, left: toolbarPosition.left }}
        >
          <div className="selection-toolbar" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 12px',
            backgroundColor: 'var(--bg-card)',
            borderRadius: '8px',
            boxShadow: 'var(--shadow-lg)',
            border: '1px solid var(--border-color)',
          }}>
            {HIGHLIGHT_COLORS.map((color) => (
              <button
                key={color}
                onClick={() => setSelectedColor(color)}
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  border: selectedColor === color ? '2px solid var(--accent-primary)' : '2px solid transparent',
                  backgroundColor: colorMap[color],
                  cursor: 'pointer',
                  transition: 'transform 0.15s ease',
                  padding: 0,
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                aria-label={`${color} 高亮`}
              />
            ))}
            <div style={{ width: '1px', height: '20px', backgroundColor: 'var(--border-color)' }} />
            <Button
              size="sm"
              variant="ghost"
              onClick={handleHighlight}
              style={{ padding: '4px 8px', minWidth: 'auto' }}
            >
              <Highlighter size={16} />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleAddNote}
              style={{ padding: '4px 8px', minWidth: 'auto' }}
            >
              <StickyNote size={16} />
            </Button>
          </div>
        </div>
      )}

      {showNotePopup && (
        <div
          className="note-popup-wrapper"
          style={{ top: notePopupPosition.top, left: notePopupPosition.left }}
        >
          <div className="note-popup" style={{
            width: '300px',
            backgroundColor: 'var(--bg-card)',
            borderRadius: '8px',
            boxShadow: 'var(--shadow-lg)',
            border: '1px solid var(--border-color)',
            overflow: 'hidden',
          }}>
            <div style={{
              padding: '12px',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                {loadingNoteId && loadingNoteId !== 'creating' ? '查看笔记' : '添加笔记'}
              </span>
              <button
                onClick={handleCloseNotePopup}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  padding: '4px',
                  borderRadius: '4px',
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--accent-hover)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <X size={16} />
              </button>
            </div>
            <div style={{ padding: '12px' }}>
              <textarea
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="写下你的想法..."
                style={{
                  width: '100%',
                  minHeight: '80px',
                  padding: '8px 12px',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                  backgroundColor: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                }}
                onFocus={(e) => e.currentTarget.style.outline = 'none'}
              />
            </div>
            <div style={{
              padding: '12px',
              borderTop: '1px solid var(--border-color)',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '8px',
            }}>
              <Button size="sm" variant="ghost" onClick={handleCloseNotePopup}>
                取消
              </Button>
              <Button
                size="sm"
                onClick={handleSaveNote}
                disabled={!noteContent.trim() || loadingNoteId === 'creating'}
              >
                {loadingNoteId === 'creating' ? (
                  <>
                    <Loader2 size={14} className="animate-spin" style={{ marginRight: '4px' }} />
                    保存中
                  </>
                ) : (
                  <>
                    <Check size={14} style={{ marginRight: '4px' }} />
                    保存
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReadingArea;
