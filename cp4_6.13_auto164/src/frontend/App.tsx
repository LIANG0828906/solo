import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Routes, Route, useNavigate, useParams, Link } from 'react-router-dom';
import BookCard, { Book } from './components/BookCard';
import NoteCard, { Note } from './components/NoteCard';

const ESTIMATED_NOTE_HEIGHT = 200;
const VIRTUAL_BUFFER = 5;

const BookshelfPage: React.FC = () => {
  const navigate = useNavigate();
  const [books, setBooks] = useState<Book[]>([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [filterKey, setFilterKey] = useState(0);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchBooks = useCallback(async () => {
    try {
      const res = await fetch('/api/books');
      if (res.ok) {
        const data = await res.json();
        setBooks(data);
      }
    } catch (err) {
      console.error('Failed to fetch books:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  const filteredBooks = useMemo(() => {
    if (!searchKeyword.trim()) return books;
    const keyword = searchKeyword.toLowerCase();
    return books.filter(b =>
      b.title.toLowerCase().includes(keyword) ||
      b.author.toLowerCase().includes(keyword)
    );
  }, [books, searchKeyword]);

  const totalProgress = useMemo(() => {
    const totalPages = books.reduce((sum, b) => sum + b.total_pages, 0);
    const readPages = books.reduce((sum, b) => sum + b.current_page, 0);
    if (totalPages === 0) return { percent: 0, readPages: 0, totalPages: 0 };
    return {
      percent: Math.round((readPages / totalPages) * 100),
      readPages,
      totalPages,
    };
  }, [books]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchKeyword(e.target.value);
    setFilterKey(prev => prev + 1);
  };

  const handleEditClick = (book: Book, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingBook(book);
    setShowEditModal(true);
  };

  const handleSaveBook = async (bookData: Partial<Book>) => {
    try {
      if (editingBook) {
        const res = await fetch(`/api/books/${editingBook.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bookData),
        });
        if (res.ok) {
          fetchBooks();
        }
      }
    } catch (err) {
      console.error('Failed to update book:', err);
    }
    setShowEditModal(false);
    setEditingBook(null);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #f8f9fa 0%, #eef1f5 100%)',
      padding: '32px 24px 60px',
    }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 24,
          flexWrap: 'wrap',
          gap: 16,
        }}>
          <div>
            <h1 style={{
              fontSize: 28,
              fontWeight: 700,
              color: '#2c3e50',
              marginBottom: 6,
              letterSpacing: -0.5,
            }}>
              📚 我的技术书架
            </h1>
            <p style={{ fontSize: 14, color: '#7f8c8d', margin: 0 }}>
              共 {books.length} 本书 · 持续阅读，积累知识
            </p>
          </div>

          <div className="search-wrapper" style={{ position: 'relative' }}>
            <svg
              style={{
                position: 'absolute',
                left: 16,
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#95a5a6',
                pointerEvents: 'none',
                zIndex: 2,
              }}
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input
              type="text"
              placeholder="搜索书名、作者..."
              value={searchKeyword}
              onChange={handleSearchChange}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              className="search-input"
              style={{
                width: searchFocused ? 400 : 300,
                height: 40,
                padding: '0 16px 0 42px',
                borderRadius: 20,
                border: `1px solid ${searchFocused ? '#3498db' : '#ddd'}`,
                background: 'white',
                fontSize: 14,
                color: '#2c3e50',
                outline: 'none',
                transition: 'width 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease',
                boxShadow: searchFocused ? '0 0 0 3px rgba(52, 152, 219, 0.15)' : 'none',
              }}
            />
          </div>
        </div>

        <div style={{
          background: 'white',
          borderRadius: 10,
          padding: '16px 20px',
          marginBottom: 28,
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 10,
          }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#34495e' }}>
              总体阅读进度
            </span>
            <span style={{ fontSize: 13, color: '#7f8c8d' }}>
              已读 {totalProgress.readPages} / {totalProgress.totalPages} 页 · {totalProgress.percent}%
            </span>
          </div>
          <div style={{
            width: '100%',
            height: 8,
            background: '#ecf0f1',
            borderRadius: 4,
            overflow: 'hidden',
          }}>
            <div style={{
              height: '100%',
              width: `${totalProgress.percent}%`,
              background: 'linear-gradient(90deg, #3498db, #2ecc71)',
              borderRadius: 4,
              transition: 'width 0.5s ease',
            }} />
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: '#7f8c8d' }}>
            加载中...
          </div>
        ) : (
          <div
            className="books-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 24,
              justifyItems: 'center',
            }}
          >
            {filteredBooks.map((book, idx) => (
              <BookCard
                key={book.id}
                book={book}
                animationKey={filterKey + idx}
                onClick={() => navigate(`/books/${book.id}`)}
                onEdit={(e) => handleEditClick(book, e)}
              />
            ))}
          </div>
        )}

        {filteredBooks.length === 0 && !loading && (
          <div style={{
            textAlign: 'center',
            padding: '80px 20px',
            color: '#95a5a6',
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
            <p style={{ fontSize: 15 }}>没有找到匹配的书籍</p>
          </div>
        )}
      </div>

      {showEditModal && editingBook && (
        <EditBookModal
          book={editingBook}
          onClose={() => { setShowEditModal(false); setEditingBook(null); }}
          onSave={handleSaveBook}
        />
      )}

      <style>{`
        @media (max-width: 1199px) {
          .books-grid { grid-template-columns: repeat(3, 1fr) !important; }
        }
        @media (max-width: 767px) {
          .books-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 16px !important; }
          .search-input { width: 100% !important; max-width: 300px; }
          .search-input:focus { width: 100% !important; max-width: 340px; }
        }
      `}</style>
    </div>
  );
};

const EditBookModal: React.FC<{
  book: Book;
  onClose: () => void;
  onSave: (data: Partial<Book>) => void;
}> = ({ book, onClose, onSave }) => {
  const [title, setTitle] = useState(book.title);
  const [author, setAuthor] = useState(book.author);
  const [coverUrl, setCoverUrl] = useState(book.cover_url || '');
  const [totalPages, setTotalPages] = useState(book.total_pages);
  const [currentPage, setCurrentPage] = useState(book.current_page);
  const [status, setStatus] = useState<Book['status']>(book.status);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      title,
      author,
      cover_url: coverUrl || null,
      total_pages: Number(totalPages),
      current_page: Number(currentPage),
      status,
    });
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        backdropFilter: 'blur(2px)',
        animation: 'fadeIn 0.2s ease',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 500,
          maxWidth: '90vw',
          background: 'white',
          borderRadius: 12,
          overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
          animation: 'scaleIn 0.25s ease',
        }}
      >
        <div style={{
          padding: '18px 24px',
          background: 'repeating-linear-gradient(45deg, #bdc3c7, #bdc3c7 1px, #d5dbdb 1px, #d5dbdb 8px)',
          borderBottom: '1px solid #bdc3c7',
        }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: '#2c3e50', margin: 0 }}>
            编辑书籍信息
          </h3>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: 24 }}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, color: '#34495e', marginBottom: 6, fontWeight: 500 }}>
              书名
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={inputStyle}
              required
            />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, color: '#34495e', marginBottom: 6, fontWeight: 500 }}>
              作者
            </label>
            <input
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              style={inputStyle}
              required
            />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, color: '#34495e', marginBottom: 6, fontWeight: 500 }}>
              封面URL
            </label>
            <input
              type="url"
              value={coverUrl}
              onChange={(e) => setCoverUrl(e.target.value)}
              style={inputStyle}
              placeholder="https://..."
            />
          </div>
          <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: 13, color: '#34495e', marginBottom: 6, fontWeight: 500 }}>
                总页数
              </label>
              <input
                type="number"
                min="0"
                value={totalPages}
                onChange={(e) => setTotalPages(Number(e.target.value))}
                style={inputStyle}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: 13, color: '#34495e', marginBottom: 6, fontWeight: 500 }}>
                当前页码
              </label>
              <input
                type="number"
                min="0"
                value={currentPage}
                onChange={(e) => setCurrentPage(Number(e.target.value))}
                style={inputStyle}
              />
            </div>
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 13, color: '#34495e', marginBottom: 6, fontWeight: 500 }}>
              阅读状态
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as Book['status'])}
              style={{ ...inputStyle, cursor: 'pointer' }}
            >
              <option value="want_to_read">想读</option>
              <option value="reading">在读</option>
              <option value="finished">已读完</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: '11px 20px',
                borderRadius: 8,
                border: '1px solid #ddd',
                background: 'white',
                color: '#7f8c8d',
                fontSize: 14,
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'background 0.2s ease',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#f8f9fa'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'white'; }}
            >
              取消
            </button>
            <button
              type="submit"
              className="submit-btn"
              style={{
                flex: 1,
                padding: '11px 20px',
                borderRadius: 8,
                border: 'none',
                background: 'linear-gradient(135deg, #2ecc71, #27ae60)',
                color: 'white',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'filter 0.2s ease, transform 0.1s ease',
              }}
            >
              保存
            </button>
          </div>
        </form>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        .submit-btn:hover { filter: brightness(1.1); }
        .submit-btn:active { transform: translateY(2px); }
      `}</style>
    </div>
  );
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  borderRadius: 6,
  border: '2px solid #bdc3c7',
  fontSize: 14,
  color: '#2c3e50',
  outline: 'none',
  transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
  boxSizing: 'border-box',
};

inputStyle.onFocus = () => {};

const BookDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [book, setBook] = useState<Book | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [excerpt, setExcerpt] = useState('');
  const [reflection, setReflection] = useState('');
  const [loading, setLoading] = useState(true);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(600);

  const fetchBook = useCallback(async () => {
    if (!id) return;
    try {
      const res = await fetch(`/api/books/${id}`);
      if (res.ok) {
        const data = await res.json();
        setBook(data);
      } else if (res.status === 404) {
        navigate('/');
      }
    } catch (err) {
      console.error('Failed to fetch book:', err);
    }
  }, [id, navigate]);

  const fetchNotes = useCallback(async () => {
    if (!id) return;
    try {
      const res = await fetch(`/api/books/${id}/notes`);
      if (res.ok) {
        const data = await res.json();
        setNotes(data);
      }
    } catch (err) {
      console.error('Failed to fetch notes:', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchBook();
    fetchNotes();
  }, [fetchBook, fetchNotes]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const updateHeight = () => {
      setContainerHeight(container.clientHeight);
    };
    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  const visibleNotes = useMemo(() => {
    const startIdx = Math.max(0, Math.floor(scrollTop / ESTIMATED_NOTE_HEIGHT) - VIRTUAL_BUFFER);
    const endIdx = Math.min(
      notes.length,
      Math.ceil((scrollTop + containerHeight) / ESTIMATED_NOTE_HEIGHT) + VIRTUAL_BUFFER
    );
    return {
      items: notes.slice(startIdx, endIdx),
      startIdx,
      endIdx,
    };
  }, [notes, scrollTop, containerHeight]);

  const totalHeight = notes.length * ESTIMATED_NOTE_HEIGHT;

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !excerpt.trim() || !reflection.trim()) return;

    try {
      const res = await fetch(`/api/books/${id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ excerpt, reflection }),
      });
      if (res.ok) {
        const newNote = await res.json();
        setNotes(prev => [newNote, ...prev]);
        setExcerpt('');
        setReflection('');
        setShowNoteModal(false);
      }
    } catch (err) {
      console.error('Failed to add note:', err);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('确定删除这条笔记吗？')) return;
    try {
      const res = await fetch(`/api/notes/${noteId}`, { method: 'DELETE' });
      if (res.ok) {
        setNotes(prev => prev.filter(n => n.id !== noteId));
      }
    } catch (err) {
      console.error('Failed to delete note:', err);
    }
  };

  const getStatusLabel = (status: Book['status']) => {
    switch (status) {
      case 'reading': return { text: '在读', color: '#3498db', bg: 'rgba(52,152,219,0.1)' };
      case 'finished': return { text: '已读完', color: '#2ecc71', bg: 'rgba(46,204,113,0.1)' };
      case 'want_to_read': return { text: '想读', color: '#e67e22', bg: 'rgba(230,126,34,0.1)' };
    }
  };

  const statusInfo = book ? getStatusLabel(book.status) : null;

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #f8f9fa 0%, #eef1f5 100%)',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <div style={{
        maxWidth: 1200,
        width: '100%',
        margin: '0 auto',
        padding: '24px 20px',
      }}>
        <Link
          to="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            color: '#3498db',
            fontSize: 14,
            textDecoration: 'none',
            marginBottom: 20,
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          返回书架
        </Link>
      </div>

      <div style={{
        maxWidth: 1200,
        width: '100%',
        margin: '0 auto',
        padding: '0 20px 40px',
        display: 'grid',
        gridTemplateColumns: '340px 1fr',
        gap: 28,
        flex: 1,
      }}>
        <div style={{
          background: 'white',
          borderRadius: 14,
          padding: 28,
          boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
          height: 'fit-content',
          position: 'sticky',
          top: 20,
        }}>
          {book ? (
            <>
              <div style={{
                width: 180,
                height: 260,
                margin: '0 auto 24px',
                borderRadius: 10,
                overflow: 'hidden',
                boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                background: '#ecf0f1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                {book.cover_url ? (
                  <img
                    src={book.cover_url}
                    alt={book.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <span style={{ color: '#95a5a6', fontSize: 14 }}>封面缺失</span>
                )}
              </div>

              <h2 style={{
                fontSize: 22,
                fontWeight: 700,
                color: '#2c3e50',
                textAlign: 'center',
                marginBottom: 8,
                lineHeight: 1.4,
              }}>
                {book.title}
              </h2>
              <p style={{
                fontSize: 15,
                color: '#7f8c8d',
                textAlign: 'center',
                marginBottom: 20,
              }}>
                {book.author}
              </p>

              {statusInfo && (
                <div style={{ textAlign: 'center', marginBottom: 24 }}>
                  <span style={{
                    display: 'inline-block',
                    padding: '6px 16px',
                    borderRadius: 20,
                    fontSize: 13,
                    fontWeight: 600,
                    color: statusInfo.color,
                    background: statusInfo.bg,
                  }}>
                    {statusInfo.text}
                  </span>
                </div>
              )}

              <div style={{
                background: '#f8f9fa',
                borderRadius: 10,
                padding: 18,
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: 12,
                }}>
                  <span style={{ fontSize: 13, color: '#7f8c8d' }}>已读页码</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#2c3e50' }}>
                    {book.current_page} / {book.total_pages}
                  </span>
                </div>
                <div style={{
                  height: 10,
                  background: '#ecf0f1',
                  borderRadius: 5,
                  overflow: 'hidden',
                }}>
                  <div style={{
                    height: '100%',
                    width: `${book.total_pages > 0 ? Math.min(100, (book.current_page / book.total_pages) * 100) : 0}%`,
                    background: 'linear-gradient(90deg, #3498db, #2ecc71)',
                    borderRadius: 5,
                    transition: 'width 0.5s ease',
                  }} />
                </div>
                <div style={{
                  textAlign: 'right',
                  marginTop: 8,
                  fontSize: 12,
                  color: '#3498db',
                  fontWeight: 600,
                }}>
                  {book.total_pages > 0 ? Math.round((book.current_page / book.total_pages) * 100) : 0}%
                </div>
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#95a5a6' }}>加载中...</div>
          )}
        </div>

        <div style={{
          background: 'white',
          borderRadius: 14,
          boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
          display: 'flex',
          flexDirection: 'column',
          minHeight: 500,
          position: 'relative',
        }}>
          <div style={{
            padding: '22px 28px',
            borderBottom: '1px solid #ecf0f1',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#2c3e50', margin: 0 }}>
                📝 阅读笔记
              </h3>
              <p style={{ fontSize: 13, color: '#7f8c8d', margin: '4px 0 0' }}>
                共 {notes.length} 条笔记
              </p>
            </div>
          </div>

          <div
            ref={scrollContainerRef}
            onScroll={handleScroll}
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '0 28px',
              maxHeight: 'calc(100vh - 200px)',
            }}
          >
            {loading ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: '#95a5a6' }}>
                加载笔记中...
              </div>
            ) : notes.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '80px 20px',
                color: '#95a5a6',
              }}>
                <div style={{ fontSize: 56, marginBottom: 16 }}>✍️</div>
                <p style={{ fontSize: 15, marginBottom: 8 }}>还没有笔记</p>
                <p style={{ fontSize: 13 }}>点击右下角按钮添加第一条笔记</p>
              </div>
            ) : (
              <div style={{ height: totalHeight, position: 'relative' }}>
                {visibleNotes.items.map((note, i) => {
                  const actualIndex = visibleNotes.startIdx + i;
                  return (
                    <div
                      key={note.id}
                      style={{
                        position: 'absolute',
                        top: actualIndex * ESTIMATED_NOTE_HEIGHT,
                        left: 0,
                        right: 0,
                      }}
                    >
                      <NoteCard
                        note={note}
                        index={actualIndex}
                        onDelete={handleDeleteNote}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <button
            onClick={() => setShowNoteModal(true)}
            className="fab-add-btn"
            style={{
              position: 'absolute',
              bottom: 24,
              right: 24,
              width: 50,
              height: 50,
              borderRadius: '50%',
              border: 'none',
              background: 'linear-gradient(135deg, #e74c3c, #c0392b)',
              color: 'white',
              fontSize: 28,
              fontWeight: 300,
              cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(231, 76, 60, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'transform 0.3s ease, box-shadow 0.3s ease',
              zIndex: 10,
              lineHeight: 1,
            }}
          >
            +
          </button>
        </div>
      </div>

      {showNoteModal && (
        <div
          onClick={() => setShowNoteModal(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            backdropFilter: 'blur(2px)',
            animation: 'fadeIn 0.2s ease',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: 500,
              maxWidth: '90vw',
              background: 'white',
              borderRadius: 12,
              overflow: 'hidden',
              boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
              animation: 'scaleIn 0.25s ease',
            }}
          >
            <div style={{
              padding: '18px 24px',
              background: 'repeating-linear-gradient(45deg, #bdc3c7, #bdc3c7 1px, #d5dbdb 1px, #d5dbdb 8px)',
              borderBottom: '1px solid #bdc3c7',
            }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#2c3e50', margin: 0 }}>
                添加笔记
              </h3>
            </div>

            <form onSubmit={handleAddNote} style={{ padding: 24 }}>
              <div style={{ marginBottom: 18 }}>
                <label style={{ display: 'block', fontSize: 13, color: '#34495e', marginBottom: 6, fontWeight: 500 }}>
                  摘录原文
                </label>
                <textarea
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  placeholder="输入书中的精彩摘录..."
                  className="modal-textarea"
                  style={{
                    width: '100%',
                    height: 120,
                    padding: '12px 14px',
                    borderRadius: 6,
                    border: '2px solid #bdc3c7',
                    fontSize: 14,
                    color: '#2c3e50',
                    outline: 'none',
                    resize: 'vertical',
                    fontFamily: 'inherit',
                    lineHeight: 1.6,
                    boxSizing: 'border-box',
                    transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
                  }}
                  required
                />
              </div>

              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', fontSize: 13, color: '#34495e', marginBottom: 6, fontWeight: 500 }}>
                  阅读感悟
                </label>
                <textarea
                  value={reflection}
                  onChange={(e) => setReflection(e.target.value)}
                  placeholder="写下你的思考和感悟..."
                  className="modal-textarea"
                  style={{
                    width: '100%',
                    height: 160,
                    padding: '12px 14px',
                    borderRadius: 6,
                    border: '2px solid #bdc3c7',
                    fontSize: 14,
                    color: '#2c3e50',
                    outline: 'none',
                    resize: 'vertical',
                    fontFamily: 'inherit',
                    lineHeight: 1.6,
                    boxSizing: 'border-box',
                    transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
                  }}
                  required
                />
              </div>

              <button
                type="submit"
                className="note-submit-btn"
                style={{
                  width: '100%',
                  padding: '13px 20px',
                  borderRadius: 8,
                  border: 'none',
                  background: 'linear-gradient(135deg, #2ecc71, #27ae60)',
                  color: 'white',
                  fontSize: 15,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'filter 0.2s ease, transform 0.1s ease',
                }}
              >
                提交笔记
              </button>
            </form>
          </div>

          <style>{`
            @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            @keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
            .fab-add-btn:hover { transform: rotate(45deg); box-shadow: 0 6px 20px rgba(231, 76, 60, 0.5); }
            .modal-textarea:focus { border-color: #3498db !important; box-shadow: 0 0 0 3px rgba(52,152,219,0.15); }
            .note-submit-btn:hover { filter: brightness(1.1); }
            .note-submit-btn:active { transform: translateY(2px); }
          `}</style>
        </div>
      )}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<BookshelfPage />} />
      <Route path="/books/:id" element={<BookDetailPage />} />
    </Routes>
  );
};

export default App;
