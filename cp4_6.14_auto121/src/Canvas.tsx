import { useRef, useCallback, useState, useEffect } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { useStore } from './store';
import type { ModuleInstance } from './types';
import SearchBar from './modules/SearchBar';
import UserCard from './modules/UserCard';
import DataTable from './modules/DataTable';

function renderModuleContent(module: ModuleInstance) {
  const props = module.props;
  switch (module.type) {
    case 'searchBar':
      return <SearchBar {...(props as any)} />;
    case 'userCard':
      return <UserCard {...(props as any)} />;
    case 'dataTable':
      return <DataTable {...(props as any)} />;
  }
}

interface DraggableModuleProps {
  module: ModuleInstance;
  isSelected: boolean;
  zoom: number;
}

function DraggableModule({ module, isSelected, zoom }: DraggableModuleProps) {
  const { selectModule, updateModule } = useStore();
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number; modX: number; modY: number } | null>(null);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return;
      e.stopPropagation();
      e.preventDefault();
      selectModule(module.id);
      setIsDragging(true);
      dragStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        modX: module.x,
        modY: module.y,
      };
    },
    [module.id, module.x, module.y, selectModule]
  );

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!dragStartRef.current) return;
      const dx = (e.clientX - dragStartRef.current.x) / zoom;
      const dy = (e.clientY - dragStartRef.current.y) / zoom;
      const newX = Math.max(0, Math.round((dragStartRef.current.modX + dx) / 24) * 24);
      const newY = Math.max(0, Math.round((dragStartRef.current.modY + dy) / 24) * 24);
      updateModule(module.id, { x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      dragStartRef.current = null;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, module.id, zoom, updateModule]);

  return (
    <div
      onMouseDown={handleMouseDown}
      style={{
        position: 'absolute',
        left: module.x,
        top: module.y,
        width: module.width,
        height: module.height,
        cursor: isDragging ? 'grabbing' : 'grab',
        opacity: isDragging ? 0.8 : 1,
        transition: isDragging ? 'none' : 'opacity 0.15s ease',
        boxShadow: isSelected ? '0 0 0 2px #3b82f6, 0 8px 24px rgba(59, 130, 246, 0.25)' : '0 2px 8px rgba(0,0,0,0.08)',
        borderRadius: 8,
        backgroundColor: '#ffffff',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          pointerEvents: isDragging ? 'none' : 'auto',
        }}
      >
        {renderModuleContent(module)}
      </div>
      {isSelected && (
        <div
          style={{
            position: 'absolute',
            top: -8,
            right: -8,
            width: 16,
            height: 16,
            borderRadius: '50%',
            backgroundColor: '#ef4444',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 10,
            color: '#ffffff',
            fontWeight: 'bold',
          }}
          onClick={(e) => {
            e.stopPropagation();
            useStore.getState().deleteModule(module.id);
          }}
        >
          ×
        </div>
      )}
    </div>
  );
}

export default function Canvas() {
  const { modules, zoom, selectedId, setZoom } = useStore();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const { setNodeRef, isOver } = useDroppable({ id: 'canvas-dropzone' });

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        setZoom(zoom + delta);
      }
    },
    [zoom, setZoom]
  );

  const canvasStyle: React.CSSProperties = {
    width: 1200,
    height: 800,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    position: 'relative',
    transform: `scale(${zoom})`,
    transformOrigin: 'top left',
    flexShrink: 0,
    boxShadow: isOver ? '0 0 0 2px #3b82f6' : '0 4px 16px rgba(0,0,0,0.2)',
    transition: 'box-shadow 0.2s ease-out',
    backgroundImage:
      'radial-gradient(circle, #cbd5e1 1px, transparent 1px)',
    backgroundSize: '24px 24px',
  };

  return (
    <div
      ref={(el) => {
        wrapperRef.current = el;
        setNodeRef(el);
      }}
      style={{
        position: 'relative',
        overflow: 'auto',
        width: '100%',
        height: '100%',
      }}
      onWheel={handleWheel}
    >
      <div style={{ position: 'relative', width: 1200 * zoom, height: 800 * zoom }}>
        <div style={canvasStyle}>
          {modules.map((module) => (
            <DraggableModule
              key={module.id}
              module={module}
              isSelected={selectedId === module.id}
              zoom={zoom}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
