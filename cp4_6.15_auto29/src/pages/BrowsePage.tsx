import { useState, useMemo } from 'react';
import { useDataStore } from '@/utils/dataStore';
import { CATEGORY_LABELS, type Category } from '@/types';
import ProductCard from '@/components/ProductCard';
import { Search, SlidersHorizontal, X } from 'lucide-react';

export default function BrowsePage() {
  const products = useDataStore((state) => state.products);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | 'all'>('all');
  const [minCondition, setMinCondition] = useState(1);
  const [showFilterPanel, setShowFilterPanel] = useState(false);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      if (product.status !== 'published') return false;
      if (selectedCategory !== 'all' && product.category !== selectedCategory) return false;
      if (product.condition < minCondition) return false;
      if (searchQuery && !product.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [products, selectedCategory, minCondition, searchQuery]);

  const categories: Array<{ key: Category | 'all'; label: string }> = [
    { key: 'all', label: '全部' },
    ...(Object.entries(CATEGORY_LABELS) as [Category, string][]).map(([key, label]) => ({
      key,
      label,
    })),
  ];

  return (
    <div className="min-h-screen bg-morandi-white pb-24">
      <div className="sticky top-0 z-30 bg-morandi-white/90 backdrop-blur-sm border-b border-morandi-gray">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3 mb-4">
            <h1 className="text-xl font-semibold text-gray-700 flex-1">
              二手好物
            </h1>
          </div>

          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-morandi-brown"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索物品..."
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-morandi-gray rounded-full text-sm text-gray-700 placeholder:text-morandi-brown/60 focus:outline-none focus:border-morandi-blue focus:ring-2 focus:ring-morandi-blue/20 transition-all duration-300"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-morandi-brown hover:text-morandi-red transition-colors"
                >
                  <X size={16} />
                </button>
              )}
            </div>
            <button
              onClick={() => setShowFilterPanel(!showFilterPanel)}
              className={`px-4 py-2.5 rounded-full border transition-all duration-300 flex items-center gap-2 ${
                showFilterPanel
                  ? 'bg-morandi-blue border-morandi-blue text-white'
                  : 'bg-white border-morandi-gray text-morandi-brown hover:border-morandi-blue hover:text-morandi-blue'
              }`}
            >
              <SlidersHorizontal size={18} />
              <span className="text-sm hidden sm:inline">筛选</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setSelectedCategory(cat.key)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm transition-all duration-300 ${
                selectedCategory === cat.key
                  ? 'bg-morandi-blue text-white shadow-md'
                  : 'bg-white text-morandi-brown border border-morandi-gray hover:border-morandi-blue hover:text-morandi-blue'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {showFilterPanel && (
        <div className="max-w-6xl mx-auto px-4 pb-2 animate-fade-in">
          <div className="bg-white rounded-card p-4 shadow-sm border border-morandi-gray">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-gray-600">新旧程度筛选</span>
              <span className="text-sm text-morandi-blue font-medium">
                {minCondition} 成新及以上
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={10}
              value={minCondition}
              onChange={(e) => setMinCondition(Number(e.target.value))}
              className="w-full h-2 bg-morandi-gray rounded-full appearance-none cursor-pointer slider-thumb"
              style={{
                background: `linear-gradient(to right, #A8B5A0 0%, #A8B5A0 ${(minCondition - 1) * 11.11}%, #E8E6E1 ${(minCondition - 1) * 11.11}%, #E8E6E1 100%)`,
              }}
            />
            <div className="flex justify-between mt-2 text-xs text-morandi-brown">
              <span>1成新</span>
              <span>10成新</span>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 pb-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-morandi-brown">
            共 <span className="text-morandi-blue font-medium">{filteredProducts.length}</span> 件好物
          </p>
        </div>

        {filteredProducts.length > 0 ? (
          <div className="masonry-grid">
            {filteredProducts.map((product, index) => (
              <ProductCard key={product.id} product={product} index={index} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-20 h-20 mx-auto mb-4 bg-morandi-gray rounded-full flex items-center justify-center">
              <Search size={32} className="text-morandi-brown" />
            </div>
            <p className="text-morandi-brown mb-2">没有找到相关物品</p>
            <p className="text-sm text-morandi-brown/70">试试其他筛选条件吧</p>
          </div>
        )}
      </div>
    </div>
  );
}
