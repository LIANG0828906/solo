import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Search } from 'lucide-react';
import { useStore } from '@/store';

export default function Favorites() {
  const navigate = useNavigate();
  const favorites = useStore((s) => s.favorites);
  const products = useStore((s) => s.products);
  const toggleFavorite = useStore((s) => s.toggleFavorite);

  const favProducts = products.filter((p) => favorites.includes(p.id));

  return (
    <div className="max-w-content mx-auto px-4 py-6 animate-fade-in-up">
      <h1 className="font-serif text-2xl font-bold text-stone-800 mb-6">我的收藏</h1>

      {favProducts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Heart size={48} className="text-stone-200 mb-3" />
          <p className="text-stone-400 text-sm">暂无收藏</p>
          <p className="text-stone-300 text-xs mt-1">点击商品卡片上的心形图标即可收藏</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {favProducts.map((product, index) => (
            <FavCard
              key={product.id}
              product={product}
              index={index}
              onToggle={toggleFavorite}
              onClick={() => navigate(`/product/${product.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function FavCard({
  product,
  index,
  onToggle,
  onClick,
}: {
  product: import('@/types').Product;
  index: number;
  onToggle: (id: string) => void;
  onClick: () => void;
}) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [heartAnim, setHeartAnim] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const [revealed, setRevealed] = useState(false);

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

  return (
    <div
      ref={cardRef}
      className={`reveal-item ${revealed ? 'revealed' : ''}`}
      style={{ animationDelay: `${index * 0.05}s` }}
    >
      <div
        className="product-card bg-white rounded-2xl overflow-hidden cursor-pointer"
        style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
        onClick={onClick}
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
            onClick={(e) => {
              e.stopPropagation();
              onToggle(product.id);
              setHeartAnim(true);
              setTimeout(() => setHeartAnim(false), 200);
            }}
            className="absolute top-3 right-3 w-9 h-9 flex items-center justify-center rounded-full bg-white/80 backdrop-blur-sm transition-colors hover:bg-white"
          >
            <Heart
              size={18}
              className={heartAnim ? 'heart-bounce' : ''}
              fill="#E11D48"
              stroke="#E11D48"
              strokeWidth={2}
            />
          </button>
        </div>
        <div className="p-4">
          <h3 className="font-serif text-base font-semibold text-stone-800 mb-1 truncate">
            {product.name}
          </h3>
          <p className="text-sm text-stone-400 mb-2">{product.makerName}</p>
          <span className="text-lg font-bold" style={{ color: '#D97706' }}>
            ¥{product.price}
          </span>
        </div>
      </div>
    </div>
  );
}
