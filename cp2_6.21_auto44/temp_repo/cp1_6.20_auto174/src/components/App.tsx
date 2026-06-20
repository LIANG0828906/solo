import React, { useState, useEffect, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import ProductCard from './ProductCard';
import ProductForm from './ProductForm';
import PricingRuleManager from './PricingRuleManager';
import { Product, PricingRule } from '../types';

const API_BASE = '/api';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error';
}

interface PriceInfo {
  price: number | null;
  type: string | null;
  endTime: string | null;
}

const typeLabels: Record<string, string> = {
  daily: '日常价',
  flash_sale: '限时折扣',
  member: '会员专享'
};

export default function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [pricingRules, setPricingRules] = useState<Record<string, PricingRule[]>>({});
  const [serverTime, setServerTime] = useState<Date>(new Date());
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showPricingManager, setShowPricingManager] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [selectedProductName, setSelectedProductName] = useState('');
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [salesData, setSalesData] = useState<{ date: string; quantity: number }[]>([]);
  const [salesFilter, setSalesFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  const addToast = useCallback((message: string, type: 'success' | 'error') => {
    const id = Date.now().toString() + Math.random().toString(36);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 2000);
  }, []);

  const fetchProducts = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/products`);
      const data = await res.json();
      setProducts(data);
      const rulesMap: Record<string, PricingRule[]> = {};
      await Promise.all(
        data.map(async (p: Product) => {
          const rulesRes = await fetch(`${API_BASE}/products/${p.id}/pricing-rules`);
          rulesMap[p.id] = await rulesRes.json();
        })
      );
      setPricingRules(rulesMap);
    } catch {
      addToast('获取商品数据失败', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    const syncTime = async () => {
      try {
        const res = await fetch(`${API_BASE}/server-time`);
        const data = await res.json();
        setServerTime(new Date(data.time));
      } catch {
        setServerTime(new Date());
      }
    };
    syncTime();
    const interval = setInterval(syncTime, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const tick = setInterval(() => {
      setServerTime(prev => new Date(prev.getTime() + 1000));
    }, 1000);
    return () => clearInterval(tick);
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  useEffect(() => {
    const fetchSales = async () => {
      try {
        const url = salesFilter === 'all'
          ? `${API_BASE}/sales`
          : `${API_BASE}/sales?productId=${salesFilter}`;
        const res = await fetch(url);
        setSalesData(await res.json());
      } catch {
        addToast('获取销量数据失败', 'error');
      }
    };
    fetchSales();
  }, [salesFilter, products, addToast]);

  const getCurrentPrice = useCallback((productId: string): PriceInfo => {
    const rules = pricingRules[productId] || [];
    const now = serverTime.getTime();
    const activeRules = rules.filter(r =>
      new Date(r.startTime).getTime() <= now && now <= new Date(r.endTime).getTime()
    );
    if (activeRules.length === 0) return { price: null, type: null, endTime: null };
    const priority: Array<'flash_sale' | 'member' | 'daily'> = ['flash_sale', 'member', 'daily'];
    for (const type of priority) {
      const typeRules = activeRules.filter(r => r.type === type);
      if (typeRules.length > 0) {
        typeRules.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        return { price: typeRules[0].price, type: typeRules[0].type, endTime: typeRules[0].endTime };
      }
    }
    return { price: null, type: null, endTime: null };
  }, [pricingRules, serverTime]);

  const getProfitMargin = (costPrice: number, currentPrice: number | null): number | null => {
    if (currentPrice === null || currentPrice === 0) return null;
    return ((currentPrice - costPrice) / currentPrice) * 100;
  };

  const activeFlashSales = products
    .map(p => ({ product: p, ...getCurrentPrice(p.id) }))
    .filter(item => item.type === 'flash_sale');

  const formatCountdown = (endIso: string | null): string => {
    if (!endIso) return '';
    const diff = new Date(endIso).getTime() - serverTime.getTime();
    if (diff <= 0) return '已结束';
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleProductSubmit = async (data: Partial<Product>) => {
    try {
      if (editingProduct) {
        await fetch(`${API_BASE}/products/${editingProduct.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        addToast('商品更新成功', 'success');
      } else {
        await fetch(`${API_BASE}/products`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        addToast('商品创建成功', 'success');
      }
      setShowProductForm(false);
      setEditingProduct(null);
      fetchProducts();
    } catch {
      addToast('操作失败', 'error');
    }
  };

  const handleDeleteProduct = async (id: string) => {
    try {
      await fetch(`${API_BASE}/products/${id}`, { method: 'DELETE' });
      addToast('商品已删除', 'success');
      fetchProducts();
    } catch {
      addToast('删除失败', 'error');
    }
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setShowProductForm(true);
  };

  const handleManagePricing = (productId: string) => {
    const p = products.find(p => p.id === productId);
    setSelectedProductId(productId);
    setSelectedProductName(p?.name || '');
    setShowPricingManager(true);
  };

  const handleGenerateSales = async () => {
    try {
      await fetch(`${API_BASE}/sales/generate`, { method: 'POST' });
      addToast('销量数据已生成', 'success');
      setSalesFilter(f => f);
    } catch {
      addToast('生成失败', 'error');
    }
  };

  if (loading) {
    return (
      <div style={styles.loadingWrap}>
        <div style={styles.spinner} />
        <span style={{ color: '#6c757d' }}>加载中...</span>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.7} }
        .countdown-blink { animation: blink 1s ease-in-out infinite; font-family: monospace; }
        @keyframes slideIn { from{transform:translateY(-100%);opacity:0} to{transform:translateY(0);opacity:1} }
        .toast-in { animation: slideIn 300ms ease forwards; }
        .product-card:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.12); }
        .product-card { transition: transform 300ms ease, box-shadow 300ms ease; }
        button:hover { filter: brightness(0.92); }
        select:hover { filter: brightness(0.98); }
        .product-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; }
        @media (max-width: 1279px) { .product-grid { grid-template-columns: repeat(3, 1fr); } }
        @media (max-width: 991px) { .product-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 767px) { .product-grid { grid-template-columns: 1fr; } }
      `}</style>

      <div style={styles.toastContainer}>
        {toasts.map(t => (
          <div key={t.id} className="toast-in" style={{
            ...styles.toast,
            backgroundColor: t.type === 'success' ? '#28a745' : '#dc3545'
          }}>
            {t.message}
          </div>
        ))}
      </div>

      {activeFlashSales.length > 0 && (
        <div style={styles.banner}>
          <div style={styles.bannerContent}>
            {activeFlashSales.map((item, idx) => (
              <div key={item.product.id} style={styles.bannerItem}>
                <span style={styles.bannerIcon}>🔥</span>
                <span style={styles.bannerText}>
                  【{item.product.name}】限时折扣进行中 — {typeLabels[item.type || '']} ¥{item.price?.toFixed(2)}
                </span>
                <span className="countdown-blink" style={styles.bannerCountdown}>
                  {formatCountdown(item.endTime)}
                </span>
                {idx < activeFlashSales.length - 1 && <span style={styles.bannerSep}>|</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <h1 style={styles.heading}>手工艺品市集</h1>
          <span style={styles.subtitle}>卖家定价与库存管理</span>
        </div>
        <div style={styles.headerRight}>
          <button style={styles.btnGenerate} onClick={handleGenerateSales}>生成模拟销量</button>
          <button style={styles.btnAdd} onClick={() => { setEditingProduct(null); setShowProductForm(true); }}>
            + 新建商品
          </button>
        </div>
      </header>

      <section className="product-grid" style={styles.grid}>
        {products.map(product => {
          const priceInfo = getCurrentPrice(product.id);
          const margin = getProfitMargin(product.costPrice, priceInfo.price);
          return (
            <ProductCard
              key={product.id}
              product={product}
              currentPrice={priceInfo.price}
              currentPriceType={priceInfo.type}
              profitMargin={margin}
              onEdit={handleEditProduct}
              onManagePricing={handleManagePricing}
            />
          );
        })}
        {products.length === 0 && (
          <div style={styles.emptyState}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🎨</div>
            <div style={{ color: '#6c757d', marginBottom: 16 }}>还没有商品，点击右上角添加</div>
          </div>
        )}
      </section>

      <section style={styles.chartSection}>
        <div style={styles.chartHeader}>
          <h2 style={styles.chartTitle}>销量趋势（近30天）</h2>
          <div style={styles.chartFilter}>
            <select
              style={styles.chartSelect}
              value={salesFilter}
              onChange={(e) => setSalesFilter(e.target.value)}
            >
              <option value="all">全部商品</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        </div>
        {salesData.length > 0 ? (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={salesData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e9ecef" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#6c757d' }} />
              <YAxis tick={{ fontSize: 11, fill: '#6c757d' }} />
              <Tooltip
                contentStyle={{ borderRadius: 8, border: '1px solid #e0e0e0', fontSize: 13 }}
              />
              <Line
                type="monotone"
                dataKey="quantity"
                stroke="#00d2ff"
                strokeWidth={2}
                dot={{ r: 3, fill: '#00d2ff' }}
                activeDot={{ r: 5 }}
                name="销量"
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div style={styles.chartEmpty}>
            暂无销量数据，点击"生成模拟销量"按钮生成
          </div>
        )}
      </section>

      {showProductForm && (
        <ProductForm
          product={editingProduct}
          onSubmit={handleProductSubmit}
          onCancel={() => { setShowProductForm(false); setEditingProduct(null); }}
        />
      )}

      {showPricingManager && selectedProductId && (
        <PricingRuleManager
          productId={selectedProductId}
          productName={selectedProductName}
          onClose={() => { setShowPricingManager(false); setSelectedProductId(null); fetchProducts(); }}
          onToast={addToast}
        />
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    backgroundColor: '#f8f9fa',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
  },
  toastContainer: {
    position: 'fixed',
    top: 16,
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 2000,
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    alignItems: 'center'
  },
  toast: {
    color: '#fff',
    padding: '10px 24px',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: 500,
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    whiteSpace: 'nowrap'
  },
  banner: {
    background: 'linear-gradient(135deg, #d4edda, #c3e6cb)',
    padding: '12px 24px',
    display: 'flex',
    justifyContent: 'center'
  },
  bannerContent: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    flexWrap: 'wrap',
    justifyContent: 'center'
  },
  bannerItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    color: '#fff'
  },
  bannerIcon: {
    fontSize: '18px'
  },
  bannerText: {
    fontSize: '14px',
    fontWeight: 500,
    textShadow: '0 1px 2px rgba(0,0,0,0.1)'
  },
  bannerCountdown: {
    fontSize: '16px',
    fontWeight: 700,
    color: '#fff',
    letterSpacing: 1
  },
  bannerSep: {
    opacity: 0.6,
    fontWeight: 300
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 32px',
    maxWidth: 1400,
    margin: '0 auto',
    flexWrap: 'wrap',
    gap: 12
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'baseline',
    gap: 12
  },
  heading: {
    margin: 0,
    fontSize: '24px',
    fontWeight: 700,
    color: '#212529'
  },
  subtitle: {
    fontSize: '14px',
    color: '#6c757d'
  },
  headerRight: {
    display: 'flex',
    gap: 10
  },
  btnGenerate: {
    padding: '9px 18px',
    border: '1px solid #e0e0e0',
    borderRadius: '6px',
    backgroundColor: '#fff',
    color: '#495057',
    fontSize: '13px',
    cursor: 'pointer'
  },
  btnAdd: {
    padding: '9px 20px',
    border: 'none',
    borderRadius: '6px',
    backgroundColor: '#00d2ff',
    color: '#fff',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer'
  },
  grid: {
    padding: '0 32px 32px',
    maxWidth: 1400,
    margin: '0 auto'
  },
  emptyState: {
    gridColumn: '1 / -1',
    textAlign: 'center',
    padding: '60px 0'
  },
  chartSection: {
    maxWidth: 1400,
    margin: '0 auto',
    padding: '0 32px 40px'
  },
  chartHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  chartTitle: {
    margin: 0,
    fontSize: '18px',
    fontWeight: 600,
    color: '#212529'
  },
  chartFilter: {
    display: 'flex',
    alignItems: 'center'
  },
  chartSelect: {
    padding: '6px 12px',
    border: '1px solid #e0e0e0',
    borderRadius: '6px',
    fontSize: '13px',
    backgroundColor: '#fff',
    cursor: 'pointer',
    outline: 'none'
  },
  chartEmpty: {
    textAlign: 'center',
    color: '#adb5bd',
    padding: '40px 0',
    backgroundColor: '#fff',
    borderRadius: '8px',
    border: '1px solid #e0e0e0'
  },
  loadingWrap: {
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#f8f9fa'
  },
  spinner: {
    width: 36,
    height: 36,
    border: '3px solid #e0e0e0',
    borderTopColor: '#00d2ff',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite'
  }
};
