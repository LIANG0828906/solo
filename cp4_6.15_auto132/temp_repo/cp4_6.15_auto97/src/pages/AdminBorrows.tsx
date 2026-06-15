import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/store';
import type { Borrow } from '@/types';

export default function AdminBorrows() {
  const navigate = useNavigate();
  const { borrows, fetchAllBorrows, renewBorrow, returnBorrow } = useStore();
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [returningIds, setReturningIds] = useState<string[]>([]);

  useEffect(() => {
    fetchAllBorrows().finally(() => setLoading(false));
  }, [fetchAllBorrows]);

  const filteredBorrows = useMemo(() => {
    if (!searchQuery.trim()) return borrows;
    const query = searchQuery.toLowerCase();
    return borrows.filter(b => 
      b.book.title.toLowerCase().includes(query) ||
      b.userId.toLowerCase().includes(query)
    );
  }, [borrows, searchQuery]);

  const getDaysUntilDue = (dueDate: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    return Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const handleRenew = async (id: string) => {
    await renewBorrow(id);
  };

  const handleReturn = async (id: string) => {
    setReturningIds(prev => [...prev, id]);
    setTimeout(async () => {
      await returnBorrow(id);
      setReturningIds(prev => prev.filter(i => i !== id));
    }, 500);
  };

  const getStatusBadge = (borrow: Borrow) => {
    const daysUntilDue = getDaysUntilDue(borrow.dueDate);
    if (borrow.status === 'returned') {
      return <span className="status-badge returned">已归还</span>;
    }
    if (borrow.status === 'overdue' || daysUntilDue < 0) {
      return <span className="status-badge overdue">逾期 {Math.abs(daysUntilDue)} 天</span>;
    }
    return <span className="status-badge borrowed">借阅中 ({daysUntilDue}天后到期)</span>;
  };

  return (
    <div className="container">
      <div className="page-header">
        <h1 className="page-title">借阅管理</h1>
        <p className="page-subtitle">管理会员借阅记录</p>
      </div>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '32px' }}>
        <button className="btn btn-outline" onClick={() => navigate('/admin/dashboard')}>
          <i className="fas fa-chart-bar"></i> 数据看板
        </button>
        <button className="btn btn-outline" onClick={() => navigate('/admin/books')}>
          <i className="fas fa-book"></i> 图书管理
        </button>
      </div>

      <div className="card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', alignItems: 'center' }}>
          <div className="search-container" style={{ marginBottom: 0, flex: 1, maxWidth: '400px' }}>
            <i className="fas fa-search search-icon"></i>
            <input
              type="text"
              className="search-input"
              placeholder="按书名搜索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '64px 0' }}>
            <div className="skeleton" style={{ width: '100%', height: '300px', borderRadius: 'var(--radius-md)' }}></div>
          </div>
        ) : filteredBorrows.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px 0', color: 'var(--color-text-light)' }}>
            <i className="fas fa-clipboard-list" style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.3 }}></i>
            <p>暂无借阅记录</p>
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>图书</th>
                <th>借阅日期</th>
                <th>应还日期</th>
                <th>状态</th>
                <th>滞纳金</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredBorrows.map((borrow) => {
                const isReturning = returningIds.includes(borrow.id);
                const isReturned = borrow.status === 'returned';
                return (
                  <tr key={borrow.id} className={isReturning ? 'book-close-animation' : ''}>
                    <td>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <img
                          src={borrow.book.coverUrl}
                          alt={borrow.book.title}
                          style={{ width: '50px', height: '70px', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }}
                        />
                        <div>
                          <p style={{ fontWeight: '600', color: 'var(--color-text)' }}>{borrow.book.title}</p>
                          <p style={{ fontSize: '13px', color: 'var(--color-text-light)' }}>{borrow.book.author}</p>
                        </div>
                      </div>
                    </td>
                    <td>{formatDate(borrow.borrowDate)}</td>
                    <td>{formatDate(borrow.dueDate)}</td>
                    <td>{getStatusBadge(borrow)}</td>
                    <td>
                      {borrow.lateFee > 0 ? (
                        <span className="late-fee">¥{borrow.lateFee.toFixed(2)}</span>
                      ) : (
                        <span style={{ color: 'var(--color-text-light)' }}>-</span>
                      )}
                    </td>
                    <td>
                      {!isReturned && (
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            className="btn btn-outline"
                            style={{ padding: '6px 12px', fontSize: '12px' }}
                            onClick={() => handleRenew(borrow.id)}
                          >
                            <i className="fas fa-redo"></i> 续借
                          </button>
                          <button
                            className="btn btn-accent"
                            style={{ padding: '6px 12px', fontSize: '12px' }}
                            onClick={() => handleReturn(borrow.id)}
                            disabled={isReturning}
                          >
                            <i className="fas fa-undo"></i> 归还
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
