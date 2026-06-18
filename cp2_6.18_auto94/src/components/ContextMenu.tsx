import { useEffect, useRef } from 'react';
import { Edit2, Trash2, Share2, Copy } from 'lucide-react';

export interface MenuItem {
  key: string;
  label: string;
  icon?: 'edit' | 'delete' | 'share' | 'copy';
  danger?: boolean;
  onClick: () => void;
}

interface ContextMenuProps {
  x: number;
  y: number;
  items: MenuItem[];
  onClose: () => void;
}

const iconMap: Record<string, typeof Edit2> = {
  edit: Edit2,
  delete: Trash2,
  share: Share2,
  copy: Copy,
};

export default function ContextMenu({ x, y, items, onClose }: ContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  const adjustedX = Math.min(x, window.innerWidth - 180);
  const adjustedY = Math.min(y, window.innerHeight - items.length * 44);

  return (
    <div
      ref={ref}
      className="fixed z-[60] py-1 bg-white overflow-hidden"
      style={{
        left: adjustedX,
        top: adjustedY,
        minWidth: '160px',
        borderRadius: '8px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
        animation: 'menuIn 0.15s ease-out',
      }}
    >
      {items.map((item) => {
        const Icon = item.icon ? iconMap[item.icon] : null;
        return (
          <button
            key={item.key}
            onClick={() => {
              item.onClick();
              onClose();
            }}
            className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-all active:scale-[0.98] ${
              item.danger
                ? 'text-red-500 hover:bg-red-50'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            {Icon && <Icon size={14} />}
            <span>{item.label}</span>
          </button>
        );
      })}
      <style>{`
        @keyframes menuIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
