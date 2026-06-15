import { CATEGORY_LABELS, AREA_OPTIONS, type ProductCategory } from '@/types';

interface FilterPanelProps {
  category: ProductCategory | 'all';
  onCategoryChange: (c: ProductCategory | 'all') => void;
  area: string;
  onAreaChange: (a: string) => void;
  minPrice: number;
  maxPrice: number;
  onPriceChange: (min: number, max: number) => void;
}

const ALL_CATEGORIES: Array<ProductCategory | 'all'> = [
  'all',
  'clothing',
  'handmade',
  'books',
  'electronics',
  'other',
];

export function FilterPanel({
  category,
  onCategoryChange,
  area,
  onAreaChange,
  minPrice,
  maxPrice,
  onPriceChange,
}: FilterPanelProps) {
  return (
    <div className="glass-card p-4 space-y-4">
      <div>
        <p className="text-sm font-medium text-amber-800 mb-2">商品类别</p>
        <div className="flex flex-wrap gap-2">
          {ALL_CATEGORIES.map(c => (
            <button
              key={c}
              onClick={() => onCategoryChange(c)}
              className={`category-chip ${
                category === c ? 'category-chip-active' : 'category-chip-inactive'
              }`}
            >
              {c === 'all' ? '全部' : CATEGORY_LABELS[c]}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-amber-800 mb-1">摊位区域</label>
          <select
            value={area}
            onChange={(e) => onAreaChange(e.target.value)}
            className="input-field"
          >
            <option value="">全部区域</option>
            {AREA_OPTIONS.map(a => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-amber-800 mb-1">
            价格范围: ¥{minPrice} - ¥{maxPrice === Infinity ? '不限' : maxPrice}
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={minPrice}
              min={0}
              onChange={(e) => onPriceChange(Number(e.target.value) || 0, maxPrice)}
              className="input-field w-20"
              placeholder="最低"
            />
            <span className="text-amber-600">-</span>
            <input
              type="number"
              value={maxPrice === Infinity ? '' : maxPrice}
              min={0}
              onChange={(e) =>
                onPriceChange(minPrice, e.target.value === '' ? Infinity : Number(e.target.value) || 0)
              }
              className="input-field w-20"
              placeholder="最高"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
