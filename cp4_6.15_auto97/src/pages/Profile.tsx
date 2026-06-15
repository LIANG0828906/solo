import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/store';
import type { Borrow } from '@/types';

export default function Profile() {
  const navigate = useNavigate();
  const { user, borrows, fetchBorrows, logout } = useStore();
  const [activeTab, setActiveTab] = useState<'borrows' | 'info'>('borrows');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchBorrows(user.id).finally(() => setLoading(false));
    }
  }, [user, fetchBorrows]);

  const getDaysUntilDue = (dueDate: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    const diff = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const activeBorrows = borrows.filter(b => b.status !== 'returned');
  const returnedBorrows = borrows.filter(b => b.status === 'returned');

  if (!user) {
    return (
      <div className="container">
        <div style={{ textAlign: 'center', padding: '64px 0' }}>
          <i className="fas fa-user-lock" style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.3 }}></i>
          <h2 style={{ fontSize: '24px', marginBottom: '8px', color: 'var(--color-text)' }}>请先登录</h2>
          <p style={{ color: 'var(--color-text-light)', marginBottom: '24px' }}>登录后查看个人中心</p>
          <button className="btn btn-primary" onClick={() => navigate('/login', { state: { from: '/profile' } })}>
            去登录
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="page-header">
        <h1 className="page-title">个人中心</h1>
        <p className="page-subtitle">欢迎回来，{user.username}</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 3fr', gap: '24px' }}>
        <div className="card" style={{ padding: '24px', height: 'fit-content' }}>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div style={{ 
              width: '80px', 
              height: '80px', 
              borderRadius: '50%', 
              background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              fontSize: '32px',
              color: 'white',
            }}>
              <i className="fas fa-user"></i>
            </div>
            <h3 style={{ fontSize: '18px', marginBottom: '4px', color: 'var(--color-text)' }}>
              {user.username}
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--color-text-light)' }}>
              {user.email}
            </p>
            <p style={{ fontSize: '12px', marginTop: '8px' }}>
              <span className={`status-badge ${user.role === 'admin' ? 'borrowed' : 'returned'}`}>
                {user.role === 'admin' ? '管理员' : '普通会员'}
              </span>
            </p>
          </div>

          <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '16px' }}>
            <button 
              className={`filter-capsule ${activeTab === 'borrows' ? 'active' : ''}`}
              style={{ width: '100%', marginBottom: '8px', textAlign: 'left' }}
              onClick={() => setActiveTab('borrows')}
            >
              <i className="fas fa-book" style={{ marginRight: '8px' }}></i>
              借阅记录
            </button>
            <button 
              className={`filter-capsule ${activeTab === 'info' ? 'active' : ''}`}
              style={{ width: '100%', marginBottom: '8px', textAlign: 'left' }}
              onClick={() => setActiveTab('info')}
            >
              <i className="fas fa-info-circle" style={{ marginRight: '8px' }}></i>
              账户信息
            </button>
            <button 
              className="filter-capsule"
              style={{ width: '100%', textAlign: 'left', color: '#F44336' }}
              onClick={() => {
                logout();
                navigate('/');
              }}
            >
              <i className="fas fa-sign-out-alt" style={{ marginRight: '8px' }}></i>
              退出登录
            </button>
          </div>
        </div>

        <div>
          {activeTab === 'borrows' ? (
            <>
              <div className="card" style={{ padding: '24px', marginBottom: '24px' }}>
                <h2 style={{ fontSize: '18px', marginBottom: '16px', color: 'var(--color-text)' }}>
                  当前借阅 ({activeBorrows.length})
                </h2>
                {loading ? (
                  <div style={{ textAlign: 'center', padding: '32px 0' }}>
                    <div className="skeleton" style={{ width: '100%', height: '120px', borderRadius: 'var(--radius-md)' }}></div>
                  </div>
                ) : activeBorrows.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--color-text-light)' }}>
                    <i className="fas fa-book-open" style={{ fontSize: '32px', marginBottom: '8px', opacity: 0.3 }}></i>
                    <p>暂无借阅中的图书</p>
                  </div>
                ) : (
                  activeBorrows.map((borrow) => (
                    <BorrowCard key={borrow.id} borrow={borrow} getDaysUntilDue={getDaysUntilDue} formatDate={formatDate} />
                  ))
                )}
              </div>

              <div className="card" style={{ padding: '24px' }}>
                <h2 style={{ fontSize: '18px', marginBottom: '16px', color: 'var(--color-text)' }}>
                  历史借阅 ({returnedBorrows.length})
                </h2>
                {returnedBorrows.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--color-text-light)' }}>
                    <i className="fas fa-history" style={{ fontSize: '32px', marginBottom: '8px', opacity: 0.3 }}></i>
                    <p>暂无历史借阅记录</p>
                  </div>
                ) : (
                  returnedBorrows.map((borrow) => (
                    <BorrowCard key={borrow.id} borrow={borrow} getDaysUntilDue={getDaysUntilDue} formatDate={formatDate} />
                  ))
                )}
              </div>
            </>
          ) : (
            <div className="card" style={{ padding: '24px' }}>
              <h2 style={{ fontSize: '18px', marginBottom: '24px', color: 'var(--color-text)' }}>
                账户信息
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ padding: '16px', background: 'var(--color-secondary)', borderRadius: 'var(--radius-md)' }}>
                  <p style={{ fontSize: '14px', color: 'var(--color-text-light)', marginBottom: '4px' }}>用户名</p>
                  <p style={{ fontSize: '16px', fontWeight: '500' }}>{user.username}</p>
                </div>
                <div style={{ padding: '16px', background: 'var(--color-secondary)', borderRadius: 'var(--radius-md)' }}>
                  <p style={{ fontSize: '14px', color: 'var(--color-text-light)', marginBottom: '4px' }}>邮箱</p>
                  <p style={{ fontSize: '16px', fontWeight: '500' }}>{user.email}</p>
                </div>
                <div style={{ padding: '16px', background: 'var(--color-secondary)', borderRadius: 'var(--radius-md)' }}>
                  <p style={{ fontSize: '14px', color: 'var(--color-text-light)', marginBottom: '4px' }}>用户角色</p>
                  <p style={{ fontSize: '16px', fontWeight: '500' }}>
                    {user.role === 'admin' ? '管理员' : '普通会员'}
                  </p>
                </div>
                <div style={{ padding: '16px', background: 'var(--color-secondary)', borderRadius: 'var(--radius-md)' }}>
                  <p style={{ fontSize: '14px', color: 'var(--color-text-light)', marginBottom: '4px' }}>注册时间</p>
                  <p style={{ fontSize: '16px', fontWeight: '500' }}>{formatDate(user.createdAt)}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function BorrowCard({ 
  borrow, 
  getDaysUntilDue, 
  formatDate 
}: { 
  borrow: Borrow; 
  getDaysUntilDue: (date: string) => number;
  formatDate: (date: string) => string;
}) {
  const daysUntilDue = getDaysUntilDue(borrow.dueDate);
  const isWarning = borrow.status !== 'returned' && daysUntilDue <= 3 && daysUntilDue > 0;
  const isOverdue = borrow.status === 'overdue';

  return (
    <div className="borrow-card">
      {isWarning && (
        <i className="fas fa-alarm-clock borrow-alarm warning"></i>
      )}
      {isOverdue && (
        <i className="fas fa-alarm-clock borrow-alarm overdue"></i>
      )}
      <img 
        src={borrow.book.coverUrl} 
        alt={borrow.book.title} 
        style={{ width: '60px', height: '80px', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }}
      />
      <div style={{ flex: 1 }}>
        <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '4px', color: 'var(--color-text)' }}>
          {borrow.book.title}
        </h3>
        <p style={{ fontSize: '14px', color: 'var(--color-text-light)', marginBottom: '8px' }}>
          {borrow.book.author}
        </p>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '13px', color: 'var(--color-text-light)' }}>
            <i className="fas fa-calendar-plus" style={{ marginRight: '4px' }}></i>
            借阅：{formatDate(borrow.borrowDate)}
          </span>
          <span style={{ fontSize: '13px', color: isOverdue ? '#F44336' : isWarning ? '#FF9800' : 'var(--color-text-light)' }}>
            <i className="fas fa-calendar-check" style={{ marginRight: '4px' }}></i>
            应还：{formatDate(borrow.dueDate)}
            {isWarning && ` (还剩${daysUntilDue}天)`}
            {isOverdue && ` (逾期${Math.abs(daysUntilDue)}天)`}
          </span>
          {borrow.returnDate && (
            <span style={{ fontSize: '13px', color: 'var(--color-text-light)' }}>
              <i className="fas fa-undo" style={{ marginRight: '4px' }}></i>
              归还：{formatDate(borrow.returnDate)}
            </span>
          )}
        </div>
        {borrow.lateFee > 0 && (
