import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Product } from '@/types';
import { Clock, Package } from 'lucide-react';
import { formatCurrency, formatHours, formatDate } from '@/utils/format';

interface ProductCardProps {
  product: Product;
  index: number;
}

export function ProductCard({ product, index }: ProductCardProps) {
  const navigate = useNavigate();
  const cardRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;

    if (typeof IntersectionObserver === 'undefined') {
      setIsVisible(true);
      setHasAnimated(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAnimated) {
            setIsVisible(true);
            setHasAnimated(true);
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '50px 0px'
      }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [hasAnimated]);

  const handleClick = () => {
    navigate(`/product/${product.id}`);
  };

  const tilt = (index % 5 - 2) * 0.3;

  return (
    <div
      ref={cardRef}
      className={`product-card ${isVisible ? 'card-visible' : 'card-hidden'}`}
      onClick={handleClick}
      style={
        {
          '--card-tilt': `${tilt}deg`,
          '--stagger-delay': `${index * 50}ms`
        } as React.CSSProperties
      }
    >
      <div className="card-cover">
        {product.coverImage ? (
          <img src={product.coverImage} alt={product.title} loading="lazy" />
        ) : (
          <div className="cover-placeholder">
            <Package size={48} />
          </div>
        )}
      </div>
      <div className="card-body">
        <h3 className="card-title">{product.title}</h3>
        <p className="card-description">{product.description || '暂无描述'}</p>
        <div className="card-footer">
          <div className="card-stat">
            <Clock size={14} />
            <span>{formatHours(product.totalHours)}</span>
          </div>
          <div className="card-stat cost">
            <span>成本 {formatCurrency(product.totalCost)}</span>
          </div>
        </div>
        <div className="card-date">{formatDate(product.completedDate)}</div>
      </div>
    </div>
  );
}
