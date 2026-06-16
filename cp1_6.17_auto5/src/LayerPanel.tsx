import React, { useState, useRef } from 'react';
import { useStore } from './store';
import { Layer } from './types';
import { Trash2, Copy, Eye, EyeOff, Type, Image, ChevronUp, ChevronDown, Plus, GripVertical } from 'lucide-react';

const LayerPanel: React.FC = () => {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const dragTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const layers = useStore((state) => state.layers);
  const selectedLayerId = useStore((state) => state.selectedLayerId);
  const selectLayer = useStore((state) => state.selectLayer);
  const removeLayer = useStore((state) => state.removeLayer);
  const duplicateLayer = useStore((state) => state.duplicateLayer);
  const updateLayer = useStore((state) => state.updateLayer);
  const reorderLayers = useStore((state) => state.reorderLayers);
  const addTextLayer = useStore((state) => state.addTextLayer);

  const sortedLayers = [...layers].sort((a, b) => b.zIndex - a.zIndex);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    if (dragTimeoutRef.current) {
      clearTimeout(dragTimeoutRef.current);
    }
    
    dragTimeoutRef.current = setTimeout(() => {
      setDragOverIndex(index);
    }, 50);
  };

  const handleDragLeave = () => {
    if (dragTimeoutRef.current) {
      clearTimeout(dragTimeoutRef.current);
    }
  };

  const handleDrop = (e: React.DragEvent, toIndex: number) => {
    e.preventDefault();
    if (dragTimeoutRef.current) {
      clearTimeout(dragTimeoutRef.current);
    }
    
    if (draggedIndex !== null && draggedIndex !== toIndex) {
      const fromSortedIndex = draggedIndex;
      const toSortedIndex = toIndex;
      const fromZIndex = sortedLayers.length - 1 - fromSortedIndex;
      const toZIndex = sortedLayers.length - 1 - toSortedIndex;
      reorderLayers(fromZIndex, toZIndex);
    }
    
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    if (dragTimeoutRef.current) {
      clearTimeout(dragTimeoutRef.current);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleMoveUp = (layer: Layer) => {
    const currentIndex = sortedLayers.findIndex((l) => l.id === layer.id);
    if (currentIndex > 0) {
      const fromZIndex = sortedLayers.length - 1 - currentIndex;
      const toZIndex = sortedLayers.length - currentIndex;
      reorderLayers(fromZIndex, toZIndex);
    }
  };

  const handleMoveDown = (layer: Layer) => {
    const currentIndex = sortedLayers.findIndex((l) => l.id === layer.id);
    if (currentIndex < sortedLayers.length - 1) {
      const fromZIndex = sortedLayers.length - 1 - currentIndex;
      const toZIndex = sortedLayers.length - 2 - currentIndex;
      reorderLayers(fromZIndex, toZIndex);
    }
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
          sortedLayers.map((layer, index) => (
            <div
              key={layer.id}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
              onClick={() => selectLayer(layer.id)}
              className={`group flex items-center gap-2 p-2 rounded cursor-move transition-all duration-300 hover:-translate-y-0.5 ${
                selectedLayerId === layer.id ? 'ring-2' : ''
              }`}
              style={{
                backgroundColor: selectedLayerId === layer.id ? '#E3F2FD' : '#FFFFFF',
                border: dragOverIndex === index ? '2px dashed #1976D2' : '1px solid #E0E0E0',
                boxShadow: draggedIndex === index ? '0 4px 12px rgba(0,0,0,0.2)' : '0 1px 3px rgba(0,0,0,0.1)',
                opacity: draggedIndex === index ? 0.5 : 1,
                transform: draggedIndex === index ? 'scale(1.02)' : undefined,
                '--tw-ring-color': '#1976D2',
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
                >
                  <ChevronUp size={12} />
                </button>
                <GripVertical size={12} style={{ color: '#BDBDBD' }} />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMoveDown(layer);
                  }}
                  className="p-0.5 rounded hover:bg-gray-100 transition-all active:scale-95"
                  disabled={index === sortedLayers.length - 1}
                  style={{ color: index === sortedLayers.length - 1 ? '#E0E0E0' : '#616161' }}
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
                <div className="text-xs" style={{ color: '#9E9E9E' }}>
                  {layer.type === 'image' ? `${Math.round(layer.width)}×${Math.round(layer.height)}` : '文字'}
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
                  title={layer.visible ? '隐藏' : '显示'}
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
                  title="复制"
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
                  title="删除"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default LayerPanel;
