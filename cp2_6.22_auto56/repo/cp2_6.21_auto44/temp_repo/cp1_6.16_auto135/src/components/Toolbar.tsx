import React from 'react';
import { ELEMENT_PRESETS, ElementType, GeneticElement, ELEMENT_SIZE } from '@/models/GeneticElement';
import { useGeneStore } from '@/store/useGeneStore';
import { v4 as uuidv4 } from 'uuid';

const ToolbarElement: React.FC<{ type: ElementType }> = ({ type }) => {
  const preset = ELEMENT_PRESETS[type];
  const setDragging = useGeneStore((s) => s.setDraggingElement);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('text/plain', type);

    const tempElement: GeneticElement = {
      id: uuidv4(),
      ...preset,
      position: { x: 0, y: 0 }
    };
    setDragging(tempElement, true);
  };

  const handleDragEnd = () => {
    setDragging(null, false);
  };

  const renderShape = () => {
    const w = ELEMENT_SIZE.width;
    const h = ELEMENT_SIZE.height;
    const cx = w / 2;
    const cy = h / 2;

    switch (preset.shape) {
      case 'rectangle':
        return (
          <rect
            x="0" y="0" width={w} height={h} rx="8"
            fill={preset.color} stroke="#fff" strokeWidth="1"
          />
        );
      case 'diamond':
        return (
          <polygon
            points={`${cx},0 ${w},${cy} ${cx},${h} 0,${cy}`}
            fill={preset.color} stroke="#fff" strokeWidth="1"
          />
        );
      case 'triangle':
        return (
          <polygon
            points={`${cx},0 ${w},${h} 0,${h}`}
            fill={preset.color} stroke="#fff" strokeWidth="1"
          />
        );
      case 'circle':
        return (
          <circle
            cx={cx} cy={cy} r={Math.min(w, h) / 2}
            fill={preset.color} stroke="#fff" strokeWidth="1"
          />
        );
      case 'hexagon': {
        const r = Math.min(w, h) / 2;
        const points = Array.from({ length: 6 }, (_, i) => {
          const angle = (Math.PI / 3) * i - Math.PI / 2;
          return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
        }).join(' ');
        return (
          <polygon points={points} fill={preset.color} stroke="#fff" strokeWidth="1" />
        );
      }
      default:
        return null;
    }
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className="toolbar-element"
    >
      <svg width={ELEMENT_SIZE.width} height={ELEMENT_SIZE.height}>
        {renderShape()}
      </svg>
      <span className="toolbar-label">{preset.label}</span>
    </div>
  );
};

export const Toolbar: React.FC = () => {
  const types: ElementType[] = ['promoter', 'operator', 'structural-gene', 'repressor', 'inducer'];

  return (
    <div className="toolbar">
      <h3 className="toolbar-title">调控元件工具箱</h3>
      <p className="toolbar-hint">拖拽元件到右侧画布</p>
      <div className="toolbar-elements">
        {types.map((type) => (
          <ToolbarElement key={type} type={type} />
        ))}
      </div>
    </div>
  );
};
