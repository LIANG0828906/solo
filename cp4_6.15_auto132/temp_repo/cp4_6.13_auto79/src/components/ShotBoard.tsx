import { useState, useRef, useCallback, useEffect } from 'react';
import type { Shot } from '../api';
import '../styles/shotboard.css';

interface ShotBoardProps {
  shots: Shot[];
  selectedIds: Set<string>;
  onEdit: (shot: Shot) => void;
  onDelete: (shotId: string) => void;
  onReorder: (shotId: string, newIndex: number) => void;
  onToggleSelect: (shotId: string) => void;
}

function ShotBoard({ shots, selectedIds, onEdit, onDelete, onReorder, onToggleSelect }: ShotBoardProps) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const getDurationGradient = (duration: number) => {
    const minDuration = 0.5;
    const maxDuration = 5;
    const t = Math.min(1, Math.max(0, (duration - minDuration) / (maxDuration - minDuration)));
    const hue = 200 - t * 40;
    const saturation = 60 + t * 20;
    const lightness = 35 + t * 10;
    return `linear-gradient(135deg, hsl(${hue}, ${saturation}%, ${lightness}%) 0%, hsl(${hue - 15}, ${saturation + 10}%, ${lightness - 8}%) 100%)`;
  };

  const handleDragStart = (e: React.MouseEvent, shot: Shot, index: number) => {
    if ((e.target as HTMLElement).closest('.shot-action-btn')) return;
    if ((e.target as HTMLElement).closest('input[type="checkbox"]')) return;

    e.preventDefault();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
    setDragPosition({ x: e.clientX, y: e.clientY });
    setDraggingId(shot.id);
    setDragOverIndex(index);
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!draggingId) return;

    setDragPosition({ x: e.clientX, y: e.clientY });

    if (!containerRef.current) return;

    const cards = cardRefs.current;
    let closestIndex = 0;
    let closestDist = Infinity;

    cards.forEach((cardEl, id) => {
      if (id === draggingId) return;
      const rect = cardEl.getBoundingClientRect();
      const cardCenterX = rect.left + rect.width / 2;
      const cardCenterY = rect.top + rect.height / 2;
      const dist = Math.hypot(e.clientX - cardCenterX, e.clientY - cardCenterY);
      if (dist < closestDist) {
        closestDist = dist;
        const shot = shots.find((s) => s.id === id);
        if (shot) closestIndex = shot.shotIndex;
      }
    });

    if (closestDist < 150) {
      setDragOverIndex(closestIndex);
    }
  }, [draggingId, shots]);

  const handleMouseUp = useCallback(() => {
    if (!draggingId || dragOverIndex === null) {
      setDraggingId(null);
      setDragOverIndex(null);
      return;
    }

    const draggedShot = shots.find((s) => s.id === draggingId);
    if (draggedShot && draggedShot.shotIndex !== dragOverIndex) {
      onReorder(draggingId, dragOverIndex);
    }

    setDraggingId(null);
    setDragOverIndex(null);
  }, [draggingId, dragOverIndex, shots, onReorder]);

  useEffect(() => {
    if (draggingId) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [draggingId, handleMouseMove, handleMouseUp]);

  if (shots.length === 0) {
    return (
      <div className="shots-empty">
        <div className="empty-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M9 9l6 3-6 3V9z" fill="currentColor" />
          </svg>
        </div>
        <h3>还没有镜头</h3>
        <p>点击"添加镜头"开始创建你的分镜序列</p>
      </div>
    );
  }

  return (
    <div className="shot-grid" ref={containerRef}>
      {shots.map((shot, index) => {
        const isDragging = draggingId === shot.id;
        const isSelected = selectedIds.has(shot.id);
        const showPlaceholder = draggingId && dragOverIndex === index && !isDragging;

        return (
          <div
            key={shot.id}
            ref={(el) => {
              if (el) cardRefs.current.set(shot.id, el);
            }}
            className={`shot-card ${isDragging ? 'dragging' : ''} ${isSelected ? 'selected' : ''} ${showPlaceholder ? 'drop-placeholder' : ''}`}
            style={{
              transition: isDragging ? 'none' : 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}
            onMouseDown={(e) => handleDragStart(e, shot, index)}
            onDoubleClick={() => onEdit(shot)}
          >
            <div className="shot-checkbox">
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => onToggleSelect(shot.id)}
                onClick={(e) => e.stopPropagation()}
              />
            </div>

            <div
              className="shot-thumbnail"
              style={{ background: getDurationGradient(shot.duration) }}
            >
              {shot.imageUrl ? (
                <img src={shot.imageUrl} alt="" />
              ) : (
                <div className="shot-index-badge">
                  <span>#{shot.shotIndex + 1}</span>
                </div>
              )}
            </div>

            <div className="shot-info">
              <div className="shot-duration">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                {shot.duration.toFixed(1)}s
              </div>
              <p className="shot-description">
                {shot.description || '无描述'}
              </p>
            </div>

            <div className="shot-actions">
              <button
                className="shot-action-btn edit-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(shot);
                }}
                title="编辑"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </button>
              <button
                className="shot-action-btn delete-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(shot.id);
                }}
                title="删除"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
              </button>
            </div>

            <div className="shot-drag-handle">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="9" cy="6" r="1" fill="currentColor" />
                <circle cx="9" cy="12" r="1" fill="currentColor" />
                <circle cx="9" cy="18" r="1" fill="currentColor" />
                <circle cx="15" cy="6" r="1" fill="currentColor" />
                <circle cx="15" cy="12" r="1" fill="currentColor" />
                <circle cx="15" cy="18" r="1" fill="currentColor" />
              </svg>
            </div>
          </div>
        );
      })}

      {draggingId && (
        <div
          className="dragging-ghost"
          style={{
            left: dragPosition.x - dragOffset.x,
            top: dragPosition.y - dragOffset.y,
          }}
        >
          <div
            className="shot-thumbnail"
            style={{
              background: getDurationGradient(shots.find((s) => s.id === draggingId)?.duration || 1),
            }}
          >
            <div className="shot-index-badge">
              <span>#{(shots.find((s) => s.id === draggingId)?.shotIndex || 0) + 1}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ShotBoard;
