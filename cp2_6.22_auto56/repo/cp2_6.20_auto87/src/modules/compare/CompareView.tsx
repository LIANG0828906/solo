import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Building } from '../editor/editorStore';

interface CompareViewProps {
  leftBuildings: Building[];
  rightBuildings: Building[];
  leftTitle?: string;
  rightTitle?: string;
  onClose: () => void;
}

const MiniCanvas: React.FC<{
  buildings: Building[];
  title: string;
  highlight?: Building[];
  side: 'left' | 'right';
}> = ({ buildings, title, highlight = [], side }) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const updateScale = () => {
      if (!canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const maxX = Math.max(...buildings.map((b) => b.x + b.width), 800);
      const maxY = Math.max(...buildings.map((b) => b.y + b.height), 500);
      const scaleX = rect.width / (maxX + 100);
      const scaleY = rect.height / (maxY + 100);
      const s = Math.min(scaleX, scaleY, 1.5);
      setScale(s);
      setOffset({
        x: (rect.width - maxX * s) / 2,
        y: rect.height - maxY * s - 20,
      });
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, [buildings]);

  const highlightIds = new Set(highlight.map((b) => b.id));

  return (
    <div className="flex flex-col h-full w-full">
      <div
        className="px-5 py-3 flex items-center gap-3"
        style={{
          background:
            side === 'left'
              ? 'linear-gradient(90deg, rgba(15, 52, 96, 0.8), rgba(15, 52, 96, 0.4))'
              : 'linear-gradient(90deg, rgba(233, 69, 96, 0.4), rgba(233, 69, 96, 0.8))',
        }}
      >
        <span
          className={`w-3 h-3 rounded-full ${
            side === 'left' ? 'bg-blue-400' : 'bg-pink-400'
          }`}
          style={{
            boxShadow:
              side === 'left'
                ? '0 0 10px rgba(100, 180, 255, 0.8)'
                : '0 0 10px rgba(255, 150, 180, 0.8)',
          }}
        />
        <span className="text-white text-sm font-semibold">{title}</span>
        <span className="text-xs text-gray-300 ml-auto">
          {buildings.length} 栋建筑
        </span>
      </div>

      <div
        ref={canvasRef}
        className="relative flex-1 overflow-hidden"
        style={{
          background:
            'linear-gradient(180deg, rgba(10, 15, 30, 0.6) 0%, rgba(5, 10, 20, 0.8) 100%)',
        }}
      >
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none opacity-10"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern
              id={`grid-${side}`}
              width="40"
              height="40"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 40 0 L 0 0 0 40"
                fill="none"
                stroke="rgba(100, 150, 200, 0.5)"
                strokeWidth="0.5"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill={`url(#grid-${side})`} />
        </svg>

        {buildings.map((building) => {
          const isHighlighted = highlightIds.has(building.id);
          return (
            <div
              key={building.id}
              className="absolute transition-all duration-200"
              style={{
                left: offset.x + building.x * scale,
                top: offset.y + building.y * scale,
                width: building.width * scale,
                height: building.height * scale,
                backgroundColor: building.color,
                borderRadius: '1px 1px 0 0',
                boxShadow: isHighlighted
                  ? `0 0 12px ${
                      side === 'left' ? 'rgba(100, 180, 255, 0.9)' : 'rgba(255, 150, 180, 0.9)'
                    }, inset 0 0 6px rgba(255,255,255,0.3)`
                  : '0 1px 4px rgba(0,0,0,0.3)',
                border: isHighlighted
                  ? `2px solid ${side === 'left' ? '#64b4ff' : '#ff96b4'}`
                  : '1px solid rgba(255,255,255,0.08)',
                animation: isHighlighted ? 'pulse 1.5s ease-in-out infinite' : 'none',
              }}
            >
              <div
                className="w-full h-full opacity-30"
                style={{
                  background:
                    'repeating-linear-gradient(0deg, transparent, transparent 4px, rgba(255,255,255,0.1) 4px, rgba(255,255,255,0.1) 5px)',
                }}
              />
            </div>
          );
        })}

        {buildings.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-gray-500 text-sm">
            暂无建筑数据
          </div>
        )}
      </div>
    </div>
  );
};

