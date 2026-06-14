import { useState, useMemo, useEffect, useRef } from 'react';
import { useDataStore } from '@/utils/dataStore';
import { CATEGORY_LABELS, type Category, type Product } from '@/types';
import { Icon } from '@/App';

const SearchIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.3-4.3" />
  </svg>
);

const XIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
);

const SlidersIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <line x1="4" x2="4" y1="21" y2="14" />
    <line x1="4" x2="4" y1="10" y2="3" />
    <line x1="12" x2="12" y1="21" y2="12" />
    <line x1="12" x2="12" y1="8" y2="3" />
    <line x1="20" x2="20" y1="21" y2="16" />
    <line x1="20" x2="20" y1="12" y2="3" />
    <line x1="1" x2="7" y1="14" y2="14" />
    <line x1="9" x2="15" y1="8" y2="8" />
    <line x1="17" x2="23" y1="16" y2="16" />
  </svg>
);

function ProductCard({
  product,
  index,
  onVisible,
}: {
  product: Product;
  index: number;
  onVisible: () => void;
}) {
  const { navigate } = useDataStore();
  const cardRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(true);
      onVisible();
    }, index * 40);
    return () => clearTimeout(timer);
  }, [index, onVisible]);

  useEffect(() => {
    if (!cardRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setImgLoaded(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' }
    );
    observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, []);

  const handleClick = () => {
    navigate({ name: 'detail', params: { id: product.id } });
  };

  const conditionLabel = (condition: number) => {
    if (condition >= 9) return '几乎全新';
    if (condition >= 7) return '成色较好';
    if (condition >= 5) return '有使用痕迹';
    return '品相一般';
  };

  return (
    <div
      ref={cardRef}
      onClick={handleClick}
      className={`product-card ${visible ? 'visible' : ''}`}
    >
      <div className="card" style={{ transition: 'box-shadow 300ms ease, transform 300ms ease' }}>
        <div className="product-card-image-wrap">
          {imgLoaded && product.images[0] ? (
            <img
              src={product.images[0]}
              alt={product.title}
              className="product-card-image"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="animate-spin" style={{ width: 24, height: 24, border: '2px solid var(--morandi-blue)', borderTopColor: 'transparent', borderRadius: '50%' }} />
            </div>
          )}
          {product.status === 'sold' && (
            <div className="product-card-sold">已交换</div>
          )}
          <div className="product-card-category">
            {CATEGORY_LABELS[product.category]}
          </div>
        </div>
        <div className="product-card-content">
          <h3 className="product-card-title">{product.title}</h3>
          <div className="product-card-condition">
            <span className="condition-bar">
              <span className="condition-track">
                <span className="condition-fill" style={{ width: `${product.condition * 10}%` }} />
              </span>
              <span>{product.condition}/10</span>
            </span>
            <span className="condition-label">{conditionLabel(product.condition)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function getColumnCount(width: number): number {
  if (width >= 1024) return 4;
  if (width >= 768) return 3;
  if (width >= 500) return 2;
  return 1;
}

export default function BrowsePage() {
  const { state } = useDataStore();
  const { products } = state;

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | 'all'>('all');
  const [minCondition, setMinCondition] = useState(1);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [containerWidth, setContainerWidth] = useState<number>(
    typeof window !== 'undefined' ? window.innerWidth : 1024
  );
  const [visibleCount, setVisibleCount] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleResize = () => setContainerWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      if (product.status !== 'published') return false;
      if (selectedCategory !== 'all' && product.category !== selectedCategory) return false;
      if (product.condition < minCondition) return false;
      if (searchQuery && !product.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [products, selectedCategory, minCondition, searchQuery]);

  const columnCount = getColumnCount(containerWidth);

  const waterfallColumns = useMemo(() => {
    const columns: Product[][] = Array.from({ length: columnCount }, () => []);
    filteredProducts.forEach((product, index) => {
      const targetColumn = index % columnCount;
      columns[targetColumn].push(product);
    });
    return columns;
  }, [filteredProducts, columnCount]);

  const productIndexMap = useMemo(() => {
    const map: Record<string, number> = {};
    filteredProducts.forEach((p, i) => (map[p.id] = i));
    return map;
  }, [filteredProducts]);

  const handleCardVisible = () => {
    setVisibleCount((c) => c + 1);
  };

  const categories: Array<{ key: Category | 'all'; label: string }> = [
    { key: 'all', label: '全部' },
    ...(Object.entries(CATEGORY_LABELS) as [Category, string][]).map(([key, label]) => ({
      key,
      label,
    })),
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-header-inner">
          <h1 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
            二手好物
          </h1>
          <div className="flex gap-2">
            <div className="search-box">
              <SearchIcon className="search-icon" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索物品..."
                className="search-input"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="search-clear" aria-label="清除">
                  <XIcon style={{ width: 16, height: 16 }} />
                </button>
              )}
            </div>
            <button
              onClick={() => setShowFilterPanel(!showFilterPanel)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-full border transition-all duration-300 ${
                showFilterPanel ? '' : ''
              }`}
              style={{
                backgroundColor: showFilterPanel ? 'var(--morandi-blue)' : 'white',
                borderColor: showFilterPanel ? 'var(--morandi-blue)' : 'var(--morandi-gray)',
                color: showFilterPanel ? 'white' : 'var(--morandi-brown)',
              }}
            >
              <SlidersIcon style={{ width: 18, height: 18 }} />
              <span className="text-sm hidden-sm">筛选</span>
            </button>
          </div>
        </div>
      </div>

      <div className="page-content" ref={containerRef} style={{ maxWidth: 1024, marginTop: 16 }}>
        <div className="tag-scroll">
          {categories.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setSelectedCategory(cat.key)}
              className={`tag ${selectedCategory === cat.key ? 'active' : ''}`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {showFilterPanel && (
        <div className="page-content" style={{ maxWidth: 1024 }}>
          <div className="filter-panel">
            <div className="filter-header">
              <span className="filter-title">新旧程度筛选</span>
              <span className="filter-value">{minCondition} 成新及以上</span>
            </div>
            <input
              type="range"
              min={1}
              max={10}
              value={minCondition}
              onChange={(e) => setMinCondition(Number(e.target.value))}
              className="slider"
              style={{
                background: `linear-gradient(to right, #A8B5A0 0%, #A8B5A0 ${(minCondition - 1) * 11.11}%, #E8E6E1 ${(minCondition - 1) * 11.11}%, #E8E6E1 100%)`,
              }}
            />
            <div className="filter-range">
              <span>1成新</span>
              <span>10成新</span>
            </div>
          </div>
        </div>
      )}

      <div className="page-content" style={{ maxWidth: 1024 }}>
        <div className="result-header">
          <p className="result-count">
            共 <strong>{filteredProducts.length}</strong> 件好物
          </p>
        </div>

        {filteredProducts.length > 0 ? (
          <div className="waterfall-container" style={{ flexDirection: columnCount === 1 ? 'column' : 'row' }}>
            {waterfallColumns.map((column, colIndex) => (
              <div key={colIndex} className="waterfall-column" style={columnCount === 1 ? { width: '100%' } : {}}>
                {column.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    index={productIndexMap[product.id]}
                    onVisible={handleCardVisible}
                  />
                ))}
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-icon-wrap">
              <SearchIcon style={{ width: 32, height: 32 }} />
            </div>
            <p className="empty-title">没有找到相关物品</p>
            <p className="empty-desc">试试其他筛选条件吧</p>
          </div>
        )}
      </div>
    </div>
  );
}
