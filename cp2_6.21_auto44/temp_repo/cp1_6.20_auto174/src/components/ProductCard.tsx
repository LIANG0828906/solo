import React from 'react';
import { Product, PricingRule } from '../types';

interface ProductCardProps {
  product: Product;
  currentPrice: number | null;
  currentPriceType: string | null;
  profitMargin: number | null;
  onEdit: (product: Product) => void;
  onManagePricing: (productId: string) => void;
}

const typeLabels: Record<string, string> = {
  daily: '日常价',
  flash_sale: '限时折扣',
  member: '会员专享'
};

const typeColors: Record<string, string> = {
  daily: '#6c757d',
  flash_sale: '#e74c3c',
  member: '#f0ad4e'
};

export default function ProductCard({
  product,
  currentPrice,
  currentPriceType,
  profitMargin,
  onEdit,
  onManagePricing
}: ProductCardProps) {
  return (
    <div className="product-card" style={styles.card}>
      <div style={styles.imageWrapper}>
        <img
          src={product.imageUrl}
          alt={product.name}
          style={styles.image}
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'data:image/svg+xml,' + encodeURIComponent(
              '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="150" fill="%23e0e0e0"><rect width="200" height="150"/><text x="100" y="80" text-anchor="middle" fill="%23999" font-size="14">暂无图片</text></svg>'
            );
          }}
        />
        <span style={styles.categoryBadge}>{product.category}</span>
      </div>
      <div style={styles.body}>
        <h3 style={styles.name}>{product.name}</h3>
        <p style={styles.desc}>{product.description}</p>
        <div style={styles.priceRow}>
          <div style={styles.priceSection}>
            {currentPrice !== null ? (
              <>
                <span style={styles.price}>¥{currentPrice.toFixed(2)}</span>
                <span style={{
                  ...styles.priceType,
                  backgroundColor: (typeColors[currentPriceType || ''] || '#6c757d') + '1a',
                  color: typeColors[currentPriceType || ''] || '#6c757d'
                }}>
                  {typeLabels[currentPriceType || ''] || ''}
                </span>
              </>
            ) : (
              <span style={styles.noPrice}>当前无定价</span>
            )}
          </div>
          {profitMargin !== null && currentPrice !== null && (
            <span style={{
              ...styles.margin,
              color: profitMargin >= 30 ? '#28a745' : profitMargin >= 15 ? '#f0ad4e' : '#dc3545'
            }}>
              利润率 {profitMargin.toFixed(1)}%
            </span>
          )}
        </div>
        <div style={styles.stockRow}>
          <span style={styles.stock}>库存：{product.stock}件</span>
          <span style={styles.cost}>成本 ¥{product.costPrice.toFixed(2)}</span>
        </div>
        <div style={styles.actions}>
          <button style={styles.btnEdit} onClick={() => onEdit(product)}>编辑</button>
          <button style={styles.btnPricing} onClick={() => onManagePricing(product.id)}>定价管理</button>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  card: {
    backgroundColor: '#fff',
    borderRadius: '8px',
    border: '1px solid #e0e0e0',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    overflow: 'hidden',
    transition: 'transform 300ms ease, box-shadow 300ms ease',
    display: 'flex',
    flexDirection: 'column'
  },
  imageWrapper: {
    position: 'relative',
    width: '100%',
    paddingTop: '60%',
    overflow: 'hidden',
    backgroundColor: '#f0f0f0'
  },
  image: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  },
  categoryBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(0,210,255,0.85)',
    color: '#fff',
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: 500
  },
  body: {
    padding: '12px 16px 16px',
    display: 'flex',
    flexDirection: 'column',
    flex: 1
  },
  name: {
    margin: '0 0 6px',
    fontSize: '16px',
    fontWeight: 600,
    color: '#212529',
    lineHeight: 1.3
  },
  desc: {
    margin: '0 0 12px',
    fontSize: '13px',
    color: '#6c757d',
    lineHeight: 1.5,
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
    flex: 1
  },
  priceRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  priceSection: {
    display: 'flex',
    alignItems: 'center',
    gap: 6
  },
  price: {
    fontSize: '20px',
    fontWeight: 700,
    color: '#00d2ff'
  },
  priceType: {
    fontSize: '11px',
    padding: '1px 6px',
    borderRadius: '3px',
    fontWeight: 500
  },
  noPrice: {
    fontSize: '14px',
    color: '#dc3545',
    fontWeight: 500
  },
  margin: {
    fontSize: '13px',
    fontWeight: 500
  },
  stockRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    fontSize: '13px'
  },
  stock: {
    color: '#495057'
  },
  cost: {
    color: '#adb5bd'
  },
  actions: {
    display: 'flex',
    gap: 8
  },
  btnEdit: {
    flex: 1,
    padding: '7px 0',
    border: '1px solid #e0e0e0',
    borderRadius: '6px',
    backgroundColor: '#fff',
    color: '#495057',
    fontSize: '13px',
    cursor: 'pointer',
    transition: 'background-color 200ms'
  },
  btnPricing: {
    flex: 1,
    padding: '7px 0',
    border: 'none',
    borderRadius: '6px',
    backgroundColor: '#00d2ff',
    color: '#fff',
    fontSize: '13px',
    cursor: 'pointer',
    transition: 'background-color 200ms'
  }
};
