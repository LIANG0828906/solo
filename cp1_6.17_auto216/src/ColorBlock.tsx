import React, { useRef, useState, useEffect } from 'react';
import ColorEditor from './ColorEditor';
import { useColorBoardStore, ColorItem } from './store';

interface ColorBlockProps {
  colorItem: ColorItem;
  index: number;
}

const ColorBlock: React.FC<ColorBlockProps> = ({ colorItem, index }) => {
  const {
    updateColor,
    removeColor,
    swapColors,
    ui,
    setEditingColorId,
    setDraggedColorId,
  } = useColorBoardStore();
  const [showEditor, setShowEditor] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isSwapTarget, setIsSwapTarget] = useState(false);
  const [animating, setAnimating] = useState(false);
  const blockRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragStartPos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    setShowEditor(ui.editingColorId === colorItem.id);
  }, [ui.editingColorId, colorItem.id]);

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingColorId(colorItem.id);
  };

  const handleDragStart = (e: React.DragEvent) => {
    setIsDragging(true);
    setDraggedColorId(colorItem.id);
    e.dataTransfer.setData('colorIndex', String(index));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    setDraggedColorId(null);
    setIsSwapTarget(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (ui.draggedColorId && ui.draggedColorId !== colorItem.id) {
      setIsSwapTarget(true);
    }
  };

  const handleDragLeave = () => {
    setIsSwapTarget(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsSwapTarget(false);
    const dragData = e.dataTransfer.getData('colorIndex');
    if (dragData) {
      const fromIndex = parseInt(dragData, 10);
      if (fromIndex !== index) {
        setAnimating(true);
        swapColors(fromIndex, index);
        setTimeout(() => setAnimating(false), 300);
      }
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    dragStartPos.current = { x: e.clientX, y: e.clientY };
  };

  const handleColorChange = (newColor: string) => {
    updateColor(colorItem.id, newColor);
  };

  const handleCloseEditor = () => {
    setEditingColorId(null);
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    removeColor(colorItem.id);
  };

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
        padding: 4,
        transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
        transform: animating ? 'scale(1.1)' : 'scale(1)',
      }}
    >
      <div
        ref={blockRef}
        draggable
        onDoubleClick={handleDoubleClick}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onMouseDown={handleMouseDown}
        style={{
          width: 32,
          height: 32,
          borderRadius: '50%',
          backgroundColor: colorItem.color,
          border: '1px solid #E0E0E0',
          cursor: isDragging ? 'grabbing' : 'grab',
          boxShadow: isSwapTarget
            ? '0 0 0 3px rgba(99, 102, 241, 0.4)'
            : 'none',
          opacity: isDragging ? 0.5 : 1,
          transition: 'box-shadow 0.2s ease, opacity 0.2s ease',
          position: 'relative',
          userSelect: 'none',
        }}
      >
        <button
          onClick={handleRemove}
          style={{
            position: 'absolute',
            top: -6,
            right: -6,
            width: 18,
            height: 18,
            borderRadius: '50%',
            backgroundColor: '#EF4444',
            color: '#FFFFFF',
            border: '2px solid #FFFFFF',
            fontSize: 10,
            lineHeight: 1,
            cursor: 'pointer',
            display: 'none',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 0,
            fontWeight: 700,
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.display = 'flex';
          }}
          className="color-remove-btn"
        >
          ×
        </button>
        <style>{`
          div:hover > .color-remove-btn {
            display: flex !important;
          }
        `}</style>
      </div>
      <div
        style={{
          fontSize: 12,
          color: '#333333',
          fontFamily: 'monospace',
          fontWeight: 500,
          userSelect: 'none',
        }}
      >
        {colorItem.color}
      </div>

      {showEditor && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            marginTop: 12,
            zIndex: 100,
          }}
        >
          <ColorEditor
            color={colorItem.color}
            onColorChange={handleColorChange}
            onClose={handleCloseEditor}
          />
        </div>
      )}
    </div>
  );
};

export default ColorBlock;
