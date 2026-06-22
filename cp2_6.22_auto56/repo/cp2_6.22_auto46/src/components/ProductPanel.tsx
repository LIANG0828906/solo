import { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from 'recharts';
import type { ProductDetail } from '../types';
import '../styles/ProductPanel.css';

interface ProductPanelProps {
  product: ProductDetail;
  visible: boolean;
  onClose: () => void;
}

function ProductPanel({ product, visible, onClose }: ProductPanelProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    if (visible) {
      setIsMounted(true);
    }
  }, [visible]);

  useEffect(() => {
    if (!visible && isMounted) {
      const timer = setTimeout(() => {
        setIsMounted(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [visible, isMounted]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && visible) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [visible, onClose]);

  if (!isMounted) return null;

  const stockPercent = Math.round((product.stock / product.maxStock) * 100);
  const isLowStock = stockPercent < 20;

  const totalReviews = product.ratingDistribution.reduce((a, b) => a + b, 0);

  const ratingChartData = product.ratingDistribution.map((count, index) => ({
    star: `${5 - index}星`,
    count: product.ratingDistribution[4 - index],
    starNum: 5 - index,
  }));

  const chartColors = ['#2ecc71', '#27ae60', '#f39c12', '#e67e22', '#e74c3c'];

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  const categoryNames: Record<string, string> = {
    fruit: '水果',
    vegetable: '蔬菜',
    meat: '肉类',
    seafood: '海鲜',
  };

  return (
    <>
      <div
        className={`product-panel-overlay ${visible ? 'visible' : ''}`}
        onClick={onClose}
      />
      <div className={`product-panel ${visible ? 'visible' : ''}`}>
        <header className="panel-header">
          <div className="panel-header-info">
            <h2 className="panel-product-name">{product.name}</h2>
            <div className="panel-product-meta">
              <span className="panel-meta-item">
                📦 <strong>{categoryNames[product.category] || product.category}</strong>
              </span>
              <span className="panel-meta-item">
                ⭐ <strong>{product.rating}</strong>
              </span>
              <span className="panel-meta-item">
                💰 <strong>¥{product.price.toFixed(2)}</strong>
              </span>
            </div>
          </div>
          <button className="panel-close-btn" onClick={onClose}>
            ✕
          </button>
        </header>

        <div className="panel-body">
          <section className="panel-section">
            <h3 className="panel-section-title">核心数据</h3>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-value">{product.totalSales}</div>
                <div className="stat-label">30天总销量</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{product.profitPercent}%</div>
                <div className="stat-label">预估利润率</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{product.feedbackCount}</div>
                <div className="stat-label">用户反馈数</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">
                  {product.feedbackCount > 0
                    ? Math.round((product.positiveFeedback / product.feedbackCount) * 100)
                    : 0}%
                </div>
                <div className="stat-label">好评率</div>
              </div>
            </div>
          </section>

          <section className="panel-section">
            <h3 className="panel-section-title">库存状态</h3>
            {isLowStock ? (
              <div className="stock-warning">
                <span className="stock-warning-icon">⚠️</span>
                <div className="stock-warning-text">
                  <div className="stock-warning-title">库存预警！库存不足 20%</div>
                  <div className="stock-warning-desc">
                    当前库存 {product.stock} / {product.maxStock}，建议尽快补货
                  </div>
                </div>
              </div>
            ) : (
              <div className="stock-normal">
                <span className="stock-normal-icon">✅</span>
                <div className="stock-info-text">
                  <div className="stock-info-title">库存充足</div>
                  <div className="stock-info-desc">
                    当前库存 {product.stock} / {product.maxStock}
                  </div>
                </div>
              </div>
            )}
            <div className="stock-bar-large">
              <div className="stock-bar">
                <div
                  className={`stock-bar-fill ${isLowStock ? 'low' : ''}`}
                  style={{ width: `${stockPercent}%` }}
                />
              </div>
            </div>
          </section>

          <section className="panel-section">
            <h3 className="panel-section-title">销量趋势（近30天）</h3>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={product.salesHistory} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ecf0f1" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: '#7f8c8d' }}
                    tickFormatter={formatDate}
                    interval={5}
                    axisLine={{ stroke: '#bdc3c7' }}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#7f8c8d' }}
                    axisLine={{ stroke: '#bdc3c7' }}
                    width={40}
                  />
                  <Tooltip
                    formatter={(value: number) => [`${value} 件`, '销量']}
                    labelFormatter={(label) => `日期: ${label}`}
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '2px solid #2ecc71',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="sales"
                    stroke="#2ecc71"
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 6, fill: '#27ae60', stroke: '#fff', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="panel-section">
            <h3 className="panel-section-title">评分分布</h3>
            <div className="chart-container" style={{ height: '180px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ratingChartData} layout="vertical" margin={{ top: 5, right: 10, left: 30, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ecf0f1" horizontal={false} />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 11, fill: '#7f8c8d' }}
                    axisLine={{ stroke: '#bdc3c7' }}
                  />
                  <YAxis
                    type="category"
                    dataKey="star"
                    tick={{ fontSize: 11, fill: '#7f8c8d' }}
                    axisLine={{ stroke: '#bdc3c7' }}
                    width={36}
                  />
                  <Tooltip
                    formatter={(value: number) => [`${value} 条`, '评价数']}
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '2px solid #2ecc71',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {ratingChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={chartColors[5 - entry.starNum]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ marginTop: '10px', fontSize: '12px', color: '#7f8c8d', textAlign: 'center' }}>
              共 {totalReviews} 条评价
            </div>
          </section>

          <section className="panel-section">
            <h3 className="panel-section-title">最新评论</h3>
            <div className="reviews-list">
              {product.reviews.map((review) => (
                <div key={review.id} className="review-item">
                  <div className="review-header">
                    <span className="review-user">{review.user}</span>
                    <span className="review-rating">
                      {'⭐'.repeat(review.rating)}
                    </span>
                  </div>
                  <div className="review-date">{review.date}</div>
                  <p className="review-content">{review.content}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </>
  );
}

export default ProductPanel;
