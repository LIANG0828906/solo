import { CATEGORIES } from '../types';
import { cn } from '../utils';

interface FilterBarProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  minCondition: number;
  maxCondition: number;
  onConditionChange: (min: number, max: number) => void;
}

export const FilterBar = ({
  selectedCategory,
  onCategoryChange,
  minCondition,
  maxCondition,
  onConditionChange,
}: FilterBarProps) => {
  const allCategories = ['全部', ...CATEGORIES];

  return (
    <div className="bg-white rounded-3xl p-4 shadow-sm mb-4">
      <div className="mb-4">
        <p className="text-sm font-semibold text-gray-600 mb-3">物品类别</p>
        <div className="flex gap-2 flex-wrap">
          {allCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => onCategoryChange(cat)}
              className={cn(
                'px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 btn-bounce',
                selectedCategory === cat
                  ? 'bg-gradient-to-r from-orange-400 to-amber-400 text-white shadow-md'
                  : 'bg-orange-50 text-orange-600 hover:bg-orange-100'
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-sm font-semibold text-gray-600 mb-3">
          新旧程度: {minCondition} - {maxCondition}
        </p>
        <div className="flex items-center gap-4">
          <span className="text-xs text-gray-400 w-6">旧</span>
          <div className="flex-1 relative">
            <input
              type="range"
              min="1"
              max="10"
              value={minCondition}
              onChange={(e) =>
                onConditionChange(
                  Math.min(Number(e.target.value), maxCondition),
                  maxCondition
                )
              }
              className="w-full h-2 bg-orange-100 rounded-full appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, #FF9A3C ${
                  ((minCondition - 1) / 9) * 100
                }%, #FFE8A3 ${((minCondition - 1) / 9) * 100}%, #FFE8A3 ${
                  ((maxCondition - 1) / 9) * 100
                }%, #FFF0D9 ${((maxCondition - 1) / 9) * 100}%)`,
              }}
            />
          </div>
          <div className="flex-1 relative">
            <input
              type="range"
              min="1"
              max="10"
              value={maxCondition}
              onChange={(e) =>
                onConditionChange(
                  minCondition,
                  Math.max(Number(e.target.value), minCondition)
                )
              }
              className="w-full h-2 bg-orange-100 rounded-full appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, #FFF0D9 ${
                  ((minCondition - 1) / 9) * 100
                }%, #FFE8A3 ${((minCondition - 1) / 9) * 100}%, #FFE8A3 ${
                  ((maxCondition - 1) / 9) * 100
                }%, #FF9A3C ${((maxCondition - 1) / 9) * 100}%)`,
              }}
            />
          </div>
          <span className="text-xs text-gray-400 w-6 text-right">新</span>
        </div>
      </div>
    </div>
  );
};
