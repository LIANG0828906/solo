import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { useStore } from '@/store';
import type { Product, Category } from '@/types';

interface GalleryProps {
  products: Product[];
}

function ProductCard({ product, index }: { product: Product; index: number }) {
  const navigate = useNavigate();
  const favorites = useStore((s) => s.favorites);
  const toggleFavorite = useStore((s) => s.toggleFavorite);
  const addToCart = useStore((s) => s.addToCart);
  const openCart = useStore((s) => s.openCart);
  const showToast = useStore((s) => s.showToast);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [heartAnim, setHeartAnim] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const [revealed, setRevealed] = useState(false);

  const isFav = favorites.includes(product.id);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setRevealed(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    if (cardRef.current) observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, []);

  const handleFavorite = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      toggleFavorite(product.id);
      setHeartAnim(true);
      setTimeout(() => setHeartAnim(false), 200);
    },
    [product.id, toggleFavorite]
  );

  const handleAddToCart = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      addToCart(product.id);
      showToast(`已将「${product.name}」加入购物车`);
      openCart();
    },
    [product.id, product.name, addToCart, showToast, openCart]
  );

  return (
    <div
      ref={cardRef}
      className={`card-item reveal-item ${revealed ? 'revealed' : ''}`}
      style={{ animationDelay: `${index * 0.05}s` }}
    >
      <div
        className="product-card bg-white rounded-2xl overflow-hidden cursor-pointer"
        style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
        onClick={() => navigate(`/product/${product.id}`)}
      >
        <div className="relative" style={{ aspectRatio: '4/3' }}>
          {!imgLoaded && (
            <div className="absolute inset-0 image-placeholder rounded-t-2xl" />
          )}
          <img
            src={product.imageUrl}
            alt={product.name}
            loading="lazy"
            onLoad={() => setImgLoaded(true)}
            className={`w-full h-full object-cover rounded-t-2xl transition-opacity duration-300 ${
              imgLoaded ? 'opacity-100' : 'opacity-0'
            }`}
          />
          <button
            onClick={handleFavorite}
            className="absolute top-3 right-3 w-9 h-9 flex items-center justify-center rounded-full bg-white/80 backdrop-blur-sm transition-colors hover:bg-white"
          >
            <Heart
              size={18}
              className={`transition-colors ${heartAnim ? 'heart-bounce' : ''}`}
              fill={isFav ? '#E11D48' : 'none'}
              stroke={isFav ? '#E11D48' : '#D1D5DB'}
              strokeWidth={2}
            />
          </button>
        </div>

        <div className="p-4">
          <h3 className="font-serif text-base font-semibold text-stone-800 mb-1 truncate">
            {product.name}
          </h3>
          <p className="text-sm text-stone-400 mb-2">{product.makerName}</p>
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold" style={{ color: '#D97706' }}>
              ¥{product.price}
            </span>
            <button
              onClick={handleAddToCart}
              className="text-xs px-3 py-1.5 rounded-lg text-white transition-colors"
              style={{ backgroundColor: '#059669' }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = '#047857')
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = '#059669')
              }
            >
              加入购物车
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Gallery({ products }: GalleryProps) {
  const [category, setCategory] = useState<Category>('全部');
  const categories: Category[] = ['全部', '陶瓷', '编织', '木雕'];

  const filtered =
    category === '全部'
      ? products
      : products.filter((p) => p.category === category);

  return (
    <div>
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200 ${
              category === cat
                ? 'text-white shadow-sm'
                : 'bg-white text-stone-600 hover:bg-stone-50'
            }`}
            style={
              category === cat
                ? { backgroundColor: '#D97706' }
                : undefined
            }
          >
            {cat}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-16 h-16 rounded-full bg-warm-100 flex items-center justify-center mb-4">
            <svg
              className="w-8 h-8 text-warm-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
              />
            </svg>
          </div>
          <p className="text-stone-400 text-sm">该分类暂无商品</p>
        </div>
      ) : (
        <div className="gallery-masonry">
          {filtered.map((product, index) => (
            <ProductCard
              key={product.id}
              product={product}
              index={index}
            />
          ))}
        </div>
      )}
    </div>
  );
}
