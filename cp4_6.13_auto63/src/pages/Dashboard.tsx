import React, { useEffect, useState } from 'react';
import { useAuthStore, useBooksStore, useNotificationsStore } from '../stores';
import { booksApi } from '../api/apiClient';
import BookCard from '../components/BookCard';
import BookDetails from '../components/BookDetails';
import NotificationBubble from '../components/NotificationBubble';
import type { Book } from '../types';
import './Dashboard.css';

const Dashboard: React.FC = () => {
  const { user } = useAuthStore();
  const { userBooks, fetchUserBooks, fetchBookDetails, selectedBook, clearSelectedBook, addBook } = useBooksStore();
  const {
    notifications,
    unreadCount,
    fetchNotifications,
    approveBorrow,
    rejectBorrow,
  } = useNotificationsStore();

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    author: '',
    cover_url: '',
    max_borrow_days: 14,
    max_borrow_count: 5,
  });
  const [submitting, setSubmitting] = useState(false);
  const [processingBorrowId, setProcessingBorrowId] = useState<string | null>(null);
  const [processingAction, setProcessingAction] = useState<'approve' | 'reject' | null>(null);

  useEffect(() => {
    if (user) {
      fetchUserBooks(user.id);
      fetchNotifications();
    }
  }, [user, fetchUserBooks, fetchNotifications]);

  useEffect(() => {
    if (selectedBookId) {
      fetchBookDetails(selectedBookId);
    } else {
      clearSelectedBook();
    }
  }, [selectedBookId, fetchBookDetails, clearSelectedBook]);

  const handleCardClick = (book: Book) => {
    setSelectedBookId(book.id);
  };

  const handleCloseDetails = () => {
    setSelectedBookId(null);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'max_borrow_days' || name === 'max_borrow_count'
        ? Number(value)
        : value,
    }));
  };

  const handleSubmitAddBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.author.trim()) {
      alert('书名和作者不能为空');
      return;
    }
    setSubmitting(true);
    try {
      await addBook({
        title: formData.title.trim(),
        author: formData.author.trim(),
        cover_url: formData.cover_url.trim() || undefined,
        max_borrow_days: formData.max_borrow_days,
        max_borrow_count: formData.max_borrow_count,
      });
      setShowAddDialog(false);
      setFormData({
        title: '',
        author: '',
        cover_url: '',
        max_borrow_days: 14,
        max_borrow_count: 5,
      });
    } catch (err: any) {
      alert(err.message || '添加图书失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async (borrowId: string) => {
    setProcessingBorrowId(borrowId);
    setProcessingAction('approve');
    try {
      await approveBorrow(borrowId);
      if (user) {
        fetchUserBooks(user.id);
      }
    } catch (err: any) {
      alert(err.message || '操作失败');
    } finally {
      setProcessingBorrowId(null);
      setProcessingAction(null);
    }
  };

  const handleReject = async (borrowId: string) => {
    setProcessingBorrowId(borrowId);
    setProcessingAction('reject');
    try {
      await rejectBorrow(borrowId);
    } catch (err: any) {
      alert(err.message || '操作失败');
    } finally {
      setProcessingBorrowId(null);
      setProcessingAction(null);
    }
  };

  const toggleNotifications = () => {
    setShowNotifications((prev) => !prev);
  };

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <div className="header-left">
          <h1>📚 我的书架</h1>
          <span className="book-count">共 {userBooks.length} 本图书</span>
        </div>
        <button className="add-book-btn" onClick={() => setShowAddDialog(true)}>
          + 添加图书
        </button>
      </header>

      <div className="dashboard-content">
        <main className="books-section">
          {userBooks.length === 0 ? (
            <div className="empty-bookshelf">
              <div className="empty-icon">📖</div>
              <p>你的书架还是空的</p>
              <button className="add-first-book" onClick={() => setShowAddDialog(true)}>
                登记第一本图书
              </button>
            </div>
          ) : (
            <div className="books-grid">
              {userBooks.map((book) => (
                <BookCard
                  key={book.id}
                  book={book}
                  onClick={() => handleCardClick(book)}
                />
              ))}
            </div>
          )}
        </main>

        {selectedBook && selectedBookId && (
          <aside className="details-section">
            <BookDetails
              book={selectedBook}
              onClose={handleCloseDetails}
              canBorrow={false}
            />
          </aside>
        )}
      </div>

      <div className={`notification-panel ${showNotifications ? 'expanded' : ''}`}>
        <button
          className="notification-toggle"
          onClick={toggleNotifications}
          aria-label="通知"
        >
          <span className="bell-icon">🔔</span>
          {unreadCount > 0 && (
            <span className="unread-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
          )}
        </button>

        {showNotifications && (
          <div className="notification-dropdown" onClick={(e) => e.stopPropagation()}>
            <div className="notification-header">
              <h4>借阅请求通知</h4>
              <span className="notification-total">{notifications.length} 条</span>
            </div>
            <div className="notification-list">
              {notifications.length === 0 ? (
                <div className="no-notifications">
                  <span>🔕</span>
                  <p>暂无借阅请求</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <NotificationBubble
                    key={notification.id}
                    notification={notification}
                    onApprove={() => handleApprove(notification.borrow_id)}
                    onReject={() => handleReject(notification.borrow_id)}
                    approving={
                      processingBorrowId === notification.borrow_id &&
                      processingAction === 'approve'
                    }
                    rejecting={
                      processingBorrowId === notification.borrow_id &&
                      processingAction === 'reject'
                    }
                  />
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {showAddDialog && (
        <div className="dialog-overlay" onClick={() => !submitting && setShowAddDialog(false)}>
          <div className="add-book-dialog" onClick={(e) => e.stopPropagation()}>
            <h3>📗 添加新图书</h3>
            <form onSubmit={handleSubmitAddBook}>
              <div className="form-row">
                <label>书名 *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="请输入书名"
                  disabled={submitting}
                  required
                />
              </div>
              <div className="form-row">
                <label>作者 *</label>
                <input
                  type="text"
                  name="author"
                  value={formData.author}
                  onChange={handleInputChange}
                  placeholder="请输入作者"
                  disabled={submitting}
                  required
                />
              </div>
              <div className="form-row">
                <label>封面 URL（可选）</label>
                <input
                  type="url"
                  name="cover_url"
                  value={formData.cover_url}
                  onChange={handleInputChange}
                  placeholder="https://example.com/cover.jpg"
                  disabled={submitting}
                />
              </div>
              <div className="form-row form-row-half">
                <div>
                  <label>最大借阅天数</label>
                  <select
                    name="max_borrow_days"
                    value={formData.max_borrow_days}
                    onChange={handleInputChange}
                    disabled={submitting}
                  >
                    <option value={7}>7 天</option>
                    <option value={14}>14 天</option>
                    <option value={21}>21 天</option>
                    <option value={30}>30 天</option>
                  </select>
                </div>
                <div>
                  <label>最大借阅次数</label>
                  <select
                    name="max_borrow_count"
                    value={formData.max_borrow_count}
                    onChange={handleInputChange}
                    disabled={submitting}
                  >
                    <option value={3}>3 次</option>
                    <option value={5}>5 次</option>
                    <option value={10}>10 次</option>
                    <option value={999}>不限</option>
                  </select>
                </div>
              </div>
              <div className="dialog-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setShowAddDialog(false)}
                  disabled={submitting}
                >
                  取消
                </button>
                <button type="submit" className="btn-confirm" disabled={submitting}>
                  {submitting ? '添加中...' : '确认添加'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
