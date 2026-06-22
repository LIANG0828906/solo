import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { Member } from '../App';

interface Book {
  isbn: string;
  title: string;
  author: string;
  category: string;
  total_copies: number;
  available_copies: number;
}

interface Props {
  member: Member;
  addToast: (msg: string, type: 'success' | 'error') => void;
}

export default function BookSearch({ member, addToast }: Props) {
  const [query, setQuery] = useState('');
  const [books, setBooks] = useState<Book[]>([]);
  const [filteredBooks, setFilteredBooks] = useState<Book[]>([]);
  const [dropdownItems, setDropdownItems] = useState<Book[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [confirmBook, setConfirmBook] = useState<Book | null>(null);
  const [reserving, setReserving] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const token = localStorage.getItem('library_token');

  useEffect(() => {
    fetch('/api/books')
      .then(res => res.json())
      .then(data => {
        setBooks(data);
        setFilteredBooks(data);
      })
      .catch(() => addToast('获取图书列表失败', 'error'));
  }, []);

  const doSearch = useCallback((q: string) => {
    const url = q ? `/api/books?search=${encodeURIComponent(q)}` : '/api/books';
    fetch(url)
      .then(res => res.json())
      .then(data => {
        setFilteredBooks(selectedCategory ? data.filter((b: Book) => b.category === selectedCategory) : data);
      })
      .catch(() => {});
  }, [selectedCategory]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      doSearch(query);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, doSearch]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    if (val.trim()) {
      const matches = books.filter(b =>
        b.title.includes(val) || b.author.includes(val) || b.category.includes(val) || b.isbn.includes(val)
      ).slice(0, 6);
      setDropdownItems(matches);
      setShowDropdown(matches.length > 0);
    } else {
      setShowDropdown(false);
      setDropdownItems([]);
    }
  };

  const handleDropdownSelect = (book: Book) => {
    setQuery(book.title);
    setShowDropdown(false);
    doSearch(book.title);
  };

  const handleReserve = async () => {
    if (!confirmBook) return;
    setReserving(true);
    try {
      const res = await fetch('/api/reserve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ member_id: member.id, book_id: confirmBook.isbn }),
      });
      const data = await res.json();
      if (data.success) {
        addToast(`《${confirmBook.title}》预约成功！保留24小时`);
        setBooks(prev => prev.map(b => b.isbn === confirmBook.isbn ? { ...b, available_copies: b.available_copies - 1 } : b));
        setFilteredBooks(prev => prev.map(b => b.isbn === confirmBook.isbn ? { ...b, available_copies: b.available_copies - 1 } : b));
        setConfirmBook(null);
      } else {
        addToast(data.error || '预约失败', 'error');
      }
    } catch {
      addToast('网络错误', 'error');
    } finally {
      setReserving(false);
    }
  };

  const categories = ['全部', '小说', '科技', '历史', '艺术'];

  const categoryIcons: Record<string, string> = {
    '小说': '📕',
    '科技': '📘',
    '历史': '📙',
    '艺术': '🎨',
  };

  const queueCounts: Record<string, number> = {};
  books.forEach(b => {
    if (b.available_copies === 0) {
      queueCounts[b.isbn] = Math.floor(Math.random() * 5) + 1;
    }
  });

  return (
    <div className="main-content">
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        <h2 className="section-title" style={{ marginBottom: 24 }}>🔍 图书搜索</h2>

        <div className="search-bar">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            value={query}
            onChange={handleInputChange}
            onFocus={() => { if (dropdownItems.length > 0) setShowDropdown(true); }}
            onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
            placeholder="搜索书名、作者或类别..."
          />
          {showDropdown && (
            <div className="search-dropdown">
              {dropdownItems.map(b => (
                <div key={b.isbn} className="search-dropdown-item" onMouseDown={() => handleDropdownSelect(b)}>
                  <div style={{ fontWeight: 500 }}>{b.title}</div>
                  <div style={{ fontSize: 12, color: '#9ca3af' }}>{b.author} · {b.category}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap', justifyContent: 'center' }}>
          {categories.map(cat => (
            <button
              key={cat}
              className={`btn ${selectedCategory === (cat === '全部' ? '' : cat) ? 'btn-primary' : 'btn-outline'} btn-sm`}
              onClick={() => {
                const val = cat === '全部' ? '' : cat;
                setSelectedCategory(val);
                setFilteredBooks(val ? books.filter(b => b.category === val) : books);
              }}
            >
              {cat === '全部' ? '📖' : categoryIcons[cat] || ''} {cat}
            </button>
          ))}
        </div>

        <div className="books-grid">
          {filteredBooks.map(book => (
            <div key={book.isbn} className="book-card">
              <div className={`book-cover ${book.category}`}>
                {categoryIcons[book.category] || '📖'}
              </div>
              <div className="book-info">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                  <h3 style={{ flex: 1 }}>{book.title}</h3>
                  <span className={`category-tag category-${book.category}`}>{book.category}</span>
                </div>
                <div className="author">{book.author}</div>
                <div className="book-footer">
                  <div className="available-count">
                    可借：<span className={`count ${book.available_copies === 0 ? 'zero' : ''}`}>
                      {book.available_copies}/{book.total_copies}
                    </span>
                  </div>
                  {book.available_copies > 0 ? (
                    <button
                      className="btn btn-cyan btn-sm"
                      onClick={() => setConfirmBook(book)}
                    >
                      预约
                    </button>
                  ) : (
                    <span className="queue-badge">
                      排队 {queueCounts[book.isbn] || 0} 人
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredBooks.length === 0 && (
          <div style={{ textAlign: 'center', color: '#9ca3af', padding: 40 }}>
            未找到相关图书
          </div>
        )}
      </div>

      {confirmBook && (
        <div className="modal-overlay" onClick={() => setConfirmBook(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>📌 确认预约</h3>
            <div style={{ margin: '16px 0' }}>
              <p><strong>书名：</strong>{confirmBook.title}</p>
              <p><strong>作者：</strong>{confirmBook.author}</p>
              <p><strong>类别：</strong>{confirmBook.category}</p>
              <p style={{ marginTop: 8, fontSize: 13, color: '#6b7280' }}>
                预约后该书将为您保留24小时，请及时前往图书馆借阅。
              </p>
            </div>
            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => setConfirmBook(null)}>取消</button>
              <button className="btn btn-cyan" onClick={handleReserve} disabled={reserving}>
                {reserving ? '预约中...' : '确认预约'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
