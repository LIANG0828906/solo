import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import * as d3 from 'd3';
import { Plus, Trash2, Box, Archive, LayoutGrid, X, Edit3, GripVertical } from 'lucide-react';
import { useStore } from './store';
import { StorageUnit, StorageType, Item, STORAGE_TYPE_LABELS, STORAGE_TYPE_COLORS } from './types';
import { calculateUtilization, snapToGrid, generateId } from './utils';

const GRID_SIZE_CM = 1;
const PIXELS_PER_CM = 5;
const GRID_SIZE = GRID_SIZE_CM * PIXELS_PER_CM;
const MIN_SCALE = 0.5;
const MAX_SCALE = 3;

const getBlueByUtilization = (utilization: number): string => {
  const alpha = 0.3 + (utilization / 100) * 0.6;
  const r = Math.round(74 * alpha + 255 * (1 - alpha));
  const g = Math.round(144 * alpha + 255 * (1 - alpha));
  const b = Math.round(217 * alpha + 255 * (1 - alpha));
  return `rgb(${r}, ${g}, ${b})`;
};

const StorageEditor: React.FC = () => {
  const {
    units, selectedUnitId, addUnit, updateUnit, deleteUnit,
    setSelectedUnitId, highlightedUnitId,
  } = useStore();

  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const gRef = useRef<SVGGElement | null>(null);
  const [transform, setTransform] = useState<d3.ZoomTransform>(d3.zoomIdentity);
  const [dragInfo, setDragInfo] = useState<{
    id: string; type: 'move' | 'resize'; startX: number; startY: number;
    origX: number; origY: number; origW: number; origD: number;
  } | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  const selectedUnit = units.find((u) => u.id === selectedUnitId) || null;

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([MIN_SCALE, MAX_SCALE])
      .on('zoom', (event) => {
        setTransform(event.transform);
        if (gRef.current) {
          d3.select(gRef.current).attr('transform', event.transform.toString());
        }
      })
      .filter((event) => {
        if (event.button !== 0) return true;
        const target = event.target as SVGElement;
        if (target.classList.contains('unit-rect') || target.classList.contains('resize-handle')) {
          return false;
        }
        return !event.ctrlKey ? true : false;
      });

    svg.call(zoom as any);

    svg.on('dblclick.zoom', null);
  }, []);

  const canvasWidth = useMemo(() => Math.max(800, dimensions.width * 1.5), [dimensions.width]);
  const canvasHeight = useMemo(() => Math.max(600, dimensions.height * 1.5), [dimensions.height]);

  const handleUnitMouseDown = useCallback((
    e: React.MouseEvent, unit: StorageUnit, type: 'move' | 'resize',
  ) => {
    e.stopPropagation();
    e.preventDefault();
    setSelectedUnitId(unit.id);
    const point = d3.pointer(e, svgRef.current);
    setDragInfo({
      id: unit.id, type,
      startX: point[0], startY: point[1],
      origX: unit.x, origY: unit.y, origW: unit.width, origD: unit.depth,
    });
  }, [setSelectedUnitId]);

  useEffect(() => {
    if (!dragInfo) return;

    const handleMove = (e: MouseEvent) => {
      if (!svgRef.current) return;
      const point = d3.pointer(e, svgRef.current);
      const dx = (point[0] - dragInfo.startX) / transform.k;
      const dy = (point[1] - dragInfo.startY) / transform.k;

      if (dragInfo.type === 'move') {
        const newX = Math.max(0, snapToGrid(dragInfo.origX + dx * PIXELS_PER_CM, GRID_SIZE_CM));
        const newY = Math.max(0, snapToGrid(dragInfo.origY + dy * PIXELS_PER_CM, GRID_SIZE_CM));
        updateUnit(dragInfo.id, { x: newX, y: newY });
      } else {
        const newW = Math.max(GRID_SIZE_CM * 2, snapToGrid(dragInfo.origW + dx * PIXELS_PER_CM, GRID_SIZE_CM));
        const newD = Math.max(GRID_SIZE_CM * 2, snapToGrid(dragInfo.origD + dy * PIXELS_PER_CM, GRID_SIZE_CM));
        updateUnit(dragInfo.id, { width: newW, depth: newD });
      }
    };

    const handleUp = () => {
      setDragInfo(null);
      setIsPanning(false);
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);

    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, [dragInfo, transform.k, updateUnit]);

  const handleCanvasClick = () => {
    if (!dragInfo && !isPanning) {
      setSelectedUnitId(null);
    }
  };

  const handleAddItem = () => {
    if (!selectedUnit) return;
    const newItem: Item = {
      id: generateId(),
      name: '新物品',
      category: '未分类',
      quantity: 1,
      estimatedVolume: 100,
    };
    updateUnit(selectedUnit.id, { items: [...selectedUnit.items, newItem] });
  };

  const handleUpdateItem = (itemId: string, updates: Partial<Item>) => {
    if (!selectedUnit) return;
    const newItems = selectedUnit.items.map((i) =>
      i.id === itemId ? { ...i, ...updates } : i
    );
    updateUnit(selectedUnit.id, { items: newItems });
  };

  const handleDeleteItem = (itemId: string) => {
    if (!selectedUnit) return;
    const newItems = selectedUnit.items.filter((i) => i.id !== itemId);
    updateUnit(selectedUnit.id, { items: newItems });
  };

  const renderGridPattern = () => {
    return (
      <defs>
        <pattern
          id="smallGrid"
          width={GRID_SIZE}
          height={GRID_SIZE}
          patternUnits="userSpaceOnUse"
        >
          <path
            d={`M ${GRID_SIZE} 0 L 0 0 0 ${GRID_SIZE}`}
            fill="none"
            stroke="#e0e0e0"
            strokeWidth="0.5"
          />
        </pattern>
        <pattern
          id="grid"
          width={GRID_SIZE * 10}
          height={GRID_SIZE * 10}
          patternUnits="userSpaceOnUse"
        >
          <rect width={GRID_SIZE * 10} height={GRID_SIZE * 10} fill="url(#smallGrid)" />
          <path
            d={`M ${GRID_SIZE * 10} 0 L 0 0 0 ${GRID_SIZE * 10}`}
            fill="none"
            stroke="#d0d0d0"
            strokeWidth="1"
          />
        </pattern>
      </defs>
    );
  };

  return (
    <div className="flex flex-col md:flex-row h-full w-full overflow-hidden">
      <div className="w-full md:w-48 flex-shrink-0 bg-white border-b md:border-b-0 md:border-r border-gray-200 p-3 overflow-y-auto">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">添加储物单元</h3>
        <div className="space-y-2">
          {(['cabinet', 'drawer', 'box'] as StorageType[]).map((type) => (
            <button
              key={type}
              onClick={() => addUnit(type)}
              className="btn-transition w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-colors"
            >
              {type === 'cabinet' && <Box size={16} style={{ color: STORAGE_TYPE_COLORS[type] }} />}
              {type === 'drawer' && <LayoutGrid size={16} style={{ color: STORAGE_TYPE_COLORS[type] }} />}
              {type === 'box' && <Archive size={16} style={{ color: STORAGE_TYPE_COLORS[type] }} />}
              <span className="text-sm text-gray-700">{STORAGE_TYPE_LABELS[type]}</span>
            </button>
          ))}
        </div>
      </div>

      <div ref={containerRef} className="flex-1 relative overflow-hidden bg-[#f5f5f5]">
        <div className="absolute top-2 left-2 bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-lg text-xs text-gray-600 z-10 shadow-sm">
          缩放: {(transform.k * 100).toFixed(0)}% · 网格: {GRID_SIZE_CM}cm
        </div>

        <svg
          ref={svgRef}
          width={dimensions.width}
          height={dimensions.height}
          onClick={handleCanvasClick}
          className="cursor-grab active:cursor-grabbing"
        >
          {renderGridPattern()}
          <rect width={canvasWidth} height={canvasHeight} fill="url(#grid)" />

          <g ref={gRef}>
            {units.map((unit) => {
              const util = calculateUtilization(unit);
              const isSelected = unit.id === selectedUnitId;
              const isHighlighted = unit.id === highlightedUnitId;
              const displayX = (unit.x / PIXELS_PER_CM) * GRID_SIZE;
              const displayY = (unit.y / PIXELS_PER_CM) * GRID_SIZE;
              const displayW = (unit.width / PIXELS_PER_CM) * GRID_SIZE;
              const displayD = (unit.depth / PIXELS_PER_CM) * GRID_SIZE;

              return (
                <g key={unit.id}>
                  <rect
                    className="unit-rect cursor-move"
                    x={displayX}
                    y={displayY}
                    width={displayW}
                    height={displayD}
                    fill={getBlueByUtilization(util)}
                    stroke={isSelected ? '#3b82f6' : isHighlighted ? '#fbbf24' : 'rgba(74, 144, 217, 0.8)'}
                    strokeWidth={isSelected ? 3 : isHighlighted ? 3 : 1.5}
                    rx={4}
                    onMouseDown={(e) => handleUnitMouseDown(e, unit, 'move')}
                    style={{
                      filter: isHighlighted ? 'drop-shadow(0 0 8px rgba(251, 191, 36, 0.6))' : undefined,
                    }}
                  />

                  <text
                    x={displayX + displayW / 2}
                    y={displayY + 16}
                    textAnchor="middle"
                    fontSize="11"
                    fill="#1f2937"
                    fontWeight="500"
                    className="pointer-events-none select-none"
                    style={{ opacity: transform.k > 0.7 ? 1 : 0 }}
                  >
                    {unit.name}
                  </text>

                  <text
                    x={displayX + displayW / 2}
                    y={displayY + displayD - 8}
                    textAnchor="middle"
                    fontSize="9"
                    fill="#6b7280"
                    className="pointer-events-none select-none"
                    style={{ opacity: transform.k > 0.8 ? 1 : 0 }}
                  >
                    {util.toFixed(0)}% · {unit.width}×{unit.depth}×{unit.height}
                  </text>

                  {isSelected && (
                    <rect
                      className="resize-handle cursor-se-resize"
                      x={displayX + displayW - 10}
                      y={displayY + displayD - 10}
                      width={14}
                      height={14}
                      fill="#3b82f6"
                      stroke="white"
                      strokeWidth={1.5}
                      rx={3}
                      onMouseDown={(e) => handleUnitMouseDown(e, unit, 'resize')}
                    />
                  )}

                  {isSelected && (
                    <g
                      className="pointer-events-none"
                      style={{ opacity: transform.k > 0.9 ? 1 : 0 }}
                    >
                      <path
                        d={`M ${displayX + 4} ${displayY + 4} L ${displayX + 12} ${displayY + 4} M ${displayX + 4} ${displayY + 4} L ${displayX + 4} ${displayY + 12}`}
                        stroke="#3b82f6"
                        strokeWidth={2}
                        fill="none"
                      />
                      <path
                        d={`M ${displayX + displayW - 4} ${displayY + 4} L ${displayX + displayW - 12} ${displayY + 4} M ${displayX + displayW - 4} ${displayY + 4} L ${displayX + displayW - 4} ${displayY + 12}`}
                        stroke="#3b82f6"
                        strokeWidth={2}
                        fill="none"
                      />
                      <path
                        d={`M ${displayX + 4} ${displayY + displayD - 4} L ${displayX + 12} ${displayY + displayD - 4} M ${displayX + 4} ${displayY + displayD - 4} L ${displayX + 4} ${displayY + displayD - 12}`}
                        stroke="#3b82f6"
                        strokeWidth={2}
                        fill="none"
                      />
                    </g>
                  )}
                </g>
              );
            })}
          </g>
        </svg>
      </div>

      {selectedUnit && (
        <div className="w-full md:w-72 flex-shrink-0 bg-white border-t md:border-t-0 md:border-l border-gray-200 overflow-y-auto">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Edit3 size={16} className="text-gray-500" />
                <h3 className="font-semibold text-gray-800">编辑储物单元</h3>
              </div>
              <button
                onClick={() => setSelectedUnitId(null)}
                className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">名称</label>
                <input
                  type="text"
                  value={selectedUnit.name}
                  onChange={(e) => updateUnit(selectedUnit.id, { name: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">类型</label>
                <select
                  value={selectedUnit.type}
                  onChange={(e) => updateUnit(selectedUnit.id, { type: e.target.value as StorageType })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {(['cabinet', 'drawer', 'box'] as StorageType[]).map((t) => (
                    <option key={t} value={t}>{STORAGE_TYPE_LABELS[t]}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">颜色标签</label>
                <div className="flex gap-2">
                  {Object.values(STORAGE_TYPE_COLORS).concat(['#f87171', '#fbbf24', '#34d399']).map((color) => (
                    <button
                      key={color}
                      onClick={() => updateUnit(selectedUnit.id, { color })}
                      className={`w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 ${
                        selectedUnit.color === color ? 'border-gray-800 scale-110' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {[
                  { key: 'width', label: '长(cm)' },
                  { key: 'depth', label: '宽(cm)' },
                  { key: 'height', label: '高(cm)' },
                ].map(({ key, label }) => (
                  <div key={key}>
                    <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
                    <input
                      type="number"
                      min={1}
                      value={selectedUnit[key as 'width' | 'depth' | 'height']}
                      onChange={(e) => updateUnit(selectedUnit.id, { [key]: Number(e.target.value) } as any)}
                      className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium text-gray-600">
                    物品列表 ({selectedUnit.items.length})
                  </label>
                  <button
                    onClick={handleAddItem}
                    className="btn-transition p-1 rounded text-blue-500 hover:bg-blue-50"
                  >
                    <Plus size={16} />
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {selectedUnit.items.length === 0 ? (
                    <div className="text-center py-4 text-xs text-gray-400 italic">暂无物品</div>
                  ) : (
                    selectedUnit.items.map((item) => (
                      <div key={item.id} className="p-2 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <input
                            type="text"
                            value={item.name}
                            onChange={(e) => handleUpdateItem(item.id, { name: e.target.value })}
                            className="flex-1 px-2 py-1 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder="名称"
                          />
                          <button
                            onClick={() => handleDeleteItem(item.id)}
                            className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                        <div className="grid grid-cols-3 gap-1">
                          <input
                            type="text"
                            value={item.category}
                            onChange={(e) => handleUpdateItem(item.id, { category: e.target.value })}
                            className="px-2 py-1 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder="类别"
                          />
                          <input
                            type="number"
                            min={1}
                            value={item.quantity}
                            onChange={(e) => handleUpdateItem(item.id, { quantity: Number(e.target.value) })}
                            className="px-2 py-1 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder="数量"
                          />
                          <input
                            type="number"
                            min={1}
                            value={item.estimatedVolume}
                            onChange={(e) => handleUpdateItem(item.id, { estimatedVolume: Number(e.target.value) })}
                            className="px-2 py-1 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder="体积cm³"
                          />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="pt-3">
                <button
                  onClick={() => deleteUnit(selectedUnit.id)}
                  className="btn-transition w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 text-sm font-medium"
                >
                  <Trash2 size={16} />
                  删除此储物单元
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StorageEditor;
