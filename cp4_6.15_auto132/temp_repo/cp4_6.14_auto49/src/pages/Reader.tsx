import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { useBook } from '../context/BookContext';
import { Annotation, AnnotationType, SelectionInfo } from '../types';
import NotePanel from '../components/NotePanel';

interface Segment {
  text: string;
  start: number;
  end: number;
  types: Set<AnnotationType>;
  annotationIds: string[];
  hasNote: boolean;
  noteContent?: string;
}

function buildSegments(content: string, chapterAnnotations: Annotation[]): Segment[] {
  if (chapterAnnotations.length === 0) {
    return [{ text: content, start: 0, end: content.length, types: new Set(), annotationIds: [], hasNote: false }];
  }

  const points = new Set<number>();
  points.add(0);
  points.add(content.length);

  for (const ann of chapterAnnotations) {
    const start = Math.max(0, Math.min(ann.startOffset, content.length));
    const end = Math.max(0, Math.min(ann.endOffset, content.length));
    points.add(start);
    points.add(end);
  }

  const sorted = Array.from(points).sort((a, b) => a - b);

  const segments: Segment[] = [];
  for (let i = 0; i < sorted.length - 1; i++) {
    const start = sorted[i];
    const end = sorted[i + 1];
    if (start === end) continue;

    const text = content.slice(start, end);
    const overlapping = chapterAnnotations.filter(
      (ann) => ann.startOffset <= start && ann.endOffset >= end
    );

    const types = new Set(overlapping.map((a) => a.type));
    const annotationIds = overlapping.map((a) => a.id);
    const noteAnn = overlapping.find((a) => a.type === 'note');

    segments.push({
      text,
      start,
      end,
      types,
      annotationIds,
      hasNote: !!noteAnn,
      noteContent: noteAnn?.note,
    });
  }

  return segments;
}

