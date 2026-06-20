import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/store';
import BookCard from '@/books/BookCard';
import ShelfCard from '@/components/ShelfCard';

const ShelfDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, books, shelves, stats, isLoadingBooks, fetchBooks, fetchShelves, fetchStats } = useStore();
  const [activeTab, setActiveTab] = useState<'books' | 'shelves'>('books');

  useEffect(() => {
    fetchBooks();
    fetchShelves();
    fetchStats();
  }, []);

  const statCards = [
    {
      icon: '📖',
      label: '已读书目',
      value: stats?.totalBooksRead ?? 0,
      suffix: '本',
      color: 'from-[#6C63FF] to-[#A78BFA]',
    },
    {
      icon: '📄',
      label: '本月阅读',
      value: stats?.monthlyPages ?? 0,
      suffix: '页',
      color: 'from-[#4ADE80] to-[#34D399]',
    },
    {
      icon: '⭐',
      label: '平均评分',
      value: stats?.averageRating ?? 0,
      suffix: '分',
      color: 'from-[#FBBF24] to-[#F59E0B]',
    },
    {
      icon: '🔥',
      label: '连续阅读',
      value: stats?.currentStreak ?? 0,
      suffix: '天',
      color: 'from-[#F87171] to-[#FB7185]',
    },
  ];

  return (
    <div className="fade-in">
      <div style={{ marginBottom: 28 }} className="slide-up">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 8,
            flexWrap: 'wrap',
            gap: 16,
          }}
        >
          <div>
            <h1
              style={{
                fontSize: 30,
                fontWeight: 700,
                marginBottom: 6,
                background: 'linear-gradient(135deg, #FFFFFF 0%, #C7D2FE 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              你好，{user?.username || '书友'} 👋
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
              今天是阅读的好日子，继续享受书籍带来的乐趣吧
            </p>
          </div>
          <button className="btn-primary" onClick={() => navigate('/book/add')}>
            <span>➕</span>
            添加书籍
          </button>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 16,
          marginBottom: 36,
        }}
      >
        {statCards.map((stat, i) => (
          <div
            key={stat.label}
            className={`slide-up stagger-${i + 1}`}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: 16,
              padding: 22,
              transition: 'all 0.3s ease',
              position: 'relative',
              overflow: 'hidden',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = 'var(--shadow-md)';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: -20,
                right: -20,
                width: 100,
                height: 100,
                borderRadius: '50%',
                background: `linear-gradient(135deg, ${stat.color})`,
                opacity: 0.15,
                filter: 'blur(20px)',
              }}
            />
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ fontSize: 30, marginBottom: 12 }}>{stat.icon}</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 6 }}>
                {stat.label}
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                <span style={{ fontSize: 28, fontWeight: 700, color: '#fff' }}>
                  {stat.value}
                </span>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                  {stat.suffix}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 24,
          borderBottom: '1px solid var(--glass-border)',
          paddingBottom: 0,
        }}
      >
        {[
          { key: 'books', label: `我的书架 (${books.length})`, icon: '📖' },
          { key: 'shelves', label: `我的书单 (${shelves.length})`, icon: '📚' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as 'books' | 'shelves')}
            style={{
              padding: '12px 22px',
              fontSize: 14,
              fontWeight: 600,
              color: activeTab === tab.key ? '#FFFFFF' : 'var(--text-muted)',
              borderBottom: `2px solid ${activeTab === tab.key ? 'var(--accent)' : 'transparent'}`,
              marginBottom: -1,
              transition: 'all 0.25s ease',
              background: 'transparent',
            }}
          >
            <span style={{ marginRight: 6 }}>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'books' ? (
        isLoadingBooks && books.length === 0 ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: 28,
              maxWidth: '100%',
            }}
          >
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} style={{ textAlign: 'center' }}>
                <div
                  className="skeleton"
                  style={{
                    width: '100%',
                    maxWidth: 200,
                    aspectRatio: '2/3',
                    borderRadius: 8,
                    margin: '0 auto 12px auto',
                  }}
                />
                <div className="skeleton" style={{ height: 14, marginBottom: 6 }} />
                <div className="skeleton" style={{ height: 12, width: '70%', margin: '0 auto' }} />
              </div>
            ))}
          </div>
        ) : books.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '80px 24px',
              background: 'rgba(255,255,255,0.03)',
              borderRadius: 20,
              border: '1px dashed var(--glass-border)',
            }}
            className="slide-up"
          >
            <div style={{ fontSize: 64, marginBottom: 20 }}>📚</div>
            <h3 style={{ fontSize: 20, marginBottom: 8, color: '#fff' }}>你的书架还是空的</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: 28, fontSize: 14 }}>
              添加第一本书，开启你的阅读旅程
            </p>
            <button className="btn-primary" onClick={() => navigate('/book/add')}>
              <span>➕</span>
              添加我的第一本书
            </button>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
              gap: 28,
              maxWidth: '100%',
            }}
            className="books-grid"
          >
            {books.map((book, i) => (
              <BookCard key={book.id} book={book} index={i} />
            ))}
          </div>
        )
      ) : shelves.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '80px 24px',
            background: 'rgba(255,255,255,0.03)',
            borderRadius: 20,
            border: '1px dashed var(--glass-border)',
          }}
          className="slide-up"
        >
          <div style={{ fontSize: 64, marginBottom: 20 }}>✨</div>
          <h3 style={{ fontSize: 20, marginBottom: 8, color: '#fff' }}>还没有创建书单</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: 28, fontSize: 14 }}>
            去书单页面创建属于你的主题书单吧
          </p>
          <button className="btn-primary" onClick={() => navigate('/shelves')}>
            <span>📚</span>
            去创建书单
          </button>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: 20,
          }}
        >
          {shelves.map((shelf, i) => (
            <ShelfCard key={shelf.id} shelf={shelf} index={i} />
          ))}
        </div>
      )}

      <style>{`
        @media (max-width: 1200px) {
          .books-grid { grid-template-columns: repeat(3, 1fr) !important; }
        }
        @media (max-width: 900px) {
          .books-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 560px) {
          .books-grid { grid-template-columns: repeat(1, 1fr) !important; }
        }
      `}</style>
    </div>
  );
};

export default ShelfDashboard;
