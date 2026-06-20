import React from 'react';
import { FURNITURE_CATEGORIES, FURNITURE_DEFINITIONS, type FurnitureCategoryItem } from '@/models/furnitureData';
import { useAppStore } from '@/store/useAppStore';
import type { FurnitureCategory, FurnitureDefinition } from '@/models/types';

interface FurniturePanelProps {
  isOpen?: boolean;
  onClose?: () => void;
  style?: React.CSSProperties;
}

export default function FurniturePanel({ isOpen = true, onClose, style }: FurniturePanelProps) {
  const setDraggingNew = useAppStore((state) => state.setDraggingNew);

  const groupedFurniture = FURNITURE_CATEGORIES.reduce(
    (acc: Record<FurnitureCategory, FurnitureDefinition[]>, cat: FurnitureCategoryItem) => {
      acc[cat.id] = FURNITURE_DEFINITIONS.filter((def: FurnitureDefinition) => def.category === cat.id);
      return acc;
    },
    {} as Record<FurnitureCategory, FurnitureDefinition[]>
  );

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, furnitureId: string) => {
    e.dataTransfer.setData('furnitureId', furnitureId);
    e.dataTransfer.effectAllowed = 'copy';
    setDraggingNew(furnitureId);
  };

  const handleDragEnd = () => {
    setDraggingNew(null);
  };

  if (!isOpen) {
    return null;
  }

  return (
    <aside
      className="glass-panel"
      style={{
        position: 'fixed',
        left: 16,
        top: 16,
        bottom: 54,
        width: 220,
        padding: '16px 12px',
        overflowY: 'auto',
        zIndex: 10,
        ...style,
      }}
    >
      {onClose && (
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: 18,
            color: 'var(--text-main)',
            opacity: 0.6,
          }}
          aria-label="关闭面板"
        >
          ✕
        </button>
      )}

      <div
        style={{
          fontSize: 14,
          fontWeight: 600,
          color: 'var(--text-main)',
          marginBottom: 12,
          paddingRight: onClose ? 24 : 0,
        }}
      >
        家具库
      </div>

      {FURNITURE_CATEGORIES.map((category) => (
        <div key={category.id} style={{ marginBottom: 8 }}>
          <div className="category-title">{category.name}</div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 8,
            }}
          >
            {groupedFurniture[category.id].map((def) => (
              <div
                key={def.id}
                className="furniture-card"
                draggable="true"
                onDragStart={(e) => handleDragStart(e, def.id)}
                onDragEnd={handleDragEnd}
                title={def.name}
              >
                <div className="furniture-card-icon">{def.icon}</div>
                <div className="furniture-card-name">{def.name}</div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </aside>
  );
}
