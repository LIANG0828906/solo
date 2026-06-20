// ============================================================
// LayerPanel.tsx - 图层管理面板组件
// 调用关系:
//   数据流向: useStore(layers, selectedLayerId, palette) → 渲染图层列表
//   用户交互: 点击选中 → selectLayer(id)
//   用户交互: 拖拽排序 → reorderLayer(from, to)
//   用户交互: 混合模式/不透明度调整 → updateLayer(id, {...})
//   用户交互: 添加按钮 → addLayer(newLayer)
//   依赖调用: renderThumbnail(layer, palette, 30) → CanvasRenderer.ts
// ============================================================
import React, { useEffect, useRef, useState } from 'react';
import { Layer, useStore, BlendMode, ShapeType } from '@/shared/store';
import { renderThumbnail } from './CanvasRenderer';
import { Moon, Cloud, Mountain, Trees, Bird, Star, LucideIcon } from 'lucide-react';

interface LayerItemProps {
  layer: Layer;
  isSelected: boolean;
  onSelect: () => void;
  onDragStart: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onDragEnd: () => void;
  onBlendChange: (mode: BlendMode) => void;
  onOpacityChange: (opacity: number) => void;
}

const LayerItem: React.FC<LayerItemProps> = ({
  layer, isSelected, onSelect, onDragStart, onDragOver, onDrop, onDragEnd, onBlendChange, onOpacityChange
}) => {
  const thumbRef = useRef<HTMLDivElement>(null);
  const palette = useStore(s => s.palette);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    if (!thumbRef.current) return;
    thumbRef.current.innerHTML = '';
    const canvas = renderThumbnail(layer, palette, 30);
    thumbRef.current.appendChild(canvas);
  }, [layer, palette]);

  const itemStyle: React.CSSProperties = {
    height: 48,
    display: 'flex',
    alignItems: 'center',
    padding: '0 12px',
    cursor: 'pointer',
    backgroundColor: isSelected ? 'rgba(100,150,255,0.2)' : hovered ? 'rgba(255,255,255,0.05)' : 'transparent',
    transition: 'background-color 0.2s ease-out',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
    userSelect: 'none'
  };

  const thumbStyle: React.CSSProperties = {
    width: 30,
    height: 30,
    flexShrink: 0,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.05)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  };

  const nameStyle: React.CSSProperties = {
    flex: 1,
    marginLeft: 10,
    fontSize: 13,
    color: '#ffffff',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    transition: 'all 0.2s ease-out'
  };

  const selectStyle: React.CSSProperties = {
    width: 60,
    fontSize: 11,
    backgroundColor: 'rgba(255,255,255,0.08)',
    color: '#ffffff',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 3,
    padding: '2px 4px',
    outline: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s ease-out',
    marginRight: 8
  };

  const rangeStyle: React.CSSProperties = {
    width: 70,
    cursor: 'pointer',
    accentColor: '#6496ff',
    transition: 'all 0.2s ease-out'
  };

  return (
    <div
      style={itemStyle}
      draggable
      onClick={onSelect}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
    >
      <div style={thumbStyle} ref={thumbRef} />
      <span style={nameStyle}>{layer.name}</span>
      <select
        style={selectStyle}
        value={layer.blendMode}
        onClick={(e) => e.stopPropagation()}
        onChange={(e) => onBlendChange(e.target.value as BlendMode)}
      >
        <option value="normal">normal</option>
        <option value="multiply">multiply</option>
        <option value="screen">screen</option>
        <option value="overlay">overlay</option>
      </select>
      <input
        type="range"
        min={0}
        max={100}
        step={5}
        value={layer.opacity}
        style={rangeStyle}
        onClick={(e) => e.stopPropagation()}
        onChange={(e) => onOpacityChange(Number(e.target.value))}
      />
    </div>
  );
};

const layerIcons: Record<ShapeType, LucideIcon> = {
  moon: Moon,
  cloud: Cloud,
  mountain: Mountain,
  tree: Trees,
  bird: Bird,
  star: Star
};

const shapeNames: Record<ShapeType, string> = {
  moon: '月亮',
  cloud: '云朵',
  mountain: '山脉',
  tree: '树木',
  bird: '飞鸟',
  star: '星星'
};

