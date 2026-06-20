import { useState, useCallback, useRef, useMemo } from 'react';
import { Book, Excerpt, WeeklyStat } from '../types';
import { useBookStore } from '../store';
import { createRipple, formatDate, mergeRanges } from '../utils';
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Plus,
  Clipboard,
  BookOpen,
  Calendar,
  FileText,
  Clock,
  BarChart3,
} from 'lucide-react';

interface Props {
  book: Book;
  weeklyStats: WeeklyStat[];
}

interface ExcerptCardProps {
  excerpt: Excerpt;
  onUpdate: (id: string, content: string) => void;
  onDelete: (id: string) => void;
  onToggleHighlight: (excerptId: string, start: number, end: number) => void;
}

function ExcerptCard({ excerpt, onUpdate, onDelete, onToggleHighlight }: ExcerptCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(excerpt.content);
  const contentRef = useRef<HTMLDivElement>(null);
  const [editRipples, setEditRipples] = useState<{ x: number; y: number; size: number; id: number }[]>([]);
  const [deleteRipples, setDeleteRipples] = useState<{ x: number; y: number; size: number; id: number }[]>([]);
  const [saveRipples, setSaveRipples] = useState<{ x: number; y: number; size: number; id: number }[]>([]);
  const [cancelRipples, setCancelRipples] = useState<{ x: number; y: number; size: number; id: number }[]>([]);

  const handleTextSelection = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) return;

    const range = selection.getRangeAt(0);
    const container = contentRef.current;
    if (!container || !container.contains(range.commonAncestorContainer)) return;

    const preRange = document.createRange();
    preRange.selectNodeContents(container);
    preRange.setEnd(range.startContainer, range.startOffset);
    const start = preRange.toString().length;
    const end = start + range.toString().length;

    if (start !== end) {
      onToggleHighlight(excerpt.id, start, end);
      selection.removeAllRanges();
    }
  }, [excerpt.id, onToggleHighlight]);

  const handleHighlightClick = (e: React.MouseEvent, start: number, end: number) => {
    e.stopPropagation();
    onToggleHighlight(excerpt.id, start, end);
  };

  const renderHighlightedContent = () => {
    if (excerpt.highlights.length === 0) {
      return excerpt.content;
    }

    const merged = mergeRanges(excerpt.highlights);
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;

    merged.forEach((range, idx) => {
      if (range.start > lastIndex) {
        parts.push(
          <span key={`text-${idx}`}>
            {excerpt.content.slice(lastIndex, range.start)}
          </span>
        );
      }
      if (range.start < range.end) {
        parts.push(
          <span
            key={`hl-${idx}`}
            className="highlight"
            onClick={(e) => handleHighlightClick(e, range.start, range.end)}
          >
            {excerpt.content.slice(range.start, range.end)}
          </span>
        );
      }
      lastIndex = range.end;
    });

    if (lastIndex < excerpt.content.length) {
      parts.push(
        <span key="text-end">{excerpt.content.slice(lastIndex)}</span>
      );
    }

    return parts;
  };

  const handleSaveEdit = () => {
    onUpdate(excerpt.id, editContent);
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditContent(excerpt.content);
    setIsEditing(false);
  };

  return (
    <div className="excerpt-card">
      <div className="excerpt-card-header">
        <span className="excerpt-date">{formatDate(excerpt.createdAt)}</span>
        <div className="excerpt-actions">
          <button
            className="icon-btn"
            onClick={(e) => {
              createRipple(e, setEditRipples);
              setIsEditing(!isEditing);
              if (!isEditing) setEditContent(excerpt.content);
            }}
            title="编辑"
          >
            <Pencil size={16} />
            {editRipples.map((r) => (
              <span
                key={r.id}
                className="ripple"
                style={{ left: r.x, top: r.y, width: r.size, height: r.size }}
              />
            ))}
          </button>
          <button
            className="icon-btn danger"
            onClick={(e) => {
              createRipple(e, setDeleteRipples);
              onDelete(excerpt.id);
            }}
            title="删除"
          >
            <Trash2 size={16} />
            {deleteRipples.map((r) => (
              <span
                key={r.id}
                className="ripple"
                style={{ left: r.x, top: r.y, width: r.size, height: r.size }}
              />
            ))}
          </button>
        </div>
      </div>

      <div
        className="excerpt-content"
        ref={contentRef}
        onMouseUp={handleTextSelection}
      >
        {renderHighlightedContent()}
      </div>

      <div className={`edit-form ${isEditing ? 'open' : ''}`}>
        <textarea
          className="edit-textarea"
          value={editContent}
          onChange={(e) => setEditContent(e.target.value)}
          autoFocus
        />
        <div className="edit-actions">
          <button
            className="btn-secondary"
            onClick={(e) => {
              createRipple(e, setCancelRipples);
              handleCancelEdit();
            }}
          >
            取消
            {cancelRipples.map((r) => (
              <span
                key={r.id}
                className="ripple"
                style={{ left: r.x, top: r.y, width: r.size, height: r.size }}
              />
            ))}
          </button>
          <button
            className="btn-primary"
            onClick={(e) => {
              createRipple(e, setSaveRipples);
              handleSaveEdit();
            }}
          >
            保存
            {saveRipples.map((r) => (
              <span
                key={r.id}
                className="ripple"
                style={{ left: r.x, top: r.y, width: r.size, height: r.size }}
              />
            ))}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function BookDetail({ book, weeklyStats }: Props) {
  const selectBook = useBookStore((s) => s.selectBook);
  const updateBook = useBookStore((s) => s.updateBook);
  const getExcerptsByBook = useBookStore((s) => s.getExcerptsByBook);
  const calculateEstimatedFinish = useBookStore((s) => s.calculateEstimatedFinish);
  const addExcerpt = useBookStore((s) => s.addExcerpt);
  const updateExcerpt = useBookStore((s) => s.updateExcerpt);
  const deleteExcerpt = useBookStore((s) => s.deleteExcerpt);
  const toggleHighlight = useBookStore((s) => s.toggleHighlight);

  const [newExcerpt, setNewExcerpt] = useState('');
  const [showInput, setShowInput] = useState(false);
  const excerpts = getExcerptsByBook(book.id);
  const estimatedFinish = calculateEstimatedFinish(book.id);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [backRipples, setBackRipples] = useState<{ x: number; y: number; size: number; id: number }[]>([]);
  const [addRipples, setAddRipples] = useState<{ x: number; y: number; size: number; id: number }[]>([]);
  const [pasteRipples, setPasteRipples] = useState<{ x: number; y: number; size: number; id: number }[]>([]);
  const [saveRipples, setSaveRipples] = useState<{ x: number; y: number; size: number; id: number }[]>([]);
  const [cancelRipples, setCancelRipples] = useState<{ x: number; y: number; size: number; id: number }[]>([]);

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setNewExcerpt((prev) => prev + text);
        textareaRef.current?.focus();
      }
    } catch {
      textareaRef.current?.focus();
      document.execCommand('paste');
    }
  };

  const handleAddExcerpt = () => {
    if (!newExcerpt.trim()) return;
    addExcerpt(book.id, newExcerpt.trim());
    setNewExcerpt('');
    setShowInput(false);
  };

  const statusLabel = useMemo(() => {
    switch (book.status) {
      case 'reading': return '在读';
      case 'finished': return '已读完';
      case 'wishlist': return '想读';
    }
  }, [book.status]);

  const maxHours = useMemo(() => {
    return Math.max(...weeklyStats.map((s) => s.hours), 1);
  }, [weeklyStats]);

  return (
    <div className="detail-view">
      <button
        className="back-btn"
        onClick={(e) => {
          createRipple(e, setBackRipples);
          selectBook(null);
        }}
      >
        <ArrowLeft size={18} />
        返回书架
        {backRipples.map((r) => (
          <span
            key={r.id}
            className="ripple"
            style={{ left: r.x, top: r.y, width: r.size, height: r.size }}
          />
        ))}
      </button>

      <div className="book-header">
        <div
          className="book-header-cover"
          style={{ background: book.gradientColor }}
        >
          <BookOpen className="book-cover-icon" size={48} />
        </div>
        <div className="book-header-info">
          <h1 className="book-header-title">{book.title}</h1>
          <p className="book-header-author">{book.author}</p>
          <span className={`status-badge ${book.status}`}>{statusLabel}</span>

          <div className="book-header-meta">
            <div className="meta-item">
              <FileText size={14} />
              共 <strong>{book.totalPages}</strong> 页
            </div>
            <div className="meta-item">
              <BarChart3 size={14} />
              已读 <strong>{Math.round(book.totalPages * book.progress / 100)}</strong> 页
            </div>
            {estimatedFinish && book.status === 'reading' && (
              <div className="meta-item">
                <Calendar size={14} />
                预计 <strong>{estimatedFinish}</strong> 读完
              </div>
            )}
            <div className="meta-item">
              <FileText size={14} />
              <strong>{excerpts.length}</strong> 条书摘
            </div>
          </div>

          <div className="progress-control">
            <div className="progress-input-wrapper">
              <input
                className="progress-slider"
                type="range"
                min="0"
                max="100"
                value={book.progress}
                onChange={(e) => {
                  const newProgress = parseInt(e.target.value);
                  updateBook(book.id, {
                    progress: newProgress,
                    status: newProgress >= 100 ? 'finished' : book.status === 'wishlist' ? 'reading' : book.status,
                  });
                }}
              />
              <span className="progress-value">{book.progress}%</span>
            </div>
          </div>
        </div>
      </div>

      <div className="section-header">
        <h2 className="section-title">书摘笔记</h2>
        {!showInput && (
          <button
            className="add-excerpt-btn"
            onClick={(e) => {
              createRipple(e, setAddRipples);
              setShowInput(true);
            }}
          >
            <Plus size={16} />
            添加书摘
            {addRipples.map((r) => (
              <span
                key={r.id}
                className="ripple"
                style={{ left: r.x, top: r.y, width: r.size, height: r.size }}
              />
            ))}
          </button>
        )}
      </div>

      {showInput && (
        <div className="excerpt-input-wrapper">
          <textarea
            ref={textareaRef}
            className="excerpt-textarea"
            placeholder="输入书摘内容，或从剪贴板粘贴..."
            value={newExcerpt}
            onChange={(e) => setNewExcerpt(e.target.value)}
            autoFocus
          />
          <div className="excerpt-input-actions">
            <button
              className="paste-btn"
              onClick={(e) => {
                createRipple(e, setPasteRipples);
                handlePaste();
              }}
            >
              <Clipboard size={14} />
              从剪贴板粘贴
              {pasteRipples.map((r) => (
                <span
                  key={r.id}
                  className="ripple"
                  style={{ left: r.x, top: r.y, width: r.size, height: r.size }}
                />
              ))}
            </button>
            <div className="save-cancel-group">
              <button
                className="btn-secondary"
                onClick={(e) => {
                  createRipple(e, setCancelRipples);
                  setShowInput(false);
                  setNewExcerpt('');
                }}
              >
                取消
                {cancelRipples.map((r) => (
                  <span
                    key={r.id}
                    className="ripple"
                    style={{ left: r.x, top: r.y, width: r.size, height: r.size }}
                  />
                ))}
              </button>
              <button
                className="btn-primary"
                onClick={(e) => {
                  createRipple(e, setSaveRipples);
                  handleAddExcerpt();
                }}
              >
                保存
                {saveRipples.map((r) => (
                  <span
                    key={r.id}
                    className="ripple"
                    style={{ left: r.x, top: r.y, width: r.size, height: r.size }}
                  />
                ))}
              </button>
            </div>
          </div>
        </div>
      )}

      {excerpts.length === 0 ? (
        <div className="empty-state">
          <FileText size={40} />
          <p className="empty-state-text">还没有书摘</p>
          <p className="empty-state-hint">选中书中的文字，添加你的第一条书摘吧</p>
        </div>
      ) : (
        <div className="excerpts-list">
          {excerpts.map((excerpt) => (
            <ExcerptCard
              key={excerpt.id}
              excerpt={excerpt}
              onUpdate={updateExcerpt}
              onDelete={deleteExcerpt}
              onToggleHighlight={toggleHighlight}
            />
          ))}
        </div>
      )}

      <div className="stats-section">
        <h3 className="stats-title">
          <Clock size={16} style={{ display: 'inline', marginRight: 6, verticalAlign: '-2px' }} />
          每周阅读时长统计
        </h3>
        <div className="stats-chart">
          {weeklyStats.map((stat) => (
            <div key={stat.week} className="stat-bar-wrapper">
              <span className="stat-value">{stat.hours}h</span>
              <div
                className="stat-bar"
                style={{ height: `${Math.max((stat.hours / maxHours) * 100, 4)}%` }}
              />
              <span className="stat-label">{stat.week}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