export const CompareView: React.FC<CompareViewProps> = ({
  leftBuildings,
  rightBuildings,
  leftTitle = '当前方案',
  rightTitle = '对比方案',
  onClose,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dividerX, setDividerX] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [showDiff, setShowDiff] = useState(true);

  const diffBuildings = useCallback(
    (source: Building[], target: Building[]): Building[] => {
      return source.filter((sb) => {
        return !target.some(
          (tb) =>
            Math.abs(sb.x - tb.x) < 30 &&
            Math.abs(sb.y - tb.y) < 30 &&
            Math.abs(sb.width - tb.width) < 20 &&
            Math.abs(sb.height - tb.height) < 30
        );
      });
    },
    []
  );

  const leftDiff = showDiff ? diffBuildings(leftBuildings, rightBuildings) : [];
  const rightDiff = showDiff ? diffBuildings(rightBuildings, leftBuildings) : [];

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      setDividerX(Math.max(15, Math.min(85, x)));
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full rounded-2xl overflow-hidden"
      style={{
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 8px 40px rgba(0,0,0,0.4)',
      }}
    >
      <div
        className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-4 px-5 py-2.5 rounded-2xl backdrop-blur-xl"
        style={{ background: 'rgba(255,255,255,0.08)' }}
      >
        <button
          onClick={() => setDividerX(50)}
          className="text-xs text-gray-300 hover:text-white px-3 py-1.5 rounded-lg hover:bg-white/10 transition-all"
        >
          均分
        </button>
        <div className="w-px h-4 bg-gray-600" />
        <button
          onClick={() => setShowDiff(!showDiff)}
          className={`text-xs px-3 py-1.5 rounded-lg transition-all flex items-center gap-2 ${
            showDiff
              ? 'bg-pink-500/30 text-pink-200'
              : 'text-gray-300 hover:text-white hover:bg-white/10'
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              showDiff ? 'bg-pink-400 animate-pulse' : 'bg-gray-500'
            }`}
          />
          差异高亮
        </button>
        <div className="w-px h-4 bg-gray-600" />
        <button
          onClick={onClose}
          className="text-xs text-gray-300 hover:text-red-400 px-3 py-1.5 rounded-lg hover:bg-red-500/10 transition-all"
        >
          关闭对比
        </button>
      </div>

      <div
        className="absolute left-0 top-0 bottom-0 overflow-hidden"
        style={{ width: `${dividerX}%` }}
      >
        <div className="w-full h-full">
          <MiniCanvas
            buildings={leftBuildings}
            title={leftTitle}
            highlight={leftDiff}
            side="left"
          />
        </div>
      </div>

      <div
        className="absolute right-0 top-0 bottom-0 overflow-hidden"
        style={{ width: `${100 - dividerX}%` }}
      >
        <div
          className="h-full"
          style={{ width: `${10000 / (100 - dividerX)}%` }}
        >
          <MiniCanvas
            buildings={rightBuildings}
            title={rightTitle}
            highlight={rightDiff}
            side="right"
          />
        </div>
      </div>

      <div
        className={`absolute top-0 bottom-0 z-20 cursor-ew-resize transition-colors duration-200 ${
          isDragging ? 'bg-[#e94560]' : ''
        }`}
        style={{
          left: `${dividerX}%`,
          transform: 'translateX(-50%)',
          width: isDragging ? '6px' : '2px',
          backgroundColor: isDragging ? '#e94560' : 'rgba(255,255,255,0.2)',
          boxShadow: isDragging
            ? '0 0 20px rgba(233, 69, 96, 0.6)'
            : 'none',
        }}
        onMouseDown={handleMouseDown}
      >
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-xl flex items-center justify-center backdrop-blur-md"
          style={{
            background: isDragging ? 'rgba(233, 69, 96, 0.8)' : 'rgba(255,255,255,0.1)',
            border: isDragging
              ? '2px solid #e94560'
              : '1px solid rgba(255,255,255,0.2)',
          }}
        >
          <div className="flex gap-1">
            <span
              className={`w-0.5 h-4 rounded-full ${
                isDragging ? 'bg-white' : 'bg-gray-400'
              }`}
            />
            <span
              className={`w-0.5 h-4 rounded-full ${
                isDragging ? 'bg-white' : 'bg-gray-400'
              }`}
            />
          </div>
        </div>
      </div>

      <div className="absolute bottom-4 left-4 right-4 flex justify-between pointer-events-none">
        <div
          className="px-3 py-1.5 rounded-lg text-xs backdrop-blur-md"
          style={{ background: 'rgba(15, 52, 96, 0.6)' }}
        >
          <span className="text-blue-300">差异: {leftDiff.length}</span>
          <span className="text-gray-400 ml-2">处不同</span>
        </div>
        <div
          className="px-3 py-1.5 rounded-lg text-xs backdrop-blur-md"
          style={{ background: 'rgba(233, 69, 96, 0.4)' }}
        >
          <span className="text-pink-300">差异: {rightDiff.length}</span>
          <span className="text-gray-400 ml-2">处不同</span>
        </div>
      </div>
    </div>
  );
};
