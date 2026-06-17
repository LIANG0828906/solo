import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import type { ColorStop } from '@/types';
import { generateGradient, clampPosition } from '@/engine/gradientEngine';

interface GradientCanvasProps {
  colorStops: ColorStop[];
  angle: number;
  selectedStopId: string | null;
  onColorStopsChange: (stops: ColorStop[]) => void;
  onStopSelect: (id: string | null) => void;
  onAddStop: (stop: ColorStop) => void;
  maxStops?: number;
}

const GradientCanvas: React.FC<GradientCanvasProps> = ({
  colorStops,
  angle,
  selectedStopId,
  onColorStopsChange,
  onStopSelect,
  onAddStop,
  maxStops = 6,
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const gradient = generateGradient(colorStops, angle);

  const handleMouseDown = useCallback((e: React.MouseEvent, stopId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDraggingId(stopId);
    onStopSelect(stopId);
  }, [onStopSelect]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!draggingId || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const position = clampPosition(Math.round((x / rect.width) * 100));

    onColorStopsChange(
      colorStops.map(stop =>
        stop.id === draggingId ? { ...stop, position } : stop
      )
    );
  }, [draggingId, colorStops, onColorStopsChange]);

  const handleMouseUp = useCallback(() => {
    setDraggingId(null);
  }, []);

  useEffect(() => {
    if (draggingId) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [draggingId, handleMouseMove, handleMouseUp]);

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (colorStops.length >= maxStops) return;
    if ((e.target as HTMLElement).dataset.stopId) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const position = clampPosition(Math.round((x / rect.width) * 100));

    const existingPositions = colorStops.map(s => s.position);
    if (existingPositions.includes(position)) return;

    const randomColor = '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
    
    onAddStop({
      id: uuidv4(),
      color: randomColor,
      position,
    });
  }, [colorStops, maxStops, onAddStop]);

  const sortedStops = [...colorStops].sort((a, b) => a.position - b.position);

  return (
    <div className="relative w-full h-full flex flex-col gap-4">
      <div
        ref={canvasRef}
        className="relative flex-1 rounded-xl overflow-hidden cursor-crosshair select-none"
        style={{
          background: gradient.cssString,
          minHeight: '300px',
          transition: 'background 100ms ease',
        }}
        onClick={handleCanvasClick}
      >
        {colorStops.length < maxStops && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 hover:opacity-100 transition-opacity">
            <div className="flex items-center gap-2 bg-black/30 px-4 py-2 rounded-full text-white/70 text-sm backdrop-blur-sm">
              <Plus size={16} />
              <span>点击添加色标</span>
            </div>
          </div>
        )}

        {sortedStops.map((stop) => (
          <div
            key={stop.id}
            data-stop-id={stop.id}
            className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 cursor-grab active:cursor-grabbing rounded-full border-2 border-black transition-all duration-200 ${
              selectedStopId === stop.id ? 'ring-2 ring-white ring-offset-2 ring-offset-transparent scale-110' : ''
            } ${draggingId === stop.id ? 'shadow-lg shadow-black/50 scale-110' : ''}`}
            style={{
              left: `${stop.position}%`,
              width: '16px',
              height: '16px',
              backgroundColor: stop.color,
              zIndex: selectedStopId === stop.id || draggingId === stop.id ? 10 : 1,
            }}
            onMouseDown={(e) => handleMouseDown(e, stop.id)}
            onClick={(e) => {
              e.stopPropagation();
              onStopSelect(stop.id);
            }}
          />
        ))}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
        {sortedStops.map((stop) => (
          <div
            key={stop.id}
            className={`flex-shrink-0 w-10 h-10 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
              selectedStopId === stop.id
                ? 'border-white scale-110 shadow-lg'
                : 'border-transparent hover:border-white/50'
            }`}
            style={{ backgroundColor: stop.color }}
            onClick={() => onStopSelect(stop.id)}
            title={`位置: ${stop.position}%`}
          />
        ))}
      </div>
    </div>
  );
};

export default React.memo(GradientCanvas);
