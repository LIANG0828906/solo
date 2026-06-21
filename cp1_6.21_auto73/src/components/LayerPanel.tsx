import React, { useState } from 'react';
import { SvgLayer } from '../types';

interface LayerPanelProps {
  layers: SvgLayer[];
  selectedLayerIds: string[];
  onToggleVisibility: (layerId: string) => void;
  onDelete: (layerId: string) => void;
  onSelect: (layerId: string, multi: boolean) => void;
  onMerge: () => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
  onToggleExport: () => void;
}

const LayerThumbnail: React.FC<{ layer: SvgLayer }> = ({ layer }) => (
  <div className="layer-thumbnail">
    <svg viewBox="0 0 800 600" preserveAspectRatio="xMidYMid meet">
      <path
        d={layer.d}
        stroke={layer.stroke}
        strokeWidth={layer.strokeWidth}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  </div>
);

const ConfirmDialog: React.FC<{
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}> = ({ open, title, message, onConfirm, onCancel }) => {
  if (!open) return null;
  return (
    <div className="confirm-dialog" onClick={onCancel}>
      <div className="confirm-dialog-content" onClick={e => e.stopPropagation()}>
        <div className="confirm-title">{title}</div>
        <div className="confirm-message">{message}</div>
        <div className="confirm-actions">
          <button className="btn-secondary" onClick={onCancel}>取消</button>
          <button className="btn-danger" onClick={onConfirm}>确认删除</button>
        </div>
      </div>
    </div>
  );
};

export const LayerPanel: React.FC<LayerPanelProps> = ({
  layers,
  selectedLayerIds,
  onToggleVisibility,
  onDelete,
  onSelect,
  onMerge,
  onReorder,
  onToggleExport,
}) => {
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'outline': return '轮廓线';
      case 'shadow': return '阴影';
      case 'highlight': return '高光';
      default: return type;
    }
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggingIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggingIndex !== null && draggingIndex !== targetIndex) {
      onReorder(draggingIndex, targetIndex);
    }
    setDraggingIndex(null);
  };

  const handleDragEnd = () => {
    setDraggingIndex(null);
  };

  const groupedLayers = layers.reduce((acc, layer) => {
    if (!acc[layer.type]) acc[layer.type] = [];
    acc[layer.type].push(layer);
    return acc;
  }, {} as Record<string, SvgLayer[]>);

  return (
    <div>
      <h2>图层管理</h2>
      
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <button
          className="btn-merge"
          disabled={selectedLayerIds.length < 2}
          onClick={onMerge}
        >
          合并图层 ({selectedLayerIds.length})
        </button>
        <button
          className="btn-secondary"
          onClick={onToggleExport}
          disabled={layers.length === 0}
          style={{ height: '40px', borderRadius: '20px', flex: 1 }}
        >
          导出
        </button>
      </div>

      {layers.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <div className="empty-text">转绘完成后图层将显示在这里</div>
        </div>
      ) : (
        <>
          {Object.entries(groupedLayers).map(([type, typeLayers]) => (
            <div key={type} style={{ marginBottom: '16px' }}>
              <h3>{getTypeLabel(type)}</h3>
              <div className="layer-list">
                {typeLayers.map(layer => {
                  const globalIndex = layers.findIndex(l => l.id === layer.id);
                  const isSelected = selectedLayerIds.includes(layer.id);
                  const isDragging = draggingIndex === globalIndex;
                  return (
                    <div
                      key={layer.id}
                      className={`layer-item ${isSelected ? 'selected' : ''} ${isDragging ? 'dragging' : ''}`}
                      draggable
                      onDragStart={(e) => handleDragStart(e, globalIndex)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, globalIndex)}
                      onDragEnd={handleDragEnd}
                      onClick={(e) => onSelect(layer.id, e.ctrlKey || e.metaKey)}
                    >
                      <LayerThumbnail layer={layer} />
                      <div className="layer-info">
                        <div className="layer-name">{layer.name}</div>
                        <div className="layer-type">{getTypeLabel(layer.type)}</div>
                      </div>
                      <div className="layer-actions">
                        <button
                          className={`icon-btn ${!layer.visible ? 'hidden-state' : ''}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleVisibility(layer.id);
                          }}
                          title={layer.visible ? '隐藏' : '显示'}
                        >
                          {layer.visible ? '👁' : '👁‍🗨'}
                        </button>
                        <button
                          className="icon-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteTarget(layer.id);
                          }}
                          title="删除"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </>
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        title="删除图层"
        message={`确定要删除该图层吗？此操作无法撤销。`}
        onConfirm={() => {
          if (deleteTarget) onDelete(deleteTarget);
          setDeleteTarget(null);
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};

export default LayerPanel;
