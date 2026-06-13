import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { Pipette, X } from 'lucide-react';
import type { MosaicCell, GridType } from '../generator';
import { updateCellColor, updateRegionColor } from '../generator';

interface CanvasViewProps {
  cells: MosaicCell[];
  gridType: GridType;
  palette: string[];
  canvasWidth: number;
  canvasHeight: number;
  density: number;
  onCellsChange: (cells: MosaicCell[]) => void;
}

interface SelectionBox {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

export const CanvasView: React.FC<CanvasViewProps> = ({
  cells,
  gridType,
  palette,
  canvasWidth,
  canvasHeight,
  density,
  onCellsChange,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedCell, setSelectedCell] = useState<MosaicCell | null>(null);
  const [pickerPosition, setPickerPosition] = useState({ x: 0, y: 0 });
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionBox, setSelectionBox] = useState<SelectionBox | null>(null);
  const [selectionStartCell, setSelectionStartCell] = useState<{
    row: number;
    col: number;
  } | null>(null);
  const [animatingCells, setAnimatingCells] = useState<Set<string>>(new Set());
  const [currentColor, setCurrentColor] = useState(palette[0]);
  const [eyedropperActive, setEyedropperActive] = useState(false);

  const rows = useMemo(() => {
    return Math.floor(density * (canvasHeight / canvasWidth));
  }, [density, canvasHeight, canvasWidth]);

  const cols = density;

  const getCellPath = useCallback((cell: MosaicCell): string => {
    const { x, y, width, height, shape, scale } = cell;
    const cx = x + width / 2;
    const cy = y + height / 2;
    const w = width * scale;
    const h = height * scale;

    if (shape === 'square') {
      const rx = cx - w / 2;
      const ry = cy - h / 2;
      const r = Math.min(2, w * 0.15);
      return `M ${rx + r} ${ry}
              L ${rx + w - r} ${ry}
              Q ${rx + w} ${ry} ${rx + w} ${ry + r}
              L ${rx + w} ${ry + h - r}
              Q ${rx + w} ${ry + h} ${rx + w - r} ${ry + h}
              L ${rx + r} ${ry + h}
              Q ${rx} ${ry + h} ${rx} ${ry + h - r}
              L ${rx} ${ry + r}
              Q ${rx} ${ry} ${rx + r} ${ry} Z`;
    }

    if (shape === 'hexagon') {
      const hw = w / 2;
      const hh = h / 2;
      const points = [
        { x: cx + hw * 0.5, y: cy - hh },
        { x: cx + hw, y: cy },
        { x: cx + hw * 0.5, y: cy + hh },
        { x: cx - hw * 0.5, y: cy + hh },
        { x: cx - hw, y: cy },
        { x: cx - hw * 0.5, y: cy - hh },
      ];
      return 'M ' + points.map((p) => `${p.x} ${p.y}`).join(' L ') + ' Z';
    }

    if (shape === 'triangle') {
      const hw = w / 2;
      const hh = h / 2;
      const points = [
        { x: cx, y: cy - hh },
        { x: cx + hw, y: cy + hh },
        { x: cx - hw, y: cy + hh },
      ];
      return 'M ' + points.map((p) => `${p.x} ${p.y}`).join(' L ') + ' Z';
    }

    return '';
  }, []);

  const getCellAtPosition = useCallback(
    (clientX: number, clientY: number): MosaicCell | null => {
      if (!svgRef.current) return null;

      const rect = svgRef.current.getBoundingClientRect();
      const scaleX = canvasWidth / rect.width;
      const scaleY = canvasHeight / rect.height;
      const x = (clientX - rect.left) * scaleX;
      const y = (clientY - rect.top) * scaleY;

      let nearestCell: MosaicCell | null = null;
      let minDist = Infinity;

      for (const cell of cells) {
        const cx = cell.x + cell.width / 2;
        const cy = cell.y + cell.height / 2;
        const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
        if (dist < minDist && dist < cell.width * 0.7) {
          minDist = dist;
          nearestCell = cell;
        }
      }

      return nearestCell;
    },
    [cells, canvasWidth, canvasHeight]
  );

  const handleCellClick = useCallback(
    (e: React.MouseEvent, cell: MosaicCell) => {
      e.stopPropagation();

      if (eyedropperActive) {
        setCurrentColor(cell.color);
        setEyedropperActive(false);
        return;
      }

      const rect = svgRef.current?.getBoundingClientRect();
      if (rect) {
        setPickerPosition({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top + 10,
        });
      }
      setSelectedCell(cell);
    },
    [eyedropperActive]
  );

