import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore, IceVessel } from '../store/useGameStore';
import { playPlaceSound } from '../utils/sound';

interface FogParticle {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
  vesselId: string;
}

interface DragState {
  isDragging: boolean;
  iceId: string | null;
  position: { x: number; y: number };
}

export const BanquetScene = () => {
  const { vessels, iceBlocks, backpack, placeIceToVessel } = useGameStore();
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    iceId: null,
    position: { x: 0, y: 0 },
  });
  const [dragOverVessel, setDragOverVessel] = useState<string | null>(null);
  const [fogParticles, setFogParticles] = useState<FogParticle[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const particleIdRef = useRef(0);
  const animationRef = useRef<number | null>(null);

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

  useEffect(() => {
    const updateFog = () => {
      setFogParticles(prev => {
        const coldVessels = vessels.filter(v => v.temperature < 20);

        const newParticles: FogParticle[] = [];
        coldVessels.forEach(vessel => {
          if (Math.random() < 0.3) {
            const vesselElement = document.querySelector(`[data-vessel-id="${vessel.id}"]`);
            if (vesselElement && containerRef.current) {
              const vesselRect = vesselElement.getBoundingClientRect();
              const containerRect = containerRef.current.getBoundingClientRect();

              newParticles.push({
                id: particleIdRef.current++,
                x: vesselRect.left - containerRect.left + vesselRect.width / 2 + (Math.random() - 0.5) * 40,
                y: vesselRect.top - containerRect.top,
                size: 2 + Math.random() * 2,
                opacity: 0.4 + Math.random() * 0.3,
                vesselId: vessel.id,
              });
            }
          }
        });

        const updated = [...prev, ...newParticles]
          .map(p => ({
            ...p,
            y: p.y - 0.5,
            opacity: p.opacity - 0.008,
            x: p.x + (Math.random() - 0.5) * 0.5,
          }))
          .filter(p => p.opacity > 0 && p.y > -50);

        if (updated.length > 200) {
          return updated.slice(-200);
        }
        return updated;
      });

      animationRef.current = requestAnimationFrame(updateFog);
    };

    animationRef.current = requestAnimationFrame(updateFog);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [vessels]);

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

    if (dragOverVessel) {
      const success = placeIceToVessel(dragState.iceId, dragOverVessel);
      if (success) {
        playPlaceSound();
      }
    }

    setDragState({ isDragging: false, iceId: null, position: { x: 0, y: 0 } });
    setDragOverVessel(null);
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
  }, [dragState.isDragging, dragOverVessel, dragState.iceId]);

  const getVesselLabel = (type: IceVessel['type']) => {
    switch (type) {
      case 'large': return '大鉴 · 酒坛';
      case 'medium': return '中鉴 · 瓜果';
      case 'small': return '小鉴 · 饮品';
    }
  };

  const draggingIce = dragState.iceId
    ? iceBlocks.find(b => b.id === dragState.iceId)
    : null;

  return (
    <div className="banquet-scene" ref={containerRef}>
      <div className="food-table" />

      <div className="vessels-container">
        {vessels.map(vessel => {
          const vesselIceBlocks = vessel.iceBlocks
            .map(id => iceBlocks.find(b => b.id === id))
            .filter(Boolean);
          const isCold = vessel.temperature < 20;

          return (
            <div key={vessel.id} className="ice-vessel" data-vessel-id={vessel.id}>
              <div className={`temperature-display ${isCold ? 'cold' : ''}`}>
                {vessel.temperature.toFixed(1)}°C
              </div>

              <div className={`vessel-body ${vessel.type}`}>
                <div className="vessel-rim" />

                <div
                  className={`vessel-slot-area ${dragOverVessel === vessel.id ? 'drag-over' : ''}`}
                  onMouseEnter={() => dragState.isDragging && setDragOverVessel(vessel.id)}
                  onMouseLeave={() => setDragOverVessel(null)}
                >
                  <AnimatePresence>
                    {vesselIceBlocks.map((ice) => ice && (
                      <motion.div
                        key={ice.id}
                        className="vessel-slot-ice"
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: ice.currentSize, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        style={{
                          transform: `scale(${ice.currentSize})`,
                        }}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              </div>

              <div className="vessel-label">{getVesselLabel(vessel.type)}</div>
            </div>
          );
        })}
      </div>

      <div className="fog-container">
        {fogParticles.map(particle => (
          <motion.div
            key={particle.id}
            className="fog-particle"
            style={{
              left: particle.x,
              top: particle.y,
              width: particle.size,
              height: particle.size,
              opacity: particle.opacity,
            }}
          />
        ))}
      </div>

      <div
        className="backpack"
        style={{
          position: 'absolute',
          right: 20,
          bottom: 20,
        }}
      >
        <div className="backpack-title">冰砖背包</div>
        <div className="backpack-grid">
          {Array.from({ length: 10 }, (_, i) => {
            const iceId = backpack[i];
            const iceBlock = iceId ? iceBlocks.find(b => b.id === iceId) : null;
            const isDraggingThis = dragState.iceId === iceId;

            return (
              <div key={i} className="backpack-slot">
                {iceBlock && (
                  <motion.div
                    className={`ice-brick ${isDraggingThis ? 'dragging' : ''}`}
                    onMouseDown={(e) => handleDragStart(e, iceBlock.id)}
                    onTouchStart={(e) => handleDragStart(e, iceBlock.id)}
                    animate={{ scale: 0.53 + iceBlock.currentSize * 0.3 }}
                    whileHover={{ scale: 0.7 + iceBlock.currentSize * 0.3 }}
                    transition={{ duration: 0.2 }}
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
