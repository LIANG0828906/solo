import { useMemo } from 'react';
import { Search } from 'lucide-react';
import { useStore } from '@/store';
import Gallery from '@/components/Gallery';

export default function Home() {
  const products = useStore((s) => s.products);
  const searchQuery = useStore((s) => s.searchQuery);

  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return products;
    const q = searchQuery.toLowerCase().trim();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.makerName.toLowerCase().includes(q)
    );
  }, [products, searchQuery]);

  return (
    <div>
      {searchQuery.trim() && (
        <div className="mb-4">
          <p className="text-sm text-stone-400">
            搜索「{searchQuery}」共找到 {filteredProducts.length} 件商品
          </p>
        </div>
      )}

      {searchQuery.trim() && filteredProducts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-16 h-16 rounded-full bg-warm-100 flex items-center justify-center mb-4">
            <Search size={24} className="text-warm-400" />
          </div>
          <p className="text-stone-400 text-sm mb-1">未找到相关商品</p>
          <p className="text-stone-300 text-xs">试试其他关键词吧</p>
        </div>
      ) : (
        <Gallery products={filteredProducts} />
      )}
    </div>
  );
}
