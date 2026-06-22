import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { X, Plus, ChevronDown } from 'lucide-react';
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

interface ColorPickerProps {
  selectedColor: string | null;
  onSelect: (color: string | null) => void;
  label?: string;
}

function ColorPicker({ selectedColor, onSelect, label }: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex h-10 w-full items-center justify-between rounded-lg border px-3 text-sm transition-colors',
          selectedColor
            ? 'border-gray-300 bg-white'
            : 'border-gray-200 bg-gray-50 text-gray-500'
        )}
      >
        <div className="flex items-center gap-2">
          {selectedColor ? (
            <>
              <div
                className="h-5 w-5 rounded-full border border-gray-200 shadow-sm"
                style={{ backgroundColor: selectedColor }}
              />
              <span className="text-gray-700">{label || '已选择'}</span>
            </>
          ) : (
            <span>{label || '选择颜色'}</span>
          )}
        </div>
        <ChevronDown className="h-4 w-4 text-gray-400" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute left-0 top-full z-20 mt-2 w-72 rounded-xl border border-gray-200 bg-white p-4 shadow-xl" style={{ borderRadius: 12 }}>
            <p className="mb-3 text-xs font-medium text-gray-500">选择颜色</p>
            <div className="grid grid-cols-8 gap-2">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => {
                    onSelect(color);
                    setIsOpen(false);
                  }}
                  className={cn(
                    'h-7 w-7 rounded-full border-2 transition-all duration-150 hover:scale-125',
                    selectedColor === color
                      ? 'border-blue-500 ring-2 ring-blue-200 scale-110'
                      : 'border-gray-200 hover:border-gray-400'
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
                className="mt-3 w-full rounded-lg py-1.5 text-sm text-gray-500 hover:bg-gray-50"
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
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-xl border border-gray-200 bg-white p-6"
      style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
    >
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
          <label className="mb-1 block text-sm font-medium text-gray-700">名称</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="输入衣物名称"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">类别</label>
          <select
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value as ClothingCategory })}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
          >
            <option value="">选择类别</option>
            {CATEGORY_OPTIONS.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">颜色</label>
          <ColorPicker
            selectedColor={formData.color}
            onSelect={(color) => setFormData({ ...formData, color })}
            label="选择颜色"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">季节</label>
          <select
            value={formData.season}
            onChange={(e) => setFormData({ ...formData, season: e.target.value as Season })}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
          >
            <option value="">选择季节</option>
            {SEASON_OPTIONS.map((season) => (
              <option key={season} value={season}>{season}</option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="mb-1 block text-sm font-medium text-gray-700">图片 URL</label>
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

interface FilterBarProps {
  compact?: boolean;
}

function FilterBar({ compact = false }: FilterBarProps) {
  const { filter, setFilter, clearFilter } = useWardrobeStore();

  const handleCategoryChange = (category: ClothingCategory | null) => {
    setFilter({ ...filter, category });
  };

  const handleColorChange = (color: string | null) => {
    setFilter({ ...filter, color });
  };

  const handleSeasonChange = (season: Season | null) => {
    setFilter({ ...filter, season });
  };

  const hasActiveFilters = !!(filter.category || filter.color || filter.season);

  return (
    <div className={cn('space-y-3', compact ? 'mb-3' : 'mb-4')}>
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => handleCategoryChange(null)}
            className={cn(
              'rounded-full px-3 py-1 text-xs font-medium transition-all duration-200',
              filter.category === null
                ? 'bg-blue-500 text-white shadow-sm'
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
                'rounded-full px-3 py-1 text-xs font-medium transition-all duration-200',
                filter.category === cat
                  ? 'bg-blue-500 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <ColorPicker
            selectedColor={filter.color}
            onSelect={handleColorChange}
            label="颜色"
          />
        </div>

        <div className="flex flex-wrap gap-1.5">
          {SEASON_OPTIONS.map((season) => (
            <button
              key={season}
              type="button"
              onClick={() => handleSeasonChange(filter.season === season ? null : season)}
              className={cn(
                'rounded-full px-3 py-1 text-xs font-medium transition-all duration-200',
                filter.season === season
                  ? 'bg-blue-500 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              {season}
            </button>
          ))}
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearFilter}
            className="flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-500 hover:bg-gray-200"
          >
            <X className="h-3 w-3" />
            清除
          </button>
        )}
      </div>
    </div>
  );
}

const ITEM_HEIGHT = 240;

interface VirtualGridState {
  visibleStart: number;
  visibleEnd: number;
}

function useVirtualGrid(
  items: ClothingItem[],
  containerRef: React.RefObject<HTMLDivElement | null>,
  columnsRef: React.MutableRefObject<number>
): VirtualGridState & { columns: number } {
  const [state, setState] = useState<VirtualGridState>({ visibleStart: 0, visibleEnd: 50 });

  const update = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const containerWidth = container.clientWidth;
    const colCount = Math.max(1, Math.floor((containerWidth + 16) / 176));
    columnsRef.current = colCount;

    const { scrollTop, clientHeight } = container;
    const rowHeight = ITEM_HEIGHT + 16;
    const startRow = Math.max(0, Math.floor(scrollTop / rowHeight) - 2);
    const endRow = Math.ceil((scrollTop + clientHeight) / rowHeight) + 2;
    const visibleStart = startRow * colCount;
    const visibleEnd = Math.min(items.length, endRow * colCount);

    setState({ visibleStart, visibleEnd });
  }, [items.length, containerRef, columnsRef]);

  useEffect(() => {
    update();
  }, [update]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const handleScroll = () => requestAnimationFrame(update);
    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [update, containerRef]);

  useEffect(() => {
    const observer = new ResizeObserver(update);
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [update, containerRef]);

  return { ...state, columns: columnsRef.current || 4 };
}

function ClosetGrid() {
  const containerRef = useRef<HTMLDivElement>(null);
  const columnsRef = useRef(4);
  const [showAddForm, setShowAddForm] = useState(false);
  const [animKey, setAnimKey] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const items = useWardrobeStore((state) => state.items);
  const getFilteredItems = useWardrobeStore((state) => state.getFilteredItems);
  const filter = useWardrobeStore((state) => state.filter);

  const filteredItems = useMemo(() => getFilteredItems(), [getFilteredItems, items]);

  const { visibleStart, visibleEnd, columns } = useVirtualGrid(
    filteredItems,
    containerRef,
    columnsRef
  );

  const visibleItems = useMemo(
    () => filteredItems.slice(visibleStart, visibleEnd),
    [filteredItems, visibleStart, visibleEnd]
  );

  const totalHeight = Math.ceil(filteredItems.length / columns) * (ITEM_HEIGHT + 16);

  useEffect(() => {
    setIsAnimating(true);
    setAnimKey((k) => k + 1);
    const timer = setTimeout(() => setIsAnimating(false), 300);
    return () => clearTimeout(timer);
  }, [filter.category, filter.color, filter.season]);

  return (
    <div className="flex h-full flex-col p-6">
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
            'flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-colors shadow-sm',
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
        style={{ maxHeight: 'calc(100vh - 300px)' }}
      >
        {filteredItems.length === 0 ? (
          <div className="flex h-64 items-center justify-center">
            <div className="text-center">
              <div className="mb-4 text-6xl">👕</div>
              <p className="text-gray-500">暂无衣物，点击上方按钮添加</p>
            </div>
          </div>
        ) : (
          <div style={{ height: totalHeight, position: 'relative' }}>
            <div
              key={animKey}
              className="grid gap-4"
              style={{
                gridTemplateColumns: `repeat(${columns}, 1fr)`,
                position: 'absolute',
                top: Math.floor(visibleStart / columns) * (ITEM_HEIGHT + 16),
                left: 0,
                right: 0,
                opacity: isAnimating ? 0 : 1,
                transition: 'opacity 300ms ease',
              }}
            >
              {visibleItems.map((item: ClothingItem, idx: number) => (
                <div key={item.id} className="fade-enter" style={{ contentVisibility: 'auto' }}>
                  <ClosetItem
                    item={item}
                    index={visibleStart + idx}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ClosetGrid;
export { ColorPicker, FilterBar };
