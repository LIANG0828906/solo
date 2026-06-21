import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface AnnotationMenuProps {
  x: number;
  y: number;
  visible: boolean;
  onAdd: () => void;
  onClose: () => void;
}

export default function AnnotationMenu({ x, y, visible, onAdd, onClose }: AnnotationMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!visible) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [visible, onClose]);

  if (!visible) return null;

  return (
    <div
      ref={menuRef}
      className={cn(
        'fixed z-50 min-w-[120px] py-2 rounded-lg shadow-lg'
      )}
      style={{
        left: x,
        top: y,
        backgroundColor: '#FFFFFF',
        boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
      }}
      role="menu"
    >
      <button
        type="button"
        onClick={() => {
          onAdd();
          onClose();
        }}
        className={cn(
          'w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 transition-colors'
        )}
        role="menuitem"
      >
        添加注释
      </button>
    </div>
  );
}
