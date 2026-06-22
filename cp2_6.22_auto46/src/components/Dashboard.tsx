import { useState, useEffect, useCallback, useMemo } from 'react';
import { getProducts, getProductDetail, submitFeedback } from '../services/api';
import type { Product, ProductDetail, ProductQuery } from '../types';
import '../styles/Dashboard.css';

interface DashboardProps {
  onProductClick: (product: ProductDetail) => void;
}

const categoryOptions = [
  { value: 'all', label: '全部品类' },
  { value: 'fruit', label: '水果' },
  { value: 'vegetable', label: '蔬菜' },
  { value: 'meat', label: '肉类' },
  { value: 'seafood', label: '海鲜' },
];

const sortOptions = [
  { value: 'hotScore', label: '热度' },
  { value: 'sales', label: '销量' },
  { value: 'rating', label: '评分' },
  { value: 'profit', label: '利润' },
];

const gradientColors = [
  'linear-gradient(135deg, #2ecc71 0%, #27ae60 100%)',
  'linear-gradient(135deg, #3498db 0%, #2980b9 100%)',
  'linear-gradient(135deg, #9b59b6 0%, #8e44ad 100%)',
  'linear-gradient(135deg, #1abc9c 0%, #16a085 100%)',
  'linear-gradient(135deg, #2ecc71 0%, #3498db 100%)',
  'linear-gradient(135deg, #3498db 0%, #9b59b6 100%)',
];

function getGradient(index: number): string {
  return gradientColors[index % gradientColors.length];
}

function getCategoryEmoji(category: string): string {
  const emojis: Record<string, string> = {
    fruit: '🍎',
    vegetable: '🥬',
    meat: '🥩',
    seafood: '🦐',
  };
  return emojis[category] || '🛒';
}

