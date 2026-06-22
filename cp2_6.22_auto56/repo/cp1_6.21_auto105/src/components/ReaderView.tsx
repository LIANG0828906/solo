import { useRef, useEffect, useState, useCallback } from 'react';
import { Chapter, Annotation, Bookmark, AnnotationType } from '@/types';
import FloatingToolbar from './FloatingToolbar';

interface ReaderViewProps {
  chapter: Chapter;
  totalChapters: number;
  annotations: Annotation[];
  bookmarks: Bookmark[];
  jumpToAnnotation?: Annotation | null;
  onAnnotationCreate: (annotation: Omit<Annotation, 'id' | 'createdAt'>) => void;
  onBookmarkCreate: (bookmark: Omit<Bookmark, 'id' | 'createdAt'>) => void;
  onBookmarkDelete: (bookmarkId: string) => void;
  onAutoSave: () => void;
  onProgressChange: (percentage: number) => void;
}

interface ContentSegment {
  type: 'text' | 'annotation';
  content: string;
  annotation?: Annotation;
}

export default function ReaderView({
  chapter,
  totalChapters,
  annotations,
  bookmarks,
  jumpToAnnotation,
  onAnnotationCreate,
  onBookmarkCreate,
  onBookmarkDelete,
  onAutoSave,
  onProgressChange,
}: ReaderViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [toolbarVisible, setToolbarVisible] = useState(false);
  const [toolbarPosition, setToolbarPosition] = useState({ x: 0, y: 0 });
  const [selectedRange, setSelectedRange] = useState<Range | null>(null);
  const [progress, setProgress] = useState(0);
  const [flashingAnnotationId, setFlashingAnnotationId] = useState<string | null>(null);

  const chapterAnnotations = annotations.filter((a) => a.chapterIndex === chapter.index);
  const chapterBookmarks = bookmarks.filter((b) => b.chapterIndex === chapter.index);

  const getContentSegments = useCallback((): ContentSegment[] => {
    const content = chapter.content;
    const sortedAnnotations = [...chapterAnnotations].sort(
      (a, b) => a.startOffset - b.startOffset
    );

    const segments: ContentSegment[] = [];
    let currentOffset = 0;

    for (const annotation of sortedAnnotations) {
      if (annotation.startOffset > currentOffset) {
        segments.push({
          type: 'text',
          content: content.slice(currentOffset, annotation.startOffset),
        });
      }
      segments.push({
        type: 'annotation',
        content: content.slice(annotation.startOffset, annotation.endOffset),
        annotation,
      });
      currentOffset = annotation.endOffset;
    }

    if (currentOffset < content.length) {
      segments.push({
        type: 'text',
        content: content.slice(currentOffset),
      });
    }

    return segments;
  }, [chapter.content, chapterAnnotations]);

  const calculateProgress = useCallback(() => {
    if (!containerRef.current) return 0;
    const container = containerRef.current;
    const scrollTop = container.scrollTop;
    const scrollHeight = container.scrollHeight - container.clientHeight;
    const percentage = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
    return Math.min(Math.max(percentage, 0), 100);
  }, []);

  const handleScroll = useCallback(() => {
    const newProgress = calculateProgress();
    setProgress(newProgress);
    onProgressChange(newProgress);
    setToolbarVisible(false);
  }, [calculateProgress, onProgressChange]);

  const handleTextSelection = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
      setToolbarVisible(false);
      setSelectedRange(null);
      return;
    }

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    if (rect.width === 0 || rect.height === 0) {
      setToolbarVisible(false);
      setSelectedRange(null);
      return;
    }

    setSelectedRange(range.cloneRange());
    setToolbarPosition({
      x: rect.left + rect.width / 2,
      y: rect.top,
    });
    setToolbarVisible(true);
  }, []);

  const handleToolbarSelect = useCallback(
    (type: AnnotationType) => {
      if (!selectedRange || !contentRef.current) return;

      const range = selectedRange;
      const content = chapter.content;

      const preSelectionRange = document.createRange();
      preSelectionRange.selectNodeContents(contentRef.current);
      preSelectionRange.setEnd(range.startContainer, range.startOffset);
      const startOffset = preSelectionRange.toString().length;
      const endOffset = startOffset + range.toString().length;

      if (startOffset < 0 || endOffset > content.length || startOffset >= endOffset) {
        setToolbarVisible(false);
        setSelectedRange(null);
        window.getSelection()?.removeAllRanges();
        return;
      }

      const selectedText = content.slice(startOffset, endOffset);

      onAnnotationCreate({
        type,
        chapterIndex: chapter.index,
        startOffset,
        endOffset,
        text: selectedText,
        comment: type === 'comment' ? '' : undefined,
      });

      setToolbarVisible(false);
      setSelectedRange(null);
      window.getSelection()?.removeAllRanges();
    },
    [selectedRange, chapter.content, chapter.index, onAnnotationCreate]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }

      longPressTimerRef.current = setTimeout(() => {
        if (!containerRef.current) return;

        const scrollPosition = containerRef.current.scrollTop;
        const target = e.target as HTMLElement;
        const text = target.textContent?.slice(0, 50) || '';

        onBookmarkCreate({
          chapterIndex: chapter.index,
          scrollPosition,
          text,
        });
      }, 500);
    },
    [chapter.index, onBookmarkCreate]
  );

  const handleMouseUp = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.detail === 2) {
        if (!containerRef.current) return;

        const scrollPosition = containerRef.current.scrollTop;
        const target = e.target as HTMLElement;
        const text = target.textContent?.slice(0, 50) || '';

        onBookmarkCreate({
          chapterIndex: chapter.index,
          scrollPosition,
          text,
        });
      }
    },
    [chapter.index, onBookmarkCreate]
  );

  useEffect(() => {
    if (!jumpToAnnotation || !containerRef.current) return;

    const annotationElements = containerRef.current.querySelectorAll<HTMLElement>(
      `[data-annotation-id="${jumpToAnnotation.id}"]`
    );

    if (annotationElements.length > 0) {
      const element = annotationElements[0];
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });

      setFlashingAnnotationId(jumpToAnnotation.id);
      setTimeout(() => {
        setFlashingAnnotationId(null);
      }, 1200);
    }
  }, [jumpToAnnotation]);

  useEffect(() => {
    saveIntervalRef.current = setInterval(() => {
      onAutoSave();
    }, 5000);

    return () => {
      if (saveIntervalRef.current) {
        clearInterval(saveIntervalRef.current);
      }
    };
  }, [onAutoSave]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('scroll', handleScroll);
    document.addEventListener('selectionchange', handleTextSelection);

    return () => {
      container.removeEventListener('scroll', handleScroll);
      document.removeEventListener('selectionchange', handleTextSelection);
    };
  }, [handleScroll, handleTextSelection]);

  useEffect(() => {
    handleScroll();
  }, [handleScroll]);

  const getAnnotationStyle = (annotation: Annotation): React.CSSProperties => {
    const isFlashing = flashingAnnotationId === annotation.id;
    const baseStyle: React.CSSProperties = {
      position: 'relative',
    };

    if (isFlashing) {
      baseStyle.animation = 'flash 0.6s ease-in-out 2';
    }

    switch (annotation.type) {
      case 'highlight':
        return {
          ...baseStyle,
          backgroundColor: '#FBBF24',
        };
      case 'underline':
        return {
          ...baseStyle,
          textDecoration: 'underline',
          textDecorationStyle: 'wavy',
          textDecorationColor: '#34D399',
          textDecorationThickness: '2px',
          textUnderlineOffset: '2px',
        };
      case 'comment':
        return {
          ...baseStyle,
          borderBottom: '2px solid #60A5FA',
        };
      default:
        return baseStyle;
    }
  };

  const segments = getContentSegments();

  return (
    <div
      ref={containerRef}
      style={{
        height: '100%',
        overflowY: 'auto',
        backgroundColor: '#FFFEF7',
        position: 'relative',
      }}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onClick={handleClick}
    >
      <style>{`
        @keyframes flash {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; background-color: #FBBF24; }
        }
      `}</style>

      {chapterBookmarks.map((bookmark) => (
        <div
          key={bookmark.id}
          onClick={(e) => {
            e.stopPropagation();
            onBookmarkDelete(bookmark.id);
          }}
          style={{
            position: 'absolute',
            left: '16px',
            top: `${bookmark.scrollPosition + 32}px`,
            width: 0,
            height: 0,
            borderTop: '6px solid transparent',
            borderBottom: '6px solid transparent',
            borderLeft: '8px solid #7C3AED',
            cursor: 'pointer',
            zIndex: 10,
          }}
          title="点击删除书签"
        />
      ))}

      <div
        style={{
          padding: '32px 48px',
          maxWidth: '800px',
          margin: '0 auto',
        }}
      >
        <div style={{ marginBottom: '24px' }}>
          <h1
            style={{
              fontSize: '20px',
              fontWeight: 600,
              color: '#1F2937',
              margin: '0 0 8px 0',
            }}
          >
            {chapter.title}
          </h1>
          <div style={{ fontSize: '14px', color: '#6B7280' }}>
            第 {chapter.index + 1} / {totalChapters} 章 · 阅读进度 {progress.toFixed(1)}%
          </div>
        </div>

        <div
          ref={contentRef}
          style={{
            fontFamily:
              'Georgia, "Times New Roman", "Songti SC", "SimSun", serif',
            lineHeight: 1.8,
            fontSize: '16px',
            color: '#374151',
          }}
        >
          {segments.map((segment, index) => {
            if (segment.type === 'text') {
              return (
                <span key={index} style={{ marginBottom: '8px', display: 'block' }}>
                  {segment.content}
                </span>
              );
            }

            return (
              <span
                key={index}
                data-annotation-id={segment.annotation?.id}
                style={{
                  ...getAnnotationStyle(segment.annotation!),
                  marginBottom: '8px',
                  display: 'inline',
                }}
              >
                {segment.content}
              </span>
            );
          })}
        </div>
      </div>

      <FloatingToolbar
        visible={toolbarVisible}
        position={toolbarPosition}
        onSelect={handleToolbarSelect}
      />
    </div>
  );
}
