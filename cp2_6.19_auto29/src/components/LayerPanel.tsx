import React, { useState } from 'react';
import { useEditorStore, Layer } from '../store/editorStore';
import './LayerPanel.css';

const LayerPanel: React.FC = () => {
  const {
    layers,
    selectedLayerId,
    highlightedLayerId,
    setSelectedLayerId,
    setHighlightedLayerId,
    deleteLayer,
    updateLayer,
    reorderLayers,
  } = useEditorStore();

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleLayerClick = (layerId: string) => {
    setSelectedLayerId(layerId);
    setHighlightedLayerId(layerId);
    setTimeout(() => setHighlightedLayerId(null), 1200);
  };

  const handleDeleteClick = (e: React.MouseEvent<HTMLButtonElement>, layerId: string) => {
    e.stopPropagation();
    const btn = e.currentTarget;
    btn.style.transform = 'scale(0.85)';
    setTimeout(() => {
      btn.style.transform = 'scale(1)';
    }, 100);
    setTimeout(() => {
      deleteLayer(layerId);
    }, 100);
  };

  const handleToggleVisible = (e: React.MouseEvent, layer: Layer) => {
    e.stopPropagation();
    updateLayer(layer.id, { visible: !layer.visible });
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDrop = (e: React.DragEvent, toIndex: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== toIndex) {
      reorderLayers(draggedIndex, toIndex);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const getLayerIcon = (layer: Layer) => {
    switch (layer.type) {
      case 'image':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
        );
      case 'text':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="4 7 4 4 20 4 20 7" />
            <line x1="9" y1="20" x2="15" y2="20" />
            <line x1="12" y1="4" x2="12" y2="20" />
          </svg>
        );
      case 'draw':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 13V6a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v7" />
            <path d="M10 17a2 2 0 0 1 4 0v3h-4Z" />
          </svg>
        );
      case 'sticker':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M8 14s1.5 2 4 2 4-2 4-2" />
            <line x1="9" y1="9" x2="9.01" y2="9" />
            <line x1="15" y1="9" x2="15.01" y2="9" />
          </svg>
        );
      default:
        return null;
    }
  };

  const getLayerThumbnail = (layer: Layer) => {
    if (layer.type === 'image') {
      return <img src={layer.src} alt="" className="layer-thumb-img" />;
    }
    if (layer.type === 'sticker') {
      return <span className="layer-thumb-emoji">{layer.emoji}</span>;
    }
    if (layer.type === 'text') {
      return (
        <span className="layer-thumb-text" style={{ color: layer.color }}>
          Aa
        </span>
      );
    }
    if (layer.type === 'draw') {
      return (
        <svg className="layer-thumb-draw" viewBox="0 0 24 24">
          <path
            d="M4 18 Q8 6 12 12 T20 8"
            stroke={layer.color}
            strokeWidth={layer.strokeWidth / 2}
            fill="none"
            strokeLinecap="round"
          />
        </svg>
      );
    }
    return null;
  };

  const reversedLayers = [...layers].reverse();

  return (
    <div className="layer-panel">
      <div className="panel-header">
        <h3 className="panel-title">图层</h3>
        <span className="layer-count">{layers.length}</span>
      </div>

      <div className="layer-list">
        {reversedLayers.length === 0 ? (
          <div className="empty-layers">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <line x1="12" y1="8" x2="12" y2="16" />
              <line x1="8" y1="12" x2="16" y2="12" />
            </svg>
            <span>暂无图层</span>
          </div>
        ) : (
          reversedLayers.map((layer, reverseIndex) => {
            const originalIndex = layers.length - 1 - reverseIndex;
            const isSelected = selectedLayerId === layer.id;
            const isHighlighted = highlightedLayerId === layer.id;
            const isDragging = draggedIndex === originalIndex;
            const isDragOver = dragOverIndex === originalIndex;

            return (
              <div
                key={layer.id}
                className={`layer-item-row ${isSelected ? 'selected' : ''} ${isHighlighted ? 'highlighted' : ''} ${isDragging ? 'dragging' : ''} ${isDragOver ? 'drag-over' : ''} ${!layer.visible ? 'hidden-layer' : ''}`}
                draggable
                onDragStart={(e) => handleDragStart(e, originalIndex)}
                onDragOver={(e) => handleDragOver(e, originalIndex)}
                onDrop={(e) => handleDrop(e, originalIndex)}
                onDragEnd={handleDragEnd}
                onClick={() => handleLayerClick(layer.id)}
              >
                <div className="layer-drag-handle">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="9" cy="6" r="1" />
                    <circle cx="15" cy="6" r="1" />
                    <circle cx="9" cy="12" r="1" />
                    <circle cx="15" cy="12" r="1" />
                    <circle cx="9" cy="18" r="1" />
                    <circle cx="15" cy="18" r="1" />
                  </svg>
                </div>

                <div className="layer-thumbnail">
                  {getLayerThumbnail(layer)}
                </div>

                <div className="layer-info">
                  <span className="layer-name">{layer.name}</span>
                  <span className="layer-type-icon">{getLayerIcon(layer)}</span>
                </div>

                <div className="layer-actions">
                  <button
                    className="layer-action-btn visibility-btn"
                    onClick={(e) => handleToggleVisible(e, layer)}
                    title={layer.visible ? '隐藏' : '显示'}
                  >
                    {layer.visible ? (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    ) : (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    )}
                  </button>
                  <button
                    className="layer-action-btn delete-btn"
                    onClick={(e) => handleDeleteClick(e, layer.id)}
                    title="删除"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6" />
                      <path d="M10 11v6" />
                      <path d="M14 11v6" />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default LayerPanel;
