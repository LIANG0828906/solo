import { useState, useRef } from 'react';
import { ChevronRight, Plus, FileText, GripVertical, Trash2, Pencil, CheckCircle, Circle, X, Check } from 'lucide-react';
import type { Chapter } from '@/types';
import { useInkFlowStore } from '@/store/useInkFlowStore';

interface ChapterTreeProps {
  projectId: string;
}

interface DragState {
  chapterId: string;
  fromIndex: number;
  startY: number;
  offsetY: number;
  ghostEl: HTMLElement | null;
}

export default function ChapterTree({ projectId }: ChapterTreeProps) {
  const chapters = useInkFlowStore((s) => s.getProjectChapters(projectId));
  const currentChapterId = useInkFlowStore((s) => s.currentChapterId);
  const setCurrentChapter = useInkFlowStore((s) => s.setCurrentChapter);
  const addChapter = useInkFlowStore((s) => s.addChapter);
  const updateChapter = useInkFlowStore((s) => s.updateChapter);
  const deleteChapter = useInkFlowStore((s) => s.deleteChapter);
  const reorderChapters = useInkFlowStore((s) => s.reorderChapters);
  const toggleChapterCompleted = useInkFlowStore((s) => s.toggleChapterCompleted);

  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(
    new Set(chapters.map((c) => c.id))
  );
  const [editingChapterId, setEditingChapterId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [showAddInput, setShowAddInput] = useState(false);
  const [newChapterTitle, setNewChapterTitle] = useState('');
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);
  const newInputRef = useRef<HTMLInputElement>(null);

  const toggleExpand = (chapterId: string) => {
    setExpandedChapters((prev) => {
      const next = new Set(prev);
      if (next.has(chapterId)) next.delete(chapterId);
      else next.add(chapterId);
      return next;
    });
  };

  const handleStartEdit = (chapter: Chapter) => {
    setEditingChapterId(chapter.id);
    setEditingTitle(chapter.title);
    setTimeout(() => {
      editInputRef.current?.focus();
      editInputRef.current?.select();
    }, 0);
  };

  const commitEdit = () => {
    if (editingChapterId && editingTitle.trim()) {
      updateChapter(editingChapterId, { title: editingTitle.trim() });
    }
    setEditingChapterId(null);
  };

  const handleAddChapter = () => {
    const title = newChapterTitle.trim() || `第${chapters.length + 1}章 新章节`;
    addChapter(projectId, title);
    setNewChapterTitle('');
    setShowAddInput(false);
  };

  const handleDelete = (chapterId: string) => {
    if (confirm('确定删除这个章节吗？此操作不可恢复。')) {
      deleteChapter(chapterId);
    }
  };

  const handleDragStart = (e: React.MouseEvent, chapter: Chapter, index: number) => {
    if (editingChapterId) return;
    e.preventDefault();

    const ghost = document.createElement('div');
    ghost.className = 'drag-ghost';
    ghost.innerHTML = `
      <div style="
        position: fixed;
        pointer-events: none;
        z-index: 9999;
        padding: 8px 12px;
        background: white;
        border-radius: 8px;
        box-shadow: 0 8px 24px rgba(0,0,0,0.15);
        font-size: 13px;
        color: #374151;
        opacity: 0.9;
        border: 1px solid #E2E8F0;
        max-width: 180px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      ">${chapter.title}</div>
    `;
    document.body.appendChild(ghost.firstElementChild as HTMLElement);
    const ghostEl = document.body.lastElementChild as HTMLElement;

    setDragState({
      chapterId: chapter.id,
      fromIndex: index,
      startY: e.clientY,
      offsetY: 0,
      ghostEl,
    });

    const onMouseMove = (ev: MouseEvent) => {
      if (ghostEl) {
        ghostEl.style.transform = `translate(${ev.clientX + 16}px, ${ev.clientY - 8}px)`;
      }
      if (containerRef.current) {
        const items = containerRef.current.querySelectorAll<HTMLElement>('[data-chapter-item]');
        let overIdx: number | null = null;
        items.forEach((item, idx) => {
          const rect = item.getBoundingClientRect();
          if (ev.clientY >= rect.top && ev.clientY <= rect.bottom) {
            overIdx = idx;
          }
        });
        setDragOverIndex(overIdx);
      }
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);

      setDragState((prev) => {
        if (prev && dragOverIndex !== null && dragOverIndex !== prev.fromIndex) {
          reorderChapters(projectId, prev.fromIndex, dragOverIndex);
        }
        if (prev?.ghostEl) {
          prev.ghostEl.remove();
        }
        return null;
      });
      setDragOverIndex(null);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  return (
    <div
      ref={containerRef}
      className="p-3 h-full flex flex-col"
      style={{
        background: '#FFFFFF',
        borderRadius: '12px',
        border: '1px solid #E2E8F0',
      }}
    >
      <div className="flex items-center justify-between px-2 py-2 mb-2">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          章节列表
          <span className="ml-1.5 text-gray-400 font-normal">({chapters.length})</span>
        </h3>
        <button
          onClick={() => {
            setShowAddInput(true);
            setTimeout(() => newInputRef.current?.focus(), 0);
          }}
          className="p-1 rounded hover:bg-gray-100 transition-all active:scale-[0.96]"
          style={{ color: '#6366F1' }}
          title="添加章节"
        >
          <Plus size={16} />
        </button>
      </div>

      {showAddInput && (
        <div className="mb-2 px-2">
          <div className="flex gap-1.5">
            <input
              ref={newInputRef}
              type="text"
              value={newChapterTitle}
              onChange={(e) => setNewChapterTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddChapter();
                if (e.key === 'Escape') {
                  setShowAddInput(false);
                  setNewChapterTitle('');
                }
              }}
              placeholder="章节标题..."
              className="flex-1 px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg outline-none focus:border-[#6366F1] focus:ring-1 focus:ring-[#6366F1]/20"
            />
            <button
              onClick={handleAddChapter}
              className="px-2.5 py-1.5 text-xs text-white rounded-lg transition-all active:scale-[0.96]"
              style={{ background: '#6366F1' }}
            >
              <Check size={14} />
            </button>
            <button
              onClick={() => {
                setShowAddInput(false);
                setNewChapterTitle('');
              }}
              className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg transition-all active:scale-[0.96]"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto space-y-0.5 pr-1 -mr-1" style={{ scrollbarWidth: 'thin' }}>
        {chapters.length === 0 && (
          <div className="text-center py-12 px-4">
            <FileText size={32} className="mx-auto text-gray-300 mb-3" />
            <p className="text-xs text-gray-400 mb-3">还没有章节</p>
            <button
              onClick={() => setShowAddInput(true)}
              className="text-xs px-3 py-1.5 rounded-lg text-white transition-all active:scale-[0.96]"
              style={{ background: '#6366F1' }}
            >
              新建第一章
            </button>
          </div>
        )}

        {chapters.map((chapter, idx) => {
          const isActive = chapter.id === currentChapterId;
          const isEditing = editingChapterId === chapter.id;
          const isDragging = dragState?.chapterId === chapter.id;
          const isDragOver = dragOverIndex === idx && dragState && !isDragging;
          const isDragInsertBefore = isDragOver && dragState && dragState.fromIndex > idx;
          const isDragInsertAfter = isDragOver && dragState && dragState.fromIndex < idx;

          return (
            <div key={chapter.id} data-chapter-item className="relative">
              {(isDragInsertBefore || (isDragOver && dragState?.fromIndex === idx)) && (
                <div
                  className="absolute left-0 right-0 -top-0.5 h-0.5 rounded-full z-10"
                  style={{
                    background: '#6366F1',
                    animation: 'expandLine 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  }}
                />
              )}
              <div
                className={`group relative flex items-center gap-1 px-2 py-2 rounded-lg cursor-pointer transition-all duration-300 ${
                  isDragging ? 'opacity-40' : ''
                }`}
                style={{
                  background: isActive ? 'rgba(99,102,241,0.08)' : 'transparent',
                  marginLeft: isDragInsertAfter ? '0' : '0',
                  transition: 'background 0.15s, margin 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                }}
                onClick={() => !isEditing && setCurrentChapter(chapter.id)}
                onMouseEnter={(e) => {
                  if (!isActive) (e.currentTarget as HTMLDivElement).style.background = '#F8FAFC';
                }}
                onMouseLeave={(e) => {
                  if (!isActive) (e.currentTarget as HTMLDivElement).style.background = 'transparent';
                }}
              >
                {isDragInsertAfter && (
                  <div
                    className="absolute left-0 right-0 -bottom-0.5 h-0.5 rounded-full z-10"
                    style={{
                      background: '#6366F1',
                      animation: 'expandLine 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    }}
                  />
                )}

                <button
                  className="p-0.5 rounded hover:bg-gray-200 text-gray-400 cursor-grab active:cursor-grabbing shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  onMouseDown={(e) => handleDragStart(e, chapter, idx)}
                  title="拖拽排序"
                >
                  <GripVertical size={12} />
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleExpand(chapter.id);
                  }}
                  className="p-0.5 rounded hover:bg-gray-200 text-gray-400 shrink-0"
                >
                  <ChevronRight
                    size={12}
                    style={{
                      transform: expandedChapters.has(chapter.id) ? 'rotate(90deg)' : 'rotate(0)',
                      transition: 'transform 0.2s',
                    }}
                  />
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleChapterCompleted(chapter.id);
                  }}
                  className="shrink-0 hover:scale-110 transition-transform"
                  title={chapter.isCompleted ? '标记为未完成' : '标记为已完成'}
                >
                  {chapter.isCompleted ? (
                    <CheckCircle size={14} style={{ color: '#10B981', fill: '#D1FAE5' }} />
                  ) : (
                    <Circle size={14} className="text-gray-300" />
                  )}
                </button>

                {isEditing ? (
                  <input
                    ref={editInputRef}
                    type="text"
                    value={editingTitle}
                    onChange={(e) => setEditingTitle(e.target.value)}
                    onBlur={commitEdit}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') commitEdit();
                      if (e.key === 'Escape') setEditingChapterId(null);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="flex-1 min-w-0 px-2 py-0.5 text-xs border border-[#6366F1] rounded outline-none bg-white"
                  />
                ) : (
                  <span
                    className={`flex-1 min-w-0 truncate text-xs ${
                      isActive ? 'font-semibold' : ''
                    } ${chapter.isCompleted ? 'text-gray-400 line-through' : 'text-gray-700'}`}
                    style={{ color: isActive ? '#6366F1' : undefined }}
                    title={chapter.title}
                  >
                    {chapter.title}
                  </span>
                )}

                <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStartEdit(chapter);
                    }}
                    className="p-1 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-all active:scale-[0.96]"
                    title="重命名"
                  >
                    <Pencil size={12} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(chapter.id);
                    }}
                    className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition-all active:scale-[0.96]"
                    title="删除"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <style>{`
        @keyframes expandLine {
          from { transform: scaleX(0); opacity: 0; }
          to { transform: scaleX(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
