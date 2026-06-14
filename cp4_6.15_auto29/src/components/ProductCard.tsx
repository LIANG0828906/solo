import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Product } from '@/types';
import { CATEGORY_LABELS } from '@/types';

interface ProductCardProps {
  product: Product;
  index?: number;
}

export default function ProductCard({ product, index = 0 }: ProductCardProps) {
  const navigate = useNavigate();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, index * 50);
    return () => clearTimeout(timer);
  }, [index]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setImageLoaded(true);
            observer.disconnect();
          }
        });
      },
      { rootMargin: '100px' }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const handleClick = () => {
    navigate(`/product/${product.id}`);
  };

  const conditionLabel = (condition: number) => {
    if (condition >= 9) return '几乎全新';
    if (condition >= 7) return '成色较好';
    if (condition >= 5) return '有使用痕迹';
    return '品相一般';
  };

  return (
    <div
      ref={imgRef}
      onClick={handleClick}
      className={`masonry-item cursor-pointer group transition-all duration-300 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
    >
      <div className="bg-white rounded-card overflow-hidden shadow-card group-hover:shadow-card-hover group-hover:-translate-y-0.5 transition-all duration-300">
        <div className="relative overflow-hidden">
          {imageLoaded && product.images[0] ? (
            <img
              src={product.images[0]}
              alt={product.title}
              className="w-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
              onLoad={() => setImageLoaded(true)}
            />
          ) : (
            <div className="w-full bg-morandi-gray aspect-square flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-morandi-blue border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          {product.status === 'sold' && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <span className="text-white font-medium text-lg">已交换</span>
            </div>
          )}
          <div className="absolute top-2 left-2">
            <span className="px-2 py-1 bg-white/90 backdrop-blur-sm text-morandi-blue text-xs rounded-full font-medium">
              {CATEGORY_LABELS[product.category]}
            </span>
          </div>
        </div>
        <div className="p-3">
          <h3 className="text-sm font-medium text-gray-700 line-clamp-2 mb-2 group-hover:text-morandi-blue transition-colors duration-300">
            {product.title}
          </h3>
          <div className="flex items-center justify-between text-xs text-morandi-brown">
            <span className="flex items-center gap-1">
              <span className="w-12 h-1.5 bg-morandi-gray rounded-full overflow-hidden">
                <span
                  className="block h-full bg-morandi-green rounded-full"
                  style={{ width: `${product.condition * 10}%` }}
                />
              </span>
              <span>{product.condition}/10</span>
            </span>
            <span className="text-[11px] opacity-75">
              {conditionLabel(product.condition)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
