import { useDrop } from 'react-dnd';
import {
  useComponentList,
  useSelectedId,
  useSelectedIds,
  useBgColor,
  useEditorStore,
} from '../store/editorStore';
import EditableComponent from './EditableComponent';
import type { ComponentType } from '../store/editorStore';
import { useState, useCallback, useRef, useEffect } from 'react';

export default function EditorCanvas() {
  const addComponent = useEditorStore((s) => s.addComponent);
  const selectComponent = useEditorStore((s) => s.selectComponent);
  const toggleMultiSelect = useEditorStore((s) => s.toggleMultiSelect);
  const clearSelection = useEditorStore((s) => s.clearSelection);
  const moveComponent = useEditorStore((s) => s.moveComponent);
  const undo = useEditorStore((s) => s.undo);
  const redo = useEditorStore((s) => s.redo);
  const components = useComponentList();
  const selectedId = useSelectedId();
  const selectedIds = useSelectedIds();
  const bgColor = useBgColor();
  const [dropIndex, setDropIndex] = useState<number | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if (
        ((e.ctrlKey || e.metaKey) && e.key === 'y') ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'Z')
      ) {
        e.preventDefault();
        redo();
      } else if (e.key === 'Escape') {
        clearSelection();
      } else if (e.key === 'Delete' && selectedIds.length > 0) {
        e.preventDefault();
        if (window.confirm(`确定要删除选中的 ${selectedIds.length} 个组件吗？`)) {
          useEditorStore.getState().removeComponents(selectedIds);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, clearSelection, selectedIds]);

  const [{ isOver, canDrop }, drop] = useDrop(
    () => ({
      accept: ['PALETTE_COMPONENT', 'CANVAS_COMPONENT'],
      drop: (
        item: { type: ComponentType; id?: string; order?: number },
        monitor
      ) => {
        const itemType = monitor.getItemType();
        if (itemType === 'PALETTE_COMPONENT') {
          addComponent(item.type, dropIndex ?? undefined);
        } else if (itemType === 'CANVAS_COMPONENT' && item.id) {
          const targetOrder = dropIndex ?? components.length;
          moveComponent(item.id, targetOrder);
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
    [dropIndex, components, addComponent, moveComponent]
  );

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === canvasRef.current) {
        clearSelection();
      }
    },
    [clearSelection]
  );

  const handleSelect = useCallback(
    (id: string, isMulti?: boolean) => {
      if (isMulti) {
        toggleMultiSelect(id);
      } else {
        selectComponent(id);
      }
    },
    [selectComponent, toggleMultiSelect]
  );

  drop(canvasRef);

  const sortedComponents = [...components].sort((a, b) => a.order - b.order);

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
        {sortedComponents.length === 0 && !isOver && (
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
              flexDirection: 'column',
              gap: 12,
            }}
          >
            <div>从左侧拖拽组件到此处</div>
            <div style={{ fontSize: 12, color: '#D5DBDB' }}>
              提示：按住 Ctrl 点击可多选组件
            </div>
          </div>
        )}

        {dropIndex !== null && isOver && (
          <div
            style={{
              height: 4,
              backgroundColor: '#3498DB',
              borderRadius: 2,
              position: 'absolute',
              left: 24,
              right: 24,
              top: 24 + dropIndex * 80,
              transition: 'top 0.2s ease-out',
              zIndex: 100,
            }}
          />
        )}

        {sortedComponents.map((comp) => (
          <EditableComponent
            key={comp.id}
            component={comp}
            isSelected={comp.id === selectedId}
            isMultiSelected={selectedIds.includes(comp.id) && comp.id !== selectedId}
            onSelect={handleSelect}
          />
        ))}
      </div>
    </div>
  );
}
