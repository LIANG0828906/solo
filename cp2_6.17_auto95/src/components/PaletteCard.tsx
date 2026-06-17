import { useRef, useState } from 'react';
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
          palette.colors.slice(0, 6).map((color, idx) => (
            <div
              key={color.id}
              className="preview-color-dot"
              style={{
                backgroundColor: color.hex,
                flexGrow: 1,
                borderTopLeftRadius: idx === 0 ? '6px' : '0',
                borderBottomLeftRadius: idx === 0 ? '6px' : '0',
                borderTopRightRadius: idx === Math.min(palette.colors.length, 6) - 1 ? '6px' : '0',
                borderBottomRightRadius: idx === Math.min(palette.colors.length, 6) - 1 ? '6px' : '0',
              }}
            />
          ))
        ) : (
          <div className="empty-colors">暂无颜色</div>
        )}
      </div>

      <div className="palette-card-footer">
        <span className="color-count">{palette.colors.length} 种颜色</span>
        <span className="create-time">{formatDate(palette.createdAt)}</span>
      </div>
    </div>
  );
}
