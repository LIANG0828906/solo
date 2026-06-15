import { useState, useEffect, useMemo } from 'react';
import HistoryPanel from './HistoryPanel';

interface Book {
  id: string;
  isbn: string;
  title: string;
  author: string;
  category: string;
  coverUrl: string;
  isBorrowed: boolean;
  currentBorrower?: string;
  borrowDate?: string;
}

interface BookListProps {
  refreshTrigger: number;
  onBorrowClick: (bookId: string) => void;
  onReturnSuccess: () => void;
  showToast: (message: string) => void;
}

const BookList = ({ refreshTrigger, onBorrowClick, onReturnSuccess, showToast }: BookListProps) => {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('全部');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [expandedBooks, setExpandedBooks] = useState<Set<string>>(new Set());

  const categories = ['全部', '小说', '非虚构', '科技', '艺术', '儿童'];

  useEffect(() => {
    fetchBooks();
  }, [refreshTrigger, category, search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const fetchBooks = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (category) params.append('category', category);
      if (search) params.append('search', search);
      const response = await fetch(`/api/books?${params.toString()}`);
      const data = await response.json();
      setBooks(data);
    } catch {
      showToast('加载图书列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleReturn = async (bookId: string) => {
    try {
      const response = await fetch(`/api/books/${bookId}/return`, { method: 'POST' });
      if (response.ok) {
        onReturnSuccess();
      } else {
        showToast('归还失败');
      }
    } catch {
      showToast('网络错误');
    }
  };

  const toggleExpand = (bookId: string) => {
    setExpandedBooks(prev => {
      const next = new Set(prev);
      if (next.has(bookId)) {
        next.delete(bookId);
      } else {
        next.add(bookId);
      }
      return next;
    });
  };

  const searchSuggestion = useMemo(() => {
    if (!searchInput) return '';
    if (books.length === 0) return `未找到包含 "${searchInput}" 的图书`;
    return `找到 ${books.length} 本包含 "${searchInput}" 的图书`;
  }, [searchInput, books]);

  if (loading) {
    return <div style={styles.loading}>加载中...</div>;
  }

  return (
    <div>
      <div style={styles.filterBar}>
        <div style={styles.filterGroup}>
          <span style={styles.filterLabel}>分类：</span>
          {categories.map(cat => (
            <button
              key={cat}
              style={{
                ...styles.filterButton,
                ...(category === cat ? styles.filterButtonActive : {}),
              }}
              onClick={() => setCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
        <div style={styles.searchWrapper}>
          <input
            type="text"
            style={styles.searchInput}
            placeholder="搜索书名..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          {searchSuggestion && (
            <div style={styles.searchSuggestion}>{searchSuggestion}</div>
          )}
        </div>
      </div>

      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.tableHeader}>
              <th style={{ ...styles.th, width: 40 }}></th>
              <th style={styles.th}>封面</th>
              <th style={styles.th}>书名</th>
              <th style={styles.th}>作者</th>
              <th style={styles.th}>ISBN</th>
              <th style={styles.th}>分类</th>
              <th style={{ ...styles.th, width: 180 }}>状态</th>
              <th style={{ ...styles.th, width: 120 }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {books.length === 0 ? (
              <tr>
                <td colSpan={8} style={styles.emptyRow}>暂无图书数据</td>
              </tr>
            ) : (
              books.map((book, index) => (
                <>
                  <tr
                    key={book.id}
                    style={{
                      ...styles.tableRow,
                      ...(index % 2 === 0 ? styles.tableRowEven : styles.tableRowOdd),
                    }}
                  >
                    <td style={styles.td}>
                      <button
                        style={{
                          ...styles.expandButton,
                          ...(expandedBooks.has(book.id) ? styles.expandButtonOpen : {}),
                        }}
                        onClick={() => toggleExpand(book.id)}
                      >
                        ▶
                      </button>
                    </td>
                    <td style={styles.td}>
                      {book.coverUrl ? (
                        <img src={book.coverUrl} alt={book.title} style={styles.coverImage} />
                      ) : (
                        <div style={styles.coverPlaceholder}>无封面</div>
                      )}
                    </td>
                    <td style={styles.tdTitle}>{book.title}</td>
                    <td style={styles.td}>{book.author}</td>
                    <td style={styles.td}>{book.isbn}</td>
                    <td style={styles.td}>
                      <span style={styles.categoryTag}>{book.category}</span>
                    </td>
                    <td style={styles.td}>
                      {book.isBorrowed ? (
                        <span style={styles.borrowedStatus}>
                          借阅中：{book.currentBorrower}
                        </span>
                      ) : (
                        <span style={styles.availableStatus}>在库</span>
                      )}
                    </td>
                    <td style={styles.td}>
                      {book.isBorrowed ? (
                        <button
                          style={styles.returnButton}
                          onClick={() => handleReturn(book.id)}
                        >
                          归还
                        </button>
                      ) : (
                        <button
                          style={styles.borrowButton}
                          onClick={() => onBorrowClick(book.id)}
                        >
                          借出
                        </button>
                      )}
                    </td>
                  </tr>
                  {expandedBooks.has(book.id) && (
                    <tr key={`${book.id}-history`}>
                      <td colSpan={8} style={styles.historyCell}>
                        <HistoryPanel bookId={book.id} />
                      </td>
                    </tr>
                  )}
                </>
              ))
            )}
          </tbody>
        </table>
      </div>

      <style>{`
        @media (max-width: 768px) {
          ${'' /* 响应式样式在组件style中处理 */}
        }
      `}</style>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  loading: {
    textAlign: 'center',
    padding: 40,
    color: '#64748b',
    fontSize: 15,
  },
  filterBar: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 20,
    alignItems: 'flex-start',
    marginBottom: 24,
    background: '#ffffff',
    padding: 20,
    borderRadius: 8,
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  },
  filterGroup: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },
  filterLabel: {
    fontSize: 14,
    color: '#334155',
    fontWeight: 500,
    marginRight: 4,
  },
  filterButton: {
    padding: '6px 14px',
    border: '1px solid #cbd5e1',
    background: '#ffffff',
    color: '#475569',
    borderRadius: 6,
    fontSize: 13,
    cursor: 'pointer',
    transition: 'all 0.2s ease-out',
  },
  filterButtonActive: {
    background: '#3b82f6',
    borderColor: '#3b82f6',
    color: '#ffffff',
  },
  searchWrapper: {
    position: 'relative',
    flex: 1,
    minWidth: 240,
  },
  searchInput: {
    width: '100%',
    padding: '10px 14px',
    border: '1px solid #cbd5e1',
    borderRadius: 6,
    fontSize: 14,
    outline: 'none',
    transition: 'border-color 0.2s ease-out',
    boxSizing: 'border-box',
  },
  searchSuggestion: {
    position: 'absolute',
    top: '100%',
    left: 4,
    marginTop: 4,
    fontSize: 14,
    color: '#9ca3af',
  },
  tableContainer: {
    background: '#ffffff',
    borderRadius: 8,
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    overflow: 'hidden',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  tableHeader: {
    background: '#e2e8f0',
  },
  th: {
    padding: '14px 16px',
    textAlign: 'left',
    fontSize: 14,
    fontWeight: 700,
    color: '#334155',
  },
  tableRow: {
    height: 60,
    transition: 'background-color 0.2s ease-out',
  },
  tableRowEven: {
    background: '#f8fafc',
  },
  tableRowOdd: {
    background: '#ffffff',
  },
  td: {
    padding: '12px 16px',
    fontSize: 14,
    color: '#334155',
    verticalAlign: 'middle',
  },
  tdTitle: {
    padding: '12px 16px',
    fontSize: 14,
    color: '#334155',
    fontWeight: 500,
    verticalAlign: 'middle',
  },
  expandButton: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: 10,
    color: '#64748b',
    transition: 'transform 0.2s ease-out',
    padding: 4,
  },
  expandButtonOpen: {
    transform: 'rotate(90deg)',
  },
  coverImage: {
    width: 40,
    height: 56,
    objectFit: 'cover',
    borderRadius: 4,
  },
  coverPlaceholder: {
    width: 40,
    height: 56,
    background: '#e2e8f0',
    borderRadius: 4,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 10,
    color: '#94a3b8',
  },
  categoryTag: {
    display: 'inline-block',
    padding: '3px 10px',
    background: '#e0f2fe',
    color: '#0369a1',
    borderRadius: 12,
    fontSize: 12,
  },
  availableStatus: {
    color: '#16a34a',
    fontSize: 13,
    fontWeight: 500,
  },
  borrowedStatus: {
    color: '#ea580c',
    fontSize: 13,
    fontWeight: 500,
  },
  borrowButton: {
    padding: '7px 20px',
    background: '#3b82f6',
    color: '#ffffff',
    border: 'none',
    borderRadius: 6,
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.3s ease-out',
  },
  returnButton: {
    padding: '7px 20px',
    background: '#f97316',
    color: '#ffffff',
    border: 'none',
    borderRadius: 6,
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.3s ease-out',
  },
  emptyRow: {
    padding: 40,
    textAlign: 'center',
    color: '#94a3b8',
    fontSize: 14,
  },
  historyCell: {
    background: '#f8fafc',
    padding: '16px 20px',
  },
};

export default BookList;
