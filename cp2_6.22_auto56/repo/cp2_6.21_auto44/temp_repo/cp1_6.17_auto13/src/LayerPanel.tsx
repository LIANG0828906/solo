import React, { useState, useRef } from 'react';
import { useStore } from './store';
import { Layer } from './types';

const LayerPanel: React.FC = () => {
  const layers = useStore((state) => state.layers);
  const selectedLayerId = useStore((state) => state.selectedLayerId);
  const selectLayer = useStore((state) => state.selectLayer);
  const removeLayer = useStore((state) => state.removeLayer);
  const duplicateLayer = useStore((state) => state.duplicateLayer);
  const moveLayer = useStore((state) => state.moveLayer);
  const reorderLayers = useStore((state) => state.reorderLayers);

  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const dragItemRef = useRef<number | null>(null);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    dragItemRef.current = index;
    setDragIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDragEnd = () => {
    if (dragItemRef.current !== null && dragOverIndex !== null) {
      reorderLayers(dragItemRef.current, dragOverIndex);
    }
    setDragIndex(null);
    setDragOverIndex(null);
    dragItemRef.current = null;
  };

  const getLayerIcon = (layer: Layer) => {
    if (layer.type === 'image') {
      return '🖼️';
    }
    return '📝';
  };

  return (
    <div
      style={{
        width: 300,
        backgroundColor: '#F9F9F9',
        borderLeft: '1px solid #E0E0E0',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          padding: '14px 16px',
          borderBottom: '1px solid #E0E0E0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <h3 style={{ fontSize: 14, fontWeight: 600, color: '#333' }}>
          图层
        </h3>
        <span style={{ fontSize: 12, color: '#999' }}>
          {layers.length} 个图层
        </span>
      </div>

      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '10px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        {layers.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '40px 20px',
              color: '#999',
              fontSize: 13,
            }}
          >
            暂无图层
            <div style={{ fontSize: 12, marginTop: 8, color: '#bbb' }}>
              上传图片或添加文字开始创作
            </div>
          </div>
        ) : (
          [...layers].reverse().map((layer, displayIndex) => {
            const realIndex = layers.length - 1 - displayIndex;
            const isSelected = layer.id === selectedLayerId;
            const isDragging = dragIndex === realIndex;
            const isOver = dragOverIndex === realIndex;

            return (
              <div
                key={layer.id}
                draggable
                onDragStart={(e) => handleDragStart(e, realIndex)}
                onDragOver={(e) => handleDragOver(e, realIndex)}
                onDragEnd={handleDragEnd}
                onClick={() => selectLayer(layer.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 12px',
                  backgroundColor: isSelected ? '#E3F2FD' : '#fff',
                  border: `1px solid ${isSelected ? '#1976D2' : '#E0E0E0'}`,
                  borderRadius: 4,
                  cursor: 'grab',
                  opacity: isDragging ? 0.5 : 1,
                  transform: isDragging ? 'scale(0.98)' : 'scale(1)',
                  boxShadow: isOver ? '0 2px 8px rgba(25, 118, 210, 0.2)' : 'none',
                  transition: 'all 0.2s ease',
                }}
              >
                <div
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: 4,
                    border: '1px solid #E0E0E0',
                    backgroundColor: '#f5f5f5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 24,
                    overflow: 'hidden',
                    flexShrink: 0,
                    position: 'relative',
                  }}
                >
                  {layer.type === 'image' && layer.src ? (
                    <img
                      src={layer.src}
                      alt=""
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    getLayerIcon(layer)
                  )}
                  <div
                    style={{
                      position: 'absolute',
                      right: 0,
                      bottom: 0,
                      width: 18,
                      height: 18,
                      backgroundColor: '#fff',
                      border: '1px solid #E0E0E0',
                      borderRadius: '3px 0 0 0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 10,
                      fontWeight: 'bold',
                      color: layer.type === 'image' ? '#1976D2' : '#4CAF50',
                    }}
                  >
                    {layer.type === 'image' ? '📷' : 'T'}
                  </div>
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 500,
                      color: '#333',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {layer.name}
                  </div>
                  <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>
                    {layer.type === 'image' ? '图片图层' : '文字图层'}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      moveLayer(layer.id, 'up');
                    }}
                    style={{
                      width: 24,
                      height: 24,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 12,
                      color: '#616161',
                      borderRadius: 3,
                      transition: 'all 0.2s ease',
                    }}
                    title="上移一层"
                  >
                    ↑
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      moveLayer(layer.id, 'down');
                    }}
                    style={{
                      width: 24,
                      height: 24,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 12,
                      color: '#616161',
                      borderRadius: 3,
                      transition: 'all 0.2s ease',
                    }}
                    title="下移一层"
                  >
                    ↓
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      duplicateLayer(layer.id);
                    }}
                    style={{
                      width: 24,
                      height: 24,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 14,
                      color: '#616161',
                      borderRadius: 3,
                      transition: 'all 0.2s ease',
                    }}
                    title="复制图层"
                  >
                    ⧉
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeLayer(layer.id);
                    }}
                    style={{
                      width: 24,
                      height: 24,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 14,
                      color: '#F44336',
                      borderRadius: 3,
                      transition: 'all 0.2s ease',
                    }}
                    title="删除图层"
                  >
                    🗑
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div
        style={{
          padding: '12px 16px',
          borderTop: '1px solid #E0E0E0',
          fontSize: 11,
          color: '#999',
          textAlign: 'center',
        }}
      >
        拖动图层可调整顺序
      </div>
    </div>
  );
};

export default LayerPanel;
