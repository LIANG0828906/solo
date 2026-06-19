import { memo, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Calendar, Droplets } from 'lucide-react';
import type { Product, UsageLog } from '@/types';
import { getTypeColor, getProgressGradient } from '@/utils/colorUtils';
import { 
  getRemainingPercent, 
  getEstimatedDaysLeft, 
  getProductStatus, 
  isLowStock,
  formatDisplayDate,
  getExpireDate
} from '@/utils/productUtils';

interface ProductCardProps {
  product: Product;
  usageLogs: UsageLog[];
  index: number;
}

export const ProductCard = memo(({ product, usageLogs, index }: ProductCardProps) => {
  const navigate = useNavigate();
  
  const remainingPercent = useMemo(() => getRemainingPercent(product), [product]);
  const daysLeft = useMemo(() => getEstimatedDaysLeft(product, usageLogs), [product, usageLogs]);
  const status = useMemo(() => getProductStatus(product), [product]);
  const lowStock = useMemo(() => isLowStock(product), [product]);
  const typeColor = useMemo(() => getTypeColor(product.type), [product.type]);
  const progressColor = useMemo(() => getProgressGradient(remainingPercent), [remainingPercent]);
  const expireDate = useMemo(() => getExpireDate(product), [product]);

  const handleClick = () => {
    navigate(`/product/${product.id}`);
  };

  return (
    <div
      onClick={handleClick}
      className="relative bg-white rounded-card shadow-card hover:shadow-card-hover hover:-translate-y-2 transition-all duration-300 cursor-pointer overflow-hidden animate-scaleIn"
      style={{ animationDelay: `${index * 0.05}s` }}
    >
      {lowStock && status === '进行中' && (
        <div className="absolute top-3 right-3 z-10">
          <div className="w-8 h-8 rounded-full bg-warning flex items-center justify-center animate-pulseSlow shadow-lg">
            <AlertTriangle className="w-4 h-4 text-white" />
          </div>
        </div>
      )}

      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div
            className="px-3 py-1 rounded-full text-xs font-medium text-white"
            style={{ backgroundColor: typeColor }}
          >
            {product.type}
          </div>
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${
            status === '进行中' ? 'bg-success/20 text-success' :
            status === '已过期' ? 'bg-warning/20 text-warning' :
            'bg-gray-200 text-gray-500'
          }`}>
            {status}
          </span>
        </div>

        <h3 className="text-lg font-semibold text-gray-800 mb-1 line-clamp-1">
          {product.name}
        </h3>
        <p className="text-sm text-gray-500 mb-4">{product.brand}</p>

        <div className="mb-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-gray-500">剩余容量</span>
            <span className="font-semibold text-gray-700">
              {remainingPercent.toFixed(0)}%
            </span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500 ease-out"
              style={{
                width: `${remainingPercent}%`,
                backgroundColor: progressColor,
              }}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-gray-400 mt-1">
            <span>{product.usedAmount.toFixed(1)} 已用</span>
            <span>{product.capacity.toFixed(0)} ml/g</span>
          </div>
        </div>

        <div className="space-y-2 pt-3 border-t border-gray-100">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="w-4 h-4 text-primary" />
            <span>过期: {formatDisplayDate(expireDate)}</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Droplets className="w-4 h-4 text-primary" />
            <span>
              {daysLeft !== null
                ? `预计 ${daysLeft} 天后用完`
                : '暂无使用数据'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
});

ProductCard.displayName = 'ProductCard';
