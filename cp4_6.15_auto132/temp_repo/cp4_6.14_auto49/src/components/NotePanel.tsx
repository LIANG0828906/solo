import React, { useState, useMemo } from 'react';
import { useBook } from '../context/BookContext';
import { Annotation } from '../types';

interface NotePanelProps {
  onNavigateToAnnotation: (annotation: Annotation) => void;
  isMobile?: boolean;
}

type SortMode = 'chapter' | 'time';

export default function NotePanel({ onNavigateToAnnotation, isMobile }: NotePanelProps) {
  const { currentBook, currentChapter, annotations, deleteAnnotation } = useBook();
  const [sortMode, setSortMode] = useState<SortMode>('chapter');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [filterText, setFilterText] = useState('');

  const filteredAndSortedAnnotations = useMemo(() => {
    let result = [...annotations];

    if (filterText.trim()) {
      const keyword = filterText.trim().toLowerCase();
      result = result.filter((ann) =>
        ann.text.toLowerCase().includes(keyword) ||
        (ann.note && ann.note.toLowerCase().includes(keyword))
      );
    }

    if (sortMode === 'chapter') {
      result.sort((a, b) => {
        if (a.chapterIndex !== b.chapterIndex) return a.chapterIndex - b.chapterIndex;
        return a.startOffset - b.startOffset;
      });
    } else {
      result.sort((a, b) => b.createdAt - a.createdAt);
    }

    return result;
  }, [annotations, sortMode, filterText]);

  const handleDelete = (id: string) => {
    setDeleteConfirmId(id);
  };

  const confirmDelete = () => {
    if (deleteConfirmId) {
      deleteAnnotation(deleteConfirmId);
      setDeleteConfirmId(null);
    }
  };

  const cancelDelete = () => {
    setDeleteConfirmId(null);
  };

  const truncate = (text: string, maxLen: number) => {
    if (text.length <= maxLen) return text;
    return text.slice(0, maxLen) + '...';
  };

  const getChapterTitle = (chapterIndex: number) => {
    if (!currentBook) return `第${chapterIndex + 1}章`;
    return currentBook.chapters[chapterIndex]?.title || `第${chapterIndex + 1}章`;
  };

  const getColorMarkClass = (type: string) => {
    switch (type) {
      case 'highlight': return 'highlight';
      case 'underline': return 'underline';
      case 'note': return 'note';
      default: return 'highlight';
    }
  };

  return (
    <div className="note-panel">
      <div className="note-panel-header">
        <span className="note-panel-title">标注与笔记</span>
        <select
          className="sort-select"
          value={sortMode}
          onChange={(e) => setSortMode(e.target.value as SortMode)}
        >
          <option value="chapter">按章节排序</option>
          <option value="time">按时间排序</option>
        </select>
      </div>

      <div className="filter-wrapper">
        <input
          type="text"
          className="filter-input"
          placeholder="搜索标注或笔记内容..."
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
        />
        {filterText && (
          <button
            className="filter-clear-btn"
            onClick={() => setFilterText('')}
            title="清除筛选"
          >
            ✕
          </button>
        )}
      </div>

      <div className="note-list">
        {filteredAndSortedAnnotations.length === 0 ? (
          <div className="empty-notes">
            {filterText
              ? '没有找到匹配的标注'
              : currentBook
                ? '暂无标注，选择文本即可创建'
                : '请先打开一本书籍'}
          </div>
        ) : (
          filteredAndSortedAnnotations.map((ann) => (
            <div
              key={ann.id}
              className="note-item"
              onClick={() => onNavigateToAnnotation(ann)}
            >
              <div className="note-item-header">
                <span className={`color-mark ${getColorMarkClass(ann.type)}`} />
                <span className="note-text-preview">
                  {truncate(ann.text, 50)}
                </span>
              </div>

              {sortMode === 'chapter' && ann.chapterIndex !== currentChapter && (
                <div className="note-chapter-label">
                  {getChapterTitle(ann.chapterIndex)}
                </div>
              )}

              {ann.type === 'note' && ann.note && (
                <div className="note-content-preview">
                  📝 {ann.note}
                </div>
              )}

              <button
                className="delete-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(ann.id);
                }}
                title="删除"
              >
                ✕
              </button>
            </div>
          ))
        )}
      </div>

      {deleteConfirmId && (
        <div className="modal-overlay" onClick={cancelDelete}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">确定删除此标注？</div>
            <div className="modal-actions">
              <button className="modal-btn cancel" onClick={cancelDelete}>
                取消
              </button>
              <button className="modal-btn confirm" onClick={confirmDelete}>
                确定
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
