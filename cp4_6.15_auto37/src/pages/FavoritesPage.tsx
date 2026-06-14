import { useState, useMemo, useCallback } from 'react';
import { Heart, HeartOff, Store, Filter } from 'lucide-react';
import { useMarketStore } from '@/store/useMarketStore';
import { CATEGORY_LABELS, type ProductCategory } from '@/types';

export function FavoritesPage() {
  const products = useMarketStore(s => s.products);
  const stalls = useMarketStore(s => s.stalls);
  const favorites = useMarketStore(s => s.favorites);
  const toggleFavorite = useMarketStore(s => s.toggleFavorite);

  const [stallFilter, setStallFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<ProductCategory | 'all'>('all');
  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set());

  const favoriteProducts = useMemo(() => {
    const favIds = new Set(favorites.map(f => f.productId));
    let list = products.filter(p => favIds.has(p.id));

    if (stallFilter !== 'all') {
      list = list.filter(p => p.stallId === stallFilter);
    }
    if (categoryFilter !== 'all') {
      list = list.filter(p => p.category === categoryFilter);
    }
    return list;
  }, [products, favorites, stallFilter, categoryFilter]);

  const handleRemove = useCallback(
    (productId: string) => {
      setRemovingIds(prev => {
        const next = new Set(prev);
        next.add(productId);
        return next;
      });
      setTimeout(() => {
        toggleFavorite(productId);
        setRemovingIds(prev => {
          const next = new Set(prev);
          next.delete(productId);
          return next;
        });
      }, 350);
    },
    [toggleFavorite]
  );

  const allCategories = useMemo(() => {
    const set = new Set<ProductCategory>();
    favoriteProducts.forEach(p => set.add(p.category));
    return Array.from(set);
  }, [favoriteProducts]);

  const allStalls = useMemo(() => {
    const set = new Set<string>();
    favoriteProducts.forEach(p => set.add(p.stallId));
    return stalls.filter(s => set.has(s.id));
  }, [favoriteProducts, stalls]);

  if (favorites.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-display font-bold text-amber-900">我的收藏</h1>
          <p className="text-amber-700 mt-1 text-sm">收藏心仪的商品，方便稍后购买</p>
        </div>
        <div className="glass-card p-16 text-center">
          <Heart size={56} className="mx-auto mb-4 text-amber-400" />
          <p className="text-lg text-amber-800 font-medium">收藏夹是空的</p>
          <p className="text-sm text-amber-600 mt-2">在首页点击商品上的心形图标即可收藏</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold text-amber-900 flex items-center gap-2">
          <Heart className="text-red-500 fill-red-500" /> 我的收藏
        </h1>
        <p className="text-amber-700 mt-1 text-sm">
          已收藏 {favoriteProducts.length} 件商品
        </p>
      </div>

      <div className="glass-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter size={18} className="text-amber-700" />
          <span className="font-medium text-amber-800">筛选</span>
        </div>
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-xs text-amber-700 mb-1">按摊位</label>
            <select
              value={stallFilter}
              onChange={(e) => setStallFilter(e.target.value)}
              className="input-field !py-1.5 !text-sm w-40"
            >
              <option value="all">全部摊位</option>
              {allStalls.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-amber-700 mb-1">按类别</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as ProductCategory | 'all')}
              className="input-field !py-1.5 !text-sm w-32"
            >
              <option value="all">全部类别</option>
              {allCategories.map(c => (
                <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {favoriteProducts.length === 0 ? (
        <div className="glass-card p-12 text-center text-amber-600">
          没有符合筛选条件的商品
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {favoriteProducts.map((product, idx) => {
            const stall = stalls.find(s => s.id === product.stallId);
            const removing = removingIds.has(product.id);
            return (
              <div
                key={product.id}
                className={`glass-card glass-card-hover overflow-hidden
                           ${removing
                             ? 'scale-75 opacity-0 translate-x-full'
                             : 'scale-100 opacity-100 translate-x-0'}`}
                style={{
                  transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
                  animation: !removing
                    ? `fadeInUp 0.4s cubic-bezier(0.4, 0, 0.2, 1) ${Math.min(idx * 50, 300)}ms both`
                    : undefined,
                }}
              >
                <div className="relative">
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-full h-48 sm:h-56 object-cover"
                    loading="lazy"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src =
                        `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=flea%20market%20${product.category}&image_size=portrait_4_3`;
                    }}
                  />
                  <button
                    onClick={() => handleRemove(product.id)}
                    className="absolute top-2 right-2 p-2 rounded-full bg-white/80 backdrop-blur-sm shadow-md
                               hover:bg-red-50 hover:scale-110 active:scale-95
                               transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]"
                    aria-label="取消收藏"
                  >
                    <HeartOff size={16} className="text-red-500" />
                  </button>
                  <div className="absolute top-2 left-2">
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-600 text-white">
                      {CATEGORY_LABELS[product.category]}
                    </span>
                  </div>
                </div>
                <div className="p-3">
                  <h3 className="font-display font-semibold text-amber-900 line-clamp-1">
                    {product.name}
                  </h3>
                  {stall && (
                    <p className="text-xs text-amber-600 mt-0.5 flex items-center gap-1 truncate">
                      <Store size={12} className="flex-shrink-0" />
                      <span className="truncate">{stall.name}</span>
                    </p>
                  )}
                  <div className="flex items-end justify-between mt-2">
                    <span className="text-lg font-bold text-amber-700">¥{product.price}</span>
                    <span className="text-xs text-amber-600">库存 {product.quantity}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
