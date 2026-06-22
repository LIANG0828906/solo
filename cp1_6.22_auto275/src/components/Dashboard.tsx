import React from 'react';
import { useApp } from '@/context/AppContext';
import { BookOutlined, TeamOutlined, SwapOutlined, WarningOutlined } from '@ant-design/icons';

const Dashboard: React.FC = () => {
  const { getStats, getHotBooks } = useApp();
  const stats = getStats();
  const hotBooks = getHotBooks(8);

  const statItems = [
    { 
      label: '总藏书量', 
      value: stats.totalBooks, 
      icon: <BookOutlined style={{ fontSize: 20, opacity: 0.6 }} />,
    },
    { 
      label: '总读者数', 
      value: stats.totalReaders, 
      icon: <TeamOutlined style={{ fontSize: 20, opacity: 0.6 }} />,
    },
    { 
      label: '当前借出', 
      value: stats.borrowedBooks, 
      icon: <SwapOutlined style={{ fontSize: 20, opacity: 0.6 }} />,
    },
    { 
      label: '逾期未还', 
      value: stats.overdueBooks, 
      icon: <WarningOutlined style={{ fontSize: 20, opacity: 0.6 }} />,
      highlight: stats.overdueBooks > 0,
    },
  ];

  return (
    <div className="fade-in">
      <h1 className="page-title">数据看板</h1>
      
      <div className="stats-grid">
        {statItems.map((item, index) => (
          <div key={index} className="stat-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              {item.icon}
            </div>
            <div className="stat-number" style={{ color: item.highlight ? '#E74C3C' : '#C49A6C' }}>
              {item.value.toLocaleString()}
            </div>
            <div className="stat-label">{item.label}</div>
          </div>
        ))}
      </div>

      <div className="recommend-section">
        <div className="recommend-title">
          <span style={{ fontSize: 20 }}>🔥</span>
          热门图书排行榜
        </div>
        <div className="recommend-carousel">
          {hotBooks.map((book, index) => (
            <div key={book.id} className="recommend-card">
              <div className="recommend-cover" style={{ background: book.coverColor }}>
                <div style={{ 
                  position: 'absolute', 
                  top: 8, 
                  left: 8, 
                  background: 'rgba(255,215,0,0.9)', 
                  color: '#333',
                  width: 24, 
                  height: 24, 
                  borderRadius: '50%', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  fontSize: 12,
                  fontWeight: 700,
                }}>
                  {index + 1}
                </div>
                <div className="recommend-cover-text">
                  {book.title.slice(0, 4)}
                </div>
              </div>
              <div className="recommend-info">
                <div className="recommend-book-title">{book.title}</div>
                <div style={{ fontSize: 11, color: '#999', marginTop: 4 }}>
                  {book.author} · 借阅 {book.borrowCount} 次
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
