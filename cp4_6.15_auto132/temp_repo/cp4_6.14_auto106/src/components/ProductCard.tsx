import React from 'react';
import { Product } from '../api';
import { useStore } from '../store';

interface ProductCardProps {
  product: Product;
  showCart?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, showCart }) => {
  const addToCart = useStore((s) => s.addToCart);
  const isLowStock = product.stock < 5;

  return (
    <div className="product-card">
      {isLowStock && <div className="low-stock-dot" />}
      {showCart && (
        <button
          className="product-card-cart-btn"
          onClick={() => addToCart(product)}
          title="加入购物车"
          disabled={product.stock === 0}
        >
          +
        </button>
      )}
      <div className="product-card-image-wrap">
        <img
          src={product.image}
          alt={product.name}
          className="product-card-image"
          loading="lazy"
        />
      </div>
      <div className="product-card-body">
        <div className="product-card-name">{product.name}</div>
        <div className="product-card-meta">
          {product.category} · {product.dimensions.length}×{product.dimensions.width}×
          {product.dimensions.height}cm
        </div>
        <div className="product-card-price">¥{product.price.toFixed(2)}</div>
        <div className={`product-card-stock ${isLowStock ? 'low' : ''}`}>
          库存：{product.stock} 件
        </div>
      </div>
    </div>
  );
};
