import { Product } from '../store';
import './ProductCard.css';

interface Props {
  product: Product;
  onClick: () => void;
  delay?: number;
  primaryColor?: string;
}

function ProductCard({ product, onClick, delay = 0, primaryColor }: Props) {
  const getCategoryColor = (category: string) => {
    switch (category) {
      case '饰品':
        return '#FF6B6B';
      case '陶艺':
        return '#8B6914';
      case '布艺':
        return '#9B59B6';
      default:
        return '#666';
    }
  };

  return (
    <div
      className="product-card"
      onClick={onClick}
      style={{
        animationDelay: `${delay}s`,
        '--card-primary': primaryColor || '#C0874E',
      } as React.CSSProperties}
    >
      <div className="product-image">
        <img src={product.image} alt={product.name} loading="lazy" />
        <span
          className="product-category"
          style={{ backgroundColor: getCategoryColor(product.category) }}
        >
          {product.category}
        </span>
      </div>
      <div className="product-info">
        <h3 className="product-name">{product.name}</h3>
        <div className="product-bottom">
          <span className="product-price">¥{product.price}</span>
          <span className="product-favorite">❤️ {product.favorite_count}</span>
        </div>
      </div>
    </div>
  );
}

export default ProductCard;
