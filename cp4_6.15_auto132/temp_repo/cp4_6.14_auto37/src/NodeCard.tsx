import { X } from 'lucide-react';
import { FlowNode, ActionType } from '@/store/flowStore';
import { useRef, useState, useEffect } from 'react';

const emojiMap: Record<ActionType, string> = {
  cut: '🔪',
  boil: '🍳',
  bake: '🔥',
  stew: '🥘',
  mix: '🥣',
  steam: '🫕',
  fry: '🍳',
  other: '📋',
};

interface NodeCardProps {
  node: FlowNode;
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
  onDragStop: (dx: number, dy: number) => void;
  onSelect: (id: string) => void;
}

export default function NodeCard({ node, onDelete, onEdit, onDragStop, onSelect }: NodeCardProps) {
  const [dragging, setDragging] = useState(false);
  const [visualOffset, setVisualOffset] = useState({ x: 0, y: 0 });
  const dragState = useRef({ active: false, startX: 0, startY: 0 });

  useEffect(() => {
    if (!dragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!dragState.current.active) return;
      const dx = e.clientX - dragState.current.startX;
      const dy = e.clientY - dragState.current.startY;
      setVisualOffset({ x: dx, y: dy });
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (!dragState.current.active) return;
      dragState.current.active = false;
      const dx = e.clientX - dragState.current.startX;
      const dy = e.clientY - dragState.current.startY;
      setDragging(false);
      setVisualOffset({ x: 0, y: 0 });
      onDragStop(dx, dy);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragging, onDragStop]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('[data-delete-btn]')) return;
    e.preventDefault();
    dragState.current = { active: true, startX: e.clientX, startY: e.clientY };
    setDragging(true);
  };

  const handleDoubleClick = () => {
    onEdit(node.id);
  };

  const handleClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('[data-delete-btn]')) return;
    onSelect(node.id);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        onDragStop(0, -10);
        break;
      case 'ArrowDown':
        e.preventDefault();
        onDragStop(0, 10);
        break;
      case 'ArrowLeft':
        e.preventDefault();
        onDragStop(-10, 0);
        break;
      case 'ArrowRight':
        e.preventDefault();
        onDragStop(10, 0);
        break;
    }
  };

  const emoji = emojiMap[node.actionType];

  return (
    <div
      className={`group relative w-[200px] rounded-[14px] bg-white shadow-card select-none cursor-grab active:cursor-grabbing transition-shadow duration-200 ${dragging ? 'dragging scale-105 shadow-card-drag' : ''} ${node.isNew ? 'drop-in' : ''}`}
      style={{
        position: 'absolute',
        left: node.x + visualOffset.x,
        top: node.y + visualOffset.y,
      }}
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
    >
      <div className="p-3">
        <div className="flex items-center gap-2 mb-2">
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-warm-500 text-white text-xs font-bold">
            {node.stepNumber}
          </span>
          <span className="text-lg">{emoji}</span>
        </div>
        <p className="text-sm text-gray-700 line-clamp-2 leading-snug mb-2">
          {node.description}
        </p>
        <span className="inline-block bg-warm-100 text-warm-700 rounded-full px-2 py-0.5 text-xs">
          {node.duration}
        </span>
      </div>
      <button
        data-delete-btn
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600"
        onClick={(e) => {
          e.stopPropagation();
          onDelete(node.id);
        }}
      >
        <X size={14} />
      </button>
    </div>
  );
}
