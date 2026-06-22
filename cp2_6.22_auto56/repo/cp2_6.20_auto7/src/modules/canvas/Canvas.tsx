import { useRef, useCallback } from 'react';
import { useDrop } from 'react-dnd';
import { useResumeStore } from '@/store/resumeStore';
import { CANVAS_WIDTH, CANVAS_HEIGHT, type ComponentType } from '@/store/types';
import CanvasComponent from './CanvasComponent';

export default function Canvas() {
  const { components, selectedId, selectComponent, moveComponent, resizeComponent, addComponent, removeComponent } = useResumeStore();

  const canvasRef = useRef<HTMLDivElement | null>(null);

  const [{ isOver, canDrop }, dropRef] = useDrop({
    accept: 'COMPONENT',
    drop: (item: { type: string }, monitor) => {
      const offset = monitor.getClientOffset();
      const canvasEl = canvasRef.current;
      if (offset && canvasEl) {
        const rect = canvasEl.getBoundingClientRect();
        const scaleX = CANVAS_WIDTH / rect.width;
        const scaleY = CANVAS_HEIGHT / rect.height;
        const x = (offset.x - rect.left) * scaleX;
        const y = (offset.y - rect.top) * scaleY;
        addComponent(item.type as ComponentType, x, y);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  const setRefs = useCallback((el: HTMLDivElement | null) => {
    (canvasRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
    (dropRef as unknown as (el: HTMLDivElement | null) => void)(el);
  }, [dropRef]);

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      selectComponent(null);
    }
  };

  const handleCanvasDoubleClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      selectComponent(null);
    }
  };

  const canvasStyle: React.CSSProperties = {
    width: CANVAS_WIDTH,
    height: CANVAS_HEIGHT,
    transformOrigin: 'top center',
  };

  return (
    <div className="flex-1 flex items-start justify-center overflow-auto bg-slate-100/60 p-8"
      style={{ minHeight: 0 }}
    >
      <div
        ref={setRefs}
        onClick={handleCanvasClick}
        onDoubleClick={handleCanvasDoubleClick}
        className="relative bg-white flex-shrink-0"
        style={{
          ...canvasStyle,
          boxShadow: isOver && canDrop
            ? '0 0 0 3px rgba(107,123,141,0.3), 0 20px 60px -12px rgba(107,123,141,0.2)'
            : '0 4px 24px -4px rgba(107,123,141,0.12), 0 1px 4px -1px rgba(107,123,141,0.06)',
          transition: 'box-shadow 0.3s ease',
        }}
      >
        {components.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center mb-4">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </div>
            <p className="text-sm text-slate-400 font-medium">拖拽组件到此处</p>
            <p className="text-xs text-slate-300 mt-1">从左侧面板拖入开始搭建简历</p>
          </div>
        )}
        {components.map((comp) => (
          <CanvasComponent
            key={comp.id}
            comp={comp}
            isSelected={comp.id === selectedId}
            canvasRef={canvasRef}
            onSelect={() => selectComponent(comp.id)}
            onMove={moveComponent}
            onResize={resizeComponent}
            onRemove={removeComponent}
          />
        ))}
      </div>
    </div>
  );
}
