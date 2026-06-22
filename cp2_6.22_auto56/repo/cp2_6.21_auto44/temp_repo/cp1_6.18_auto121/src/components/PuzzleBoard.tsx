import { useState, useRef, useEffect } from 'react';
import { usePuzzleStore } from '../store/puzzleStore';
import { getDecadeData } from '../data/cityData';
import type { Fragment } from '../engine/puzzleEngine';

interface DragState {
  fragment: Fragment;
  startX: number;
  startY: number;
  offsetX: number;
  offsetY: number;
  currentX: number;
  currentY: number;
}

export function PuzzleBoard() {
  const {
    placedFragments,
    unplacedFragments,
    phase,
    place,
  } = usePuzzleStore();

  const [dragState, setDragState] = useState<DragState | null>(null);
  const [hoveredCell, setHoveredCell] = useState<number | null>(null);
  const [celebrating, setCelebrating] = useState(false);
  const [particles, setParticles] = useState<{ id: number; x: number; y: number; size: number; color: string; delay: number }[]>([]);

  const boardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (phase === 'completed' && !celebrating) {
      setCelebrating(true);
      const newParticles = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        x: Math.random() * 500,
        y: Math.random() * 500,
        size: 3 + Math.random() * 3,
        color: ['#FFD700', '#FF6B6B', '#45B7D1'][Math.floor(Math.random() * 3)],
        delay: Math.random() * 0.5,
      }));
      setParticles(newParticles);
    }
  }, [phase, celebrating]);

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      if (!dragState) return;
      setDragState({
        ...dragState,
        currentX: e.clientX - dragState.offsetX,
        currentY: e.clientY - dragState.offsetY,
      });
    };

    const handleUp = (e: MouseEvent) => {
      if (!dragState || !boardRef.current) {
        setDragState(null);
        setHoveredCell(null);
        return;
      }

      const boardRect = boardRef.current.getBoundingClientRect();
      const cells = boardRef.current.querySelectorAll<HTMLDivElement>('[data-cell]');
      let placed = false;

      cells.forEach((cell) => {
        const rect = cell.getBoundingClientRect();
        const centerX = e.clientX;
        const centerY = e.clientY;
        if (
          centerX >= rect.left &&
          centerX <= rect.right &&
          centerY >= rect.top &&
          centerY <= rect.bottom
        ) {
          const pos = parseInt(cell.dataset.cell || '-1', 10);
          if (pos >= 0) {
            const success = place(dragState.fragment.id, pos);
            if (success) {
              placed = true;
            }
          }
        }
      });

      if (!placed) {
        setHoveredCell(null);
      }
      setDragState(null);
    };

    if (dragState) {
      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseup', handleUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, [dragState, place]);

  const handleDragStart = (e: React.MouseEvent, fragment: Fragment) => {
    if (phase === 'completed') return;
    const target = e.currentTarget as HTMLDivElement;
    const rect = target.getBoundingClientRect();
    setDragState({
      fragment,
      startX: e.clientX,
      startY: e.clientY,
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top,
      currentX: e.clientX - (e.clientX - rect.left),
      currentY: e.clientY - (e.clientY - rect.top),
    });
  };

  const renderFragment = (fragment: Fragment, inGrid = false) => {
    const decadeData = getDecadeData(fragment.decade);
    const isDragging = dragState?.fragment.id === fragment.id;

    return (
      <div
        key={fragment.id}
        draggable={false}
        onMouseDown={(e) => !inGrid && handleDragStart(e, fragment)}
        className="relative flex flex-col items-center justify-center text-white text-xs font-medium cursor-grab select-none"
        style={{
          width: 64,
          height: 64,
          backgroundColor: decadeData.color,
          borderRadius: 4,
          transition: 'all 0.3s ease-in-out',
          transform: isDragging ? 'scale(1.05)' : 'scale(1)',
          opacity: isDragging ? 0.7 : 1,
          boxShadow: isDragging
            ? '0 4px 12px rgba(0,0,0,0.3)'
            : '0 1px 3px rgba(0,0,0,0.2)',
          cursor: inGrid ? 'default' : 'grab',
          zIndex: isDragging ? 1000 : 1,
          animation: celebrating && inGrid ? 'celebrate 1s ease-in-out' : undefined,
        }}
      >
        <span className="text-center leading-tight px-1 text-[10px] font-semibold">
          {fragment.label}
        </span>
        <span className="text-[8px] opacity-80 mt-0.5">
          {decadeData.label}
        </span>
      </div>
    );
  };

  return (
    <div className="flex flex-col md:flex-row gap-4 w-full h-full">
      <div
        className="flex-1 bg-[#2D2D44] rounded-xl p-6 flex flex-col items-center justify-center relative overflow-hidden"
        ref={boardRef}
        style={{
          minHeight: 400,
          background: celebrating
            ? 'linear-gradient(135deg, #8B4513 0%, #FFD700 100%)'
            : '#2D2D44',
          transition: 'background 1s ease-in-out',
        }}
      >
        {celebrating && particles.map((p) => (
          <div
            key={p.id}
            className="absolute rounded-full pointer-events-none"
            style={{
              left: `calc(50% - 250px + ${p.x}px)`,
              top: `calc(50% - 250px + ${p.y}px)`,
              width: p.size,
              height: p.size,
              backgroundColor: p.color,
              opacity: 0,
              animation: `particle 2s ease-out ${p.delay}s forwards`,
            }}
          />
        ))}

        <div className="text-white text-sm mb-4 opacity-70">
          {phase === 'completed' ? '✨ 拼图完成！时光重现 ✨' : '拖拽碎片至对应位置'}
        </div>

        <div
          className="grid gap-2"
          style={{
            gridTemplateColumns: 'repeat(3, 64px)',
            gridTemplateRows: 'repeat(3, 64px)',
            gap: 8,
          }}
        >
          {Array.from({ length: 9 }, (_, i) => {
            const placed = placedFragments[i];
            const isHovered = hoveredCell === i;
            return (
              <div
                key={i}
                data-cell={i}
                className="rounded flex items-center justify-center"
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 4,
                  backgroundColor: placed ? 'transparent' : isHovered ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.05)',
                  border: placed ? 'none' : '2px dashed rgba(255,255,255,0.2)',
                  transition: 'all 0.3s ease-in-out',
                }}
              >
                {placed && renderFragment(placed, true)}
              </div>
            );
          })}
        </div>
      </div>

      <div
        className="md:w-72 w-full bg-[#3D3D5C] rounded-xl p-4 overflow-auto"
        style={{ minHeight: 400 }}
      >
        <div className="text-white text-sm font-semibold mb-3 opacity-90">备选碎片</div>
        <div className="flex flex-wrap gap-2 justify-center">
          {unplacedFragments.map((f) => renderFragment(f))}
          {unplacedFragments.length === 0 && (
            <div className="text-white/50 text-sm py-8">所有碎片已归位</div>
          )}
        </div>
      </div>

      {dragState && (
        <div
          className="fixed pointer-events-none"
          style={{
            left: dragState.currentX,
            top: dragState.currentY,
            zIndex: 9999,
          }}
        >
          {renderFragment(dragState.fragment)}
        </div>
      )}
    </div>
  );
}
