import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { CourseUnit } from '../../types';
import { useProgress } from '../../hooks/useProgress';

interface TocNode {
  id: string;
  text: string;
  level: number;
  element: HTMLElement | null;
  children: TocNode[];
}

interface CourseContentProps {
  courseId: string;
  unit: CourseUnit;
  isCompleted: boolean;
  onMarkComplete: () => void;
}

export const CourseContent: React.FC<CourseContentProps> = ({
  courseId,
  unit,
  isCompleted,
  onMarkComplete,
}) => {
  const { saveNote, deleteNote, getNoteSync, hasNoteSync } = useProgress();

  const [renderedContent, setRenderedContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [readingProgress, setReadingProgress] = useState(0);
  const [tocExpanded, setTocExpanded] = useState(true);
  const [tocTree, setTocTree] = useState<TocNode[]>([]);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteContent, setNoteContent] = useState('');
  const [activeHeadingId, setActiveHeadingId] = useState<string | null>(null);
  const [isNoteLocked, setIsNoteLocked] = useState(false);

  const contentRef = useRef<HTMLDivElement>(null);
  const markdownContainerRef = useRef<HTMLDivElement | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const throttleTimeoutRef = useRef<number | null>(null);

  const noteKey = useMemo(() => `${courseId}__${unit.id}`, [courseId, unit.id]);

  const note = getNoteSync(courseId, unit.id);
  const hasNote = hasNoteSync(courseId, unit.id);

  useEffect(() => {
    setIsNoteLocked(isCompleted);
  }, [isCompleted]);

  const buildTocTree = (flatItems: TocNode[]): TocNode[] => {
    const tree: TocNode[] = [];
    const stack: TocNode[] = [];

    flatItems.forEach((item) => {
      const node: TocNode = { ...item, children: [] };

      while (
        stack.length > 0 &&
        stack[stack.length - 1].level >= node.level
      ) {
        stack.pop();
      }

      if (stack.length === 0) {
        tree.push(node);
      } else {
        stack[stack.length - 1].children.push(node);
      }

      stack.push(node);
    });

    return tree;
  };

  const parseDomHeadings = useCallback((): TocNode[] => {
    if (!markdownContainerRef.current) return [];

    const container = markdownContainerRef.current;
    const headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6');

    const flatItems: TocNode[] = [];
    let headingIndex = 0;

    headings.forEach((heading) => {
      const level = parseInt(heading.tagName.substring(1), 10);
      const text = heading.textContent?.trim() || '';
      const safeText = text.toLowerCase()
        .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
        .replace(/^-+|-+$/g, '');
      const id = `h-${noteKey}-${headingIndex}-${safeText || level}`;

      heading.id = id;
      heading.setAttribute('data-heading-index', String(headingIndex));
      heading.setAttribute('tabindex', '-1');
      (heading as HTMLElement).style.scrollMarginTop = '24px';

      flatItems.push({
        id,
        text,
        level,
        element: heading as HTMLElement,
        children: [],
      });

      headingIndex++;
    });

    return flatItems;
  }, [noteKey]);

  useEffect(() => {
    const renderMarkdown = async () => {
      setLoading(true);
      setTocTree([]);
      const start = performance.now();

      marked.setOptions({
        breaks: true,
        gfm: true,
      });

      const rawHtml = await marked.parse(unit.content);
      const sanitizedHtml = DOMPurify.sanitize(rawHtml);

      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = sanitizedHtml;
      const headings = tempDiv.querySelectorAll('h1, h2, h3, h4, h5, h6');
      let headingIndex = 0;
      headings.forEach((heading) => {
        const text = heading.textContent?.trim() || '';
        const safeText = text.toLowerCase()
          .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
          .replace(/^-+|-+$/g, '');
        const id = `h-${noteKey}-${headingIndex}-${safeText || heading.tagName.substring(1)}`;
        heading.id = id;
        heading.setAttribute('data-heading-index', String(headingIndex));
        headingIndex++;
      });

      setRenderedContent(tempDiv.innerHTML);

      const duration = performance.now() - start;
      if (duration > 200) {
        console.warn(`Markdown rendering took ${duration}ms, exceeds 200ms limit`);
      }

      setLoading(false);
    };

    renderMarkdown();
  }, [unit.content, noteKey]);

  useEffect(() => {
    if (loading) return;

    const frameId = requestAnimationFrame(() => {
      if (markdownContainerRef.current) {
        const flatItems = parseDomHeadings();
        const tree = buildTocTree(flatItems);
        setTocTree(tree);
      }
    });

    return () => cancelAnimationFrame(frameId);
  }, [renderedContent, loading, parseDomHeadings]);

  const calculateReadingProgress = useCallback(() => {
    if (!contentRef.current) return 0;

    const el = contentRef.current;
    const scrollTop = el.scrollTop;
    const scrollHeight = el.scrollHeight;
    const clientHeight = el.clientHeight;
    const scrollable = scrollHeight - clientHeight;

    if (scrollable <= 0) return scrollTop > 0 ? 100 : 0;
    return Math.min(100, Math.max(0, Math.round((scrollTop / scrollable) * 100)));
  }, []);

  const findActiveHeading = useCallback((): string | null => {
    if (!markdownContainerRef.current) return null;

    const container = markdownContainerRef.current;
    const viewportTop = (contentRef.current?.scrollTop || 0) + 120;

    const headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6');
    let currentActive: HTMLElement | null = null;

    headings.forEach((heading) => {
      const el = heading as HTMLElement;
      if (el.offsetTop <= viewportTop) {
        currentActive = el;
      }
    });

    return (currentActive as HTMLElement | null)?.id || null;
  }, []);

  const onScrollThrottled = useCallback(() => {
    if (throttleTimeoutRef.current !== null) return;

    throttleTimeoutRef.current = window.setTimeout(() => {
      throttleTimeoutRef.current = null;

      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }

      rafIdRef.current = requestAnimationFrame(() => {
        const progress = calculateReadingProgress();
        setReadingProgress(progress);

        const activeId = findActiveHeading();
        if (activeId !== activeHeadingId) {
          setActiveHeadingId(activeId);
        }
      });
    }, 50);
  }, [calculateReadingProgress, findActiveHeading, activeHeadingId]);

  useEffect(() => {
    const contentEl = contentRef.current;
    if (!contentEl) return;

    contentEl.addEventListener('scroll', onScrollThrottled, { passive: true });

    const initialProgress = calculateReadingProgress();
    setReadingProgress(initialProgress);

    return () => {
      contentEl.removeEventListener('scroll', onScrollThrottled);
      if (throttleTimeoutRef.current !== null) {
        clearTimeout(throttleTimeoutRef.current);
        throttleTimeoutRef.current = null;
      }
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, [onScrollThrottled, calculateReadingProgress, loading]);

  const handleTocClick = (node: TocNode) => {
    if (!contentRef.current) return;

    const element = document.getElementById(node.id);
    if (element) {
      const targetTop = element.offsetTop - 24;
      contentRef.current.scrollTo({
        top: targetTop,
        behavior: 'smooth',
      });
    }
  };

  const renderTocNode = (node: TocNode): React.ReactNode => (
    <div key={node.id}>
      <button
        className={`toc-item level-${node.level} ${
          activeHeadingId === node.id ? 'active' : ''
        }`}
        onClick={() => handleTocClick(node)}
        style={{ paddingLeft: `${(node.level - 1) * 16 + 12}px` }}
      >
        {node.text}
      </button>
      {node.children.length > 0 && (
        <div className="toc-children">
          {node.children.map(renderTocNode)}
        </div>
      )}
    </div>
  );

  useEffect(() => {
    if (showNoteModal && note) {
      setNoteContent(note.content);
    } else if (showNoteModal) {
      setNoteContent('');
    }
  }, [showNoteModal, note]);

  const handleOpenNoteModal = () => {
    if (isNoteLocked) {
      return;
    }
    setShowNoteModal(true);
  };

  const handleSaveNote = async () => {
    if (isNoteLocked) return;

    if (noteContent.trim()) {
      await saveNote(courseId, unit.id, noteContent.trim());
    } else if (hasNote) {
      await deleteNote(courseId, unit.id);
    }
    setShowNoteModal(false);
  };

  const handleDeleteNote = async () => {
    if (isNoteLocked) return;
    if (window.confirm('确定要删除这条笔记吗？')) {
      await deleteNote(courseId, unit.id);
      setShowNoteModal(false);
      setNoteContent('');
    }
  };

  if (loading) {
    return (
      <div className="course-content-wrapper">
        <div className="loading-spinner">加载中...</div>
      </div>
    );
  }

  const flattenToc = (nodes: TocNode[]): TocNode[] => {
    const result: TocNode[] = [];
    const walk = (list: TocNode[]) => {
      list.forEach((node) => {
        result.push(node);
        if (node.children.length) walk(node.children);
      });
    };
    walk(nodes);
    return result;
  };

  const flatToc = flattenToc(tocTree);

  return (
    <div className="course-content-wrapper">
      <div className="reading-progress-bar">
        <div
          className="reading-progress-fill"
          style={{ width: `${readingProgress}%` }}
        />
        <span className="reading-progress-text">{readingProgress}%</span>
      </div>

      {tocTree.length > 0 && (
        <div className={`toc-container ${tocExpanded ? 'expanded' : 'collapsed'}`}>
          <button
            className="toc-toggle"
            onClick={() => setTocExpanded(!tocExpanded)}
            aria-expanded={tocExpanded}
          >
            <span className="toc-icon">📑</span>
            <span className="toc-title">目录大纲 ({flatToc.length} 节)</span>
            <span className={`toc-arrow ${tocExpanded ? 'up' : 'down'}`}>
              {tocExpanded ? '▲' : '▼'}
            </span>
          </button>
          {tocExpanded && (
            <nav className="toc-list" role="navigation" aria-label="课程目录">
              {tocTree.map(renderTocNode)}
            </nav>
          )}
        </div>
      )}

      <div className="course-content" ref={contentRef}>
        <h2 className="course-unit-title" id={`unit-${unit.id}`}>
          {unit.title}
        </h2>
        <div
          className="markdown-content"
          ref={(el) => {
            markdownContainerRef.current = el;
          }}
          dangerouslySetInnerHTML={{ __html: renderedContent }}
        />
        <div className="content-footer">
          <div className="footer-actions">
            <button
              className={`btn-add-note ${hasNote ? 'has-note' : ''} ${isNoteLocked ? 'locked' : ''}`}
              onClick={handleOpenNoteModal}
              disabled={isNoteLocked}
              title={isNoteLocked ? '单元已完成，笔记已锁定' : hasNote ? '编辑笔记' : '添加笔记'}
            >
              <span className="btn-icon">{isNoteLocked ? '🔒' : '📝'}</span>
              {isNoteLocked
                ? '笔记已锁定'
                : hasNote
                ? '编辑笔记'
                : '添加笔记'}
              {hasNote && !isNoteLocked && <span className="note-indicator">●</span>}
            </button>
            <button
              className={`btn-mark-complete ${isCompleted ? 'completed' : ''}`}
              onClick={onMarkComplete}
              disabled={isCompleted}
            >
              {isCompleted ? '✓ 已完成' : '标记已完成'}
            </button>
          </div>
          {isNoteLocked && hasNote && (
            <p className="note-locked-hint">
              💡 该单元已完成，笔记已保存。如需修改，请先取消完成状态。
            </p>
          )}
        </div>
      </div>

      {showNoteModal && !isNoteLocked && (
        <div className="note-modal-overlay" onClick={() => setShowNoteModal(false)}>
          <div className="note-modal" onClick={(e) => e.stopPropagation()}>
            <header className="note-modal-header">
              <h3>📝 学习笔记</h3>
              <button
                className="note-modal-close"
                onClick={() => setShowNoteModal(false)}
                aria-label="关闭"
              >
                ✕
              </button>
            </header>
            <div className="note-modal-body">
              <p className="note-unit-title">
                <strong>单元：</strong>{unit.title}
              </p>
              <p className="note-meta-hint">
                <small>笔记标识：{noteKey}</small>
              </p>
              <textarea
                className="note-textarea"
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="在这里记录你的学习心得、疑问或重要知识点..."
                autoFocus
              />
              {note && (
                <p className="note-updated-at">
                  最后更新：{new Date(note.updatedAt).toLocaleString('zh-CN')}
                </p>
              )}
            </div>
            <footer className="note-modal-footer">
              {hasNote && (
                <button className="btn-delete-note" onClick={handleDeleteNote}>
                  删除笔记
                </button>
              )}
              <div className="footer-right">
                <button
                  className="btn-cancel-note"
                  onClick={() => setShowNoteModal(false)}
                >
                  取消
                </button>
                <button className="btn-save-note" onClick={handleSaveNote}>
                  保存笔记
                </button>
              </div>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
};
