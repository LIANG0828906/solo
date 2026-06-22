import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Layer } from '../types';
import { getShapeIcon } from '../canvas/VectorTools';

interface LayerItemProps {
  layer: Layer;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
}

export const LayerItem: React.FC<LayerItemProps> = React.memo(({ 
  layer, 
  isSelected, 
  onSelect, 
  onDelete 
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: layer.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 'auto'
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete();
  };

  const opacityPercent = Math.round(layer.transform.opacity * 100);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`layer-item ${isSelected ? 'selected' : ''}`}
      onClick={onSelect}
    >
      <div className="layer-highlight" />
      <div className="layer-drag-handle" {...attributes} {...listeners}>
        <span className="material-icons">drag_indicator</span>
      </div>
      <div className="layer-thumbnail">
        <svg width="20" height="20" viewBox="0 0 20 20">
          <path
            d={layer.pathData}
            fill={layer.color}
            transform={`scale(${20 / Math.max(layer.transform.width, layer.transform.height)})`}
            opacity={layer.transform.opacity}
          />
        </svg>
      </div>
      <div className="layer-info">
        <div className="layer-name">
          <span className="material-icons layer-shape-icon">{getShapeIcon(layer.shapeType)}</span>
          <span>{layer.name}</span>
        </div>
        <div className="layer-props">
          <span>透明度 {opacityPercent}%</span>
          <span className="layer-prop-sep">•</span>
          <span>旋转 {layer.transform.rotation}°</span>
          <span className="layer-prop-sep">•</span>
          <span>模糊 {layer.transform.blur}px</span>
        </div>
      </div>
      <button className="layer-delete-btn" onClick={handleDelete}>
        <span className="material-icons">delete</span>
      </button>
    </div>
  );
});

LayerItem.displayName = 'LayerItem';
