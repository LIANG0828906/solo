import React, { useState, useRef, useEffect } from 'react';

interface ComponentItem {
  type: string;
  label: string;
  icon: string;
}

const componentList: ComponentItem[] = [
  { type: 'hero', label: '英雄区', icon: '🎨' },
  { type: 'feature', label: '功能卡片', icon: '⚡' },
  { type: 'pricing', label: '价格表', icon: '💰' },
  { type: 'testimonial', label: '用户评价', icon: '💬' },
  { type: 'footer', label: '页脚CTA', icon: '🚀' },
];

interface ComponentPanelProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  panelWidth: number;
  onResizeEnd: (width: number) => void;
}

const ComponentPanel: React.FC<ComponentPanelProps> = ({
  collapsed,
  onToggleCollapse,
  panelWidth,
  onResizeEnd,
}) => {
  const resizerRef = useRef<HTMLDivElement>(null);
  const isResizing = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(panelWidth);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing.current) return;
      const newWidth = startWidth.current + (e.clientX - startX.current);
      const clampedWidth = Math.min(Math.max(240, newWidth), 320);
      if (resizerRef.current?.parentElement) {
        resizerRef.current.parentElement.style.width = `${clampedWidth}px`;
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (!isResizing.current) return;
      isResizing.current = false;
      const finalWidth = startWidth.current + (e.clientX - startX.current);
      const clampedWidth = Math.min(Math.max(240, finalWidth), 320);
      onResizeEnd(clampedWidth);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [onResizeEnd]);

  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    isResizing.current = true;
    startX.current = e.clientX;
    startWidth.current = panelWidth;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  const handleDragStart = (e: React.DragEvent, type: string) => {
    e.dataTransfer.setData('componentType', type);
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div
      className={`component-panel ${collapsed ? 'collapsed' : ''}`}
      style={{ width: collapsed ? undefined : `${panelWidth}px` }}
    >
      <div className="panel-header">
        {!collapsed && <span className="panel-title">组件库</span>}
        <button className="panel-toggle" onClick={onToggleCollapse} title={collapsed ? '展开' : '收起'}>
          {collapsed ? '→' : '←'}
        </button>
      </div>
      {!collapsed && (
        <div className="component-list">
          {componentList.map((item) => (
            <div
              key={item.type}
              className="component-item"
              draggable
              onDragStart={(e) => handleDragStart(e, item.type)}
            >
              <div className="component-item-icon">{item.icon}</div>
              <span className="component-item-label">{item.label}</span>
            </div>
          ))}
        </div>
      )}
      {!collapsed && (
        <div
          ref={resizerRef}
          className="panel-resizer"
          onMouseDown={handleResizeStart}
        />
      )}
    </div>
  );
};

export default ComponentPanel;
