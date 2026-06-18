import React, { useEffect } from 'react';
import { Trash2, Copy, Settings } from 'lucide-react';
import type { ContextMenuState } from '../types';

interface ContextMenuProps {
  state: ContextMenuState;
  onClose: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onSetInteraction: () => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
  state,
  onClose,
  onDelete,
  onDuplicate,
  onSetInteraction,
}) => {
  useEffect(() => {
    const handleClickOutside = () => onClose();
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (state.visible) {
      document.addEventListener('click', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [state.visible, onClose]);

  if (!state.visible) return null;

  const menuItems = [
    { icon: Copy, label: '复制', action: onDuplicate },
    { icon: Settings, label: '设置交互', action: onSetInteraction },
    { icon: Trash2, label: '删除', action: onDelete, danger: true },
  ];

  return (
    <div
      className="fixed bg-white rounded-lg shadow-xl border border-slate-200 py-1 z-50"
      style={{
        left: state.x,
        top: state.y,
        minWidth: '140px',
        animation: 'contextMenuIn 0.2s ease-out',
        transformOrigin: 'top left',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {menuItems.map((item) => {
        const Icon = item.icon;
        return (
          <button
            key={item.label}
            onClick={() => {
              item.action();
              onClose();
            }}
            className={`w-full px-3 py-2 flex items-center gap-2 text-sm transition-colors ${
              item.danger
                ? 'text-red-600 hover:bg-red-50'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Icon size={16} />
            {item.label}
          </button>
        );
      })}
    </div>
  );
};
