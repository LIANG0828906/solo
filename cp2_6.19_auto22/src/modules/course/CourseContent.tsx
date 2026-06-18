import React, { useState, useEffect, useRef, useCallback } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { CourseUnit } from '../../types';
import { useProgress } from '../../hooks/useProgress';

interface TocItem {
  id: string;
  text: string;
  level: number;
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
  const [tocItems, setTocItems] = useState<TocItem[]>([]);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteContent, setNoteContent] = useState('');
  const [activeHeadingId, setActiveHeadingId] = useState<string | null>(null);

  const contentRef = useRef<HTMLDivElement>(null);
  const headingRefs = useRef<Map<string, HTMLElement>>(new Map());

  const note = getNoteSync(courseId, unit.id);
  const hasNote = hasNoteSync(courseId, unit.id);

  const extractToc = useCallback((markdown: string): TocItem[] => {
    const headingRegex = /^(#{1,6})\s+(.+)$/gm;
    const items: TocItem[] = [];
    let match;

    while ((match = headingRegex.exec(markdown)) !== null) {
      const level = match[1].length;
      const text = match[2].trim();
      const id = `heading-${items.length}-${text.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-').replace(/^-+|-+$/g, '')}`;
      items.push({ id, text, level });
    }

    return items;
  }, []);

  const addHeadingIds = useCallback((html: string, toc: TocItem[]): string => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;

    const headings = tempDiv.querySelectorAll('h1, h2, h3, h4, h5, h6');
    headings.forEach((heading, index) => {
      if (toc[index]) {
        heading.id = toc[index].id;
      }
    });

    return tempDiv.innerHTML;
  }, []);

  useEffect(() => {
    const renderMarkdown = async () => {
      setLoading(true);
      const start = performance.now();

      marked.setOptions({
        breaks: true,
        gfm: true,
      });

      const toc = extractToc(unit.content);
      setTocItems(toc);

      const rawHtml = await marked.parse(unit.content);
      const htmlWithIds = addHeadingIds(rawHtml, toc);
      const sanitizedHtml = DOMPurify.sanitize(htmlWithIds);
      setRenderedContent(sanitizedHtml);

      const duration = performance.now() - start;
      if (duration > 200) {
        console.warn(`Markdown rendering took ${duration}ms, exceeds 200ms limit`);
      }

      setLoading(false);
    };

    renderMarkdown();
  }, [unit.content, extractToc, addHeadingIds]);

  useEffect(() => {
    if (loading || !contentRef.current) return;

    const headings = contentRef.current.querySelectorAll('h1, h2, h3, h4, h5, h6');
    headingRefs.current.clear();
    headings.forEach((heading) => {
      if (heading.id) {
        headingRefs.current.set(heading.id, heading as HTMLElement);
      }
    });
  }, [renderedContent, loading]);

  useEffect(() => {
    if (showNoteModal && note) {
      setNoteContent(note.content);
    } else if (showNoteModal) {
      setNoteContent('');
    }
  }, [showNoteModal, note]);

  const handleScroll = useCallback(() => {
    if (!contentRef.current) return;

    const contentEl = contentRef.current;
    const scrollTop = contentEl.scrollTop;
    const scrollHeight = contentEl.scrollHeight - contentEl.clientHeight;

    if (scrollHeight > 0) {
      const progress = Math.min(100, Math.max(0, (scrollTop / scrollHeight) * 100));
      setReadingProgress(Math.round(progress));
    }

    let currentHeading: string | null = null;
    const viewportTop = scrollTop + 100;

    headingRefs.current.forEach((element, id) => {
      if (element.offsetTop <= viewportTop) {
        currentHeading = id;
      }
    });

    if (currentHeading !== activeHeadingId) {
      setActiveHeadingId(currentHeading);
    }
  }, [activeHeadingId]);

  useEffect(() => {
    const contentEl = contentRef.current;
    if (!contentEl) return;

    contentEl.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      contentEl.removeEventListener('scroll', handleScroll);
    };
  }, [handleScroll, loading]);

  const handleTocClick = (item: TocItem) => {
    const element = headingRefs.current.get(item.id);
    if (element && contentRef.current) {
      contentRef.current.scrollTo({
        top: element.offsetTop - 20,
        behavior: 'smooth',
      });
    }
  };

  const handleSaveNote = async () => {
    if (noteContent.trim()) {
      await saveNote(courseId, unit.id, noteContent.trim());
    } else if (hasNote) {
      await deleteNote(courseId, unit.id);
    }
    setShowNoteModal(false);
  };

  const handleDeleteNote = async () => {
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

  return (
    <div className="course-content-wrapper">
      <div className="reading-progress-bar">
        <div
          className="reading-progress-fill"
          style={{ width: `${readingProgress}%` }}
        />
        <span className="reading-progress-text">{readingProgress}%</span>
      </div>

      {tocItems.length > 0 && (
        <div className={`toc-container ${tocExpanded ? 'expanded' : 'collapsed'}`}>
          <button
            className="toc-toggle"
            onClick={() => setTocExpanded(!tocExpanded)}
          >
            <span className="toc-icon">📑</span>
            <span className="toc-title">目录大纲</span>
            <span className={`toc-arrow ${tocExpanded ? 'up' : 'down'}`}>
              {tocExpanded ? '▲' : '▼'}
            </span>
          </button>
          {tocExpanded && (
            <nav className="toc-list">
              {tocItems.map((item) => (
                <button
                  key={item.id}
                  className={`toc-item level-${item.level} ${
                    activeHeadingId === item.id ? 'active' : ''
                  }`}
                  onClick={() => handleTocClick(item)}
                  style={{ paddingLeft: `${(item.level - 1) * 16 + 12}px` }}
                >
                  {item.text}
                </button>
              ))}
            </nav>
          )}
        </div>
      )}

      <div className="course-content" ref={contentRef}>
        <h2 className="course-unit-title">{unit.title}</h2>
        <div
          className="markdown-content"
          dangerouslySetInnerHTML={{ __html: renderedContent }}
        />
        <div className="content-footer">
          <div className="footer-actions">
            <button
              className={`btn-add-note ${hasNote ? 'has-note' : ''}`}
              onClick={() => setShowNoteModal(true)}
            >
              <span className="btn-icon">📝</span>
              {hasNote ? '编辑笔记' : '添加笔记'}
              {hasNote && <span className="note-indicator">●</span>}
            </button>
            <button
              className={`btn-mark-complete ${isCompleted ? 'completed' : ''}`}
              onClick={onMarkComplete}
              disabled={isCompleted}
            >
              {isCompleted ? '✓ 已完成' : '标记已完成'}
            </button>
          </div>
        </div>
      </div>

      {showNoteModal && (
        <div className="note-modal-overlay" onClick={() => setShowNoteModal(false)}>
          <div className="note-modal" onClick={(e) => e.stopPropagation()}>
            <header className="note-modal-header">
              <h3>📝 学习笔记</h3>
              <button
                className="note-modal-close"
                onClick={() => setShowNoteModal(false)}
              >
                ✕
              </button>
            </header>
            <div className="note-modal-body">
              <p className="note-unit-title">
                <strong>单元：</strong>{unit.title}
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
