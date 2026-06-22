import React, { memo } from 'react';
import type { Product } from '@/types';

interface ProductCardProps {
  product: Product;
  onEdit: (product: Product) => void;
  onDelete: (id: string) => void;
  isNew?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = memo(function ProductCard({
  product,
  onEdit,
  onDelete,
  isNew = false,
}) {
  const remainingStock = product.stock - product.sold;
  const stockPercentage = Math.max(0, Math.min(100, (remainingStock / product.dailyLimit) * 100));

  return (
    <div className={`product-card card ${isNew ? 'scale-in' : ''}`}>
      <div className="product-info">
        <h3 className="product-name">{product.name}</h3>
        <div className="product-price">¥{product.price.toFixed(2)}</div>
      </div>
      <div className="product-stock">
        <div className="stock-label">
          <span>剩余库存</span>
          <span className="stock-count">
            {remainingStock} / {product.dailyLimit}
          </span>
        </div>
        <div className="stock-bar">
          <div
            className="stock-progress"
            style={{
              width: `${stockPercentage}%`,
              backgroundColor:
                stockPercentage > 50
                  ? 'var(--color-success)'
                  : stockPercentage > 20
                  ? 'var(--color-warning)'
                  : 'var(--color-danger)',
            }}
          />
        </div>
      </div>
      <div className="product-actions">
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => onEdit(product)}
        >
          编辑
        </button>
        <button
          className="btn btn-danger btn-sm"
          onClick={() => onDelete(product.id)}
        >
          删除
        </button>
      </div>
      <style>{`
        .product-card {
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .product-info {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }
        .product-name {
          font-size: 16px;
          font-weight: 600;
          color: var(--color-text);
          margin: 0;
        }
        .product-price {
          font-size: 20px;
          font-weight: 700;
          color: var(--color-accent);
        }
        .product-stock {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .stock-label {
          display: flex;
          justify-content: space-between;
          font-size: 13px;
          color: var(--color-text-light);
        }
        .stock-count {
          font-weight: 600;
          color: var(--color-text);
        }
        .stock-bar {
          height: 8px;
          background-color: var(--color-background);
          border-radius: 4px;
          overflow: hidden;
        }
        .stock-progress {
          height: 100%;
          border-radius: 4px;
          transition: width var(--transition-slow) ease,
            background-color var(--transition-slow) ease;
        }
        .product-actions {
          display: flex;
          gap: 10px;
          justify-content: flex-end;
        }
      `}</style>
    </div>
  );
});
