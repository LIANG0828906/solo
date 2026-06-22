import { useState, useCallback, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../store/useGameStore';
import { playDropSound } from '../utils/sound';

interface DragState {
  isDragging: boolean;
  iceId: string | null;
  position: { x: number; y: number };
}

export const IceStorage = () => {
  const { iceBlocks, backpack, takeIceFromStorage } = useGameStore();
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    iceId: null,
    position: { x: 0, y: 0 },
  });
  const [dragOverBackpack, setDragOverBackpack] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const storageIceBlocks = iceBlocks.filter(b => b.location === 'storage');

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (dragState.isDragging && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setDragState(prev => ({
        ...prev,
        position: {
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        },
      }));
    }
  }, [dragState.isDragging]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (dragState.isDragging && containerRef.current && e.touches[0]) {
      const rect = containerRef.current.getBoundingClientRect();
      setDragState(prev => ({
        ...prev,
        position: {
          x: e.touches[0].clientX - rect.left,
          y: e.touches[0].clientY - rect.top,
        },
      }));
    }
  }, [dragState.isDragging]);

  useEffect(() => {
    if (dragState.isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('touchmove', handleTouchMove, { passive: false });
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('touchmove', handleTouchMove);
      };
    }
  }, [dragState.isDragging, handleMouseMove, handleTouchMove]);

  const handleDragStart = (e: React.MouseEvent | React.TouchEvent, iceId: string) => {
    e.preventDefault();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setDragState({
        isDragging: true,
        iceId,
        position: {
          x: clientX - rect.left,
          y: clientY - rect.top,
        },
      });
    }
  };

  const handleDragEnd = () => {
    if (!dragState.isDragging || !dragState.iceId) {
      setDragState({ isDragging: false, iceId: null, position: { x: 0, y: 0 } });
      return;
    }

    if (dragOverBackpack) {
      const success = takeIceFromStorage(dragState.iceId);
      if (success) {
        playDropSound();
      }
    }

    setDragState({ isDragging: false, iceId: null, position: { x: 0, y: 0 } });
    setDragOverBackpack(false);
  };

  useEffect(() => {
    const handleMouseUp = () => handleDragEnd();
    const handleTouchEnd = () => handleDragEnd();

    if (dragState.isDragging) {
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchend', handleTouchEnd);
      return () => {
        window.removeEventListener('mouseup', handleMouseUp);
        window.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [dragState.isDragging, dragOverBackpack, dragState.iceId]);

  const draggingIce = dragState.iceId
    ? iceBlocks.find(b => b.id === dragState.iceId)
    : null;

  return (
    <div className="ice-storage" ref={containerRef}>
      <div className="ice-pile-container">
        {Array.from({ length: 30 }, (_, i) => {
          const iceId = `ice-${i}`;
          const iceBlock = storageIceBlocks.find(b => b.id === iceId);
          const isTaken = !iceBlock || iceBlock.location !== 'storage';
          const isDraggingThis = dragState.iceId === iceId;

          return (
            <motion.div
              key={iceId}
              className={`ice-brick ${isTaken ? 'taken' : ''} ${isDraggingThis ? 'dragging' : ''}`}
              onMouseDown={(e) => !isTaken && handleDragStart(e, iceId)}
              onTouchStart={(e) => !isTaken && handleDragStart(e, iceId)}
              style={{
                opacity: isTaken ? 0 : 1,
                transform: isDraggingThis ? 'scale(0.8)' : undefined,
              }}
              animate={isTaken ? { scale: 0, opacity: 0 } : { scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
              whileHover={!isTaken && !isDraggingThis ? { scale: 1.1 } : {}}
            />
          );
        })}
      </div>

      <div
        className={`backpack-slot backpack ${dragOverBackpack ? 'drag-over' : ''}`}
        onMouseEnter={() => dragState.isDragging && setDragOverBackpack(true)}
        onMouseLeave={() => setDragOverBackpack(false)}
        style={{ position: 'absolute', right: 20, bottom: 20, padding: 0, width: 'auto', height: 'auto', background: 'none', border: 'none' }}
      >
        <div className="backpack" style={{ position: 'relative', right: 0, bottom: 0 }}>
          <div className="backpack-title">冰砖背包</div>
          <div className="backpack-grid">
            {Array.from({ length: 10 }, (_, i) => {
              const iceId = backpack[i];
              const iceBlock = iceId ? iceBlocks.find(b => b.id === iceId) : null;

              return (
                <div key={i} className="backpack-slot">
                  {iceBlock && (
                    <motion.div
                      className="ice-brick"
                      style={{
                        transform: `scale(${0.53 + iceBlock.currentSize * 0.3})`,
                      }}
                      animate={{ scale: 0.53 + iceBlock.currentSize * 0.3 }}
                      transition={{ duration: 0.3 }}
                    />
                  )}
                </div>
              );
            })}
          </div>
          <div className="backpack-count">
            {backpack.length} / 10 块
          </div>
        </div>
      </div>

      {dragState.isDragging && draggingIce && (
        <motion.div
          className="ice-brick dragging"
          style={{
            position: 'fixed',
            left: dragState.position.x - 24,
            top: dragState.position.y - 24,
            width: 48,
            height: 48,
            pointerEvents: 'none',
            zIndex: 9999,
          }}
          animate={{ scale: 0.8 }}
        />
      )}
    </div>
  );
};
