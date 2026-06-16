import { useEffect } from 'react';
import { useProductStore } from '@/store/useProductStore';
import { useProjectStore } from '@/store/useProjectStore';
import { ProductCard } from '@/components/ProductCard';
import { Palette, Package } from 'lucide-react';

export function ShowcasePage() {
  const { products, refreshProducts } = useProductStore();
  const { projects, isHydrated } = useProjectStore();

  useEffect(() => {
    if (isHydrated) {
      refreshProducts();
    }
  }, [isHydrated, projects.length, refreshProducts]);

  return (
    <div className="showcase-page">
      <div className="showcase-hero">
        <div className="hero-content">
          <div className="hero-icon">
            <Palette size={36} />
          </div>
          <h1 className="hero-title">作品展示架</h1>
          <p className="hero-subtitle">精心呈现每一件手工作品，讲述它们的创作故事</p>
          <div className="hero-stats">
            <div className="hero-stat">
              <strong>{products.length}</strong>
              <span>件作品</span>
            </div>
            <div className="hero-stat">
              <strong>{projects.length}</strong>
              <span>个项目</span>
            </div>
          </div>
        </div>
      </div>

      <div className="showcase-container">
        {products.length === 0 ? (
          <div className="empty-showcase">
            <div className="empty-icon-wrapper">
              <Package size={60} />
            </div>
            <h2>展示架还是空的</h2>
            <p>在"创作记录"中标记作品为"已完成"，它们就会出现在这里啦</p>
          </div>
        ) : (
          <div className="product-grid">
            {products.map((product, index) => (
              <ProductCard key={product.id} product={product} index={index} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
