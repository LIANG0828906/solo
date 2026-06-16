import React, { useState, useRef } from 'react';
import { useStore } from './store';
import { Layer } from './types';
import { Trash2, Copy, Eye, EyeOff, Type, Image, ChevronUp, ChevronDown, Plus, GripVertical } from 'lucide-react';

const LayerPanel: React.FC = () => {
  const [draggedLayerId, setDraggedLayerId] = useState<string | null>(null);
  const [dragOverLayerId, setDragOverLayerId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const layers = useStore((state) => state.layers);
  const selectedLayerId = useStore((state) => state.selectedLayerId);
  const selectLayer = useStore((state) => state.selectLayer);
  const removeLayer = useStore((state) => state.removeLayer);
  const duplicateLayer = useStore((state) => state.duplicateLayer);
  const updateLayer = useStore((state) => state.updateLayer);
  const moveLayer = useStore((state) => state.moveLayer);
  const addTextLayer = useStore((state) => state.addTextLayer);

  const sortedLayers = [...layers].sort((a, b) => b.zIndex - a.zIndex);

  const handleDragStart = (e: React.DragEvent, layer: Layer) => {
    setDraggedLayerId(layer.id);
    setIsDragging(true);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', layer.id);
    
    const target = e.currentTarget as HTMLElement;
    if (target && target.style) {
      target.style.opacity = '0.4';
    }
  };

  const handleDragOver = (e: React.DragEvent, layer: Layer) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    if (dragTimeoutRef.current) {
      clearTimeout(dragTimeoutRef.current);
    }
    
    dragTimeoutRef.current = setTimeout(() => {
      if (layer.id !== draggedLayerId) {
        setDragOverLayerId(layer.id);
      }
    }, 30);
  };

  const handleDragEnter = (e: React.DragEvent, layer: Layer) => {
    e.preventDefault();
    if (layer.id !== draggedLayerId) {
      setDragOverLayerId(layer.id);
    }
  };

  const handleDragLeave = (e: React.DragEvent, layer: Layer) => {
    e.preventDefault();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      if (dragTimeoutRef.current) {
        clearTimeout(dragTimeoutRef.current);
      }
      setDragOverLayerId(null);
    }
  };

  const handleDrop = (e: React.DragEvent, targetLayer: Layer) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (dragTimeoutRef.current) {
      clearTimeout(dragTimeoutRef.current);
    }
    
    const sourceId = draggedLayerId || e.dataTransfer.getData('text/plain');
    const targetId = targetLayer.id;
    
    if (sourceId && sourceId !== targetId) {
      const sourceIndex = sortedLayers.findIndex(l => l.id === sourceId);
      const targetIndex = sortedLayers.findIndex(l => l.id === targetId);
      
      if (sourceIndex !== -1 && targetIndex !== -1) {
        const actualTargetIndex = targetIndex;
        const sortedAsc = sortedLayers.length - 1 - actualTargetIndex;
        moveLayer(sourceId, sortedAsc);
      }
    }
    
    setDraggedLayerId(null);
    setDragOverLayerId(null);
    setIsDragging(false);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    if (dragTimeoutRef.current) {
      clearTimeout(dragTimeoutRef.current);
    }
    
    const target = e.currentTarget as HTMLElement;
    if (target && target.style) {
      target.style.opacity = '1';
    }
    
    setDraggedLayerId(null);
    setDragOverLayerId(null);
    setIsDragging(false);
  };

  const handleMoveUp = (layer: Layer) => {
    moveLayer(layer.id, 'up');
  };

  const handleMoveDown = (layer: Layer) => {
    moveLayer(layer.id, 'down');
  };

  const getLayerIcon = (layer: Layer) => {
    if (layer.type === 'text') {
      return <Type size={16} />;
    }
    return <Image size={16} />;
  };

  const renderThumbnail = (layer: Layer) => {
    if (layer.type === 'image' && layer.imageSrc) {
      return (
        <img
          src={layer.imageSrc}
          alt={layer.name}
          className="w-full h-full object-cover"
          style={{ filter: layer.visible ? 'none' : 'grayscale(100%)' }}
          draggable={false}
        />
      );
    }
    if (layer.type === 'text' && layer.textStyle) {
      return (
        <div
          className="w-full h-full flex items-center justify-center text-xs font-bold truncate p-1"
          style={{
            color: layer.textStyle.color,
            fontFamily: layer.textStyle.fontFamily,
            backgroundColor: '#F5F5F5',
          }}
        >
          {layer.textStyle.content.slice(0, 6)}
        </div>
      );
    }
    return (
      <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: '#E0E0E0' }}>
        {getLayerIcon(layer)}
      </div>
    );
  };

  return (
    <div className="w-[300px] flex flex-col h-full" style={{ backgroundColor: '#F9F9F9', borderLeft: '1px solid #E0E0E0' }}>
      <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: '#E0E0E0' }}>
        <h2 className="text-lg font-semibold" style={{ color: '#1976D2' }}>图层管理</h2>
        <button
          onClick={addTextLayer}
          className="p-2 rounded transition-all duration-300 hover:opacity-80 hover:-translate-y-0.5 active:scale-95"
          style={{
            backgroundColor: '#1976D2',
            color: '#FFFFFF',
          }}
          title="添加文字图层"
        >
          <Plus size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {sortedLayers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <Image size={48} style={{ color: '#E0E0E0' }} />
            <p className="mt-3 text-sm" style={{ color: '#616161' }}>暂无图层</p>
            <p className="text-xs mt-1" style={{ color: '#9E9E9E' }}>点击上传按钮添加商品图片</p>
          </div>
        ) : (
          sortedLayers.map((layer, index) => {
            const isDragOver = dragOverLayerId === layer.id;
            const isDraggingThis = draggedLayerId === layer.id;
            
            return (
              <div
                key={layer.id}
                draggable
                onDragStart={(e) => handleDragStart(e, layer)}
                onDragOver={(e) => handleDragOver(e, layer)}
                onDragEnter={(e) => handleDragEnter(e, layer)}
                onDragLeave={(e) => handleDragLeave(e, layer)}
                onDrop={(e) => handleDrop(e, layer)}
                onDragEnd={handleDragEnd}
                onClick={() => selectLayer(layer.id)}
                className={`group flex items-center gap-2 p-2 rounded cursor-move transition-all duration-300 hover:-translate-y-0.5 ${
                  selectedLayerId === layer.id ? 'ring-2' : ''
                }`}
                style={{
                  backgroundColor: selectedLayerId === layer.id ? '#E3F2FD' : '#FFFFFF',
                  borderTop: isDragOver && !isDraggingThis ? '3px solid #1976D2' : undefined,
                  border: !isDragOver || isDraggingThis ? (isDragOver ? '2px dashed #1976D2' : '1px solid #E0E0E0') : undefined,
                  boxShadow: isDraggingThis ? '0 8px 24px rgba(25, 118, 210, 0.3)' : '0 1px 3px rgba(0,0,0,0.1)',
                  opacity: isDraggingThis ? 0.4 : 1,
                  transform: isDraggingThis ? 'scale(1.03) rotate(1deg)' : undefined,
                  '--tw-ring-color': '#1976D2',
                  zIndex: isDraggingThis ? 100 : 1,
                } as React.CSSProperties}
              >
                <div className="flex flex-col items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMoveUp(layer);
                    }}
                    className="p-0.5 rounded hover:bg-gray-100 transition-all active:scale-95"
                    disabled={index === 0}
                    style={{ color: index === 0 ? '#E0E0E0' : '#616161' }}
                    title="上移图层"
                  >
                    <ChevronUp size={12} />
                  </button>
                  <div
                    className="flex items-center text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing"
                    onMouseDown={(e) => e.stopPropagation()}
                  >
                    <GripVertical size={12} />
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMoveDown(layer);
                    }}
                    className="p-0.5 rounded hover:bg-gray-100 transition-all active:scale-95"
                    disabled={index === sortedLayers.length - 1}
                    style={{ color: index === sortedLayers.length - 1 ? '#E0E0E0' : '#616161' }}
                    title="下移图层"
                  >
                    <ChevronDown size={12} />
                  </button>
                </div>

                <div
                  className="w-12 h-12 rounded flex-shrink-0 overflow-hidden"
                  style={{ border: '1px solid #E0E0E0', borderRadius: '4px' }}
                >
                  {renderThumbnail(layer)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <span style={{ color: '#616161' }}>{getLayerIcon(layer)}</span>
                    <span className="text-sm font-medium truncate" style={{ color: '#333333' }}>
                      {layer.name}
                    </span>
                  </div>
                  <div className="text-xs flex items-center gap-2" style={{ color: '#9E9E9E' }}>
                    <span>
                      {layer.type === 'image' ? `${Math.round(layer.width)}×${Math.round(layer.height)}` : '文字'}
                    </span>
                    <span>·</span>
                    <span>z{layer.zIndex + 1}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      updateLayer(layer.id, { visible: !layer.visible });
                    }}
                    className="p-1.5 rounded hover:bg-gray-100 transition-all duration-300 hover:-translate-y-0.5 active:scale-95"
                    style={{ color: layer.visible ? '#616161' : '#BDBDBD' }}
                    title={layer.visible ? '隐藏图层' : '显示图层'}
                  >
                    {layer.visible ? <Eye size={14} /> : <EyeOff size={14} />}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      duplicateLayer(layer.id);
                    }}
                    className="p-1.5 rounded hover:bg-gray-100 transition-all duration-300 hover:-translate-y-0.5 active:scale-95"
                    style={{ color: '#616161' }}
                    title="复制图层"
                  >
                    <Copy size={14} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeLayer(layer.id);
                    }}
                    className="p-1.5 rounded hover:bg-red-50 transition-all duration-300 hover:-translate-y-0.5 active:scale-95"
                    style={{ color: '#F44336' }}
                    title="删除图层"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {isDragging && (
        <div
          className="px-3 py-2 text-xs text-center border-t"
          style={{ backgroundColor: '#E3F2FD', color: '#1976D2', borderColor: '#BBDEFB' }}
        >
          拖拽至目标位置释放以调整图层顺序
        </div>
      )}
    </div>
  );
};

export default LayerPanel;
