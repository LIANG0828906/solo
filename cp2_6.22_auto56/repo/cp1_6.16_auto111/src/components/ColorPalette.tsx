import React, { useState, useRef } from 'react';
import { useStore } from '@/store/useStore';
import { MIN_COLORS, MAX_COLORS } from '@/types';
import { X, Plus } from 'lucide-react';

const ColorPalette: React.FC = () => {
  const {
    colors,
    updateColor,
    addColor,
    removeColor,
    reorderColors,
  } = useStore();

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== index) {
      reorderColors(draggedIndex, index);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleColorClick = (index: number) => {
    fileInputRefs.current[index]?.click();
  };

  const handleColorChange = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    updateColor(id, e.target.value);
  };

  const handleRemoveColor = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (colors.length > MIN_COLORS) {
      removeColor(id);
    }
  };

  const handleAddColor = () => {
    if (colors.length < MAX_COLORS) {
      addColor();
    }
  };

  return (
    <div style={styles.container}>
      <h3 style={styles.title}>调色板</h3>
      <p style={styles.subtitle}>
        {colors.length} / {MAX_COLORS} 色
      </p>
      <div style={styles.colorsList}>
        {colors.map((colorItem, index) => (
          <div
            key={colorItem.id}
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, index)}
            onDragEnd={handleDragEnd}
            onClick={() => handleColorClick(index)}
            style={{
              ...styles.colorSwatch,
              backgroundColor: colorItem.color,
              opacity: draggedIndex === index ? 0.7 : 1,
              boxShadow: draggedIndex === index
                ? '0 4px 8px rgba(0,0,0,0.3)'
                : 'none',
              transform: draggedIndex === index ? 'scale(1.05)' : 'scale(1)',
              border: dragOverIndex === index ? '2px dashed #4ECDC4' : 'none',
            }}
          >
            {colors.length > MIN_COLORS && (
              <button
                style={styles.removeButton}
                onClick={(e) => handleRemoveColor(e, colorItem.id)}
                onMouseDown={(e) => e.stopPropagation()}
              >
                <X size={12} />
              </button>
            )}
            <input
              type="color"
              ref={(el) => { fileInputRefs.current[index] = el; }}
              value={colorItem.color}
              onChange={(e) => handleColorChange(colorItem.id, e)}
              style={styles.hiddenInput}
            />
          </div>
        ))}
      </div>
      <button
        onClick={handleAddColor}
        disabled={colors.length >= MAX_COLORS}
        style={{
          ...styles.addButton,
          opacity: colors.length >= MAX_COLORS ? 0.5 : 1,
          cursor: colors.length >= MAX_COLORS ? 'not-allowed' : 'pointer',
        }}
      >
        <Plus size={16} />
        <span>添加颜色</span>
      </button>
      <p style={styles.hint}>
        点击色块修改颜色，拖拽排序
      </p>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: '300px',
    padding: '20px',
    backgroundColor: '#16213e',
    borderRadius: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    flexShrink: 0,
  },
  title: {
    color: '#ffffff',
    fontSize: '18px',
    fontWeight: 600,
    margin: 0,
  },
  subtitle: {
    color: '#e0e0e0',
    fontSize: '12px',
    margin: '-8px 0 0 0',
  },
  colorsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    maxHeight: '500px',
    overflowY: 'auto',
    padding: '4px',
  },
  colorSwatch: {
    width: '60px',
    height: '60px',
    borderRadius: '8px',
    cursor: 'grab',
    position: 'relative',
    transition: 'transform 0.15s ease, box-shadow 0.15s ease',
    userSelect: 'none',
  },
  removeButton: {
    position: 'absolute',
    top: '-6px',
    right: '-6px',
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    backgroundColor: '#ff6b6b',
    color: '#fff',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
    fontSize: '10px',
    opacity: 0,
    transition: 'opacity 0.15s ease',
  },
  hiddenInput: {
    display: 'none',
  },
  addButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '10px 16px',
    backgroundColor: '#4ECDC4',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'filter 0.15s ease, transform 0.1s ease',
  },
  hint: {
    color: '#8892b0',
    fontSize: '12px',
    margin: 0,
    textAlign: 'center',
  },
};

export default ColorPalette;
