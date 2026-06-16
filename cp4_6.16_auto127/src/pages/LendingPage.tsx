import { useState, useEffect, useMemo } from 'react';
import { useLendingStore } from '../store/lendingStore';
import { useBookStore } from '../store/bookStore';
import { borrowBook, returnBook, isOverdue, getDaysRemaining } from '../modules/lending/LendingManager';
import { getAvailableBooks, getAllBooks } from '../modules/book/BookManager';
import type { LendingRecord, Book } from '../types';

type TabType = 'active' | 'all' | 'overdue';

export default function LendingPage() {
  const records = useLendingStore((s) => s.records);
  const books = useBookStore((s) => s.books);
  const [activeTab, setActiveTab] = useState<TabType>('active');
  const [showBorrowModal, setShowBorrowModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [borrowerName, setBorrowerName] = useState('');
  const [selectedBookId, setSelectedBookId] = useState('');
  const [returnIsbn, setReturnIsbn] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const availableBooks = useMemo(() => getAvailableBooks(), [books]);

  const filteredRecords = useMemo(() => {
    let result = [...records];
    if (activeTab === 'active') {
      result = result.filter((r) => r.returnDate === null);
    } else if (activeTab === 'overdue') {
      result = result.filter((r) => r.returnDate === null && r.dueDate < Date.now());
    }
    return result.sort((a, b) => b.borrowDate - a.borrowDate);
  }, [records, activeTab]);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const getBookByRecord = (record: LendingRecord): Book | undefined => {
    return useBookStore.getState().getBookById(record.bookId);
  };

  const formatDate = (ts: number) => {
    const d = new Date(ts);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const handleBorrow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!borrowerName.trim() || !selectedBookId) return;
    setIsSubmitting(true);
    const result = await borrowBook({
      bookId: selectedBookId,
      borrowerName: borrowerName.trim(),
    });
    setIsSubmitting(false);
    if (result.success) {
      setMessage({ type: 'success', text: result.message });
      setBorrowerName('');
      setSelectedBookId('');
      setShowBorrowModal(false);
    } else {
      setMessage({ type: 'error', text: result.message });
    }
  };

  const handleReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!returnIsbn.trim()) return;
    setIsSubmitting(true);
    const result = await returnBook(returnIsbn.trim());
    setIsSubmitting(false);
    if (result.success) {
      setMessage({ type: 'success', text: result.message });
      setReturnIsbn('');
      setShowReturnModal(false);
    } else {
      setMessage({ type: 'error', text: result.message });
    }
  };

  const tabs: { key: TabType; label: string; count: number }[] = [
    { key: 'active', label: '借阅中', count: records.filter((r) => r.returnDate === null).length },
    { key: 'overdue', label: '已超期', count: records.filter((r) => r.returnDate === null && r.dueDate < Date.now()).length },
    { key: 'all', label: '全部记录', count: records.length },
  ];

  return (
    <div className="page lending-page">
      <div className="page-header">
        <div>
          <h1>借阅管理</h1>
          <p className="page-subtitle">管理图书的借出与归还</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-outline" onClick={() => setShowReturnModal(true)}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 14l-4-4 4-4" />
              <path d="M5 10h11a4 4 0 1 1 0 8h-1" />
            </svg>
            归还登记
          </button>
          <button className="btn btn-primary" onClick={() => setShowBorrowModal(true)}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 3h6v6" />
              <path d="M10 14L21 3" />
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            </svg>
            借出登记
          </button>
        </div>
      </div>

      {message && (
        <div className={`toast ${message.type}`}>
          {message.type === 'success' ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          )}
          {message.text}
        </div>
      )}

      <div className="tabs">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className={`tab-btn ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
            <span className="tab-count">{tab.count}</span>
          </button>
        ))}
      </div>

      <div className="table-wrapper">
        <table className="lending-table">
          <thead>
            <tr>
              <th>书名</th>
              <th>借阅者</th>
              <th>借出日期</th>
              <th>到期日期</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {filteredRecords.length === 0 ? (
              <tr>
                <td colSpan={6} className="empty-cell">
                  <div className="empty-state small">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="1.5">
                      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                    </svg>
                    <p>暂无借阅记录</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredRecords.map((record, index) => {
                const book = getBookByRecord(record);
                const overdue = isOverdue(record);
                const daysRemaining = getDaysRemaining(record);

                return (
                  <tr
                    key={record.recordId}
                    className={`lending-row ${overdue ? 'overdue-row' : ''}`}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <td>
                      <div className="book-cell">
                        <div className="book-cell-letter" style={{ background: getCategoryGradient(book?.category || '小说') }}>
                          {book?.title.charAt(0) || '?'}
                        </div>
                        <div>
                          <p className="book-cell-title">{book?.title || '未知图书'}</p>
                          <p className="book-cell-author">{book?.author || '-'}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="borrower-cell">
                        <div className="user-avatar small">{record.borrowerName.charAt(0)}</div>
                        <span>{record.borrowerName}</span>
                      </div>
                    </td>
                    <td>{formatDate(record.borrowDate)}</td>
                    <td>
                      <div className={`due-date-cell ${overdue ? 'overdue' : ''}`}>
                        {formatDate(record.dueDate)}
                        {overdue && (
                          <span className="overdue-inline-warning" title={`已超期 ${Math.abs(daysRemaining)} 天`}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                              <line x1="12" y1="9" x2="12" y2="13" />
                              <line x1="12" y1="17" x2="12.01" y2="17" />
                            </svg>
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      {record.returnDate ? (
                        <span className="status-pill returned">已归还</span>
                      ) : overdue ? (
                        <span className="status-pill overdue">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                            <line x1="12" y1="9" x2="12" y2="13" />
                            <line x1="12" y1="17" x2="12.01" y2="17" />
                          </svg>
                          超期 {Math.abs(daysRemaining)} 天
                        </span>
                      ) : (
                        <span className="status-pill borrowing">借阅中 · 剩 {daysRemaining} 天</span>
                      )}
                    </td>
                    <td>
                      {!record.returnDate && (
                        <button
                          className="btn btn-text"
                          onClick={async () => {
                            if (!book?.isbn) return;
                            setIsSubmitting(true);
                            const result = await returnBook(book.isbn);
                            setIsSubmitting(false);
                            if (result.success) {
                              setMessage({ type: 'success', text: result.message });
                            } else {
                              setMessage({ type: 'error', text: result.message });
                            }
                          }}
                        >
                          归还
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {showBorrowModal && (
        <div className="modal-overlay" onClick={() => setShowBorrowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>借出登记</h2>
              <button className="modal-close" onClick={() => setShowBorrowModal(false)} aria-label="关闭">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleBorrow} className="form">
              <div className="form-group">
                <label>借阅者姓名 *</label>
                <input
                  type="text"
                  value={borrowerName}
                  onChange={(e) => setBorrowerName(e.target.value)}
                  placeholder="请输入借阅者姓名"
                  required
                />
              </div>
              <div className="form-group">
                <label>选择图书 *</label>
                <select
                  value={selectedBookId}
                  onChange={(e) => setSelectedBookId(e.target.value)}
                  required
                >
                  <option value="">请选择可借阅的图书</option>
                  {availableBooks.map((book) => (
                    <option key={book.id} value={book.id}>
                      {book.title} - {book.author} (ISBN: {book.isbn || '无'})
                    </option>
                  ))}
                </select>
                {availableBooks.length === 0 && (
                  <p className="form-hint">暂无可借阅的图书</p>
                )}
              </div>
              <div className="form-info-box">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
                借阅期限为 30 天，到期日将自动计算
              </div>
              <div className="form-actions">
                <button type="button" className="btn btn-outline" onClick={() => setShowBorrowModal(false)}>
                  取消
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting || availableBooks.length === 0}>
                  {isSubmitting ? '登记中...' : '确认借出'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showReturnModal && (
        <div className="modal-overlay" onClick={() => setShowReturnModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>归还登记</h2>
              <button className="modal-close" onClick={() => setShowReturnModal(false)} aria-label="关闭">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleReturn} className="form">
              <div className="form-group">
                <label>图书 ISBN *</label>
                <input
                  type="text"
                  value={returnIsbn}
                  onChange={(e) => setReturnIsbn(e.target.value.replace(/\D/g, ''))}
                  placeholder="扫描或输入图书 ISBN"
                  required
                />
              </div>
              <div className="form-actions">
                <button type="button" className="btn btn-outline" onClick={() => setShowReturnModal(false)}>
                  取消
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? '登记中...' : '确认归还'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function getCategoryGradient(category: string): string {
  const colors: Record<string, string> = {
    '小说': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    '非虚构': 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    '科技': 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    '生活': 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    '儿童': 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  };
  return colors[category] || colors['小说'];
}
