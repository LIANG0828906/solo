import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Building, useEditorStore } from './editorStore';

interface DragState {
  isDragging: boolean;
  startX: number;
  startY: number;
  buildingStartX: number;
  buildingStartY: number;
}

const BuildingBlock: React.FC<{
  building: Building;
  isSelected: boolean;
  onSelect: () => void;
  onDragStart: (e: React.MouseEvent) => void;
}> = ({ building, isSelected, onSelect, onDragStart }) => {
  const [animating, setAnimating] = useState(true);
  const prevDims = useRef({ width: building.width, height: building.height });

  useEffect(() => {
    setAnimating(true);
    const timer = setTimeout(() => setAnimating(false), 300);
    return () => clearTimeout(timer);
  }, [building.id, building.width, building.height]);

  useEffect(() => {
    if (
      prevDims.current.width !== building.width ||
      prevDims.current.height !== building.height
    ) {
      prevDims.current = { width: building.width, height: building.height };
      setAnimating(true);
      const timer = setTimeout(() => setAnimating(false), 300);
      return () => clearTimeout(timer);
    }
  }, [building.width, building.height]);

  return (
    <div
      className={`absolute cursor-move transition-all ${
        animating ? 'duration-300' : 'duration-150'
      }`}
      style={{
        left: building.x,
        top: building.y,
        width: building.width,
        height: building.height,
        backgroundColor: building.color,
        borderRadius: '2px 2px 0 0',
        boxShadow: isSelected
          ? '0 0 30px rgba(15, 52, 96, 0.9), 0 0 60px rgba(15, 52, 96, 0.4), inset 0 0 15px rgba(15, 52, 96, 0.5)'
          : '0 2px 8px rgba(0, 0, 0, 0.3)',
        border: isSelected ? '2px solid #0f3460' : '1px solid rgba(255,255,255,0.1)',
        transform: animating ? 'scale(1.02)' : 'scale(1)',
        transformOrigin: 'center bottom',
        transitionTimingFunction: animating
          ? 'cubic-bezier(0.34, 1.56, 0.64, 1)'
          : 'ease-out',
      }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      onMouseDown={onDragStart}
    >
      <div
        className="w-full h-full opacity-20"
        style={{
          background:
            'repeating-linear-gradient(0deg, transparent, transparent 8px, rgba(255,255,255,0.15) 8px, rgba(255,255,255,0.15) 10px), repeating-linear-gradient(90deg, transparent, transparent 10px, rgba(255,255,255,0.1) 10px, rgba(255,255,255,0.1) 11px)',
        }}
      />
    </div>
  );
};

const PropertyPanel: React.FC<{
  building: Building;
  onUpdate: (updates: Partial<Building>) => void;
}> = ({ building, onUpdate }) => {
  return (
    <div
      className="absolute top-4 right-4 w-64 p-5 rounded-2xl backdrop-blur-xl z-20"
      style={{
        background: 'rgba(255,255,255,0.08)',
        border: '1px solid rgba(255,255,255,0.12)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
      }}
    >
      <h3 className="text-white text-base font-semibold mb-5 flex items-center gap-2">
        <span
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: '#0f3460', boxShadow: '0 0 10px #0f3460' }}
        />
        建筑属性
      </h3>

      <div className="space-y-5">
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-gray-300 text-sm font-medium">高度</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={10}
                max={300}
                value={building.height}
                onChange={(e) => {
                  const val = Math.max(10, Math.min(300, Number(e.target.value)));
                  onUpdate({ height: val });
                }}
                className="w-16 px-2 py-1 text-xs text-center rounded-lg font-mono text-white bg-gray-800/80 border border-gray-600 focus:border-blue-500 focus:outline-none"
              />
              <span className="text-gray-500 text-xs">px</span>
            </div>
          </div>
          <input
            type="range"
            min={10}
            max={300}
            value={building.height}
            onChange={(e) => onUpdate({ height: Number(e.target.value) })}
            className="w-full h-2 rounded-lg appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, #0f3460 0%, #0f3460 ${
                ((building.height - 10) / 290) * 100
              }%, rgba(255,255,255,0.15) ${((building.height - 10) / 290) * 100}%, rgba(255,255,255,0.15) 100%)`,
              outline: 'none',
            }}
          />
          <div className="flex justify-between mt-1">
            <span className="text-gray-500 text-xs">10</span>
            <span className="text-gray-500 text-xs">300</span>
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-gray-300 text-sm font-medium">宽度</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={20}
                max={100}
                value={building.width}
                onChange={(e) => {
                  const val = Math.max(20, Math.min(100, Number(e.target.value)));
                  onUpdate({ width: val });
                }}
                className="w-16 px-2 py-1 text-xs text-center rounded-lg font-mono text-white bg-gray-800/80 border border-gray-600 focus:border-blue-500 focus:outline-none"
              />
              <span className="text-gray-500 text-xs">px</span>
            </div>
          </div>
          <input
            type="range"
            min={20}
            max={100}
            value={building.width}
            onChange={(e) => onUpdate({ width: Number(e.target.value) })}
            className="w-full h-2 rounded-lg appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, #0f3460 0%, #0f3460 ${
                ((building.width - 20) / 80) * 100
              }%, rgba(255,255,255,0.15) ${((building.width - 20) / 80) * 100}%, rgba(255,255,255,0.15) 100%)`,
              outline: 'none',
            }}
          />
          <div className="flex justify-between mt-1">
            <span className="text-gray-500 text-xs">20</span>
            <span className="text-gray-500 text-xs">100</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-gray-300 text-xs block mb-1">X 坐标</label>
            <input
              type="number"
              value={Math.round(building.x)}
              onChange={(e) => onUpdate({ x: Number(e.target.value) })}
              className="w-full px-3 py-2 text-sm rounded-lg text-white bg-gray-800/60 border border-gray-700 focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-gray-300 text-xs block mb-1">Y 坐标</label>
            <input
              type="number"
              value={Math.round(building.y)}
              onChange={(e) => onUpdate({ y: Number(e.target.value) })}
              className="w-full px-3 py-2 text-sm rounded-lg text-white bg-gray-800/60 border border-gray-700 focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export const Editor2D: React.FC = () => {
  const {
    buildings,
    selectedId,
    addBuilding,
    removeBuilding,
    updateBuilding,
    selectBuilding,
    clearAll,
    undo,
    redo,
    pushHistory,
  } = useEditorStore();

  const canvasRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState | null>(null);
  const dragBuildingId = useRef<string | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);

  const selectedBuilding = buildings.find((b) => b.id === selectedId);

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent) => {
      if (!canvasRef.current) return;

      const clickedBuilding = buildings.find((b) => {
        const bx = b.x;
        const by = b.y;
        const bw = b.width;
        const bh = b.height;
        const rect = canvasRef.current!.getBoundingClientRect();
        const cx = e.clientX - rect.left;
        const cy = e.clientY - rect.top;
        return cx >= bx && cx <= bx + bw && cy >= by && cy <= by + bh;
      });

      if (clickedBuilding) {
        selectBuilding(clickedBuilding.id);
        return;
      }

      const rect = canvasRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left - 25;
      const y = e.clientY - rect.top - 60;

      addBuilding({
        x: Math.max(0, Math.min(x, rect.width - 50)),
        y: Math.max(0, Math.min(y, rect.height - 120)),
        color: '#a0a0a0',
      });
    },
    [addBuilding, buildings, selectBuilding]
  );

  const handleBuildingDragStart = useCallback(
    (buildingId: string) => (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();

      const building = buildings.find((b) => b.id === buildingId);
      if (!building) return;

      selectBuilding(buildingId);
      pushHistory();

      dragBuildingId.current = buildingId;
      dragRef.current = {
        isDragging: false,
        startX: e.clientX,
        startY: e.clientY,
        buildingStartX: building.x,
        buildingStartY: building.y,
      };
    },
    [buildings, selectBuilding, pushHistory]
  );

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      setMousePos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });

      if (!dragRef.current || !dragBuildingId.current) return;

      const deltaX = e.clientX - dragRef.current.startX;
      const deltaY = e.clientY - dragRef.current.startY;

      if (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3) {
        dragRef.current.isDragging = true;
      }

      const building = buildings.find((b) => b.id === dragBuildingId.current);
      if (!building) return;

      let newX = dragRef.current.buildingStartX + deltaX;
      let newY = dragRef.current.buildingStartY + deltaY;

      newX = Math.max(0, Math.min(newX, rect.width - building.width));
      newY = Math.max(0, Math.min(newY, rect.height - building.height));

      updateBuilding(dragBuildingId.current, { x: newX, y: newY });
    };

    const handleMouseUp = () => {
      if (dragRef.current?.isDragging) {
        pushHistory();
      }
      dragRef.current = null;
      dragBuildingId.current = null;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [buildings, updateBuilding, pushHistory]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
        if (
          document.activeElement?.tagName !== 'INPUT' &&
          document.activeElement?.tagName !== 'TEXTAREA'
        ) {
          removeBuilding(selectedId);
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId, removeBuilding, undo, redo]);

  return (
    <div
      className="relative w-full h-full overflow-hidden rounded-2xl"
      style={{
        background:
          'linear-gradient(180deg, rgba(10, 15, 30, 0.4) 0%, rgba(5, 10, 20, 0.6) 100%)',
        border: '1px solid rgba(255,255,255,0.06)',
        boxShadow: 'inset 0 0 80px rgba(0,0,0,0.3)',
      }}
    >
      <div
        ref={canvasRef}
        className="absolute inset-0 cursor-crosshair"
        onClick={handleCanvasClick}
        onMouseLeave={() => setMousePos(null)}
        style={{ pointerEvents: 'auto' }}
      >
        <svg
          className="absolute inset-0 w-full h-full opacity-20"
          style={{ pointerEvents: 'none' }}
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern
              id="grid"
              width="40"
              height="40"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 40 0 L 0 0 0 40"
                fill="none"
                stroke="rgba(100, 150, 200, 0.3)"
                strokeWidth="0.5"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>

        <div
          className="absolute bottom-0 left-0 right-0 h-12"
          style={{
            pointerEvents: 'none',
            background:
              'linear-gradient(to top, rgba(30, 50, 80, 0.8), transparent)',
          }}
        />

        {buildings.map((building) => (
          <BuildingBlock
            key={building.id}
            building={building}
            isSelected={building.id === selectedId}
            onSelect={() => selectBuilding(building.id)}
            onDragStart={handleBuildingDragStart(building.id)}
          />
        ))}

        {mousePos && (
          <div
            className="absolute text-xs text-gray-400 px-3 py-1.5 rounded-lg"
            style={{
              pointerEvents: 'none',
              left: mousePos.x + 15,
              top: mousePos.y + 15,
              background: 'rgba(15, 52, 96, 0.7)',
              backdropFilter: 'blur(4px)',
            }}
          >
            {buildings.length === 0 ? '点击此处添加建筑' : '点击空白处添加建筑'}
          </div>
        )}
      </div>

      {selectedBuilding && (
        <PropertyPanel
          building={selectedBuilding}
          onUpdate={(updates) => {
            pushHistory();
            updateBuilding(selectedBuilding.id, updates);
          }}
        />
      )}

      <div
        className="absolute bottom-4 left-4 px-4 py-2 rounded-xl text-xs text-gray-400 backdrop-blur-md flex items-center gap-4"
        style={{ background: 'rgba(255,255,255,0.05)' }}
      >
        <span>建筑数量: <span className="text-white font-semibold">{buildings.length}</span></span>
        <span className="text-gray-600">|</span>
        <span>吸附: 20px</span>
      </div>
    </div>
  );
};
