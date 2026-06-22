import { useState, useRef } from 'react';
import { FlavorLogItem } from '../modules/api';
import { calculateHappiness, getHappinessEmoji, getHappinessLabel } from '../modules/data';

interface FlavorLogProps {
  flavors: FlavorLogItem[];
  onRemove: (id: string) => void;
  onClear: () => void;
  onReorder: (flavors: FlavorLogItem[]) => void;
  mobileCollapsed: boolean;
}

export default function FlavorLog({
  flavors,
  onRemove,
  onClear,
  onReorder,
  mobileCollapsed,
}: FlavorLogProps) {
  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set());
  const [flyingBack, setFlyingBack] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const dragOverId = useRef<string | null>(null);

  const happiness = calculateHappiness(flavors);

  const handleRemove = (id: string) => {
    setRemovingIds((prev) => new Set(prev).add(id));
    setTimeout(() => {
      onRemove(id);
      setRemovingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, 300);
  };

  const handleClear = () => {
    setFlyingBack(true);
    setTimeout(() => {
      onClear();
      setFlyingBack(false);
    }, 600);
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    dragOverId.current = id;
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedId || draggedId === targetId) {
      setDraggedId(null);
      return;
    }

    const newFlavors = [...flavors];
    const draggedIndex = newFlavors.findIndex((f) => f.id === draggedId);
    const targetIndex = newFlavors.findIndex((f) => f.id === targetId);

    if (draggedIndex !== -1 && targetIndex !== -1) {
      const [removed] = newFlavors.splice(draggedIndex, 1);
      newFlavors.splice(targetIndex, 0, removed);
      onReorder(newFlavors);
    }

    setDraggedId(null);
    dragOverId.current = null;
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    dragOverId.current = null;
  };

  return (
    <aside className={`log-section ${mobileCollapsed ? 'collapsed' : ''}`}>
      <div className="log-header">
        <h2 className="log-title">风味记录</h2>
        <div className="happiness-display">
          <span className="happiness-emoji">
            {flavors.length > 0 ? getHappinessEmoji(happiness) : '☕'}
          </span>
          <span className="happiness-value">
            {flavors.length > 0 ? `${happiness}% · ${getHappinessLabel(happiness)}` : '待选择'}
          </span>
        </div>
      </div>

      {flavors.length === 0 ? (
        <div className="empty-log">
          <span style={{ fontSize: 32 }}>☕</span>
          <span>点击轮盘上的风味标签添加记录</span>
        </div>
      ) : (
        <ul className="log-list">
          {flavors.map((flavor) => (
            <li
              key={flavor.id}
              className={`log-item ${
                removingIds.has(flavor.id) ? 'removing' : ''
              } ${draggedId === flavor.id ? 'dragging' : ''} ${
                flyingBack ? 'fly-back' : ''
              }`}
              draggable
              onDragStart={(e) => handleDragStart(e, flavor.id)}
              onDragOver={(e) => handleDragOver(e, flavor.id)}
              onDrop={(e) => handleDrop(e, flavor.id)}
              onDragEnd={handleDragEnd}
            >
              <span className="drag-handle">⋮⋮</span>
              <span className="flavor-name">{flavor.name}</span>
              <span className="flavor-intensity">强度 {flavor.intensity}</span>
              <button
                className="delete-btn"
                onClick={() => handleRemove(flavor.id)}
                aria-label="删除"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="log-actions">
        <button
          className="action-btn secondary"
          onClick={handleClear}
          disabled={flavors.length === 0 || flyingBack}
        >
          清空
        </button>
      </div>
    </aside>
  );
}
