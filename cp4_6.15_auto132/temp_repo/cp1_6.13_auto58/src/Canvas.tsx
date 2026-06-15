import React, { useCallback } from 'react';
import { useDrop } from 'react-dnd';
import type { ComponentConfig, DragItem, DragMoveItem, ResizeItem } from './types';
import CarouselComponent from './CarouselComponent';

const MIN_SIZE = 50;
const MAX_SIZE = 500;

interface CanvasProps {
  components: ComponentConfig[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onAddComponent: (component: ComponentConfig) => void;
  onMoveComponent: (id: string, x: number, y: number) => void;
  onResizeComponent: (id: string, width: number, height: number, x?: number, y?: number) => void;
  onDeleteComponent: (id: string) => void;
  onCopyComponent: (id: string) => void;
  onSetBackground: (id: string, color: string) => void;
}

const CanvasComponent: React.FC<CanvasProps> = ({
  components,
  selectedId,
  onSelect,
  onAddComponent,
  onMoveComponent,
  onResizeComponent,
  onDeleteComponent,
  onCopyComponent,
  onSetBackground,
}) => {
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; componentId: string } | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const [, drop] = useDrop(() => ({
    accept: 'COMPONENT',
    drop: (item: DragItem, monitor) => {
      const offset = monitor.getClientOffset();
      if (!offset) return;
      const canvasRect = document.getElementById('canvas-area')?.getBoundingClientRect();
      if (!canvasRect) return;
      const x = Math.max(0, Math.min(offset.x - canvasRect.left, 1200 - 100));
      const y = Math.max(0, Math.min(offset.y - canvasRect.top, 800 - 100));
      onAddComponent({
        id: '',
        type: item.componentType,
        x,
        y,
        width: 0,
        height: 0,
      });
    },
    hover: (_item, monitor) => {
      setIsDragOver(monitor.isOver({ shallow: true }));
    },
    collect: (monitor) => ({
      isOver: monitor.isOver({ shallow: true }),
    }),
  }), [onAddComponent]);

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).id === 'canvas-area' || (e.target as HTMLElement).id === 'canvas-grid') {
      onSelect(null);
      setContextMenu(null);
    }
  }, [onSelect]);

  const handleContextMenu = useCallback((e: React.MouseEvent, componentId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, componentId });
  }, []);

  const handleDelete = useCallback(() => {
    if (contextMenu) {
      onDeleteComponent(contextMenu.componentId);
      setContextMenu(null);
    }
  }, [contextMenu, onDeleteComponent]);

  const handleCopy = useCallback(() => {
    if (contextMenu) {
      onCopyComponent(contextMenu.componentId);
      setContextMenu(null);
    }
  }, [contextMenu, onCopyComponent]);

  const handleBgColor = useCallback((color: string) => {
    if (contextMenu) {
      onSetBackground(contextMenu.componentId, color);
      setContextMenu(null);
    }
  }, [contextMenu, onSetBackground]);

  const startDragMove = useCallback((e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    onSelect(id);
    setContextMenu(null);

    const startX = e.clientX;
    const startY = e.clientY;
    const comp = components.find(c => c.id === id);
    if (!comp) return;
    const origX = comp.x;
    const origY = comp.y;

    const handleMouseMove = (ev: MouseEvent) => {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      const newX = Math.max(0, Math.min(origX + dx, 1200 - comp.width));
      const newY = Math.max(0, Math.min(origY + dy, 800 - comp.height));
      onMoveComponent(id, newX, newY);
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [components, onSelect, onMoveComponent]);

  const startResize = useCallback((e: React.MouseEvent, id: string, corner: string) => {
    e.stopPropagation();
    e.preventDefault();

    const comp = components.find(c => c.id === id);
    if (!comp) return;

    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = comp.width;
    const startHeight = comp.height;
    const startLeft = comp.x;
    const startTop = comp.y;

    const handleMouseMove = (ev: MouseEvent) => {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;

      let newWidth = startWidth;
      let newHeight = startHeight;
      let newX = startLeft;
      let newY = startTop;

      if (corner === 'br') {
        newWidth = startWidth + dx;
        newHeight = startHeight + dy;
      } else if (corner === 'bl') {
        newWidth = startWidth - dx;
        newHeight = startHeight + dy;
        newX = startLeft + dx;
      } else if (corner === 'tr') {
        newWidth = startWidth + dx;
        newHeight = startHeight - dy;
        newY = startTop + dy;
      } else if (corner === 'tl') {
        newWidth = startWidth - dx;
        newHeight = startHeight - dy;
        newX = startLeft + dx;
        newY = startTop + dy;
      }

      newWidth = Math.max(MIN_SIZE, Math.min(MAX_SIZE, newWidth));
      newHeight = Math.max(MIN_SIZE, Math.min(MAX_SIZE, newHeight));

      if (corner === 'bl') {
        newX = startLeft + startWidth - newWidth;
      } else if (corner === 'tl') {
        newX = startLeft + startWidth - newWidth;
        newY = startTop + startHeight - newHeight;
      } else if (corner === 'tr') {
        newY = startTop + startHeight - newHeight;
      }

      onResizeComponent(id, newWidth, newHeight, newX, newY);
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);

      const finalComp = components.find(c => c.id === id);
      if (finalComp) {
        const correctedW = Math.max(MIN_SIZE, Math.min(MAX_SIZE, finalComp.width));
        const correctedH = Math.max(MIN_SIZE, Math.min(MAX_SIZE, finalComp.height));
        if (correctedW !== finalComp.width || correctedH !== finalComp.height) {
          onResizeComponent(id, correctedW, correctedH);
        }
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [components, onResizeComponent]);

  const renderComponent = (comp: ComponentConfig) => {
    const isSelected = comp.id === selectedId;

    const wrapperStyle: React.CSSProperties = {
      position: 'absolute',
      left: comp.x,
      top: comp.y,
      width: comp.width,
      height: comp.height,
      backgroundColor: comp.backgroundColor || 'transparent',
      borderRadius: comp.borderRadius || 0,
      cursor: 'move',
      border: isSelected ? '2px solid #2196F3' : '1px solid transparent',
      overflow: 'hidden',
      boxSizing: 'border-box',
    };

    let inner: React.ReactNode = null;

    switch (comp.type) {
      case 'title':
        inner = (
          <div style={{
            width: '100%', height: '100%', display: 'flex', alignItems: 'center',
            padding: 8, boxSizing: 'border-box',
            fontSize: comp.fontSize || 24, color: comp.color || '#1e3a5f', fontWeight: 700,
          }}>
            {comp.content || '标题文本'}
          </div>
        );
        break;
      case 'paragraph':
        inner = (
          <div style={{
            width: '100%', height: '100%', padding: 8, boxSizing: 'border-box',
            fontSize: comp.fontSize || 14, color: comp.color || '#333333', lineHeight: 1.6, overflow: 'hidden',
          }}>
            {comp.content || '段落文本内容'}
          </div>
        );
        break;
      case 'image':
        inner = (
          <img
            src={comp.images?.[0] || 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=placeholder%20sample%20image&image_size=landscape_4_3'}
            alt="图片"
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        );
        break;
      case 'button':
        inner = (
          <div style={{
            width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <button style={{
              width: '100%', height: '100%', backgroundColor: comp.backgroundColor || '#2196F3',
              color: comp.color || '#ffffff', border: 'none', borderRadius: comp.borderRadius || 4,
              fontSize: comp.fontSize || 14, cursor: 'pointer', padding: '0 16px', boxSizing: 'border-box',
            }}>
              {comp.content || '按钮'}
            </button>
          </div>
        );
        break;
      case 'form':
        inner = (
          <div style={{ width: '100%', height: '100%', padding: 12, boxSizing: 'border-box' }}>
            <input placeholder="输入框" style={{ width: '100%', padding: 8, marginBottom: 8, border: '1px solid #ddd', borderRadius: 4, fontSize: 14, boxSizing: 'border-box' }} readOnly />
            <input placeholder="输入框" style={{ width: '100%', padding: 8, marginBottom: 8, border: '1px solid #ddd', borderRadius: 4, fontSize: 14, boxSizing: 'border-box' }} readOnly />
            <button style={{ padding: '8px 16px', backgroundColor: '#2196F3', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}>提交</button>
          </div>
        );
        break;
      case 'carousel':
        inner = <CarouselComponent component={comp} />;
        break;
    }

    return (
      <div
        key={comp.id}
        style={wrapperStyle}
        onMouseDown={(e) => startDragMove(e, comp.id)}
        onContextMenu={(e) => handleContextMenu(e, comp.id)}
      >
        {inner}
        {isSelected && (
          <>
            <div onMouseDown={(e) => startResize(e, comp.id, 'tl')} style={{ position: 'absolute', top: -4, left: -4, width: 8, height: 8, backgroundColor: '#2196F3', cursor: 'nw-resize', zIndex: 10 }} />
            <div onMouseDown={(e) => startResize(e, comp.id, 'tr')} style={{ position: 'absolute', top: -4, right: -4, width: 8, height: 8, backgroundColor: '#2196F3', cursor: 'ne-resize', zIndex: 10 }} />
            <div onMouseDown={(e) => startResize(e, comp.id, 'bl')} style={{ position: 'absolute', bottom: -4, left: -4, width: 8, height: 8, backgroundColor: '#2196F3', cursor: 'sw-resize', zIndex: 10 }} />
            <div onMouseDown={(e) => startResize(e, comp.id, 'br')} style={{ position: 'absolute', bottom: -4, right: -4, width: 8, height: 8, backgroundColor: '#2196F3', cursor: 'se-resize', zIndex: 10 }} />
          </>
        )}
      </div>
    );
  };

  return (
    <div style={{ flex: 1, overflow: 'auto', backgroundColor: '#e8eaed', padding: 20, display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}>
      <div
        id="canvas-area"
        ref={drop}
        onClick={handleCanvasClick}
        style={{
          width: 1200,
          height: 800,
          backgroundColor: '#ffffff',
          position: 'relative',
          border: isDragOver ? '2px dashed #2196F3' : '1px solid #ddd',
          backgroundImage: isDragOver
            ? 'linear-gradient(90deg, rgba(33,150,243,0.05) 1px, transparent 1px), linear-gradient(rgba(33,150,243,0.05) 1px, transparent 1px)'
            : 'linear-gradient(90deg, rgba(0,0,0,0.03) 1px, transparent 1px), linear-gradient(rgba(0,0,0,0.03) 1px, transparent 1px)',
          backgroundSize: '20px 20px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
          flexShrink: 0,
        }}
      >
        <div style={{
          position: 'absolute', top: 8, left: 8, fontSize: 12, color: '#999',
          backgroundColor: 'rgba(255,255,255,0.8)', padding: '2px 8px', borderRadius: 4, zIndex: 5,
        }}>
          组件数量: {components.length}
        </div>
        {components.map(renderComponent)}
      </div>

      {contextMenu && (
        <div style={{
          position: 'fixed',
          left: contextMenu.x,
          top: contextMenu.y,
          backgroundColor: '#fff',
          border: '1px solid #ddd',
          borderRadius: 6,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          zIndex: 1000,
          minWidth: 160,
        }}>
          <div onClick={handleDelete} style={{ padding: '8px 16px', cursor: 'pointer', fontSize: 14, borderBottom: '1px solid #eee' }}>🗑️ 删除</div>
          <div onClick={handleCopy} style={{ padding: '8px 16px', cursor: 'pointer', fontSize: 14, borderBottom: '1px solid #eee' }}>📋 复制</div>
          <div style={{ padding: '8px 16px', fontSize: 12, color: '#999' }}>背景颜色:</div>
          <div style={{ display: 'flex', gap: 4, padding: '4px 16px 8px' }}>
            {['#ffffff', '#f0f2f5', '#e3f2fd', '#fff3e0', '#e8f5e9', '#fce4ec'].map(c => (
              <div
                key={c}
                onClick={() => handleBgColor(c)}
                style={{
                  width: 20, height: 20, backgroundColor: c, border: '1px solid #ccc',
                  borderRadius: 4, cursor: 'pointer',
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

import { useState } from 'react';

export default CanvasComponent;
