import { useState, useRef, useEffect } from 'react';
import type { Clip } from '@/types';
import { useEditorStore } from './editStore';
import './ClipBlock.css';

interface ClipBlockProps {
  clip: Clip;
  isSelected: boolean;
  pixelsPerSecond: number;
  timelineStartX: number;
  onDragStart: (clipId: string, e: React.PointerEvent) => void;
  onHandleDragStart: (clipId: string, handle: 'left' | 'right', e: React.PointerEvent) => void;
  isDragging: boolean;
  isRemoving: boolean;
  slideOffset: number;
}

export function ClipBlock({
  clip,
  isSelected,
  pixelsPerSecond,
  timelineStartX,
  onDragStart,
  onHandleDragStart,
  isDragging,
  isRemoving,
  slideOffset,
}: ClipBlockProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(clip.text);
  const inputRef = useRef<HTMLInputElement>(null);
  const updateClipText = useEditorStore((state) => state.updateClipText);

  const left = timelineStartX + clip.startTime * pixelsPerSecond;
  const width = (clip.endTime - clip.startTime) * pixelsPerSecond;

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
    setEditText(clip.text);
  };

  const handleInputBlur = () => {
    setIsEditing(false);
    if (editText !== clip.text) {
      updateClipText(clip.id, editText);
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      updateClipText(clip.id, editText);
      setIsEditing(false);
    } else if (e.key === 'Escape') {
      setEditText(clip.text);
      setIsEditing(false);
    }
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (isEditing) return;
    e.stopPropagation();
    onDragStart(clip.id, e);
  };

  const handleLeftHandlePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onHandleDragStart(clip.id, 'left', e);
  };

  const handleRightHandlePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onHandleDragStart(clip.id, 'right', e);
  };

  const clipClasses = [
    'clip-block',
    isSelected ? 'selected' : '',
    isDragging ? 'dragging' : '',
    isRemoving ? 'clip-removing' : '',
    slideOffset !== 0 ? 'clip-sliding' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={clipClasses}
      style={{
        left,
        width,
        ['--slide-offset' as string]: `${slideOffset}px`,
      }}
      onPointerDown={handlePointerDown}
      onDoubleClick={handleDoubleClick}
    >
      <div
        className="clip-handle left-handle"
        onPointerDown={handleLeftHandlePointerDown}
        title="调整开始时间"
      />

      <div className="clip-content">
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            className="clip-text-input"
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onBlur={handleInputBlur}
            onKeyDown={handleInputKeyDown}
            onClick={(e) => e.stopPropagation()}
            onDoubleClick={(e) => e.stopPropagation()}
            placeholder="输入文字标签..."
          />
        ) : (
          <div className="clip-text">{clip.text || `片段 ${clip.orderIndex + 1}`}</div>
        )}
        <div className="clip-time">
          {clip.startTime.toFixed(1)}s - {clip.endTime.toFixed(1)}s
        </div>
      </div>

      <div
        className="clip-handle right-handle"
        onPointerDown={handleRightHandlePointerDown}
        title="调整结束时间"
      />
    </div>
  );
}
