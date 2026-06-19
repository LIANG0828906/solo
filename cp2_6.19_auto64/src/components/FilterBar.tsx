import { useState, useMemo, useCallback } from 'react';
import { Search, Filter, X, ChevronDown } from 'lucide-react';
import type { Product, ProductType, ProductStatus, FilterStatus } from '@/types';
import { getUniqueBrands } from '@/utils/productUtils';

interface FilterBarProps {
  products: Product[];
  onFilter: (filtered: Product[]) => void;
}

const productTypes: ProductType[] = ['精华', '面霜', '防晒', '洁面', '水乳', '眼霜', '面膜', '其他'];
const statusOptions: { value: FilterStatus; label: string }[] = [
  { value: 'all', label: '全部状态' },
  { value: '进行中', label: '进行中' },
  { value: '已用完', label: '已用完' },
  { value: '已过期', label: '已过期' },
];

export const FilterBar = ({ products, onFilter }: FilterBarProps) => {
  const [selectedTypes, setSelectedTypes] = useState<ProductType[]>([]);
  const [brandSearch, setBrandSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [showBrandSuggestions, setShowBrandSuggestions] = useState(false);

  const brands = useMemo(() => getUniqueBrands(products), [products]);
  
  const filteredBrands = useMemo(() => {
    if (!brandSearch.trim()) return brands;
    return brands.filter(b => 
      b.toLowerCase().includes(brandSearch.toLowerCase())
    );
  }, [brands, brandSearch]);

  const getProductStatus = useCallback((product: Product): ProductStatus => {
    if (product.usedAmount >= product.capacity) return '已用完';
    const expireDate = new Date(product.openDate);
    expireDate.setMonth(expireDate.getMonth() + product.shelfLife);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (expireDate < today) return '已过期';
    return '进行中';
  }, []);

  const applyFilters = useCallback(() => {
    let filtered = [...products];

    if (selectedTypes.length > 0) {
      filtered = filtered.filter(p => selectedTypes.includes(p.type));
    }

    if (brandSearch.trim()) {
      filtered = filtered.filter(p => 
        p.brand.toLowerCase().includes(brandSearch.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(p => getProductStatus(p) === statusFilter);
    }

    onFilter(filtered);
  }, [products, selectedTypes, brandSearch, statusFilter, onFilter, getProductStatus]);

  useMemo(() => {
    applyFilters();
  }, [applyFilters]);

  const toggleType = (type: ProductType) => {
    setSelectedTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const clearAll = () => {
    setSelectedTypes([]);
    setBrandSearch('');
    setStatusFilter('all');
  };

  const hasActiveFilters = selectedTypes.length > 0 || brandSearch.trim() || statusFilter !== 'all';

  return (
    <div className="bg-white rounded-card shadow-card p-4 mb-6">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="搜索品牌..."
            value={brandSearch}
            onChange={(e) => setBrandSearch(e.target.value)}
            onFocus={() => setShowBrandSuggestions(true)}
            onBlur={() => setTimeout(() => setShowBrandSuggestions(false), 200)}
            className="w-full pl-10 pr-4 py-2.5 rounded-input border-2 border-gray-200 focus:border-primary focus:shadow-input transition-all duration-300 outline-none"
          />
          {showBrandSuggestions && filteredBrands.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-100 max-h-48 overflow-y-auto z-10">
              {filteredBrands.map(brand => (
                <button
                  key={brand}
                  type="button"
                  onClick={() => {
                    setBrandSearch(brand);
                    setShowBrandSuggestions(false);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors"
                >
                  {brand}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="relative">
          <button
            onClick={() => setShowTypeDropdown(!showTypeDropdown)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-input border-2 border-gray-200 hover:border-primary transition-all duration-200"
          >
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-gray-700">
              {selectedTypes.length > 0 
                ? `类型 (${selectedTypes.length})` 
                : '产品类型'}
            </span>
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </button>

          {showTypeDropdown && (
            <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-100 p-2 min-w-[200px] z-10">
              <div className="grid grid-cols-2 gap-1">
                {productTypes.map(type => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => toggleType(type)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      selectedTypes.includes(type)
                        ? 'bg-primary text-white'
                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as FilterStatus)}
          className="px-4 py-2.5 rounded-input border-2 border-gray-200 focus:border-primary focus:shadow-input transition-all duration-300 outline-none bg-white"
        >
          {statusOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {hasActiveFilters && (
          <button
            onClick={clearAll}
            className="flex items-center gap-1 px-3 py-2.5 text-gray-500 hover:text-warning transition-colors"
          >
            <X className="w-4 h-4" />
            <span className="text-sm">清除筛选</span>
          </button>
        )}
      </div>

      {selectedTypes.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-100">
          {selectedTypes.map(type => (
            <span
              key={type}
              className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm"
            >
              {type}
              <button
                onClick={() => toggleType(type)}
                className="hover:text-primary-dark transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
