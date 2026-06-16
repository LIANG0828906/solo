import { useDrop } from 'react-dnd';
import { useEditorStore, useComponentList, useSelectedId, useBgColor } from '../store/editorStore';
import EditableComponent from './EditableComponent';
import type { ComponentType, PortfolioComponent } from '../store/editorStore';
import { useState, useCallback, useRef } from 'react';

export default function EditorCanvas() {
  const addComponent = useEditorStore((s) => s.addComponent);
  const selectComponent = useEditorStore((s) => s.selectComponent);
  const components = useComponentList();
  const selectedId = useSelectedId();
  const bgColor = useBgColor();
  const [dropIndex, setDropIndex] = useState<number | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const [{ isOver, canDrop }, drop] = useDrop(
    () => ({
      accept: ['PALETTE_COMPONENT', 'CANVAS_COMPONENT'],
      drop: (item: { type: ComponentType; id?: string; order?: number }, monitor) => {
        const itemType = monitor.getItemType();
        if (itemType === 'PALETTE_COMPONENT') {
          addComponent(item.type, dropIndex ?? undefined);
        } else if (itemType === 'CANVAS_COMPONENT' && item.id) {
          const targetOrder = dropIndex ?? components.length;
          const mover = useEditorStore.getState();
          mover.moveComponent(item.id, targetOrder);
        }
        setDropIndex(null);
      },
      hover: (_item, monitor) => {
        const clientOffset = monitor.getClientOffset();
        if (!clientOffset || !canvasRef.current) return;
        const canvasRect = canvasRef.current.getBoundingClientRect();
        const y = clientOffset.y - canvasRect.top;
        const compHeight = 80;
        const idx = Math.round(y / compHeight);
        setDropIndex(Math.max(0, Math.min(idx, components.length)));
      },
      collect: (monitor) => ({
        isOver: monitor.isOver(),
        canDrop: monitor.canDrop(),
      }),
    }),
    [dropIndex, components, addComponent]
  );

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === canvasRef.current) {
        selectComponent(null);
      }
    },
    [selectComponent]
  );

  drop(canvasRef);

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        justifyContent: 'center',
        marginLeft: 200,
        marginRight: 280,
        padding: '88px 0 32px',
        minHeight: '100vh',
      }}
    >
      <div
        ref={canvasRef}
        onClick={handleCanvasClick}
        style={{
          width: 960,
          minHeight: 600,
          backgroundColor: bgColor,
          borderRadius: 6,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          padding: '24px',
          position: 'relative',
          border: isOver && canDrop ? '2px dashed #95A5A6' : '2px solid transparent',
          transition: 'border 0.2s ease',
        }}
      >
        {components.length === 0 && !isOver && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: 400,
              color: '#BDC3C7',
              fontSize: 16,
              border: '2px dashed #BDC3C7',
              borderRadius: 6,
            }}
          >
            从左侧拖拽组件到此处
          </div>
        )}

        {dropIndex !== null && isOver && (
          <div
            style={{
              height: 4,
              backgroundColor: '#3498DB',
              borderRadius: 2,
              marginBottom: 8,
              position: 'absolute',
              left: 24,
              right: 24,
              top: 24 + dropIndex * 80,
              transition: 'top 0.2s ease-out',
            }}
          />
        )}

        {components.map((comp) => (
          <EditableComponent
            key={comp.id}
            component={comp}
            isSelected={comp.id === selectedId}
            onSelect={selectComponent}
          />
        ))}
      </div>
    </div>
  );
}
