import React, { useState, useRef } from 'react';
import { useCollage } from '../context/CollageContext';
import { Layer } from '../../shared/types';

const LayerPanel: React.FC = () => {
  const {
    layers,
    selectedLayerId,
    setSelectedLayerId,
    reorderLayer,
    setLayerVisibility,
    deleteLayer,
  } = useCollage();

  const [draggedLayer, setDraggedLayer] = useState<string | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const dragItemRef = useRef<string | null>(null);

  const handleDragStart = (e: React.DragEvent, layerId: string, index: number) => {
    setDraggedLayer(layerId);
    dragItemRef.current = layerId;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', layerId);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    const layerId = dragItemRef.current;
    if (layerId) {
      reorderLayer(layerId, targetIndex);
    }
    setDraggedLayer(null);
    setDragOverIndex(null);
    dragItemRef.current = null;
  };

  const handleDragEnd = () => {
    setDraggedLayer(null);
    setDragOverIndex(null);
    dragItemRef.current = null;
  };

  const handleDelete = (layerId: string) => {
    setDeletingId(layerId);
    setTimeout(() => {
      deleteLayer(layerId);
      setDeletingId(null);
    }, 300);
  };

  const toggleVisibility = (layer: Layer) => {
    setLayerVisibility(layer.id, !layer.visible);
  };

  const reversedLayers = [...layers].reverse();

  return (
    <div
      className="layer-panel"
      style={{
        width: 280,
        backgroundColor: '#1f2937',
        borderRadius: 12,
        margin: 12,
        marginLeft: 0,
        padding: 12,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          fontSize: 14,
          fontWeight: 600,
          color: '#fff',
          marginBottom: 12,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <span>📚</span>
        <span>图层管理</span>
        <span
          style={{
            marginLeft: 'auto',
            fontSize: 12,
            color: '#9ca3af',
            fontWeight: 400,
          }}
        >
          {layers.length} 个图层
        </span>
      </div>

      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          paddingRight: 4,
        }}
      >
        {reversedLayers.length === 0 && (
          <div
            style={{
              textAlign: 'center',
              color: '#6b7280',
              fontSize: 13,
              padding: '40px 0',
            }}
          >
            暂无图层
          </div>
        )}

        {reversedLayers.map((layer, displayIndex) => {
          const actualIndex = layers.length - 1 - displayIndex;
          const isSelected = selectedLayerId === layer.id;
          const isDragging = draggedLayer === layer.id;
          const isDeleting = deletingId === layer.id;
          const isDragOver = dragOverIndex === actualIndex && !isDragging;

          return (
            <React.Fragment key={layer.id}>
              {isDragOver && (
                <div
                  style={{
                    height: 4,
                    backgroundColor: '#4ecdc4',
                    borderRadius: 2,
                    margin: '2px 0',
                    transition: 'all 0.2s ease',
                    animation: 'pulse 0.8s infinite',
                  }}
                />
              )}
              <div
                draggable
                onDragStart={(e) => handleDragStart(e, layer.id, actualIndex)}
                onDragOver={(e) => handleDragOver(e, actualIndex)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, actualIndex)}
                onDragEnd={handleDragEnd}
                onClick={() => setSelectedLayerId(layer.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: 8,
                  backgroundColor: isSelected ? '#374151' : '#111827',
                  borderRadius: 8,
                  cursor: 'pointer',
                  opacity: isDragging ? 0.4 : isDeleting ? 0 : 1,
                  transform: isDeleting ? 'translateX(100%)' : 'translateX(0)',
                  transition:
                    'background-color 0.2s, opacity 0.3s, transform 0.3s ease',
                  border: isSelected
                    ? '1px solid #4ecdc4'
                    : '1px solid transparent',
                  minHeight: 76,
                }}
              >
                <div
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: 8,
                    overflow: 'hidden',
                    flexShrink: 0,
                    backgroundColor: '#0f172a',
                    position: 'relative',
                  }}
                >
                  <img
                    src={layer.src}
                    alt=""
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      opacity: layer.visible ? 1 : 0.3,
                      filter: layer.filter !== 'none' ? 'grayscale(0.5)' : 'none',
                    }}
                  />
                </div>

                <div
                  style={{
                    flex: 1,
                    minWidth: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                  }}
                >
                  <div
                    style={{
                      fontSize: 12,
                      color: '#fff',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    图层 {actualIndex + 1}
                  </div>
                  <div
                    style={{
                      fontSize: 10,
                      color: '#9ca3af',
                    }}
                  >
                    {Math.round(layer.width * layer.scale)} ×{' '}
                    {Math.round(layer.height * layer.scale)}px
                  </div>
                  {layer.filter !== 'none' && (
                    <div
                      style={{
                        fontSize: 10,
                        color: '#4ecdc4',
                      }}
                    >
                      滤镜: {layer.filter}
                    </div>
                  )}
                </div>

                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 4,
                    flexShrink: 0,
                  }}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleVisibility(layer);
                    }}
                    title={layer.visible ? '隐藏图层' : '显示图层'}
                    style={{
                      width: 28,
                      height: 28,
                      border: 'none',
                      borderRadius: 6,
                      backgroundColor: layer.visible ? '#4b5563' : '#1f2937',
                      color: layer.visible ? '#fff' : '#6b7280',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 14,
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      (e.target as HTMLButtonElement).style.backgroundColor =
                        '#6b7280';
                    }}
                    onMouseLeave={(e) => {
                      (e.target as HTMLButtonElement).style.backgroundColor =
                        layer.visible ? '#4b5563' : '#1f2937';
                    }}
                  >
                    {layer.visible ? '👁️' : '👁️‍🗨️'}
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(layer.id);
                    }}
                    title="删除图层"
                    style={{
                      width: 28,
                      height: 28,
                      border: 'none',
                      borderRadius: 6,
                      backgroundColor: '#7f1d1d',
                      color: '#fff',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 12,
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      (e.target as HTMLButtonElement).style.backgroundColor =
                        '#ef4444';
                    }}
                    onMouseLeave={(e) => {
                      (e.target as HTMLButtonElement).style.backgroundColor =
                        '#7f1d1d';
                    }}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </React.Fragment>
          );
        })}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
};

export default LayerPanel;
