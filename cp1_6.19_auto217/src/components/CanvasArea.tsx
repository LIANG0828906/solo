import { RightPanel } from '@/components/RightPanel';
import { useComponentStore } from '@/store/componentStore';
import { renderShape } from '@/utils/shapes';
import { exportCharacterData } from '@/utils/export';
import { Dice5, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { EditModal } from '@/components/EditModal';
import { useCallback, useRef, useState } from 'react';

export function CanvasArea() {
  const canvasComponents = useComponentStore((s) => s.canvasComponents);
  const componentLibrary = useComponentStore((s) => s.componentLibrary);
  const addComponentToCanvas = useComponentStore((s) => s.addComponentToCanvas);
  const updateCanvasComponent = useComponentStore((s) => s.updateCanvasComponent);
  const openEditModal = useComponentStore((s) => s.openEditModal);
  const editModalOpen = useComponentStore((s) => s.editModalOpen);
  const randomInspiration = useComponentStore((s) => s.randomInspiration);

  const canvasRef = useRef<HTMLDivElement>(null);
  const [resizingId, setResizingId] = useState<string | null>(null);
  const resizeStartRef = useRef({ x: 0, y: 0, scale: 1 });

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const componentId = e.dataTransfer.getData('application/component-id');
      if (!componentId) return;

      const item = componentLibrary.find((ci) => ci.id === componentId);
      if (!item) return;

      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left - item.width / 2;
      const y = e.clientY - rect.top - item.height / 2;

      addComponentToCanvas(item, x, y);
    },
    [componentLibrary, addComponentToCanvas]
  );

  const handleResizeStart = useCallback(
    (e: React.MouseEvent, compId: string, currentScale: number) => {
      e.stopPropagation();
      e.preventDefault();
      setResizingId(compId);
      resizeStartRef.current = { x: e.clientX, y: e.clientY, scale: currentScale };

      const handleMove = (ev: MouseEvent) => {
        const dx = ev.clientX - resizeStartRef.current.x;
        const dy = ev.clientY - resizeStartRef.current.y;
        const delta = (dx + dy) / 200;
        const newScale = Math.min(1.5, Math.max(0.5, resizeStartRef.current.scale + delta));
        updateCanvasComponent(compId, { scale: newScale });
      };

      const handleUp = () => {
        setResizingId(null);
        window.removeEventListener('mousemove', handleMove);
        window.removeEventListener('mouseup', handleUp);
      };

      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseup', handleUp);
    },
    [updateCanvasComponent]
  );

  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-3 min-w-0">
      <div className="relative">
        <div className="absolute -top-10 left-0 z-10">
          <button
            onClick={randomInspiration}
            className="flex items-center gap-1.5 px-3 py-1.5 text-white/80 text-sm bg-transparent rounded-md hover:bg-[#FF6B6B33] transition-colors duration-200"
            title="随机灵感"
          >
            <Dice5 size={16} />
            <span>随机灵感</span>
          </button>
        </div>

        <div className="absolute -top-10 right-0 z-10">
          <button
            onClick={exportCharacterData}
            className="flex items-center gap-1.5 px-3 py-1.5 text-white text-sm rounded-md transition-colors duration-200"
            style={{ background: '#FF6B6B' }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = '#E55A5A';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = '#FF6B6B';
            }}
          >
            <Download size={14} />
            <span>导出角色</span>
          </button>
        </div>

        <div
          ref={canvasRef}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className="relative bg-white overflow-hidden"
          style={{
            width: 390,
            height: 600,
            backgroundImage:
              'linear-gradient(#E0E0E0 1px, transparent 1px), linear-gradient(90deg, #E0E0E0 1px, transparent 1px)',
            backgroundSize: '10px 10px',
            borderRadius: '8px',
          }}
        >
          <AnimatePresence>
            {canvasComponents.map((comp) => {
              const item = componentLibrary.find((ci) => ci.id === comp.componentId);
              if (!item) return null;

              return (
                <motion.div
                  key={comp.id}
                  className="absolute cursor-move"
                  style={{ zIndex: 10 }}
                  initial={false}
                  animate={{
                    x: comp.x,
                    y: comp.y,
                    scale: comp.scale,
                    rotate: comp.rotation,
                  }}
                  transition={{
                    type: 'spring',
                    stiffness: 300,
                    damping: 28,
                    mass: 0.8,
                  }}
                  drag
                  dragMomentum={false}
                  dragElastic={0}
                  onDragEnd={(_, info) => {
                    updateCanvasComponent(comp.id, {
                      x: comp.x + info.offset.x,
                      y: comp.y + info.offset.y,
                    });
                  }}
                  onDoubleClick={() => openEditModal(comp)}
                  whileDrag={{ opacity: 0.85 }}
                >
                  <div
                    style={{
                      transform: `scaleX(${comp.flipH ? -1 : 1}) scaleY(${comp.flipV ? -1 : 1})`,
                    }}
                  >
                    {renderShape(item.shape, comp.color, item.width, item.height)}
                  </div>

                  <div
                    className="absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 rounded-full bg-[#FF6B6B] border-2 border-white cursor-se-resize shadow-md hover:scale-125 transition-transform duration-150"
                    onMouseDown={(e) => handleResizeStart(e, comp.id, comp.scale)}
                  />
                </motion.div>
              );
            })}
          </AnimatePresence>

          {canvasComponents.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center text-[#bbb]">
                <div className="text-3xl mb-2">🎨</div>
                <div className="text-sm">从左侧拖拽组件到画布</div>
                <div className="text-xs mt-1 text-[#ccc]">或点击"随机灵感"开始创作</div>
              </div>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {editModalOpen && <EditModal />}
      </AnimatePresence>
    </div>
  );
}
