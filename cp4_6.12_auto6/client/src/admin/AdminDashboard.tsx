import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import type { Book, Stats, Category, PriceSuggestion } from '../types';
import { CATEGORIES } from '../types';
import StarRating from '../components/StarRating';
import BookForm from './BookForm';

interface CanvasChartProps {
  data: { date: string; count: number }[];
}

function CanvasChart({ data }: CanvasChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; date: string; count: number } | null>(null);

  const drawChart = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || data.length === 0) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = 250 * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = '250px';

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = 250;
    const paddingLeft = 40;
    const paddingRight = 20;
    const paddingTop = 20;
    const paddingBottom = 40;

    const maxCountRaw = Math.max(...data.map((d) => d.count), 1);
    const maxCount = Math.ceil(maxCountRaw / 5) * 5;

    ctx.clearRect(0, 0, width, height);

    const gridLines = 5;
    for (let i = 0; i <= gridLines; i++) {
      const y = paddingTop + (i / gridLines) * (height - paddingTop - paddingBottom);
      ctx.strokeStyle = '#E0E0E0';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(paddingLeft, y);
      ctx.lineTo(width - paddingRight, y);
      ctx.stroke();
      ctx.setLineDash([]);

      const label = maxCount - (i / gridLines) * maxCount;
      ctx.fillStyle = '#A1887F';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(Math.round(label)), paddingLeft - 8, y);
    }

    data.forEach((d, i) => {
      const x = paddingLeft + (i / Math.max(data.length - 1, 1)) * (width - paddingLeft - paddingRight);
      const dateStr = d.date.slice(5);
      ctx.fillStyle = '#A1887F';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(dateStr, x, height - paddingBottom + 12);
    });

    ctx.strokeStyle = '#FF7043';
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.beginPath();
    data.forEach((d, i) => {
      const x = paddingLeft + (i / Math.max(data.length - 1, 1)) * (width - paddingLeft - paddingRight);
      const y = paddingTop + (1 - d.count / maxCount) * (height - paddingTop - paddingBottom);
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();

    data.forEach((d, i) => {
      const x = paddingLeft + (i / Math.max(data.length - 1, 1)) * (width - paddingLeft - paddingRight);
      const y = paddingTop + (1 - d.count / maxCount) * (height - paddingTop - paddingBottom);
      ctx.fillStyle = 'white';
      ctx.strokeStyle = '#FF7043';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    });
  }, [data]);

  useEffect(() => {
    drawChart();
    const handleResize = () => drawChart();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [drawChart]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || data.length === 0) return;

    const rect = container.getBoundingClientRect();
    const width = rect.width;
    const height = 250;
    const paddingLeft = 40;
    const paddingRight = 20;
    const paddingTop = 20;
    const paddingBottom = 40;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    let nearestIndex = -1;
    let nearestDist = Infinity;

    data.forEach((d, i) => {
      const x = paddingLeft + (i / Math.max(data.length - 1, 1)) * (width - paddingLeft - paddingRight);
      const maxCountRaw = Math.max(...data.map((d) => d.count), 1);
      const maxCount = Math.ceil(maxCountRaw / 5) * 5;
      const y = paddingTop + (1 - d.count / maxCount) * (height - paddingTop - paddingBottom);
      const dist = Math.sqrt((mouseX - x) ** 2 + (mouseY - y) ** 2);
      if (dist < nearestDist && dist < 20) {
        nearestDist = dist;
        nearestIndex = i;
      }
    });

    if (nearestIndex >= 0) {
      const d = data[nearestIndex];
      setTooltip({ x: mouseX, y: mouseY, date: d.date, count: d.count });
    } else {
      setTooltip(null);
    }
  };

  const handleMouseLeave = () => setTooltip(null);

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      <canvas
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ width: '100%', height: '250px', display: 'block' }}
      />
      {tooltip && (
        <div
          style={{
            position: 'absolute',
            left: tooltip.x + 12,
            top: tooltip.y - 30,
            background: 'rgba(62, 39, 35, 0.9)',
            color: 'white',
            padding: '6px 12px',
            borderRadius: '6px',
            fontSize: '13px',
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
            zIndex: 10,
          }}
        >
          {tooltip.date}: {tooltip.count} 本
        </div>
      )}
    </div>
  );
}