  const handleColorPick = useCallback(
    (color: string) => {
      if (selectedCell) {
        const newCells = updateCellColor(
          cells,
          selectedCell.row,
          selectedCell.col,
          color
        );
        setAnimatingCells(new Set([selectedCell.id]));
        onCellsChange(newCells);

        setTimeout(() => {
          setAnimatingCells(new Set());
        }, 200);
      }
      setSelectedCell(null);
    },
    [selectedCell, cells, onCellsChange]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (eyedropperActive) return;
      if (e.button !== 0) return;
      if (selectedCell) {
        setSelectedCell(null);
        return;
      }

      const cell = getCellAtPosition(e.clientX, e.clientY);
      if (cell) {
        setIsSelecting(true);
        setSelectionStartCell({ row: cell.row, col: cell.col });
        const rect = svgRef.current?.getBoundingClientRect();
        if (rect) {
          setSelectionBox({
            startX: e.clientX - rect.left,
            startY: e.clientY - rect.top,
            endX: e.clientX - rect.left,
            endY: e.clientY - rect.top,
          });
        }
      }
    },
    [eyedropperActive, selectedCell, getCellAtPosition]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isSelecting) return;

      const rect = svgRef.current?.getBoundingClientRect();
      if (rect) {
        setSelectionBox((prev) =>
          prev
            ? {
                ...prev,
                endX: e.clientX - rect.left,
                endY: e.clientY - rect.top,
              }
            : null
        );
      }
    },
    [isSelecting]
  );

  const handleMouseUp = useCallback(
    (e: React.MouseEvent) => {
      if (!isSelecting || !selectionStartCell || !selectionBox) {
        setIsSelecting(false);
        setSelectionBox(null);
        setSelectionStartCell(null);
        return;
      }

      const endCell = getCellAtPosition(e.clientX, e.clientY);
      if (endCell) {
        const distance = Math.sqrt(
          (endCell.row - selectionStartCell.row) ** 2 +
            (endCell.col - selectionStartCell.col) ** 2
        );

        if (distance > 1) {
          const newCells = updateRegionColor(
            cells,
            selectionStartCell.row,
            selectionStartCell.col,
            endCell.row,
            endCell.col,
            currentColor
          );

          const affectedIds = new Set<string>();
          const minRow = Math.min(selectionStartCell.row, endCell.row);
          const maxRow = Math.max(selectionStartCell.row, endCell.row);
          const minCol = Math.min(selectionStartCell.col, endCell.col);
          const maxCol = Math.max(selectionStartCell.col, endCell.col);

          for (let r = minRow; r <= maxRow; r++) {
            for (let c = minCol; c <= maxCol; c++) {
              affectedIds.add(`cell-${r}-${c}`);
            }
          }

          setAnimatingCells(affectedIds);
          onCellsChange(newCells);

          setTimeout(() => {
            setAnimatingCells(new Set());
          }, 200);
        } else {
          const cell = getCellAtPosition(e.clientX, e.clientY);
          if (cell) {
            handleCellClick(e, cell);
          }
        }
      }

      setIsSelecting(false);
      setSelectionBox(null);
      setSelectionStartCell(null);
    },
    [
      isSelecting,
      selectionStartCell,
      selectionBox,
      cells,
      currentColor,
      getCellAtPosition,
      handleCellClick,
      onCellsChange,
    ]
  );

  const handleBgClick = useCallback(() => {
    setSelectedCell(null);
  }, []);

  const toggleEyedropper = useCallback(() => {
    setEyedropperActive((prev) => !prev);
    setSelectedCell(null);
  }, []);

  const selectedCells = useMemo(() => {
    if (!selectionBox || !selectionStartCell || !isSelecting) return new Set<string>();
    
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return new Set<string>();

    const scaleX = canvasWidth / rect.width;
    const scaleY = canvasHeight / rect.height;

    const x1 = Math.min(selectionBox.startX, selectionBox.endX) * scaleX;
    const x2 = Math.max(selectionBox.startX, selectionBox.endX) * scaleX;
    const y1 = Math.min(selectionBox.startY, selectionBox.endY) * scaleY;
    const y2 = Math.max(selectionBox.startY, selectionBox.endY) * scaleY;

    const selected = new Set<string>();
    for (const cell of cells) {
      const cx = cell.x + cell.width / 2;
      const cy = cell.y + cell.height / 2;
      if (cx >= x1 && cx <= x2 && cy >= y1 && cy <= y2) {
        selected.add(cell.id);
      }
    }
    return selected;
  }, [selectionBox, selectionStartCell, isSelecting, cells, canvasWidth, canvasHeight]);

  useEffect(() => {
    if (palette.length > 0 && !palette.includes(currentColor)) {
      setCurrentColor(palette[0]);
    }
  }, [palette, currentColor]);

  return (
    <div
      ref={containerRef}
      className={`flex-1 relative overflow-hidden ${
        eyedropperActive ? 'cursor-crosshair' : 'cursor-default'
      }`}
      style={{
        background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)',
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={() => {
        setIsSelecting(false);
        setSelectionBox(null);
        setSelectionStartCell(null);
      }}
      onClick={handleBgClick}
    >
      <div className="absolute inset-0 flex items-center justify-center p-8">
        <div className="relative w-full h-full flex items-center justify-center">
          <svg
            ref={svgRef}
            viewBox={`0 0 ${canvasWidth} ${canvasHeight}`}
            preserveAspectRatio="xMidYMid meet"
            className="max-w-full max-h-full"
            style={{
              filter: 'drop-shadow(0 20px 60px rgba(0, 0, 0, 0.5))',
            }}
          >
            <defs>
              <linearGradient id="canvasBg" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#1a1a2e" />
                <stop offset="100%" stopColor="#16213e" />
              </linearGradient>

              <filter id="innerShadow" x="-10%" y="-10%" width="120%" height="120%">
                <feGaussianBlur in="SourceAlpha" stdDeviation="0.5" />
                <feOffset dx="0" dy="0" result="offsetblur" />
                <feComposite in2="offsetblur" operator="arithmetic" k2="-1" k3="1" result="shadowDiff" />
                <feFlood floodColor="#000000" floodOpacity="0.4" />
                <feComposite in2="shadowDiff" operator="in" />
                <feComposite in="SourceGraphic" operator="over" />
              </filter>

              <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            <rect
              x="0"
              y="0"
              width={canvasWidth}
              height={canvasHeight}
              rx="8"
              fill="url(#canvasBg)"
            />

            <g>
              {cells.map((cell) => {
                const isSelected = selectedCells.has(cell.id);
                const isAnimating = animatingCells.has(cell.id);
                const isPickerTarget = selectedCell?.id === cell.id;

                return (
                  <path
                    key={cell.id}
                    d={getCellPath(cell)}
                    fill={cell.color}
                    className={`transition-opacity duration-200 ${
                      isAnimating ? 'animate-pulse' : ''
                    }`}
                    style={{
                      opacity: isSelected ? 0.7 : 1,
                      filter: isPickerTarget
                        ? 'drop-shadow(0 0 6px rgba(255, 215, 0, 0.8))'
                        : isSelected
                        ? 'drop-shadow(0 0 4px rgba(255, 215, 0, 0.5))'
                        : 'none',
                      cursor: eyedropperActive ? 'crosshair' : 'pointer',
                    }}
                    onClick={(e) => handleCellClick(e, cell)}
                  />
                );
              })}
            </g>

            {selectionBox && isSelecting && (
              <rect
                x={Math.min(selectionBox.startX, selectionBox.endX) * (canvasWidth / (svgRef.current?.getBoundingClientRect().width || canvasWidth))}
                y={Math.min(selectionBox.startY, selectionBox.endY) * (canvasHeight / (svgRef.current?.getBoundingClientRect().height || canvasHeight))}
                width={Math.abs(selectionBox.endX - selectionBox.startX) * (canvasWidth / (svgRef.current?.getBoundingClientRect().width || canvasWidth))}
                height={Math.abs(selectionBox.endY - selectionBox.startY) * (canvasHeight / (svgRef.current?.getBoundingClientRect().height || canvasHeight))}
                fill="rgba(255, 215, 0, 0.15)"
                stroke="#ffd700"
                strokeWidth="1"
                strokeDasharray="4 2"
                style={{ pointerEvents: 'none' }}
              />
            )}
          </svg>

          {selectedCell && (
            <div
              className="absolute z-20 bg-[#2a1a4e]/95 backdrop-blur-md border border-purple-500/40 rounded-xl p-3 shadow-2xl"
              style={{
                left: `${pickerPosition.x}px`,
                top: `${pickerPosition.y}px`,
                transform: 'translateX(-50%)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-purple-300">选择颜色</span>
                <button
                  onClick={() => setSelectedCell(null)}
                  className="text-purple-400 hover:text-white transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
              <div className="flex gap-1.5 flex-wrap max-w-[180px]">
                {palette.map((color, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleColorPick(color)}
                    className={`w-7 h-7 rounded-lg border-2 transition-all hover:scale-110 ${
                      currentColor === color
                        ? 'border-yellow-400 shadow-lg shadow-yellow-500/30'
                        : 'border-transparent hover:border-purple-400/50'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <div className="mt-3 pt-2 border-t border-purple-700/30">
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={currentColor}
                    onChange={(e) => setCurrentColor(e.target.value)}
                    className="w-6 h-6 bg-transparent cursor-pointer rounded"
                  />
                  <input
                    type="text"
                    value={currentColor}
                    onChange={(e) => setCurrentColor(e.target.value)}
                    className="flex-1 bg-purple-900/30 border border-purple-600/30 rounded px-2 py-1 text-xs text-purple-200 font-mono focus:outline-none focus:border-yellow-500/50"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="absolute bottom-4 right-4 flex items-center gap-2">
        <div className="bg-black/30 backdrop-blur-sm rounded-lg px-3 py-1.5 text-xs text-purple-300/70">
          {cols} × {rows} 格子
        </div>
        <button
          onClick={toggleEyedropper}
          className={`p-2 rounded-lg transition-all ${
            eyedropperActive
              ? 'bg-yellow-500/30 border border-yellow-500/60 text-yellow-300'
              : 'bg-black/30 backdrop-blur-sm border border-purple-700/30 text-purple-300 hover:border-purple-500/50 hover:text-purple-200'
          }`}
          title="取色吸管"
        >
          <Pipette size={16} />
        </button>
      </div>

      {eyedropperActive && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-yellow-500/20 backdrop-blur-sm border border-yellow-500/40 rounded-lg px-4 py-2 text-sm text-yellow-300">
          取色模式已激活 · 点击任意格子取色
        </div>
      )}
    </div>
  );
};

export default CanvasView;
