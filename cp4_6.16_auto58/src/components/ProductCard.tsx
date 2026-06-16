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

  const handleClick = () => {
    navigate(`/product/${product.id}`);
  };

  const randomRotate = (index % 5 - 2) * 0.3;

  return (
    <div
      className="product-card"
      onClick={handleClick}
      style={{
        animationDelay: `${index * 50}ms`,
        transform: `rotate(${randomRotate}deg)`
      }}
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