const LayerPanel: React.FC = () => {
  const layers = useStore(s => s.layers);
  const palette = useStore(s => s.palette);
  const selectedLayerId = useStore(s => s.selectedLayerId);
  const addLayer = useStore(s => s.addLayer);
  const reorderLayer = useStore(s => s.reorderLayer);
  const updateLayer = useStore(s => s.updateLayer);
  const selectLayer = useStore(s => s.selectLayer);

  const [draggedId, setDraggedId] = useState<string | null>(null);
  const dragCloneRef = useRef<HTMLDivElement | null>(null);
  const [counter, setCounter] = useState(layers.length + 1);

  const handleAddLayer = (type: ShapeType) => {
    const newLayer: Layer = {
      id: Math.random().toString(36).slice(2, 10),
      name: `图层${counter}`,
      type,
      x: 300,
      y: 250,
      scale: 100,
      rotation: 0,
      opacity: 100,
      blendMode: 'normal',
      colorIndex: Math.floor(Math.random() * palette.length)
    };
    addLayer(newLayer);
    setCounter(c => c + 1);
    selectLayer(newLayer.id);
  };

  const handleDragStart = (e: React.DragEvent, id: string, index: number) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const clone = document.createElement('div');
    clone.innerHTML = (e.currentTarget as HTMLElement).innerHTML;
    clone.style.position = 'fixed';
    clone.style.top = `${rect.top}px`;
    clone.style.left = `${rect.left}px`;
    clone.style.width = `${rect.width}px`;
    clone.style.height = `${rect.height}px`;
    clone.style.backgroundColor = 'rgba(30,30,46,0.85)';
    clone.style.border = '1px solid rgba(100,150,255,0.5)';
    clone.style.borderRadius = '4px';
    clone.style.pointerEvents = 'none';
    clone.style.zIndex = '9999';
    clone.style.opacity = '0.9';
    clone.style.transform = 'translate(8px, 8px)';
    document.body.appendChild(clone);
    dragCloneRef.current = clone;
    const moveHandler = (ev: MouseEvent) => {
      if (dragCloneRef.current) {
        dragCloneRef.current.style.top = `${ev.clientY - rect.height / 2}px`;
        dragCloneRef.current.style.left = `${ev.clientX - rect.width / 2}px`;
      }
    };
    document.addEventListener('mousemove', moveHandler);
    (dragCloneRef.current as any)._moveHandler = moveHandler;
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedId === null) return;
    const fromIndex = Number(e.dataTransfer.getData('text/plain'));
    if (fromIndex !== targetIndex) {
      if (dragCloneRef.current) {
        const el = dragCloneRef.current;
        const targetRect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        el.style.transition = 'all 0.2s ease-out';
        el.style.top = `${targetRect.top}px`;
        el.style.left = `${targetRect.left}px`;
        el.style.transform = 'translate(0, 0)';
        setTimeout(() => {
          reorderLayer(fromIndex, targetIndex);
        }, 180);
      } else {
        reorderLayer(fromIndex, targetIndex);
      }
    }
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    if (dragCloneRef.current) {
      const moveHandler = (dragCloneRef.current as any)._moveHandler;
      if (moveHandler) document.removeEventListener('mousemove', moveHandler);
      document.body.removeChild(dragCloneRef.current);
      dragCloneRef.current = null;
    }
  };

  const panelStyle: React.CSSProperties = {
    width: 280,
    backgroundColor: '#1e1e2e',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    marginBottom: 220,
    height: '100%',
    borderLeft: '1px solid rgba(255,255,255,0.05)'
  };

  const addAreaStyle: React.CSSProperties = {
    padding: '12px',
    borderBottom: '1px solid rgba(255,255,255,0.08)'
  };

  const addLabelStyle: React.CSSProperties = {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 8,
    display: 'block'
  };

  const iconButtonsStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(6, 1fr)',
    gap: 6
  };

  const reversedLayers = [...layers].reverse();
  const originalIndices = layers.map((_, i) => i).reverse();

  return (
    <div style={panelStyle}>
      <div style={addAreaStyle}>
        <span style={addLabelStyle}>添加图层</span>
        <div style={iconButtonsStyle}>
          {(Object.keys(layerIcons) as ShapeType[]).map(type => {
            const Icon = layerIcons[type];
            return <IconButton key={type} type={type} Icon={Icon} onClick={() => handleAddLayer(type)} />;
          })}
        </div>
      </div>
      <div style={{ flex: 1 }}>
        {reversedLayers.map((layer, reversedIdx) => {
          const originalIndex = originalIndices[reversedIdx];
          return (
            <LayerItem
              key={layer.id}
              layer={layer}
              isSelected={selectedLayerId === layer.id}
              onSelect={() => selectLayer(layer.id)}
              onDragStart={(e) => handleDragStart(e, layer.id, originalIndex)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, originalIndex)}
              onDragEnd={handleDragEnd}
              onBlendChange={(mode) => updateLayer(layer.id, { blendMode: mode })}
              onOpacityChange={(opacity) => updateLayer(layer.id, { opacity })}
            />
          );
        })}
      </div>
    </div>
  );
};

const IconButton: React.FC<{
  type: ShapeType;
  Icon: LucideIcon;
  onClick: () => void;
}> = ({ type, Icon, onClick }) => {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      style={{
        width: '100%',
        aspectRatio: '1',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: hovered ? 'rgba(100,150,255,0.2)' : 'rgba(255,255,255,0.05)',
        borderRadius: 6,
        border: 'none',
        cursor: 'pointer',
        color: hovered ? '#6496ff' : 'rgba(255,255,255,0.7)',
        transition: 'all 0.2s ease-out',
        padding: 0
      } as React.CSSProperties}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title={shapeNames[type]}
    >
      <Icon size={18} strokeWidth={1.8} />
    </button>
  );
};

export default LayerPanel;
