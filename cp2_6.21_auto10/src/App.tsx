import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useLocalStorage } from './hooks/useLocalStorage';
import { BookCard } from './components/BookCard';
import { BookDetail } from './components/BookDetail';
import type { Book, Note, BookStatus, SearchResult, AppData } from './types';

const STORAGE_KEY = 'reading_list_app_data';

type View = 'list' | 'detail';
type FilterStatus = 'all' | BookStatus;
type AddMode = 'search' | 'manual';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

const initialData: AppData = {
  books: [],
  version: '1.0.0'
};

const statusFilters: { value: FilterStatus; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'reading', label: '在读' },
  { value: 'unread', label: '未读' },
  { value: 'finished', label: '读完' }
];

export default function App() {
  const [data, setData, , importData, exportData] = useLocalStorage<AppData>(
    STORAGE_KEY,
    initialData
  );

  const [view, setView] = useState<View>('list');
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addMode, setAddMode] = useState<AddMode>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const searchDebounceRef = useRef<number | null>(null);

  const [manualTitle, setManualTitle] = useState('');
  const [manualAuthor, setManualAuthor] = useState('');
  const [manualCoverUrl, setManualCoverUrl] = useState('');

  const importInputRef = useRef<HTMLInputElement>(null);

  const filteredBooks = useMemo(() => {
    let books = [...data.books].sort(
      (a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
    );
    if (statusFilter !== 'all') {
      books = books.filter((book) => book.status === statusFilter);
    }
    return books;
  }, [data.books, statusFilter]);

  const stats = useMemo(() => {
    const total = data.books.length;
    const reading = data.books.filter((b) => b.status === 'reading').length;
    const finished = data.books.filter((b) => b.status === 'finished').length;
    const totalNotes = data.books.reduce((sum, b) => sum + b.notes.length, 0);
    return { total, reading, finished, totalNotes };
  }, [data.books]);

  const selectedBook = useMemo(
    () => data.books.find((b) => b.id === selectedBookId) || null,
    [data.books, selectedBookId]
  );

  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    if (searchDebounceRef.current) {
      window.clearTimeout(searchDebounceRef.current);
    }

    searchDebounceRef.current = window.setTimeout(async () => {
      setIsSearching(true);
      try {
        const response = await fetch(
          `https://openlibrary.org/search.json?q=${encodeURIComponent(searchQuery)}&limit=10`
        );
        const result = await response.json();
        setSearchResults(result.docs || []);
      } catch (error) {
        console.error('Search error:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => {
      if (searchDebounceRef.current) {
        window.clearTimeout(searchDebounceRef.current);
      }
    };
  }, [searchQuery]);

  const addBook = useCallback(
    (bookData: { title: string; author: string; coverUrl: string }) => {
      const newBook: Book = {
        id: generateId(),
        title: bookData.title,
        author: bookData.author,
        coverUrl:
          bookData.coverUrl ||
          'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="300"><rect width="100%25" height="100%25" fill="%23f0ebe0"/><text x="50%25" y="50%25" fill="%238b7355" font-family="Georgia" font-size="14" text-anchor="middle" dy=".3em">无封面</text></svg>',
        status: 'unread',
        progress: 0,
        startDate: '',
        endDate: '',
        lastUpdated: new Date().toISOString(),
        notes: []
      };

      setData((prev) => ({
        ...prev,
        books: [...prev.books, newBook]
      }));

      setShowAddModal(false);
      setSearchQuery('');
      setSearchResults([]);
      setManualTitle('');
      setManualAuthor('');
      setManualCoverUrl('');
    },
    [setData]
  );

  const addBookFromSearch = useCallback(
    (result: SearchResult) => {
      const coverUrl = result.cover_i
        ? `https://covers.openlibrary.org/b/id/${result.cover_i}-M.jpg`
        : '';
      addBook({
        title: result.title,
        author: result.author_name?.[0] || '未知作者',
        coverUrl
      });
    },
    [addBook]
  );

  const handleManualAdd = useCallback(() => {
    if (!manualTitle.trim()) return;
    addBook({
      title: manualTitle.trim(),
      author: manualAuthor.trim() || '未知作者',
      coverUrl: manualCoverUrl.trim()
    });
  }, [manualTitle, manualAuthor, manualCoverUrl, addBook]);

  const updateBook = useCallback(
    (bookId: string, updates: Partial<Book>) => {
      setData((prev) => ({
        ...prev,
        books: prev.books.map((book) =>
          book.id === bookId
            ? { ...book, ...updates, lastUpdated: new Date().toISOString() }
            : book
        )
      }));
    },
    [setData]
  );

  const deleteBook = useCallback(
    (bookId: string) => {
      setData((prev) => ({
        ...prev,
        books: prev.books.filter((book) => book.id !== bookId)
      }));
      setView('list');
      setSelectedBookId(null);
    },
    [setData]
  );

  const addNote = useCallback(
    (bookId: string, noteData: Omit<Note, 'id'>) => {
      const newNote: Note = {
        ...noteData,
        id: generateId()
      };
      setData((prev) => ({
        ...prev,
        books: prev.books.map((book) =>
          book.id === bookId
            ? {
                ...book,
                notes: [...book.notes, newNote],
                lastUpdated: new Date().toISOString()
              }
            : book
        )
      }));
    },
    [setData]
  );

  const deleteNote = useCallback(
    (bookId: string, noteId: string) => {
      setData((prev) => ({
        ...prev,
        books: prev.books.map((book) =>
          book.id === bookId
            ? {
                ...book,
                notes: book.notes.filter((note) => note.id !== noteId),
                lastUpdated: new Date().toISOString()
              }
            : book
        )
      }));
    },
    [setData]
  );

  const handleExport = useCallback(() => {
    const startTime = performance.now();
    exportData();
    const elapsed = performance.now() - startTime;
    console.log(`Export triggered in ${elapsed.toFixed(2)}ms`);
  }, [exportData]);

  const handleImportClick = useCallback(() => {
    importInputRef.current?.click();
  }, []);

  const handleImport = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const imported = JSON.parse(event.target?.result as string) as AppData;
          if (imported.books && Array.isArray(imported.books)) {
            importData(imported);
            alert('导入成功！');
          } else {
            alert('无效的数据格式');
          }
        } catch {
          alert('导入失败，请检查文件格式');
        }
      };
      reader.readAsText(file);
      e.target.value = '';
    },
    [importData]
  );

  const handleBookClick = useCallback(
    (bookId: string) => {
      const startTime = performance.now();
      setSelectedBookId(bookId);
      setView('detail');
      requestAnimationFrame(() => {
        const elapsed = performance.now() - startTime;
        console.log(`Navigation completed in ${elapsed.toFixed(2)}ms`);
      });
    },
    []
  );

  const handleBackToList = useCallback(() => {
    setView('list');
    setSelectedBookId(null);
  }, []);

  const resetAddModal = useCallback(() => {
    setShowAddModal(false);
    setSearchQuery('');
    setSearchResults([]);
    setManualTitle('');
    setManualAuthor('');
    setManualCoverUrl('');
    setAddMode('search');
  }, []);

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">📚 我的阅读书单</h1>
        <div className="header-actions">
          <button className="glass-btn" onClick={() => setShowAddModal(true)}>
            + 添加书籍
          </button>
          <button className="glass-btn" onClick={handleExport}>
            ⬇ 导出
          </button>
          <button className="glass-btn" onClick={handleImportClick}>
            ⬆ 导入
          </button>
          <input
            ref={importInputRef}
            type="file"
            accept=".json"
            style={{ display: 'none' }}
            onChange={handleImport}
          />
        </div>
      </header>

      {view === 'list' ? (
        <>
          <div className="stats-row">
            <div className="stat-card">
              <div className="stat-number">{stats.total}</div>
              <div className="stat-label">全部书籍</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{stats.reading}</div>
              <div className="stat-label">正在阅读</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{stats.finished}</div>
              <div className="stat-label">已读完</div>
            </div>
          </div>

          <div className="tabs">
            {statusFilters.map((filter) => (
              <button
                key={filter.value}
                className={`tab ${statusFilter === filter.value ? 'active' : ''}`}
                onClick={() => setStatusFilter(filter.value)}
              >
                {filter.label}
              </button>
            ))}
          </div>

          {filteredBooks.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📖</div>
              <div className="empty-state-text">
                还没有添加书籍，点击右上角「添加书籍」开始你的阅读之旅
              </div>
            </div>
          ) : (
            <div className="books-grid">
              {filteredBooks.map((book) => (
                <BookCard
                  key={book.id}
                  book={book}
                  isSelected={false}
                  onClick={() => handleBookClick(book.id)}
                />
              ))}
            </div>
          )}
        </>
      ) : (
        selectedBook && (
          <BookDetail
            book={selectedBook}
            onBack={handleBackToList}
            onUpdateBook={(updates) => updateBook(selectedBook.id, updates)}
            onAddNote={(note) => addNote(selectedBook.id, note)}
            onDeleteNote={(noteId) => deleteNote(selectedBook.id, noteId)}
            onDeleteBook={() => deleteBook(selectedBook.id)}
          />
        )
      )}

      {showAddModal && (
        <div className="modal-overlay" onClick={resetAddModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">添加书籍</h2>

            <div className="tabs" style={{ marginBottom: '20px' }}>
              <button
                className={`tab ${addMode === 'search' ? 'active' : ''}`}
                onClick={() => setAddMode('search')}
              >
                🔍 搜索书籍
              </button>
              <button
                className={`tab ${addMode === 'manual' ? 'active' : ''}`}
                onClick={() => setAddMode('manual')}
              >
                ✏️ 手动输入
              </button>
            </div>

            {addMode === 'search' ? (
              <>
                <div className="form-group">
                  <label className="form-label">搜索书名或作者</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="输入关键词搜索..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    autoFocus
                  />
                </div>

                {isSearching && (
                  <div style={{ textAlign: 'center', padding: '20px', color: '#888' }}>
                    搜索中...
                  </div>
                )}

                {!isSearching && searchResults.length > 0 && (
                  <div className="search-results">
                    {searchResults.map((result) => (
                      <div
                        key={result.key}
                        className="search-result-item"
                        onClick={() => addBookFromSearch(result)}
                      >
                        {result.cover_i ? (
                          <img
                            src={`https://covers.openlibrary.org/b/id/${result.cover_i}-S.jpg`}
                            alt={result.title}
                            className="search-result-cover"
                          />
                        ) : (
                          <div className="search-result-cover" />
                        )}
                        <div className="search-result-info">
                          <div className="search-result-title">{result.title}</div>
                          <div className="search-result-author">
                            {result.author_name?.join(', ') || '未知作者'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {!isSearching && searchQuery && searchResults.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '20px', color: '#888' }}>
                    未找到相关书籍，可以切换到「手动输入」添加
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="form-group">
                  <label className="form-label">书名 *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="请输入书名"
                    value={manualTitle}
                    onChange={(e) => setManualTitle(e.target.value)}
                    autoFocus
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">作者</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="请输入作者"
                    value={manualAuthor}
                    onChange={(e) => setManualAuthor(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">封面图片 URL（可选）</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="https://example.com/cover.jpg"
                    value={manualCoverUrl}
                    onChange={(e) => setManualCoverUrl(e.target.value)}
                  />
                </div>
              </>
            )}

            <div className="btn-group">
              <button className="btn-secondary" onClick={resetAddModal}>
                取消
              </button>
              {addMode === 'manual' && (
                <button
                  className="btn-primary"
                  onClick={handleManualAdd}
                  disabled={!manualTitle.trim()}
                >
                  添加
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
