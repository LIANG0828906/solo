import { useState, useMemo } from 'react';
import { useMarketStore, filterProducts } from '@/store/useMarketStore';
import { useDebounce } from '@/hooks/useDebounce';
import type { ProductCategory } from '@/types';
import { SearchBar } from '@/components/SearchBar';
import { FilterPanel } from '@/components/FilterPanel';
import { ProductCard } from '@/components/ProductCard';
import { PackageOpen } from 'lucide-react';

export function HomePage() {
  const products = useMarketStore(s => s.products);
  const stalls = useMarketStore(s => s.stalls);

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 100);

  const [category, setCategory] = useState<ProductCategory | 'all'>('all');
  const [area, setArea] = useState('');
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState<number>(Infinity);
  const [showFilters, setShowFilters] = useState(false);

  const filtered = useMemo(
    () =>
      filterProducts(products, stalls, {
        search: debouncedSearch,
        category,
        area,
        minPrice,
        maxPrice,
      }),
    [products, stalls, debouncedSearch, category, area, minPrice, maxPrice]
  );

  const sortedByNew = useMemo(
    () => [...filtered].sort((a, b) => b.createdAt - a.createdAt),
    [filtered]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-amber-900">发现好物</h1>
          <p className="text-amber-700 mt-1 text-sm">
            浏览社区集市中的精选商品，共 {filtered.length} 件
          </p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <SearchBar value={search} onChange={setSearch} />
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="btn-secondary sm:hidden flex-shrink-0"
          >
            筛选
          </button>
        </div>
      </div>

      <div className={showFilters ? 'block' : 'hidden sm:block'}>
        <FilterPanel
          category={category}
          onCategoryChange={setCategory}
          area={area}
          onAreaChange={setArea}
          minPrice={minPrice}
          maxPrice={maxPrice}
          onPriceChange={(min, max) => {
            setMinPrice(min);
            setMaxPrice(max);
          }}
        />
      </div>

      {sortedByNew.length === 0 ? (
        <div className="glass-card p-16 text-center">
          <PackageOpen size={56} className="mx-auto mb-4 text-amber-400" />
          <p className="text-lg text-amber-800 font-medium">
            {products.length === 0 ? '还没有商品上架' : '没有找到匹配的商品'}
          </p>
          <p className="text-sm text-amber-600 mt-2">
            {products.length === 0
              ? '前往"摊位管理"创建摊位并上架商品吧'
              : '试试调整搜索条件或筛选器'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {sortedByNew.map((product, idx) => (
            <ProductCard
              key={product.id}
              product={product}
              index={idx}
              highlightText={debouncedSearch}
            />
          ))}
        </div>
      )}
    </div>
  );
}