function Dashboard({ onProductClick }: DashboardProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [animating, setAnimating] = useState(false);
  
  const [category, setCategory] = useState('all');
  const [minPrice, setMinPrice] = useState<number | ''>('');
  const [maxPrice, setMaxPrice] = useState<number | ''>('');
  const [minRating, setMinRating] = useState<number | ''>('');
  const [sortBy, setSortBy] = useState<'hotScore' | 'sales' | 'rating' | 'profit'>('hotScore');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  const [feedbackStates, setFeedbackStates] = useState<Record<string, { type: 'like' | 'dislike' | null; shaking: boolean; showToast: boolean }>>({});

  const fetchProducts = useCallback(async () => {
    setAnimating(true);
    try {
      const query: ProductQuery = {
        category,
        sortBy,
        sortOrder,
      };
      if (minPrice !== '') query.minPrice = Number(minPrice);
      if (maxPrice !== '') query.maxPrice = Number(maxPrice);
      if (minRating !== '') query.minRating = Number(minRating);

      const response = await getProducts(query);
      setProducts(response.products);
    } catch (error) {
      console.error('获取商品列表失败:', error);
    } finally {
      setLoading(false);
      setTimeout(() => setAnimating(false), 300);
    }
  }, [category, minPrice, maxPrice, minRating, sortBy, sortOrder]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleProductClick = useCallback(async (product: Product) => {
    try {
      const detail = await getProductDetail(product.id);
      onProductClick(detail);
    } catch (error) {
      console.error('获取商品详情失败:', error);
    }
  }, [onProductClick]);

  const handleFeedback = useCallback(async (productId: string, type: 'like' | 'dislike', e: React.MouseEvent) => {
    e.stopPropagation();
    
    setFeedbackStates(prev => ({
      ...prev,
      [productId]: { type, shaking: true, showToast: true }
    }));

    try {
      const response = await submitFeedback(productId, type);
      
      setProducts(prev => prev.map(p => 
        p.id === productId 
          ? { 
              ...p, 
              feedbackCount: response.feedbackCount,
              positiveFeedback: response.positiveFeedback,
              hotScore: response.hotScore
            } 
          : p
      ));
    } catch (error) {
      console.error('提交反馈失败:', error);
    }

    setTimeout(() => {
      setFeedbackStates(prev => ({
        ...prev,
        [productId]: { ...prev[productId], shaking: false }
      }));
    }, 400);

    setTimeout(() => {
      setFeedbackStates(prev => ({
        ...prev,
        [productId]: { ...prev[productId], showToast: false }
      }));
    }, 1200);
  }, []);

  const handleSortChange = useCallback((sort: 'hotScore' | 'sales' | 'rating' | 'profit') => {
    if (sortBy === sort) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(sort);
      setSortOrder('desc');
    }
  }, [sortBy]);

  const stockPercentage = useCallback((product: Product) => {
    return Math.round((product.stock / product.maxStock) * 100);
  }, []);

  const isLowStock = useCallback((product: Product) => {
    return (product.stock / product.maxStock) < 0.2;
  }, []);

  const displayProducts = useMemo(() => {
    if (sortBy === 'hotScore' && sortOrder === 'desc') {
      return [...products].sort((a, b) => b.hotScore - a.hotScore);
    }
    return products;
  }, [products, sortBy, sortOrder]);

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1 className="dashboard-title">智能生鲜团购选品看板</h1>
        <p className="dashboard-subtitle">基于销量、评分和用户反馈的智能爆品推荐系统</p>
      </header>

      <div className="filter-bar">
        <div className="filter-group">
          <label className="filter-label">品类</label>
          <select
            className="filter-select"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {categoryOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label className="filter-label">价格区间</label>
          <div className="price-range">
            <input
              type="number"
              className="filter-input"
              placeholder="最低"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value ? Number(e.target.value) : '')}
              min="0"
            />
            <span className="price-separator">-</span>
            <input
              type="number"
              className="filter-input"
              placeholder="最高"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value ? Number(e.target.value) : '')}
              min="0"
            />
          </div>
        </div>

        <div className="filter-group">
          <label className="filter-label">最低评分</label>
          <select
            className="filter-select"
            value={minRating}
            onChange={(e) => setMinRating(e.target.value ? Number(e.target.value) : '')}
          >
            <option value="">不限</option>
            <option value="1">1星以上</option>
            <option value="2">2星以上</option>
            <option value="3">3星以上</option>
            <option value="4">4星以上</option>
            <option value="4.5">4.5星以上</option>
          </select>
        </div>

        <div className="filter-group" style={{ flex: 1, minWidth: 200 }}>
          <label className="filter-label">排序方式</label>
          <div className="sort-toggle">
            {sortOptions.map(opt => (
              <button
                key={opt.value}
                className={`sort-btn ${sortBy === opt.value ? 'active' : ''}`}
                onClick={() => handleSortChange(opt.value as 'hotScore' | 'sales' | 'rating' | 'profit')}
              >
                {opt.label}
                {sortBy === opt.value && (sortOrder === 'desc' ? ' ↓' : ' ↑')}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="stats-bar">
        <div className="stats-count">
          共 <strong>{products.length}</strong> 个商品
        </div>
      </div>

      {loading ? (
        <div className="loading">加载中...</div>
      ) : products.length === 0 ? (
        <div className="empty">暂无符合条件的商品</div>
      ) : (
        <div className={`products-grid ${animating ? 'fade-out' : 'fade-in'}`}>
          {displayProducts.map((product, index) => (
            <div
              key={product.id}
              className="product-card"
              onClick={() => handleProductClick(product)}
              style={{ animationDelay: `${index * 30}ms` }}
            >
              <div className="product-card-image">
                <div 
                  className="product-image-placeholder"
                  style={{ background: getGradient(index) }}
                >
                  {getCategoryEmoji(product.category)}
                </div>
                <div className="product-hot-badge">
                  🔥 {product.hotScore.toFixed(2)}
                </div>
              </div>

              <div className="product-card-body">
                <h3 className="product-card-title">{product.name}</h3>
                
                <div className="product-card-meta">
                  <span className="product-price">{product.price.toFixed(2)}</span>
                  <span className="product-rating">
                    ⭐ <span className="product-rating-score">{product.rating}</span>
                  </span>
                </div>

                <div className="product-stock">
                  <div className="stock-label">
                    <span>库存</span>
                    <span>{stockPercentage(product)}% ({product.stock}/{product.maxStock})</span>
                  </div>
                  <div className="stock-bar">
                    <div 
                      className={`stock-bar-fill ${isLowStock(product) ? 'low' : ''}`}
                      style={{ width: `${stockPercentage(product)}%` }}
                    />
                  </div>
                </div>

                <div className="product-profit">
                  💰 预估利润 {product.profitPercent}%
                </div>
              </div>

              <div className="product-card-footer">
                <button
                  className={`feedback-btn like ${feedbackStates[product.id]?.type === 'like' && feedbackStates[product.id]?.showToast ? 'shake' : ''}`}
                  onClick={(e) => handleFeedback(product.id, 'like', e)}
                >
                  👍 点赞
                  {feedbackStates[product.id]?.showToast && feedbackStates[product.id]?.type === 'like' && (
                    <span className="feedback-toast like">已点赞 +1</span>
                  )}
                </button>
                <button
                  className={`feedback-btn dislike ${feedbackStates[product.id]?.type === 'dislike' && feedbackStates[product.id]?.showToast ? 'shake' : ''}`}
                  onClick={(e) => handleFeedback(product.id, 'dislike', e)}
                >
                  👎 点踩
                  {feedbackStates[product.id]?.showToast && feedbackStates[product.id]?.type === 'dislike' && (
                    <span className="feedback-toast dislike">已点踩</span>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Dashboard;
