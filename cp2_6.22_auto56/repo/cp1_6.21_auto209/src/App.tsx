import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import AdminPanel from './components/AdminPanel';
import Notification from './components/Notification';
import BookList from './BookModule/BookList';
import { fetchCategories } from './utils/api';

function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [categories, setCategories] = useState<string[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    setIsLoading(true);
    try {
      const res = await fetchCategories();
      if (res.success) {
        setCategories(res.data);
      }
    } catch (error) {
      console.error('加载分类失败:', error);
      setCategories([
        '文学小说',
        '科学技术',
        '历史传记',
        '经济管理',
        '艺术设计',
        '儿童读物',
        '哲学思想',
        '生活百科',
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchDebounced = (query: string) => {
    setSearchQuery(query);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#0F172A',
      }}
    >
      <Navbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        categories={categories}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        onToggleAdmin={() => setShowAdmin(!showAdmin)}
        showAdmin={showAdmin}
      />

      <Notification />

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {showAdmin ? (
          <AdminPanel isOpen={showAdmin} />
        ) : (
          <>
            <div
              style={{
                padding: '32px 24px',
                background: 'linear-gradient(180deg, #1E293B 0%, #0F172A 100%)',
                borderBottom: '1px solid #1E293B',
              }}
              className="hero-section"
            >
              <div
                style={{
                  maxWidth: '1200px',
                  margin: '0 auto',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    marginBottom: '12px',
                  }}
                >
                  <h1
                    style={{
                      fontSize: '32px',
                      fontWeight: 800,
                      background: 'linear-gradient(135deg, #F8FAFC, #94A3B8)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      margin: 0,
                      lineHeight: 1.2,
                    }}
                    className="hero-title"
                  >
                    探索知识的海洋
                  </h1>
                  <svg
                    width="36"
                    height="36"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#6366F1"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="hero-icon"
                  >
                    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                  </svg>
                </div>
                <p
                  style={{
                    fontSize: '16px',
                    color: '#94A3B8',
                    margin: 0,
                    lineHeight: 1.6,
                    maxWidth: '600px',
                  }}
                  className="hero-subtitle"
                >
                  海量精选图书，一键预约借阅，开启您的阅读之旅。
                  支持在线续借、智能推荐，让阅读更便捷。
                </p>

                <div
                  style={{
                    display: 'flex',
                    gap: '24px',
                    marginTop: '24px',
                    flexWrap: 'wrap',
                  }}
                  className="hero-stats"
                >
                  {[
                    { label: '馆藏图书', value: categories.length > 0 ? '24+' : '--', color: '#6366F1' },
                    { label: '图书分类', value: categories.length || '--', color: '#22C55E' },
                    { label: '本月新增', value: '8+', color: '#F59E0B' },
                    { label: '读者好评', value: '98%', color: '#EC4899' },
                  ].map((stat, i) => (
                    <div
                      key={i}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                      }}
                    >
                      <div
                        style={{
                          width: '44px',
                          height: '44px',
                          borderRadius: '12px',
                          backgroundColor: `${stat.color}20`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <span
                          style={{
                            fontSize: '20px',
                            fontWeight: 700,
                            color: stat.color,
                          }}
                        >
                          {stat.value}
                        </span>
                      </div>
                      <span style={{ fontSize: '14px', color: '#64748B' }}>
                        {stat.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div
              style={{
                flex: 1,
                padding: '32px 24px 48px',
                maxWidth: '1400px',
                margin: '0 auto',
                width: '100%',
              }}
            >
              {isLoading ? (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '80px',
                    color: '#64748B',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      fontSize: '16px',
                    }}
                  >
                    <div className="loading-spinner" />
                    正在加载馆藏数据...
                  </div>
                </div>
              ) : (
                <BookList
                  searchQuery={searchQuery}
                  selectedCategory={selectedCategory}
                  categories={categories}
                  onSearchDebounced={handleSearchDebounced}
                />
              )}
            </div>

            <footer
              style={{
                padding: '24px',
                backgroundColor: '#0F172A',
                borderTop: '1px solid #1E293B',
                textAlign: 'center',
              }}
            >
              <p
                style={{
                  fontSize: '13px',
                  color: '#64748B',
                  margin: 0,
                }}
              >
                © 2025 智慧书屋 · Smart Library System · 让阅读触手可及
              </p>
            </footer>
          </>
        )}
      </div>

      <style>{`
        @media (max-width: 1024px) {
          .hero-title { font-size: 26px !important; }
          .hero-icon { width: 28px !important; height: 28px !important; }
          .hero-subtitle { font-size: 14px !important; }
        }
        @media (max-width: 768px) {
          .hero-section { padding: 24px 16px !important; }
          .hero-title { font-size: 22px !important; }
          .hero-icon { display: none; }
          .hero-stats { gap: 16px !important; margin-top: 16px !important; }
          .hero-stats > div { flex: 1; min-width: 45%; }
        }
        @media (max-width: 640px) {
          .hero-stats { gap: 12px !important; }
        }
      `}</style>
    </div>
  );
}

export default App;
