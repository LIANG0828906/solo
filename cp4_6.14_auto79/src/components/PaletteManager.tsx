import React, { useCallback, useState } from 'react';
import { Layers } from 'lucide-react';
import PaletteCard from './PaletteCard';
import { useGradientStore } from '../store';

export const PaletteManager: React.FC = () => {
  const palettes = useGradientStore((s) => s.palettes);
  const reorderPalettes = useGradientStore((s) => s.reorderPalettes);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleDragStart = useCallback((index: number) => {
    setDraggingIndex(index);
  }, []);

  const handleDragOver = useCallback((index: number) => {
    setDragOverIndex(index);
  }, []);

  const handleDragEnd = useCallback(() => {
    if (draggingIndex !== null && dragOverIndex !== null && draggingIndex !== dragOverIndex) {
      reorderPalettes(draggingIndex, dragOverIndex);
    }
    setDraggingIndex(null);
    setDragOverIndex(null);
  }, [draggingIndex, dragOverIndex, reorderPalettes]);

  const handleDropZone = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (draggingIndex !== null && dragOverIndex !== null && draggingIndex !== dragOverIndex) {
        reorderPalettes(draggingIndex, dragOverIndex);
      }
      setDraggingIndex(null);
      setDragOverIndex(null);
    },
    [draggingIndex, dragOverIndex, reorderPalettes]
  );

  return (
    <div
      style={{
        padding: 24,
        display: 'flex',
        flexDirection: 'column',
        gap: 16
      }}
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDropZone}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Layers size={20} color="#3b82f6" />
        <h2 style={{ fontSize: 18, fontWeight: 600 }}>
          调色板
          <span
            style={{
              marginLeft: 8,
              fontSize: 13,
              fontWeight: 400,
              color: 'var(--color-text-secondary)'
            }}
          >
            {palettes.length} 个方案
          </span>
        </h2>
      </div>

      {palettes.length === 0 ? (
        <div
          style={{
            border: '2px dashed var(--color-bg-input)',
            borderRadius: 12,
            padding: 48,
            textAlign: 'center',
            color: 'var(--color-text-secondary)',
            fontSize: 14
          }}
        >
          <div style={{ marginBottom: 8, fontSize: 32 }}>🎨</div>
          暂无保存的渐变方案，点击左侧"保存到调色板"按钮添加
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, 180px)',
            gap: 16,
            justifyContent: 'flex-start'
          }}
        >
          {palettes.map((item, index) => (
            <PaletteCard
              key={item.id}
              item={item}
              index={index}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragEnd={handleDragEnd}
              isDragging={draggingIndex === index}
              dragOverIndex={dragOverIndex}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default PaletteManager;
