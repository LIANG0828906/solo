import React, { useState, useRef } from 'react';
import type { Chapter } from '@/types';
import { formatTime } from '../utils/helpers';
import '../styles/ChapterTimeline.css';

interface Props {
  chapters: Chapter[];
  onChaptersChange: (chapters: Chapter[]) => void;
  previewMode: boolean;
  onJumpToTime: (time: number) => void;
  isLoading?: boolean;
}

const ChapterTimeline: React.FC<Props> = ({
  chapters,
  onChaptersChange,
  previewMode,
  onJumpToTime,
  isLoading,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const dragStartY = useRef(0);
  const listRef = useRef<HTMLDivElement>(null);

  const startEdit = (chapter: Chapter) => {
    if (previewMode) return;
    setEditingId(chapter.id);
    setEditValue(chapter.title);
  };

  const finishEdit = (id: string) => {
    const updated = chapters.map((c) =>
      c.id === id ? { ...c, title: editValue.trim() || c.title } : c,
    );
    onChaptersChange(updated);
    setEditingId(null);
    setEditValue('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValue('');
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    if (previewMode) {
      e.preventDefault();
      return;
    }
    setDraggingId(id);
    dragStartY.current = e.clientY;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (!draggingId) return;
    const sourceIndex = chapters.findIndex((c) => c.id === draggingId);
    if (sourceIndex === -1 || sourceIndex === targetIndex) {
      setDraggingId(null);
      setDragOverIndex(null);
      return;
    }
    const newChapters = [...chapters];
    const [moved] = newChapters.splice(sourceIndex, 1);
    newChapters.splice(targetIndex, 0, moved);
    const reindexed = newChapters.map((c, i) => ({ ...c, index: i + 1 }));
    onChaptersChange(reindexed);
    setDraggingId(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggingId(null);
    setDragOverIndex(null);
  };

  const addChapter = () => {
    if (previewMode) return;
    const newChapter: Chapter = {
      id: `ch-${Date.now()}`,
      index: chapters.length + 1,
      startTime: chapters.length > 0 ? chapters[chapters.length - 1].startTime + 10 : 0,
      title: `章节 ${chapters.length + 1}`,
    };
    onChaptersChange([...chapters, newChapter]);
  };

  const removeChapter = (id: string) => {
    if (previewMode) return;
    const filtered = chapters
      .filter((c) => c.id !== id)
      .map((c, i) => ({ ...c, index: i + 1 }));
    onChaptersChange(filtered);
  };

  const handleClick = (chapter: Chapter) => {
    onJumpToTime(chapter.startTime);
  };

  return (
    <div className={`chapter-timeline ${previewMode ? 'preview-mode' : ''}`}>
      <div className="chapter-header">
        <h3 className="chapter-title">章节列表</h3>
        {!previewMode && (
          <button className="add-chapter-btn" onClick={addChapter} title="新增章节">
            +
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="loading-state">
          <div className="loading-spinner" />
          <span>加载中...</span>
        </div>
      ) : (
        <div className="chapter-list" ref={listRef}>
          {chapters.length === 0 && !previewMode && (
            <div className="empty-state">
              <div className="empty-icon">📋</div>
              <p>暂无章节</p>
              <span>上传视频后自动生成</span>
            </div>
          )}

          {chapters.map((chapter, index) => (
            <React.Fragment key={chapter.id}>
              {index > 0 && <div className="chapter-divider" />}
              {dragOverIndex === index && draggingId !== chapter.id && (
                <div className="drop-placeholder" />
              )}
              <div
                className={`chapter-card ${
                  draggingId === chapter.id ? 'dragging' : ''
                } ${editingId === chapter.id ? 'editing' : ''}`}
                draggable={!previewMode}
                onDragStart={(e) => handleDragStart(e, chapter.id)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
                onClick={() => !editingId && handleClick(chapter)}
                style={{
                  animationDelay: `${index * 100}ms`,
                }}
              >
                <div className="chapter-index">
                  <span className="index-badge">{chapter.index}</span>
                </div>

                <div className="chapter-content">
                  {editingId === chapter.id ? (
                    <div
                      className="chapter-edit-wrapper"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="text"
                        className="chapter-title-input"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') finishEdit(chapter.id);
                          if (e.key === 'Escape') cancelEdit();
                        }}
                        onBlur={() => finishEdit(chapter.id)}
                        autoFocus
                      />
                      <span className="input-cursor" />
                    </div>
                  ) : (
                    <div
                      className="chapter-title"
                      onDoubleClick={() => startEdit(chapter)}
                      title={previewMode ? '点击跳转' : '双击编辑标题'}
                    >
                      {chapter.title}
                    </div>
                  )}
                  <div className="chapter-time">{formatTime(chapter.startTime)}</div>
                </div>

                {!previewMode && editingId !== chapter.id && (
                  <button
                    className="delete-chapter-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeChapter(chapter.id);
                    }}
                    title="删除章节"
                  >
                    ✕
                  </button>
                )}
              </div>
            </React.Fragment>
          ))}

          {dragOverIndex === chapters.length && draggingId && (
            <div className="drop-placeholder" />
          )}
        </div>
      )}

      {!previewMode && chapters.length > 0 && (
        <div className="chapter-footer">
          <span className="chapter-count">共 {chapters.length} 个章节</span>
        </div>
      )}
    </div>
  );
};

export default ChapterTimeline;
