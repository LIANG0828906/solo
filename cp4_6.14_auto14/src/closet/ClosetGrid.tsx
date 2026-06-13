import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from '@hello-pangea/dnd';
import { Filter, X, Plus, ChevronDown } from 'lucide-react';
import { useWardrobeStore } from '@/store';
import ClosetItem from '@/closet/ClosetItem';
import {
  ClothingCategory,
  Season,
  PRESET_COLORS,
  ClothingItem,
  CATEGORY_OPTIONS,
  SEASON_OPTIONS,
} from '@/types';
import { cn } from '@/lib/utils';

interface VirtualState {
  startIndex: number;
  endIndex: number;
  offsetY: number;
}

function useVirtual<T>(
  items: T[],
  containerRef: React.RefObject<HTMLDivElement>,
  itemHeight: number,
  overscan: number = 5
): VirtualState {
  const [virtualState, setVirtualState] = useState<VirtualState>({
    startIndex: 0,
    endIndex: 0,
    offsetY: 0,
  });

  const calculateVisibleRange = useCallback(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const { scrollTop, clientHeight } = container;
    const totalItems = items.length;

    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const visibleCount = Math.ceil(clientHeight / itemHeight) + overscan * 2;
    const endIndex = Math.min(totalItems, startIndex + visibleCount);
    const offsetY = startIndex * itemHeight;

    setVirtualState({ startIndex, endIndex, offsetY });
  }, [items.length, itemHeight, overscan, containerRef]);

  useEffect(() => {
    calculateVisibleRange();
  }, [calculateVisibleRange]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      requestAnimationFrame(calculateVisibleRange);
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [calculateVisibleRange, containerRef]);

  useEffect(() => {
    const resizeObserver = new ResizeObserver(calculateVisibleRange);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    return () => resizeObserver.disconnect();
  }, [calculateVisibleRange, containerRef]);

  return virtualState;
}

interface ColorPickerProps {
  selectedColor: string | null;
  onSelect: (color: string | null) => void;
}