function getSelectionOffsets(contentDiv: HTMLElement): { startOffset: number; endOffset: number } | null {
  const selection = window.getSelection();
  if (!selection || selection.isCollapsed || !selection.rangeCount) return null;

  const range = selection.getRangeAt(0);

  if (!contentDiv.contains(range.startContainer) || !contentDiv.contains(range.endContainer)) return null;

  const walker = document.createTreeWalker(contentDiv, NodeFilter.SHOW_TEXT, {
    acceptNode: (node: Text) => {
      const parent = node.parentElement;
      if (parent && parent.classList.contains('note-icon')) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });

  let offset = 0;
  let startOffset = -1;
  let endOffset = -1;

  let node = walker.nextNode();
  while (node) {
    const len = node.textContent?.length || 0;
    const nodeEnd = offset + len;

    if (startOffset === -1 && range.startContainer === node) {
      startOffset = offset + range.startOffset;
    }
    if (endOffset === -1 && range.endContainer === node) {
      endOffset = offset + range.endOffset;
    }

    offset = nodeEnd;
    node = walker.nextNode();
  }

  if (startOffset === -1 || endOffset === -1) return null;
  return { startOffset, endOffset };
}

export default function Reader() {
  const navigate = useNavigate();
  const {
    currentBook,
    currentChapter,
    setCurrentChapter,
    annotations,
    addAnnotation,
    blinkAnnotationId,
    setBlinkAnnotationId,
  } = useBook();

  const [showLoading, setShowLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [selectionInfo, setSelectionInfo] = useState<SelectionInfo | null>(null);
  const [slideDirection, setSlideDirection] = useState('');
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [pendingSelection, setPendingSelection] = useState<{ startOffset: number; endOffset: number; text: string } | null>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showMobilePanel, setShowMobilePanel] = useState(false);

  const contentRef = useRef<HTMLDivElement>(null);
  const contentWrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setShowLoading(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!currentBook) {
      navigate('/');
    }
  }, [currentBook, navigate]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (blinkAnnotationId) {
      const timer = setTimeout(() => setBlinkAnnotationId(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [blinkAnnotationId, setBlinkAnnotationId]);

  useEffect(() => {
    if (!contentRef.current) return;

    const handleMouseUp = (e: MouseEvent) => {
      if (!contentRef.current) return;
      if (contentRef.current.contains(e.target as Node)) {
        setTimeout(() => {
          const offsets = getSelectionOffsets(contentRef.current!);
          if (!offsets) return;

          const selection = window.getSelection();
          if (!selection || selection.isCollapsed || !selection.rangeCount) return;

          const range = selection.getRangeAt(0);
          const rect = range.getBoundingClientRect();
          const text = selection.toString().trim();

          if (!text) return;

          setSelectionInfo({
            text,
            startOffset: offsets.startOffset,
            endOffset: offsets.endOffset,
            rect,
          });
        }, 10);
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.selection-toolbar')) {
        setSelectionInfo(null);
      }
    };

    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mousedown', handleMouseDown);

    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);

  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => setErrorMessage(''), 2000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  const goToPage = useCallback((direction: 'prev' | 'next') => {
    if (!currentBook) return;

    const newChapter = direction === 'prev' ? currentChapter - 1 : currentChapter + 1;
    if (newChapter < 0 || newChapter >= currentBook.chapters.length) return;

    setSlideDirection(direction === 'next' ? 'slide-left' : 'slide-right');
    setCurrentChapter(newChapter);

    setTimeout(() => setSlideDirection(''), 300);
  }, [currentBook, currentChapter, setCurrentChapter]);

  const createAnnotation = useCallback((type: AnnotationType, note?: string) => {
    if (!selectionInfo || !currentBook) return;

    const annotation: Annotation = {
      id: uuidv4(),
      bookId: currentBook.id,
      chapterIndex: currentChapter,
      startOffset: selectionInfo.startOffset,
      endOffset: selectionInfo.endOffset,
      text: selectionInfo.text.slice(0, 100),
      type,
      note,
      createdAt: Date.now(),
    };

    addAnnotation(annotation);
    setSelectionInfo(null);
    window.getSelection()?.removeAllRanges();
  }, [selectionInfo, currentBook, currentChapter, addAnnotation]);

  const handleHighlight = useCallback(() => {
    createAnnotation('highlight');
  }, [createAnnotation]);

  const handleUnderline = useCallback(() => {
    createAnnotation('underline');
  }, [createAnnotation]);

  const handleAddNote = useCallback(() => {
    if (!selectionInfo) return;
    setPendingSelection({
      startOffset: selectionInfo.startOffset,
      endOffset: selectionInfo.endOffset,
      text: selectionInfo.text,
    });
    setNoteText('');
    setShowNoteModal(true);
    setSelectionInfo(null);
  }, [selectionInfo]);

  const handleSaveNote = useCallback(() => {
    if (!pendingSelection || !currentBook) return;
    if (!noteText.trim()) return;

    const annotation: Annotation = {
      id: uuidv4(),
      bookId: currentBook.id,
      chapterIndex: currentChapter,
      startOffset: pendingSelection.startOffset,
      endOffset: pendingSelection.endOffset,
      text: pendingSelection.text.slice(0, 100),
      type: 'note',
      note: noteText.trim().slice(0, 500),
      createdAt: Date.now(),
    };

    addAnnotation(annotation);
    setShowNoteModal(false);
    setNoteText('');
    setPendingSelection(null);
    window.getSelection()?.removeAllRanges();
  }, [pendingSelection, currentBook, currentChapter, noteText, addAnnotation]);

  const handleNavigateToAnnotation = useCallback((annotation: Annotation) => {
    if (annotation.chapterIndex !== currentChapter) {
      const direction = annotation.chapterIndex > currentChapter ? 'next' : 'prev';
      setCurrentChapter(annotation.chapterIndex);

      setSlideDirection(direction === 'next' ? 'slide-left' : 'slide-right');
      setTimeout(() => setSlideDirection(''), 300);
    }

    setBlinkAnnotationId(annotation.id);

    setTimeout(() => {
      if (contentRef.current) {
        const el = contentRef.current.querySelector(`[data-annotation-id="${annotation.id}"]`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    }, 100);
  }, [currentChapter, setCurrentChapter, setBlinkAnnotationId]);

  if (!currentBook) return null;

  const chapter = currentBook.chapters[currentChapter];
  const chapterAnnotations = annotations.filter((a) => a.chapterIndex === currentChapter);
  const segments = buildSegments(chapter.content, chapterAnnotations);

  const renderSegment = (segment: Segment): React.ReactNode => {
    const { text, types, annotationIds, hasNote } = segment;
    const isBlinking = annotationIds.includes(blinkAnnotationId || '');

    const classNames: string[] = [];
    if (types.has('highlight')) classNames.push('highlight-span');
    if (types.has('underline')) classNames.push('underline-span');
    if (types.has('note')) classNames.push('note-span');
    if (isBlinking) classNames.push('blink');

    if (classNames.length === 0) {
      return <React.Fragment key={segment.start}>{text}</React.Fragment>;
    }

    return (
      <span
        key={segment.start}
        className={classNames.join(' ')}
        data-start={segment.start}
        data-end={segment.end}
        data-annotation-id={annotationIds.length > 0 ? annotationIds[0] : undefined}
      >
        {text}
        {hasNote && <span className="note-icon">📝</span>}
      </span>
    );
  };

  return (
    <div className="reader-page">
      {showLoading && (
        <div className="loading-overlay">
          <div className="loading-icon">📖</div>
          <div className="loading-text">正在打开书籍...</div>
        </div>
      )}

      {errorMessage && <div className="error-toast">{errorMessage}</div>}

      <div className="reader-main">
        <div className="reader-header">
          <span className="chapter-title">{chapter.title}</span>
          <button className="back-btn" onClick={() => navigate('/')}>
            返回
          </button>
        </div>

        <div className="reader-content-wrapper" ref={contentWrapperRef}>
          <div
            className={`reader-content${slideDirection ? ' ' + slideDirection : ''}`}
            ref={contentRef}
          >
            {segments.map(renderSegment)}
          </div>

          {selectionInfo && selectionInfo.rect && (
            <div
              className="selection-toolbar"
              style={{
                position: 'fixed',
                top: selectionInfo.rect.top - 48,
                left: selectionInfo.rect.left + selectionInfo.rect.width / 2 - 60,
              }}
            >
              <button
                className="toolbar-btn"
                onClick={handleHighlight}
                title="高亮"
                style={{ color: '#d4a017' }}
              >
                🖍️
              </button>
              <button
                className="toolbar-btn"
                onClick={handleUnderline}
                title="划线"
                style={{ color: '#FF4D4F' }}
              >
                <span style={{ textDecoration: 'underline dashed #FF4D4F', textDecorationThickness: '2px' }}>U</span>
              </button>
              <button
                className="toolbar-btn"
                onClick={handleAddNote}
                title="添加笔记"
                style={{ color: '#ff9800' }}
              >
                📝
              </button>
            </div>
          )}
        </div>

        <div className="reader-footer">
          <button
            className="page-btn"
            disabled={currentChapter === 0}
            onClick={() => goToPage('prev')}
          >
            上一页
          </button>
          <span className="page-indicator">
            第{currentChapter + 1}页 / 共{currentBook.totalPages}页
          </span>
          <button
            className="page-btn"
            disabled={currentChapter >= currentBook.chapters.length - 1}
            onClick={() => goToPage('next')}
          >
            下一页
          </button>
        </div>
      </div>

      <NotePanel onNavigateToAnnotation={handleNavigateToAnnotation} />

      {isMobile && (
        <>
          <button
            className="mobile-toggle-btn"
            onClick={() => setShowMobilePanel(!showMobilePanel)}
          >
            +
          </button>
          <div className={`mobile-note-panel${showMobilePanel ? ' open' : ''}`}>
            <NotePanel
              onNavigateToAnnotation={(ann) => {
                handleNavigateToAnnotation(ann);
                setShowMobilePanel(false);
              }}
              isMobile
            />
          </div>
        </>
      )}

      {showNoteModal && (
        <div className="modal-overlay" onClick={() => setShowNoteModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">添加笔记</div>
            <textarea
              className="note-textarea"
              value={noteText}
              onChange={(e) => setNoteText(e.target.value.slice(0, 500))}
              placeholder="在此输入笔记内容（最多500字）"
              maxLength={500}
              autoFocus
            />
            <div className="char-count">{noteText.length} / 500</div>
            <div className="modal-actions">
              <button className="modal-btn cancel" onClick={() => setShowNoteModal(false)}>
                取消
              </button>
              <button
                className="modal-btn confirm"
                onClick={handleSaveNote}
                disabled={!noteText.trim()}
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
