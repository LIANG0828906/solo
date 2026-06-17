import React, { useState, useRef } from 'react';
import { useStore } from '../store';
import type { Chapter } from '../types';
import { generateId } from '../utils';
import Button from './Button';
import '../styles/CoursePanel.css';

interface ChapterNodeProps {
  chapter: Chapter;
  courseId: string;
  depth: number;
  onDragStart: (e: React.DragEvent, chapter: Chapter) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, targetChapter: Chapter) => void;
  onDragEnd: () => void;
  draggedChapter: Chapter | null;
  dropTarget: string | null;
}

const ChapterNode: React.FC<ChapterNodeProps> = ({
  chapter,
  courseId,
  depth,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  draggedChapter,
  dropTarget,
}) => {
  const {
    selectedChapterId,
    toggleChapterExpand,
    selectChapter,
    updateChapterName,
    addChapter,
    deleteChapter,
  } = useStore();
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const [showAddMenu, setShowAddMenu] = useState<string | null>(null);

  const hasChildren = chapter.children.length > 0;
  const isExpanded = chapter.expanded ?? true;
  const isSelected = selectedChapterId === chapter.id;
  const isDragging = draggedChapter?.id === chapter.id;
  const isDropTarget = dropTarget === chapter.id;

  const handleDoubleClick = () => {
    setEditingId(chapter.id);
    setEditValue(chapter.name);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleBlur = () => {
    if (editValue.trim() && editValue !== chapter.name) {
      updateChapterName(courseId, chapter.id, editValue.trim());
    }
    setEditingId(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleBlur();
    } else if (e.key === 'Escape') {
      setEditingId(null);
    }
  };

  const handleAddChapter = (asChild: boolean) => {
    const newChapter: Chapter = {
      id: generateId(),
      name: '新章节',
      order: 0,
      children: [],
      expanded: true,
    };
    addChapter(courseId, newChapter, asChild ? chapter.id : undefined);
    setShowAddMenu(null);
  };

  const handleDelete = () => {
    if (window.confirm(`确定删除 "${chapter.name}" 吗？`)) {
      deleteChapter(courseId, chapter.id);
    }
  };

  return (
    <div className="chapter-node-container">
      <div
        className={`chapter-node ${isSelected ? 'selected' : ''} ${isDragging ? 'dragging' : ''} ${isDropTarget ? 'drop-target' : ''}`}
        style={{ paddingLeft: 12 + depth * 20 }}
        draggable={editingId !== chapter.id}
        onDragStart={(e) => onDragStart(e, chapter)}
        onDragOver={onDragOver}
        onDrop={(e) => onDrop(e, chapter)}
        onDragEnd={onDragEnd}
      >
        <div className="chapter-left">
          <button
            className={`expand-arrow ${isExpanded ? 'expanded' : ''} ${!hasChildren ? 'hidden' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              toggleChapterExpand(courseId, chapter.id);
            }}
            aria-label={isExpanded ? '折叠' : '展开'}
          >
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="9 6 15 12 9 18" />
            </svg>
          </button>
          <span className={`expand-placeholder ${hasChildren ? 'hidden' : ''}`} />
          
          {editingId === chapter.id ? (
            <input
              ref={inputRef}
              className="chapter-edit-input"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span
              className="chapter-name"
              onDoubleClick={handleDoubleClick}
              onClick={() => selectChapter(chapter.id)}
            >
              {chapter.name}
            </span>
          )}
        </div>

        <div className="chapter-actions">
          <div className="add-menu-container">
            <button
              className="action-btn add-btn"
              onClick={(e) => {
                e.stopPropagation();
                setShowAddMenu(showAddMenu === chapter.id ? null : chapter.id);
              }}
              aria-label="添加章节"
            >
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
            {showAddMenu === chapter.id && (
              <div className="add-menu" onClick={(e) => e.stopPropagation()}>
                <button onClick={() => handleAddChapter(false)}>添加同级</button>
                <button onClick={() => handleAddChapter(true)}>添加子级</button>
              </div>
            )}
          </div>
          <button
            className="action-btn delete-btn"
            onClick={(e) => {
              e.stopPropagation();
              handleDelete();
            }}
            aria-label="删除章节"
          >
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6" />
              <path d="M10 11v6M14 11v6" />
              <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </button>
        </div>
      </div>
      
      {hasChildren && isExpanded && (
        <div className="chapter-children">
          {chapter.children.map((child) => (
            <ChapterNode
              key={child.id}
              chapter={child}
              courseId={courseId}
              depth={depth + 1}
              onDragStart={onDragStart}
              onDragOver={onDragOver}
              onDrop={onDrop}
              onDragEnd={onDragEnd}
              draggedChapter={draggedChapter}
              dropTarget={dropTarget}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const CoursePanel: React.FC = () => {
  const { courses, selectedCourseId, selectedChapterId, reorderChapters, loadingCourses, addChapter } = useStore();
  const [draggedChapter, setDraggedChapter] = useState<Chapter | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);
  
  const course = courses.find(c => c.id === selectedCourseId);

  const handleDragStart = (e: React.DragEvent, chapter: Chapter) => {
    setDraggedChapter(chapter);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', chapter.id);
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '0.6';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetChapter: Chapter) => {
    e.preventDefault();
    if (!draggedChapter || draggedChapter.id === targetChapter.id || !selectedCourseId) {
      setDropTarget(null);
      setDraggedChapter(null);
      return;
    }

    const removeChapter = (chapters: Chapter[], id: string): [Chapter[], Chapter | null] => {
      for (let i = 0; i < chapters.length; i++) {
        if (chapters[i].id === id) {
          const removed = chapters[i];
          const newChapters = [...chapters];
          newChapters.splice(i, 1);
          return [newChapters, removed];
        }
        if (chapters[i].children.length > 0) {
          const [newChildren, removed] = removeChapter(chapters[i].children, id);
          if (removed) {
            const newChapters = [...chapters];
            newChapters[i] = { ...newChapters[i], children: newChildren };
            return [newChapters, removed];
          }
        }
      }
      return [chapters, null];
    };

    const insertAfter = (chapters: Chapter[], targetId: string, chapterToInsert: Chapter): Chapter[] => {
      for (let i = 0; i < chapters.length; i++) {
        if (chapters[i].id === targetId) {
          const newChapters = [...chapters];
          newChapters.splice(i + 1, 0, chapterToInsert);
          return newChapters;
        }
        if (chapters[i].children.length > 0) {
          const newChildren = insertAfter(chapters[i].children, targetId, chapterToInsert);
          if (newChildren !== chapters[i].children) {
            const newChapters = [...chapters];
            newChapters[i] = { ...newChapters[i], children: newChildren };
            return newChapters;
          }
        }
      }
      return chapters;
    };

    const [chaptersWithoutDragged, removed] = removeChapter(course!.chapters, draggedChapter.id);
    if (removed) {
      const reorderedChapters = insertAfter(chaptersWithoutDragged, targetChapter.id, removed);
      reorderChapters(selectedCourseId, reorderedChapters);
    }

    setDropTarget(null);
    setDraggedChapter(null);
  };

  const handleDragEnd = () => {
    setDraggedChapter(null);
    setDropTarget(null);
    document.querySelectorAll('.chapter-node').forEach(el => {
      el.style.opacity = '';
    });
  };

  const handleDragEnter = (e: React.DragEvent, chapterId: string) => {
    e.preventDefault();
    if (draggedChapter && draggedChapter.id !== chapterId) {
      setDropTarget(chapterId);
    }
  };

  const handleAddRootChapter = () => {
    if (!selectedCourseId) return;
    const newChapter: Chapter = {
      id: generateId(),
      name: '新章节',
      order: course ? course.chapters.length : 0,
      children: [],
      expanded: true,
    };
    addChapter(selectedCourseId, newChapter);
  };

  if (loadingCourses) {
    return (
      <div className="course-panel">
        <div className="panel-header">
          <h2>课程章节</h2>
        </div>
        <div className="panel-loading">
          <div className="loading-spinner" />
          <span>加载中...</span>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="course-panel">
        <div className="panel-header">
          <h2>课程章节</h2>
        </div>
        <div className="panel-empty">暂无课程</div>
      </div>
    );
  }

  return (
    <div className="course-panel">
      <div className="panel-header">
        <h2>{course.title}</h2>
      </div>
      
      <div className="chapters-list">
        {course.chapters.length === 0 ? (
          <div className="panel-empty">暂无章节，点击下方按钮添加</div>
        ) : (
          course.chapters.map((chapter) => (
            <div
              key={chapter.id}
              onDragEnter={(e) => handleDragEnter(e, chapter.id)}
            >
              <ChapterNode
                chapter={chapter}
                courseId={selectedCourseId!}
                depth={0}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onDragEnd={handleDragEnd}
                draggedChapter={draggedChapter}
                dropTarget={dropTarget}
              />
            </div>
          ))
        )}
      </div>
      
      <div className="panel-footer">
        <Button variant="secondary" size="sm" onClick={handleAddRootChapter}>
          + 添加章节
        </Button>
      </div>
    </div>
  );
};

export default CoursePanel;
