import { useState, useMemo, useEffect, useRef } from 'react';
import { useBookStore } from '../store/bookStore';
import BookCard from '../modules/book/BookCard';
import BookDetailModal from '../components/BookDetailModal';
import { addBook, fetchCoverByIsbn, getBookCategories } from '../modules/book/BookManager';
import type { Book, BookCategory, BookCondition, BookStatus } from '../types';

const PAGE_SIZE = 12;
const ALL_CATEGORIES = ['全部', ...getBookCategories()];

export default function BookListPage() {
  const books = useBookStore((s) => s.books);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<BookCategory | '全部'>('全部');
  const [page, setPage] = useState(1);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const filteredBooks = useMemo(() => {
    const start = performance.now();
    let result = books;
    if (category !== '全部') {
      result = result.filter((b) => b.category === category);
    }
    if (search.trim()) {
      const lower = search.toLowerCase();
      result = result.filter(
        (b) =>
          b.title.toLowerCase().includes(lower) ||
          b.author.toLowerCase().includes(lower) ||
          b.isbn.includes(search)
      );
    }
    const elapsed = performance.now() - start;
    return result;
  }, [books, category, search]);

  const suggestions = useMemo(() => {
    if (!search.trim()) return [];
    const lower = search.toLowerCase();
    const titles = books
      .filter((b) => b.title.toLowerCase().includes(lower))
      .slice(0, 3)
      .map((b) => ({ text: b.title, type: '书名', category: b.category }));
    const authors = books
      .filter((b) => b.author.toLowerCase().includes(lower))
      .slice(0, 2)
      .map((b) => ({ text: b.author, type: '作者', category: b.category }));
    return [...titles, ...authors];
  }, [books, search]);

  const totalPages = Math.max(1, Math.ceil(filteredBooks.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageBooks = filteredBooks.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [search, category]);

  return (
    <div className="page book-list-page">
      <div className="page-header">
        <div>
          <h1>图书管理</h1>
          <p className="page-subtitle">共 {filteredBooks.length} 本图书</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          添加图书
        </button>
      </div>

      <div className="book-filter-bar">
        <div className="search-wrapper" ref={searchRef}>
          <svg className="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="搜索书名、作者或ISBN..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={() => setShowSuggestions(true)}
            className="search-input"
          />
          {search && (
            <button className="search-clear" onClick={() => setSearch('')} aria-label="清除">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
          {showSuggestions && suggestions.length > 0 && (
            <div className="search-suggestions">
              {suggestions.map((s, idx) => (
                <div
                  key={idx}
                  className="suggestion-item"
                  onClick={() => {
                    setSearch(s.text);
                    setShowSuggestions(false);
                  }}
                >
                  <span className="suggestion-text">{highlightMatch(s.text, search)}</span>
                  <span className={`suggestion-tag tag-${s.category}`}>{s.type}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="filter-select-wrapper">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as BookCategory | '全部')}
            className="filter-select"
          >
            {ALL_CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <svg className="select-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </div>

      {pageBooks.length === 0 ? (
        <div className="empty-state">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="1.5">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          </svg>
          <p>没有找到匹配的图书</p>
          <button className="btn btn-outline" onClick={() => { setSearch(''); setCategory('全部'); }}>
            清除筛选
          </button>
        </div>
      ) : (
        <>
          <div className="books-grid">
            {pageBooks.map((book) => (
              <BookCard key={book.id} book={book} onClick={setSelectedBook} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <button
                className="page-btn"
                disabled={currentPage === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  className={`page-btn ${p === currentPage ? 'active' : ''}`}
                  onClick={() => setPage(p)}
                >
                  {p}
                </button>
              ))}
              <button
                className="page-btn"
                disabled={currentPage === totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </div>
          )}
        </>
      )}

      <BookDetailModal book={selectedBook} onClose={() => setSelectedBook(null)} />

      {showAddModal && (
        <AddBookModal
          onClose={() => setShowAddModal(false)}
          onAdded={() => {
            setShowAddModal(false);
          }}
        />
      )}
    </div>
  );
}

function highlightMatch(text: string, query: string) {
  if (!query.trim()) return text;
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);
  return parts.map((part, i) =>
    regex.test(part) ? <mark key={i}>{part}</mark> : part
  );
}

function AddBookModal({
  onClose,
  onAdded,
}: {
  onClose: () => void;
  onAdded: () => void;
}) {
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [isbn, setIsbn] = useState('');
  const [category, setCategory] = useState<BookCategory>('小说');
  const [condition, setCondition] = useState<BookCondition>('良好');
  const [status, setStatus] = useState<BookStatus>('在馆');
  const [coverPreview, setCoverPreview] = useState('');
  const [isFetchingCover, setIsFetchingCover] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let debounce: NodeJS.Timeout;
    if (isbn.length >= 10) {
      debounce = setTimeout(async () => {
        setIsFetchingCover(true);
        const url = await fetchCoverByIsbn(isbn);
        setCoverPreview(url);
        setIsFetchingCover(false);
      }, 500);
    } else {
      setCoverPreview('');
    }
    return () => clearTimeout(debounce);
  }, [isbn]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !author.trim()) return;
    setIsSubmitting(true);
    const result = await addBook({
      title: title.trim(),
      author: author.trim(),
      isbn: isbn.trim(),
      category,
      condition,
      status,
      coverUrl: coverPreview,
    });
    setIsSubmitting(false);
    if (result.book) {
      onAdded();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content add-book-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>添加新图书</h2>
          <button className="modal-close" onClick={onClose} aria-label="关闭">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="add-book-form">
          <div className="form-row">
            <div className="form-cover-preview">
              {isFetchingCover ? (
                <div className="cover-loading">查询中...</div>
              ) : coverPreview ? (
                <img src={coverPreview} alt="封面预览" />
              ) : (
                <div className="cover-placeholder">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="1.5">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                  </svg>
                  <p>输入ISBN自动获取封面</p>
                </div>
              )}
            </div>
            <div className="form-fields">
              <div className="form-group">
                <label>书名 *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="请输入书名"
                  required
                />
              </div>
              <div className="form-group">
                <label>作者 *</label>
                <input
                  type="text"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="请输入作者"
                  required
                />
              </div>
              <div className="form-group">
                <label>ISBN</label>
                <input
                  type="text"
                  value={isbn}
                  onChange={(e) => setIsbn(e.target.value.replace(/\D/g, ''))}
                  placeholder="10或13位ISBN号"
                  maxLength={13}
                />
              </div>
            </div>
          </div>
          <div className="form-row form-row-inline">
            <div className="form-group">
              <label>分类</label>
              <select value={category} onChange={(e) => setCategory(e.target.value as BookCategory)}>
                {getBookCategories().map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>品相</label>
              <select value={condition} onChange={(e) => setCondition(e.target.value as BookCondition)}>
                <option value="全新">全新</option>
                <option value="良好">良好</option>
                <option value="一般">一般</option>
              </select>
            </div>
            <div className="form-group">
              <label>当前状态</label>
              <select value={status} onChange={(e) => setStatus(e.target.value as BookStatus)}>
                <option value="在馆">在馆</option>
                <option value="借出">借出</option>
                <option value="漂流">漂流</option>
                <option value="下架">下架</option>
              </select>
            </div>
          </div>
          <div className="form-actions">
            <button type="button" className="btn btn-outline" onClick={onClose}>
              取消
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? '添加中...' : '确认添加'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
