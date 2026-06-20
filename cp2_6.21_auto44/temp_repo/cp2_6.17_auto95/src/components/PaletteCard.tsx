import { useRef, useState, useMemo } from 'react';
import type { Palette } from '../types';
import { Edit2, Trash2, GripVertical } from 'lucide-react';

interface PaletteCardProps {
  palette: Palette;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, targetId: string) => void;
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) {
    return '刚刚';
  }
  if (diffMinutes < 60) {
    return `${diffMinutes}分钟前`;
  }
  if (diffHours < 24) {
    return `${diffHours}小时前`;
  }
  if (diffDays === 1) {
    return '昨天';
  }
  if (diffDays < 7) {
    return `${diffDays}天前`;
  }
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

export function PaletteCard({
  palette,
  isSelected,
  onSelect,
  onRename,
  onDelete,
  onDragStart,
  onDragOver,
  onDrop,
}: PaletteCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(palette.name);
  const inputRef = useRef<HTMLInputElement>(null);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleDoubleClick = () => {
    setIsEditing(true);
    setEditName(palette.name);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleRenameSubmit = () => {
    if (editName.trim()) {
      onRename(palette.id, editName.trim());
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleRenameSubmit();
    } else if (e.key === 'Escape') {
      setEditName(palette.name);
      setIsEditing(false);
    }
  };

  return (
    <div
      className={`palette-card ${isSelected ? 'selected' : ''}`}
      onClick={() => !isEditing && onSelect(palette.id)}
      draggable
      onDragStart={(e) => onDragStart(e, palette.id)}
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, palette.id)}
    >
      <div className="palette-card-header">
        <div className="palette-card-title">
          <GripVertical className="drag-handle" size={16} />
          {isEditing ? (
            <input
              ref={inputRef}
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onBlur={handleRenameSubmit}
              onKeyDown={handleKeyDown}
              className="palette-name-input"
              onClick={(e) => e.stopPropagation()}
              autoFocus
            />
          ) : (
            <span className="palette-name" onDoubleClick={handleDoubleClick}>
              {palette.name}
            </span>
          )}
        </div>
        <div className="palette-card-actions">
          <button
            className="icon-btn"
            onClick={(e) => {
              e.stopPropagation();
              handleDoubleClick();
            }}
            title="重命名"
          >
            <Edit2 size={14} />
          </button>
          <button
            className="icon-btn delete"
            onClick={(e) => {
              e.stopPropagation();
              if (confirm(`确定要删除色板 "${palette.name}" 吗？`)) {
                onDelete(palette.id);
              }
            }}
            title="删除"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <div className="palette-colors-preview">
        {palette.colors.length > 0 ? (
          <div className="mini-color-swatches">
            {palette.colors.map((color) => (
              <div
                key={color.id}
                className="mini-color-swatch"
                style={{ backgroundColor: color.hex }}
                title={color.hex}
              />
            ))}
          </div>
        ) : (
          <div className="empty-colors">暂无颜色</div>
        )}
      </div>

      <div className="palette-card-footer">
        <span className="color-count">{palette.colors.length} 种颜色</span>
        <span className="create-time">{formatRelativeTime(palette.createdAt)}</span>
      </div>
    </div>
  );
}
