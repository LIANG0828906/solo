import { useState, useRef, useCallback } from 'react';
import type { ColorBlock } from '../types';
import { X, GripVertical } from 'lucide-react';
import chroma from 'chroma-js';

interface ColorBlockEditorProps {
  color: ColorBlock;
  index: number;
  onUpdateColor: (colorId: string, hex: string) => void;
  onUpdateLabel: (colorId: string, label: string) => void;
  onRemove: (colorId: string) => void;
  onDragStart: (e: React.DragEvent, index: number) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, index: number) => void;
}

export function ColorBlockEditor({
  color,
  index,
  onUpdateColor,
  onUpdateLabel,
  onRemove,
  onDragStart,
  onDragOver,
  onDrop,
}: ColorBlockEditorProps) {
  const [showHex, setShowHex] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const getContrastColor = useCallback((hex: string) => {
    try {
      return chroma(hex).luminance() > 0.5 ? '#000000' : '#FFFFFF';
    } catch {
      return '#FFFFFF';
    }
  }, []);

  const handleColorClick = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const handleColorChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onUpdateColor(color.id, e.target.value);
    },
    [color.id, onUpdateColor]
  );

  const handleLabelChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onUpdateLabel(color.id, e.target.value);
    },
    [color.id, onUpdateLabel]
  );

  return (
    <div
      className="color-block-editor"
      draggable
      onDragStart={(e) => onDragStart(e, index)}
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, index)}
    >
      <div
        className="color-block"
        style={{ backgroundColor: color.hex }}
        onMouseEnter={() => setShowHex(true)}
        onMouseLeave={() => setShowHex(false)}
        onClick={handleColorClick}
      >
        <div className="color-block-drag">
          <GripVertical size={16} style={{ color: getContrastColor(color.hex) }} />
        </div>
        {showHex && (
          <div className="color-block-hex" style={{ color: getContrastColor(color.hex) }}>
            {color.hex.toUpperCase()}
          </div>
        )}
        <button
          className="color-block-remove"
          onClick={(e) => {
            e.stopPropagation();
            onRemove(color.id);
          }}
          title="删除颜色"
        >
          <X size={14} />
        </button>
        <input
          ref={inputRef}
          type="color"
          value={color.hex}
          onChange={handleColorChange}
          className="color-block-input"
        />
      </div>
      <input
        type="text"
        className="color-label-input"
        placeholder="标签 (10字)"
        value={color.label}
        onChange={handleLabelChange}
        maxLength={10}
      />
    </div>
  );
}
