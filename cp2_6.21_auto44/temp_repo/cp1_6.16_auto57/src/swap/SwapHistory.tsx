import { useState, useEffect } from 'react';
import { database } from '../db/database';
import { SwapHistory, Book, User } from '../types';
import { getCategoryColor, getInitials } from '../utils/colors';
import { CheckCircle, XCircle, BookOpen } from 'lucide-react';

interface SwapHistoryProps {
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export function SwapHistoryPage({ showToast }: SwapHistoryProps) {
  const currentUser = database.getCurrentUser();
  const [history, setHistory] = useState<SwapHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadHistory = () => {
      setIsLoading(true);
      setTimeout(() => {
        setHistory(database.getSwapHistory());
        setIsLoading(false);
      }, 200);
    };
    loadHistory();
    return database.subscribe(loadHistory);
  }, []);

  const getUser = (id: string): User | undefined => database.getUserById(id);
  const getBook = (id: string): Book | undefined => database.getBookById(id);

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const userHistory = history.filter(
    (h) => h.user1Id === currentUser.id || h.user2Id === currentUser.id
  );

  return (
    <div className="page-container page-transition">
      <div className="page-header">
        <div>
          <h1 className="page-title">交换历史</h1>
          <p className="page-subtitle">
            {userHistory.length > 0
              ? `你已完成 ${userHistory.filter((h) => h.status === 'completed').length} 次交换`
              : '还没有交换记录'}
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="history-list">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="skeleton-history-item">
              <div className="skeleton-line w-1/4" />
              <div className="skeleton-books">
                <div className="skeleton-book" />
                <div className="skeleton-book" />
              </div>
            </div>
          ))}
        </div>
      ) : userHistory.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📜</div>
          <p className="empty-text">还没有交换记录</p>
          <p className="empty-subtext">去社区动态找找感兴趣的书，发起你的第一次交换吧</p>
        </div>
      ) : (
        <div className="history-list">
          {userHistory.map((item) => {
            const isUser1 = item.user1Id === currentUser.id;
            const otherUser = getUser(isUser1 ? item.user2Id : item.user1Id);
            const myBook = getBook(isUser1 ? item.book1Id : item.book2Id);
            const otherBook = getBook(isUser1 ? item.book2Id : item.book1Id);

            if (!otherUser || !myBook || !otherBook) return null;

            return (
              <div key={item.id} className="history-item">
                <div className="history-item-header">
                  <div className="history-item-users">
                    <div
                      className="history-avatar"
                      style={{ backgroundColor: currentUser.avatarColor }}
                    >
                      {getInitials(currentUser.username)}
                    </div>
                    <span className="history-arrow">⟷</span>
                    <div
                      className="history-avatar"
                      style={{ backgroundColor: otherUser.avatarColor }}
                    >
                      {getInitials(otherUser.username)}
                    </div>
                  </div>
                  <div className="history-item-meta">
                    <span
                      className={`history-status ${item.status}`}
                    >
                      {item.status === 'completed' ? (
                        <><CheckCircle size={14} /> 已完成</>
                      ) : (
                        <><XCircle size={14} /> 已取消</>
                      )}
                    </span>
                    <span className="history-date">{formatDate(item.completedAt)}</span>
                  </div>
                </div>

                <div className="history-item-books">
                  <div className="history-book">
                    <div className="history-book-label">你提供</div>
                    <div className="history-book-card">
                      <div
                        className="history-book-cover"
                        style={{ backgroundColor: getCategoryColor(myBook.category) }}
                      >
                        <BookOpen size={18} />
                      </div>
                      <div className="history-book-info">
                        <p className="history-book-title">《{myBook.title}》</p>
                        <p className="history-book-author">{myBook.author}</p>
                      </div>
                    </div>
                  </div>

                  <div className="history-divider" />

                  <div className="history-book">
                    <div className="history-book-label">你获得</div>
                    <div className="history-book-card">
                      <div
                        className="history-book-cover"
                        style={{ backgroundColor: getCategoryColor(otherBook.category) }}
                      >
                        <BookOpen size={18} />
                      </div>
                      <div className="history-book-info">
                        <p className="history-book-title">《{otherBook.title}》</p>
                        <p className="history-book-author">{otherBook.author}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