const menuItems = [
  { icon: '📊', label: '数据看板', value: 'stats' as const, path: '/admin' },
  { icon: '📚', label: '库存管理', value: 'books' as const, path: '/admin/books' },
  { icon: '💰', label: '收购定价', value: 'pricing' as const, path: '/admin/pricing' },
];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const location = useLocation();

  const getInitialTab = (): 'stats' | 'books' | 'pricing' => {
    if (location.pathname.includes('/pricing')) return 'pricing';
    if (location.pathname.includes('/books')) return 'books';
    return 'stats';
  };

  const [activeTab, setActiveTab] = useState<'stats' | 'books' | 'pricing'>(getInitialTab());
  const [stats, setStats] = useState<Stats | null>(null);
  const [books, setBooks] = useState<Book[]>([]);
  const [showBookForm, setShowBookForm] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [inventoryRefresh, setInventoryRefresh] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [pricing, setPricing] = useState<{ title: string; author: string; year: number | ''; condition: number }>({
    title: '',
    author: '',
    year: '',
    condition: 4,
  });
  const [suggestion, setSuggestion] = useState<PriceSuggestion | null>(null);
  const [suggestionKey, setSuggestionKey] = useState(0);

  useEffect(() => {
    if (location.pathname.includes('/pricing')) setActiveTab('pricing');
    else if (location.pathname.includes('/books')) setActiveTab('books');
    else setActiveTab('stats');
  }, [location.pathname]);

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval>;

    const fetchStats = async () => {
      try {
        const res = await fetch('/api/stats');
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (e) {
        // ignore
      }
    };

    fetchStats();
    intervalId = setInterval(fetchStats, 10000);

    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const res = await fetch('/api/books?pageSize=200');
        if (res.ok) {
          const data = await res.json();
          setBooks(data.data || []);
        }
      } catch (e) {
        // ignore
      }
    };

    fetchBooks();
  }, [inventoryRefresh]);

  useEffect(() => {
    if (pricing.year === '' || !pricing.condition) return;

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/books/price-suggestion?year=${pricing.year}&condition=${pricing.condition}`
        );
        if (res.ok) {
          const data = await res.json();
          setSuggestion(data);
          setSuggestionKey((k) => k + 1);
        }
      } catch (e) {
        // ignore
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [pricing.year, pricing.condition]);

  const handleTabClick = (value: 'stats' | 'books' | 'pricing', path: string) => {
    setActiveTab(value);
    navigate(path);
    setSidebarOpen(false);
  };

  const handleToggleStatus = async (book: Book) => {
    const newStatus = book.status === 'on' ? 'off' : 'on';
    try {
      await fetch(`/api/books/${book.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      setInventoryRefresh((n) => n + 1);
    } catch (e) {
      // ignore
    }
  };

  const handleDelete = async (book: Book) => {
    if (!window.confirm(`确定删除《${book.title}》吗？`)) return;
    try {
      await fetch(`/api/books/${book.id}`, { method: 'DELETE' });
      setInventoryRefresh((n) => n + 1);
    } catch (e) {
      // ignore
    }
  };

  const breadcrumbTitle = menuItems.find((m) => m.value === activeTab)?.label || '数据看板';

  const inputStyle: React.CSSProperties = {
    width: '100%',
    border: '2px solid #D7CCC8',
    borderRadius: '6px',
    padding: '8px 12px',
    fontSize: '14px',
    fontFamily: 'var(--font-sans)',
    color: 'var(--color-text)',
    background: '#fff',
    outline: 'none',
    transition: 'border-color 0.2s ease',
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {sidebarOpen && (
        <div
          className="admin-sidebar-overlay"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.4)',
            zIndex: 49,
          }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className="admin-sidebar"
        style={{
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          width: '220px',
          background: '#4E342E',
          color: 'white',
          zIndex: 50,
          display: 'flex',
          flexDirection: 'column',
          transform: 'translateX(0)',
          transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1)',
        }}
      >
        <div
          style={{
            padding: '20px 24px',
            fontFamily: 'var(--font-serif)',
            fontSize: '20px',
            fontWeight: 700,
            color: 'white',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          旧书店管理
        </div>

        <nav style={{ flex: 1, paddingTop: '8px' }}>
          {menuItems.map((item) => {
            const isActive = activeTab === item.value;
            return (
              <div
                key={item.value}
                onClick={() => handleTabClick(item.value, item.path)}
                style={{
                  padding: '14px 20px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  transition: '0.2s',
                  background: isActive ? '#5D4037' : 'transparent',
                  borderLeft: isActive ? '3px solid #FF7043' : '3px solid transparent',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = '#5D4037';
                    e.currentTarget.style.borderLeft = '3px solid #FF7043';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.borderLeft = '3px solid transparent';
                  }
                }}
              >
                <span style={{ fontSize: '18px' }}>{item.icon}</span>
                <span style={{ fontSize: '15px' }}>{item.label}</span>
              </div>
            );
          })}
        </nav>

        <div
          style={{
            position: 'absolute',
            bottom: '20px',
            left: 0,
            right: 0,
            padding: '0 24px',
          }}
        >
          <button
            onClick={() => navigate('/')}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'rgba(255,255,255,0.7)',
              fontSize: '14px',
              cursor: 'pointer',
              padding: 0,
              fontFamily: 'var(--font-sans)',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'white')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.7)')}
          >
            ← 返回首页
          </button>
        </div>
      </aside>

      <main
        className="admin-main"
        style={{
          marginLeft: '220px',
          flex: 1,
          minWidth: 0,
          background: '#FAF0E6',
        }}
      >
        <div
          style={{
            height: '60px',
            background: 'white',
            borderBottom: '1px solid #D7CCC8',
            padding: '0 24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              className="admin-hamburger"
              onClick={() => setSidebarOpen(true)}
              style={{
                display: 'none',
                background: 'transparent',
                border: 'none',
                color: '#3E2723',
                fontSize: '22px',
                cursor: 'pointer',
                padding: '4px 8px',
              }}
            >
              ☰
            </button>
            <span
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '18px',
                fontWeight: 600,
                color: '#3E2723',
              }}
            >
              {breadcrumbTitle}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: '#8D6E63',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 600,
              }}
            >
              管
            </div>
            <span style={{ fontSize: '14px', color: '#3E2723' }}>管理员</span>
            <button
              onClick={() => navigate('/')}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#6D4C41',
                padding: '6px 12px',
                fontSize: '14px',
                cursor: 'pointer',
                fontFamily: 'var(--font-sans)',
              }}
            >
              退出
            </button>
          </div>
        </div>

        <div style={{ padding: '28px 24px', minHeight: 'calc(100vh - 60px)' }}>
          {activeTab === 'stats' && (
            <div>
              <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '28px' }}>
                <div
                  style={{
                    background: 'linear-gradient(135deg, #8D6E63, #A1887F)',
                    color: 'white',
                    padding: '24px',
                    borderRadius: '12px',
                    boxShadow: '0 4px 12px rgba(141,110,99,0.25)',
                  }}
                >
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>📦</div>
                  <div style={{ fontSize: '36px', fontWeight: 700 }}>{stats?.totalStock ?? 0}</div>
                  <div style={{ fontSize: '14px', opacity: 0.9, marginTop: '4px' }}>库存总数</div>
                </div>
                <div
                  style={{
                    background: 'linear-gradient(135deg, #FF7043, #FF8A65)',
                    color: 'white',
                    padding: '24px',
                    borderRadius: '12px',
                    boxShadow: '0 4px 12px rgba(255,112,67,0.25)',
                  }}
                >
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>📋</div>
                  <div style={{ fontSize: '36px', fontWeight: 700 }}>{stats?.pendingOrders ?? 0}</div>
                  <div style={{ fontSize: '14px', opacity: 0.9, marginTop: '4px' }}>待处理订单</div>
                </div>
                <div
                  style={{
                    background: 'linear-gradient(135deg, #6D4C41, #8D6E63)',
                    color: 'white',
                    padding: '24px',
                    borderRadius: '12px',
                    boxShadow: '0 4px 12px rgba(109,76,65,0.25)',
                  }}
                >
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>👁</div>
                  <div style={{ fontSize: '36px', fontWeight: 700 }}>{stats?.visits7d ?? 0}</div>
                  <div style={{ fontSize: '14px', opacity: 0.9, marginTop: '4px' }}>近7日访问</div>
                </div>
              </div>

              <div
                style={{
                  background: 'white',
                  padding: '24px',
                  borderRadius: '12px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                }}
              >
                <h3 style={{ fontWeight: 600, fontSize: '18px', marginBottom: '20px', color: '#3E2723' }}>近7日销量趋势</h3>
                <CanvasChart data={stats?.sales7d ?? []} />
              </div>
            </div>
          )}

          {activeTab === 'books' && (
            <div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '20px',
                }}
              >
                <h2
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: '22px',
                    fontWeight: 700,
                    color: '#3E2723',
                  }}
                >
                  库存书籍
                </h2>
                <button
                  onClick={() => {
                    setShowBookForm(true);
                    setEditingBook(null);
                  }}
                  style={{
                    background: '#FF7043',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '10px 20px',
                    fontSize: '14px',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-sans)',
                  }}
                >
                  + 上架新书
                </button>
              </div>

              {showBookForm && (
                <div
                  style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(0,0,0,0.4)',
                    zIndex: 100,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '16px',
                  }}
                  onClick={(e) => {
                    if (e.target === e.currentTarget) {
                      setShowBookForm(false);
                      setEditingBook(null);
                    }
                  }}
                >
                  <div
                    style={{
                      maxWidth: '700px',
                      width: 'calc(100% - 32px)',
                      maxHeight: '90vh',
                      overflowY: 'auto',
                    }}
                  >
                    <BookForm
                      book={editingBook}
                      onSubmit={() => {
                        setShowBookForm(false);
                        setEditingBook(null);
                        setInventoryRefresh((n) => n + 1);
                      }}
                      onCancel={() => {
                        setShowBookForm(false);
                        setEditingBook(null);
                      }}
                    />
                  </div>
                </div>
              )}

              <table
                className="admin-table"
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  background: 'white',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                }}
              >
                <thead>
                  <tr>
                    {['书名', '作者', '分类', '品相', '价格', '库存', '状态', '操作'].map((h) => (
                      <th
                        key={h}
                        style={{
                          background: '#F5E6D3',
                          color: '#6D4C41',
                          padding: '12px 16px',
                          textAlign: 'left',
                          fontSize: '13px',
                          fontWeight: 600,
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {books.map((book) => (
                    <tr key={book.id}>
                      <td style={{ padding: '12px 16px', borderBottom: '1px solid #F5E6D3', fontSize: '14px', fontWeight: 500, color: '#3E2723' }}>
                        {book.title}
                      </td>
                      <td style={{ padding: '12px 16px', borderBottom: '1px solid #F5E6D3', fontSize: '14px', color: '#6D4C41' }}>
                        {book.author}
                      </td>
                      <td style={{ padding: '12px 16px', borderBottom: '1px solid #F5E6D3', fontSize: '14px' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '2px 10px',
                            borderRadius: '12px',
                            background: '#F5E6D3',
                            color: '#6D4C41',
                            fontSize: '12px',
                          }}
                        >
                          {book.category}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', borderBottom: '1px solid #F5E6D3', fontSize: '14px' }}>
                        <StarRating rating={book.condition} size={14} />
                      </td>
                      <td style={{ padding: '12px 16px', borderBottom: '1px solid #F5E6D3', fontSize: '14px', color: '#FF7043', fontWeight: 700 }}>
                        ¥{book.price.toFixed(2)}
                      </td>
                      <td style={{ padding: '12px 16px', borderBottom: '1px solid #F5E6D3', fontSize: '14px', color: '#6D4C41' }}>
                        {book.stock}
                      </td>
                      <td style={{ padding: '12px 16px', borderBottom: '1px solid #F5E6D3', fontSize: '14px' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '2px 10px',
                            borderRadius: '12px',
                            background: book.status === 'on' ? '#E8F5E9' : '#FFEBEE',
                            color: book.status === 'on' ? '#2E7D32' : '#D32F2F',
                            fontSize: '12px',
                          }}
                        >
                          {book.status === 'on' ? '上架中' : '已下架'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', borderBottom: '1px solid #F5E6D3', fontSize: '14px' }}>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          <button
                            onClick={() => {
                              setEditingBook(book);
                              setShowBookForm(true);
                            }}
                            style={{
                              background: '#8D6E63',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              padding: '4px 10px',
                              fontSize: '12px',
                              cursor: 'pointer',
                              fontFamily: 'var(--font-sans)',
                            }}
                          >
                            编辑
                          </button>
                          <button
                            onClick={() => handleToggleStatus(book)}
                            style={{
                              background: book.status === 'on' ? '#6D4C41' : '#2E7D32',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              padding: '4px 10px',
                              fontSize: '12px',
                              cursor: 'pointer',
                              fontFamily: 'var(--font-sans)',
                            }}
                          >
                            {book.status === 'on' ? '下架' : '上架'}
                          </button>
                          <button
                            onClick={() => handleDelete(book)}
                            style={{
                              background: '#D32F2F',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              padding: '4px 10px',
                              fontSize: '12px',
                              cursor: 'pointer',
                              fontFamily: 'var(--font-sans)',
                            }}
                          >
                            删除
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {books.length === 0 && (
                    <tr>
                      <td colSpan={8} style={{ padding: '40px 16px', textAlign: 'center', color: '#A1887F', fontSize: '14px' }}>
                        暂无书籍数据
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              <div className="admin-book-cards" style={{ display: 'none' }}>
                {books.map((book) => (
                  <div
                    key={book.id}
                    style={{
                      background: 'white',
                      borderRadius: '12px',
                      padding: '16px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                      marginBottom: '12px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <div style={{ fontWeight: 500, fontSize: '16px', color: '#3E2723' }}>{book.title}</div>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '2px 10px',
                          borderRadius: '12px',
                          background: book.status === 'on' ? '#E8F5E9' : '#FFEBEE',
                          color: book.status === 'on' ? '#2E7D32' : '#D32F2F',
                          fontSize: '12px',
                        }}
                      >
                        {book.status === 'on' ? '上架中' : '已下架'}
                      </span>
                    </div>
                    <div style={{ fontSize: '14px', color: '#6D4C41', marginBottom: '8px' }}>{book.author}</div>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '12px' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '2px 10px',
                          borderRadius: '12px',
                          background: '#F5E6D3',
                          color: '#6D4C41',
                          fontSize: '12px',
                        }}
                      >
                        {book.category}
                      </span>
                      <StarRating rating={book.condition} size={14} />
                      <span style={{ color: '#6D4C41', fontSize: '13px' }}>库存: {book.stock}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#FF7043', fontWeight: 700, fontSize: '18px' }}>¥{book.price.toFixed(2)}</span>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          onClick={() => {
                            setEditingBook(book);
                            setShowBookForm(true);
                          }}
                          style={{
                            background: '#8D6E63',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            padding: '4px 10px',
                            fontSize: '12px',
                            cursor: 'pointer',
                          }}
                        >
                          编辑
                        </button>
                        <button
                          onClick={() => handleToggleStatus(book)}
                          style={{
                            background: book.status === 'on' ? '#6D4C41' : '#2E7D32',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            padding: '4px 10px',
                            fontSize: '12px',
                            cursor: 'pointer',
                          }}
                        >
                          {book.status === 'on' ? '下架' : '上架'}
                        </button>
                        <button
                          onClick={() => handleDelete(book)}
                          style={{
                            background: '#D32F2F',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            padding: '4px 10px',
                            fontSize: '12px',
                            cursor: 'pointer',
                          }}
                        >
                          删除
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {books.length === 0 && (
                  <div style={{ padding: '40px 16px', textAlign: 'center', color: '#A1887F', fontSize: '14px' }}>
                    暂无书籍数据
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'pricing' && (
            <div
              style={{
                background: 'white',
                padding: '28px',
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                maxWidth: '560px',
                margin: '0 auto',
              }}
            >
              <h2
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: '22px',
                  fontWeight: 700,
                  color: '#3E2723',
                  marginBottom: '6px',
                }}
              >
                收购价格智能评估
              </h2>
              <p style={{ color: '#6D4C41', fontSize: '14px', marginBottom: '28px' }}>
                根据品相和出版年份自动计算建议收购价
              </p>

              <form onSubmit={(e) => e.preventDefault()} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#6D4C41', marginBottom: '6px' }}>
                    书名
                  </label>
                  <input
                    type="text"
                    placeholder="书名"
                    value={pricing.title}
                    onChange={(e) => setPricing((p) => ({ ...p, title: e.target.value }))}
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#6D4C41', marginBottom: '6px' }}>
                    作者
                  </label>
                  <input
                    type="text"
                    placeholder="作者"
                    value={pricing.author}
                    onChange={(e) => setPricing((p) => ({ ...p, author: e.target.value }))}
                    style={inputStyle}
                  />
                </div>

                <div className="pricing-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#6D4C41', marginBottom: '6px' }}>
                      出版年份
                    </label>
                    <input
                      type="number"
                      placeholder="YYYY"
                      value={pricing.year}
                      onChange={(e) =>
                        setPricing((p) => ({ ...p, year: e.target.value ? Number(e.target.value) : '' }))
                      }
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#6D4C41', marginBottom: '6px' }}>
                      品相评分
                    </label>
                    <select
                      value={pricing.condition}
                      onChange={(e) => setPricing((p) => ({ ...p, condition: Number(e.target.value) }))}
                      style={inputStyle}
                    >
                      <option value={5}>5 - 全新</option>
                      <option value={4}>4 - 品相良好</option>
                      <option value={3}>3 - 有轻微磨损</option>
                      <option value={2}>2 - 明显使用痕迹</option>
                      <option value={1}>1 - 较差</option>
                    </select>
                  </div>
                </div>

                {suggestion && (
                  <div key={suggestionKey} className="pulse" style={{ marginTop: '24px' }}>
                    <div
                      style={{
                        background: '#E8F5E9',
                        border: '2px solid #81C784',
                        borderRadius: '12px',
                        padding: '24px',
                        textAlign: 'center',
                      }}
                    >
                      <div style={{ fontSize: '14px', color: '#2E7D32', marginBottom: '4px' }}>建议收购价</div>
                      <div style={{ fontSize: '48px', fontWeight: 700, color: '#2E7D32', lineHeight: 1.2 }}>
                        ¥{suggestion.suggestedPrice.toFixed(2)}
                      </div>
                      <div
                        style={{
                          marginTop: '16px',
                          display: 'flex',
                          justifyContent: 'center',
                          gap: '24px',
                          fontSize: '13px',
                          color: '#558B2F',
                          flexWrap: 'wrap',
                        }}
                      >
                        <span>基础价 ¥{suggestion.basePrice}</span>
                        <span>品相系数 ×{suggestion.conditionMultiplier.toFixed(2)}</span>
                        <span>年限折旧 ×{suggestion.yearDepreciation.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </form>
            </div>
          )}
        </div>
      </main>

      <style>{`
        @media (max-width: 767px) {
          .admin-sidebar {
            transform: translateX(-100%) !important;
          }
          .admin-sidebar[style*="translateX(0)"] {
            transform: translateX(0) !important;
          }
          .admin-main {
            margin-left: 0 !important;
          }
          .admin-hamburger {
            display: block !important;
          }
          .stats-grid {
            grid-template-columns: 1fr !important;
          }
          .admin-table {
            display: none !important;
          }
          .admin-book-cards {
            display: block !important;
          }
          .pricing-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
