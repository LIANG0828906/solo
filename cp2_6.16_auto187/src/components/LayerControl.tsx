import React, { useState, useCallback } from 'react';
import { useLayerStore } from '../store/layerStore';
import type { Layer } from '../utils/layerUtils';
import './LayerControl.css';

interface LayerCardProps {
  layer: Layer;
  index: number;
  dragIndex: number | null;
  onDragStart: (index: number) => void;
  onDragOver: (index: number) => void;
  onDragEnd: () => void;
  onDrop: () => void;
}

const LayerCard: React.FC<LayerCardProps> = ({
  layer,
  index,
  dragIndex,
  onDragStart,
  onDragOver,
  onDragEnd,
  onDrop,
}) => {
  const toggleVisibility = useLayerStore(state => state.toggleLayerVisibility);
  const [animating, setAnimating] = useState(false);

  const handleToggle = useCallback(() => {
    setAnimating(true);
    toggleVisibility(layer.id);
    setTimeout(() => setAnimating(false), 200);
  }, [toggleVisibility, layer.id]);

  const isDragging = dragIndex === index;

  return (
    <div
      className={`lp-layer-card ${isDragging ? 'lp-dragging' : ''} ${dragIndex !== null && !isDragging ? 'lp-drop-target' : ''}`}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', String(index));
        onDragStart(index);
      }}
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        onDragOver(index);
      }}
      onDragEnd={onDragEnd}
      onDrop={(e) => {
        e.preventDefault();
        onDrop();
      }}
    >
      <div className="lp-layer-card-main">
        <div className="lp-layer-color-dot" style={{ backgroundColor: layer.colorLabel }} />
        <span className={`lp-layer-name ${layer.visible ? '' : 'lp-layer-hidden'}`}>
          {layer.name}
        </span>
        <button
          type="button"
          onClick={handleToggle}
          className={`lp-toggle-btn ${layer.visible ? 'lp-toggle-on' : ''} ${animating ? 'lp-toggle-anim' : ''}`}
          aria-label={`切换图层${layer.name}的可见性`}
        >
          <span className="lp-toggle-knob" />
        </button>
      </div>
      <div className="lp-layer-card-footer">
        <div className="lp-layer-info">
          <span className="lp-layer-count">{layer.elementCount}个元素</span>
        </div>
        <div className="lp-layer-avg-color" style={{ backgroundColor: layer.averageColor }} title="主色调平均" />
      </div>
    </div>
  );
};

const LayerControl: React.FC = () => {
  const layers = useLayerStore(state => state.layers);
  const reorderLayers = useLayerStore(state => state.reorderLayers);
  const mobilePanelOpen = useLayerStore(state => state.mobilePanelOpen);
  const closeMobilePanel = useLayerStore(state => state.closeMobilePanel);

  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  const handleDrop = useCallback(() => {
    if (dragIndex !== null && overIndex !== null) {
      reorderLayers(dragIndex, overIndex);
    }
    setDragIndex(null);
    setOverIndex(null);
  }, [dragIndex, overIndex, reorderLayers]);

  return (
    <aside className={`lp-control-panel ${mobilePanelOpen ? 'lp-panel-open' : ''}`}>
      <div className="lp-panel-header">
        <h2 className="lp-panel-title">图层</h2>
        <span className="lp-layer-counter">{layers.length} 层</span>
        <button
          type="button"
          className="lp-panel-close-mobile"
          onClick={closeMobilePanel}
          aria-label="关闭面板"
        >
          ×
        </button>
      </div>
      <div className="lp-layer-list">
        {layers.map((layer, index) => (
          <LayerCard
            key={layer.id}
            layer={layer}
            index={index}
            dragIndex={dragIndex}
            onDragStart={setDragIndex}
            onDragOver={(i) => setOverIndex(i)}
            onDragEnd={() => {
              setDragIndex(null);
              setOverIndex(null);
            }}
            onDrop={handleDrop}
          />
        ))}
      </div>
    </aside>
  );
};

export default LayerControl;
