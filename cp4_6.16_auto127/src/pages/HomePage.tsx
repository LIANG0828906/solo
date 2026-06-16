import { useState, useEffect } from 'react';
import { useBookStore } from '../store/bookStore';
import { useLendingStore } from '../store/lendingStore';
import { useEventStore } from '../store/eventStore';
import { getDriftingBooksCount } from '../modules/lending/LendingManager';
import { getThisMonthEventsCount } from '../modules/community/CommunityManager';

function AnimatedNumber({ target, duration = 2000 }: { target: number; duration?: number }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number | null = null;
    let frameId: number;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(easeOut * target));
      if (progress < 1) {
        frameId = requestAnimationFrame(animate);
      }
    };

    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [target, duration]);

  return <>{count.toLocaleString()}</>;
}

interface StatCard {
  label: string;
  value: number;
  gradient: string;
  icon: JSX.Element;
}

export default function HomePage() {
  const books = useBookStore((s) => s.books);
  const activeRecords = useLendingStore((s) => s.getActiveRecords());
  const eventsStore = useEventStore();

  const totalBooks = books.length;
  const borrowedCount = activeRecords().filter((r) => !r.isDrifting).length;
  const driftingCount = getDriftingBooksCount();
  const eventsCount = getThisMonthEventsCount();

  const recentBooks = [...books].sort((a, b) => b.createdAt - a.createdAt).slice(0, 5);
  const recentRecords = [...useLendingStore.getState().records]
    .sort((a, b) => b.borrowDate - a.borrowDate)
    .slice(0, 5);

  const stats: StatCard[] = [
    {
      label: '总藏书量',
      value: totalBooks,
      gradient: 'linear-gradient(135deg, #2E7D32 0%, #4CAF50 100%)',
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
      ),
    },
    {
      label: '当前在借',
      value: borrowedCount,
      gradient: 'linear-gradient(135deg, #F57C00 0%, #FFB74D 100%)',
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
        </svg>
      ),
    },
    {
      label: '本月活动',
      value: eventsCount,
      gradient: 'linear-gradient(135deg, #7B1FA2 0%, #BA68C8 100%)',
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      ),
    },
    {
      label: '漂流中图书',
      value: driftingCount,
      gradient: 'linear-gradient(135deg, #1976D2 0%, #4FC3F7 100%)',
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <path d="M2 12h20" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
      ),
    },
  ];

  const formatDate = (ts: number) => {
    const d = new Date(ts);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  };

  return (
    <div className="page home-page">
      <div className="page-header">
        <div>
          <h1>欢迎回来 👋</h1>
          <p className="page-subtitle">今天是管理图书流转的好日子</p>
        </div>
      </div>

      <div className="stats-grid">
        {stats.map((stat, idx) => (
          <div key={idx} className="stat-card" style={{ background: stat.gradient }}>
            <div className="stat-icon">{stat.icon}</div>
            <div className="stat-content">
              <p className="stat-label">{stat.label}</p>
              <p className="stat-value">
                <AnimatedNumber target={stat.value} />
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="home-sections">
        <div className="home-card">
          <div className="home-card-header">
            <h2>最新入藏</h2>
            <span className="badge">{recentBooks.length} 本</span>
          </div>
          <div className="recent-list">
            {recentBooks.length === 0 ? (
              <p className="empty-text">暂无图书，快去添加吧！</p>
            ) : (
              recentBooks.map((book) => (
                <div key={book.id} className="recent-item">
                  <div className="recent-letter" style={{ background: getCategoryColor(book.category) }}>
                    {book.title.charAt(0)}
                  </div>
                  <div className="recent-info">
                    <p className="recent-title">{book.title}</p>
                    <p className="recent-meta">{book.author} · {book.category}</p>
                  </div>
                  <span className="recent-date">{formatDate(book.createdAt)}</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="home-card">
          <div className="home-card-header">
            <h2>最近借阅</h2>
            <span className="badge">{recentRecords.length} 条</span>
          </div>
          <div className="recent-list">
            {recentRecords.length === 0 ? (
              <p className="empty-text">暂无借阅记录</p>
            ) : (
              recentRecords.map((record) => {
                const book = useBookStore.getState().getBookById(record.bookId);
                return (
                  <div key={record.recordId} className="recent-item">
                    <div className="user-avatar small">{record.borrowerName.charAt(0)}</div>
                    <div className="recent-info">
                      <p className="recent-title">{book?.title || '未知图书'}</p>
                      <p className="recent-meta">{record.borrowerName} · {formatDate(record.borrowDate)}</p>
                    </div>
                    {record.returnDate ? (
                      <span className="mini-tag returned">已还</span>
                    ) : record.dueDate < Date.now() ? (
                      <span className="mini-tag overdue">超期</span>
                    ) : (
                      <span className="mini-tag borrowing">借阅中</span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      <div className="home-card">
        <div className="home-card-header">
          <h2>即将开始的活动</h2>
          <span className="badge">{eventsStore.getUpcomingEvents().slice(0, 3).length} 场</span>
        </div>
        <div className="events-preview">
          {eventsStore.getUpcomingEvents().slice(0, 3).length === 0 ? (
            <p className="empty-text">暂无即将开始的活动</p>
          ) : (
            eventsStore.getUpcomingEvents().slice(0, 3).map((event) => (
              <div key={event.eventId} className="event-preview-item">
                <div className="event-preview-date">
                  <p className="ep-month">{new Date(event.date).getMonth() + 1}月</p>
                  <p className="ep-day">{new Date(event.date).getDate()}</p>
                </div>
                <div className="event-preview-info">
                  <h3>{event.title}</h3>
                  <p className="ep-location">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    {event.location}
                  </p>
                </div>
                <div className="event-preview-progress">
                  <div className="progress-bar-wrapper">
                    <div
                      className="progress-bar"
                      style={{
                        width: `${Math.min(100, (event.registeredIds.length / event.maxAttendees) * 100)}%`,
                        background: `linear-gradient(90deg, #4CAF50 0%, #F44336 100%)`,
                      }}
                    />
                  </div>
                  <p className="progress-text">
                    剩余 <strong>{Math.max(0, event.maxAttendees - event.registeredIds.length)}</strong> 名
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    '小说': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    '非虚构': 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    '科技': 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    '生活': 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    '儿童': 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  };
  return colors[category] || colors['小说'];
}