function ColorPicker({ selectedColor, onSelect }: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex h-10 w-36 items-center justify-between rounded-lg border px-3 text-sm transition-colors',
          selectedColor
            ? 'border-gray-300 bg-white'
            : 'border-gray-200 bg-gray-50 text-gray-500'
        )}
      >
        <div className="flex items-center gap-2">
          {selectedColor ? (
            <>
              <div
                className="h-5 w-5 rounded-full border border-gray-200"
                style={{ backgroundColor: selectedColor }}
              />
              <span className="text-gray-700">已选择</span>
            </>
          ) : (
            <span>选择颜色</span>
          )}
        </div>
        <ChevronDown className="h-4 w-4 text-gray-400" />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute left-0 top-full z-20 mt-2 w-72 rounded-lg border border-gray-200 bg-white p-3 shadow-lg">
            <div className="mb-2 grid grid-cols-8 gap-2">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => {
                    onSelect(color);
                    setIsOpen(false);
                  }}
                  className={cn(
                    'h-7 w-7 rounded-full border-2 transition-transform hover:scale-110',
                    selectedColor === color
                      ? 'border-blue-500 ring-2 ring-blue-200'
                      : 'border-gray-200'
                  )}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            {selectedColor && (
              <button
                type="button"
                onClick={() => {
                  onSelect(null);
                  setIsOpen(false);
                }}
                className="w-full rounded-md py-1.5 text-sm text-gray-500 hover:bg-gray-50"
              >
                清除选择
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

interface AddItemFormProps {
  onClose: () => void;
}

function AddItemForm({ onClose }: AddItemFormProps) {
  const addItem = useWardrobeStore((state) => state.addItem);
  const [formData, setFormData] = useState({
    name: '',
    category: '' as ClothingCategory | '',
    color: null as string | null,
    imageUrl: '',
    season: '' as Season | '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.category || !formData.color || !formData.imageUrl || !formData.season) {
      return;
    }

    addItem({
      name: formData.name,
      category: formData.category,
      color: formData.color,
      imageUrl: formData.imageUrl,
      season: formData.season,
    });

    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-gray-200 bg-white p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800">添加新衣物</h3>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            名称
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="输入衣物名称"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            类别
          </label>
          <select
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value as ClothingCategory })}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
          >
            <option value="">选择类别</option>
            {CATEGORY_OPTIONS.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            颜色
          </label>
          <ColorPicker
            selectedColor={formData.color}
            onSelect={(color) => setFormData({ ...formData, color })}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            季节
          </label>
          <select
            value={formData.season}
            onChange={(e) => setFormData({ ...formData, season: e.target.value as Season })}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
          >
            <option value="">选择季节</option>
            {SEASON_OPTIONS.map((season) => (
              <option key={season} value={season}>
                {season}
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="mb-1 block text-sm font-medium text-gray-700">
            图片 URL
          </label>
          <input
            type="text"
            value={formData.imageUrl}
            onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
            placeholder="输入图片 URL 地址"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          取消
        </button>
        <button
          type="submit"
          className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={!formData.name || !formData.category || !formData.color || !formData.imageUrl || !formData.season}
        >
          添加
        </button>
      </div>
    </form>
  );
}

function FilterBar() {
  const { filter, setFilter, clearFilter } = useWardrobeStore();
  const [showFilters, setShowFilters] = useState(true);

  const handleCategoryChange = (category: ClothingCategory | null) => {
    setFilter({ ...filter, category });
  };

  const handleColorChange = (color: string | null) => {
    setFilter({ ...filter, color });
  };

  const handleSeasonChange = (season: Season | null) => {
    setFilter({ ...filter, season });
  };

  const hasActiveFilters = filter.category || filter.color || filter.season;

  return (
    <div className="mb-4 space-y-4">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
        >
          <Filter className="h-4 w-4" />
          筛选
          {hasActiveFilters && (
            <span className="ml-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-500 px-1.5 text-xs text-white">
              {(filter.category ? 1 : 0) + (filter.color ? 1 : 0) + (filter.season ? 1 : 0)}
            </span>
          )}
        </button>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearFilter}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
          >
            <X className="h-4 w-4" />
            清除所有
          </button>
        )}
      </div>

      {showFilters && (
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="flex flex-wrap items-center gap-6">
            <div className="space-y-2">
              <span className="text-xs font-medium uppercase text-gray-500">类别</span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleCategoryChange(null)}
                  className={cn(
                    'rounded-full px-3 py-1 text-sm transition-colors',
                    filter.category === null
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  )}
                >
                  全部
                </button>
                {CATEGORY_OPTIONS.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => handleCategoryChange(cat)}
                    className={cn(
                      'rounded-full px-3 py-1 text-sm transition-colors',
                      filter.category === cat
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-medium uppercase text-gray-500">颜色</span>
              <ColorPicker
                selectedColor={filter.color}
                onSelect={handleColorChange}
              />
            </div>

            <div className="space-y-2">
              <span className="text-xs font-medium uppercase text-gray-500">季节</span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleSeasonChange(null)}
                  className={cn(
                    'rounded-full px-3 py-1 text-sm transition-colors',
                    filter.season === null
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  )}
                >
                  全部
                </button>
                {SEASON_OPTIONS.map((season) => (
                  <button
                    key={season}
                    type="button"
                    onClick={() => handleSeasonChange(season)}
                    className={cn(
                      'rounded-full px-3 py-1 text-sm transition-colors',
                      filter.season === season
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    )}
                  >
                    {season}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const ITEM_HEIGHT = 240;
const GRID_GAP = 16;

function ClosetGrid() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [filterKey, setFilterKey] = useState(0);

  const { items, getFilteredItems } = useWardrobeStore();

  const filteredItems = useMemo(() => {
    const start = performance.now();
    const result = getFilteredItems();
    const elapsed = performance.now() - start;
    if (elapsed > 100) {
      console.warn(`筛选耗时 ${elapsed.toFixed(2)}ms，超过 100ms 目标`);
    }
    return result;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getFilteredItems, items]);

  const { startIndex, endIndex, offsetY } = useVirtual(
    filteredItems,
    containerRef,
    ITEM_HEIGHT + GRID_GAP,
    3
  );

  const visibleItems = useMemo(() => {
    return filteredItems.slice(startIndex, endIndex);
  }, [filteredItems, startIndex, endIndex]);

  const filter = useWardrobeStore((state) => state.filter);

  useEffect(() => {
    setFilterKey((prev) => prev + 1);
  }, [filter.category, filter.color, filter.season]);

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
  };

  const totalHeight = Math.ceil(filteredItems.length / 4) * (ITEM_HEIGHT + GRID_GAP);

  return (
    <div className="h-full flex flex-col">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800">我的衣橱</h2>
          <p className="mt-1 text-sm text-gray-500">
            共 {filteredItems.length} 件衣物
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowAddForm(!showAddForm)}
          className={cn(
            'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors',
            showAddForm
              ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              : 'bg-blue-500 text-white hover:bg-blue-600'
          )}
        >
          <Plus className="h-4 w-4" />
          添加衣物
        </button>
      </div>

      {showAddForm && (
        <div className="mb-6">
          <AddItemForm onClose={() => setShowAddForm(false)} />
        </div>
      )}

      <FilterBar />

      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto"
        style={{ maxHeight: 'calc(100vh - 400px)' }}
      >
        {filteredItems.length === 0 ? (
          <div className="flex h-64 items-center justify-center">
            <div className="text-center">
              <div className="text-6xl mb-4">👕</div>
              <p className="text-gray-500">暂无衣物，点击上方按钮添加</p>
            </div>
          </div>
        ) : (
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="closet-grid" mode="virtual">
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="relative"
                  style={{ height: totalHeight }}
                >
                  <div
                    key={filterKey}
                    className="equal-grid absolute left-0 right-0"
                    style={{
                      top: offsetY,
                      paddingBottom: GRID_GAP,
                    }}
                  >
                    {visibleItems.map((item: ClothingItem, index: number) => (
                      <Draggable
                        key={item.id}
                        draggableId={item.id}
                        index={startIndex + index}
                      >
                        {(draggableProvided, snapshot) => (
                          <div
                            key={`${item.id}-${filterKey}`}
                            className="fade-enter"
                          >
                            <ClosetItem
                              item={item}
                              provided={draggableProvided}
                              isDragging={snapshot.isDragging}
                            />
                          </div>
                        )}
                      </Draggable>
                    ))}
                  </div>
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        )}
      </div>
    </div>
  );
}

export default ClosetGrid;
