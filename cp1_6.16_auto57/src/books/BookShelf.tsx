import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { BookCard } from './BookCard';
import { SearchBar } from './SearchBar';
import { AddBookModal } from './AddBookModal';
import { SwapRequest } from '../swap/SwapRequest';
import { database } from '../db/database';
import { useDebounce } from '../hooks/useDebounce';
import { Book } from '../types';
import { getInitials } from '../utils/colors';

interface BookShelfProps {
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export function BookShelf({ showToast }: BookShelfProps) {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const currentUser = database.getCurrentUser();
  const targetUserId = userId || currentUser.id;
  const isOwner = targetUserId === currentUser.id;
  const targetUser = database.getUserById(targetUserId);

  const [books, setBooks] = useState<Book[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [swapBook, setSwapBook] = useState<Book | null>(null);
  const [highlightBookId, setHighlightBookId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const debouncedSearch = useDebounce(searchQuery, 300);

  useEffect(() => {
    const loadBooks = () => {
      setIsLoading(true);
      setTimeout(() => {
        setBooks(database.getBooksByUserId(targetUserId));
        setIsLoading(false);
      }, 200);
    };
    loadBooks();
    return database.subscribe(loadBooks);
  }, [targetUserId]);

  useEffect(() => {
    if (location.hash) {
      const bookId = location.hash.replace('#', '');
      setHighlightBookId(bookId);
      setTimeout(() => {
        const element = document.querySelector(`[data-book-id="${bookId}"]`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        setTimeout(() => setHighlightBookId(null), 3000);
      }, 500);
    }
  }, [location.hash]);

  const filteredBooks = useMemo(() => {
    return books.filter((book) => {
      const matchesSearch =
        !debouncedSearch ||
        book.title.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        book.author.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        book.category.toLowerCase().includes(debouncedSearch.toLowerCase());
      const matchesCategory = !categoryFilter || book.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [books, debouncedSearch, categoryFilter]);

  const filteredIds = useMemo(
    () => new Set(filteredBooks.map((b) => b.id)),
    [filteredBooks]
  );

  const handleAddBook = useCallback(
    (bookData: Omit<Book, 'id' | 'createdAt'>) => {
      database.addBook({
        ...bookData,
        ownerId: currentUser.id,
      });
      showToast('书籍添加成功！', 'success');
    },
    [currentUser.id, showToast]
  );

  const handleEditBook = useCallback(
    (bookData: Omit<Book, 'id' | 'createdAt'>) => {
      if (editingBook) {
        database.updateBook(editingBook.id, bookData);
        showToast('书籍信息已更新！', 'success');
        setEditingBook(null);
      }
    },
    [editingBook, showToast]
  );

  const handleDeleteBook = useCallback(
    (id: string) => {
      if (confirm('确定要删除这本书吗？')) {
        database.deleteBook(id);
        showToast('书籍已删除', 'info');
      }
    },
    [showToast]
  );

  const handleEdit = useCallback((book: Book) => {
    setEditingBook(book);
    setIsAddModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsAddModalOpen(false);
    setEditingBook(null);
  }, []);

  const handleRequestSwap = useCallback((book: Book) => {
    setSwapBook(book);
  }, []);

  if (!targetUser) {
    return <div className="page-container">用户不存在</div>;
  }

  return (
    <div className="page-container page-transition">
      <div className="page-header">
        <div className="page-header-left">
          <div
            className="page-avatar"
            style={{ backgroundColor: targetUser.avatarColor }}
          >
            {getInitials(targetUser.username)}
          </div>
          <div>
            <h1 className="page-title">
              {isOwner ? '我的书架' : `${targetUser.username}的书架`}
            </h1>
            <p className="page-subtitle">
              共 {books.length} 本书，可交换 {books.filter((b) => b.isAvailable).length} 本
            </p>
          </div>
        </div>
        {isOwner && (
          <button
            className="btn btn-primary"
            onClick={() => setIsAddModalOpen(true)}
          >
            <Plus size={18} />
            添加新书
          </button>
        )}
      </div>

      <SearchBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        categoryFilter={categoryFilter}
        onCategoryChange={setCategoryFilter}
      />

      {isLoading ? (
        <div className="book-grid">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="skeleton-card">
              <div className="skeleton-cover" />
              <div className="skeleton-content">
                <div className="skeleton-line w-3/4" />
                <div className="skeleton-line w-1/2" />
                <div className="skeleton-line w-2/3" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredBooks.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📚</div>
          <p className="empty-text">
            {searchQuery || categoryFilter
              ? '没有找到匹配的书籍'
              : isOwner
              ? '书架还空着，快去添加你的第一本书吧！'
              : '这个用户还没有添加书籍'}
          </p>
        </div>
      ) : (
        <div className="book-grid">
          {books.map((book) => (
            <div
              key={book.id}
              data-book-id={book.id}
              style={{ position: 'relative' }}
            >
              <BookCard
                book={book}
                isOwner={isOwner}
                onEdit={handleEdit}
                onDelete={handleDeleteBook}
                onRequestSwap={!isOwner ? handleRequestSwap : undefined}
                isFiltered={!filteredIds.has(book.id)}
                showHighlight={highlightBookId === book.id}
              />
            </div>
          ))}
        </div>
      )}

      <AddBookModal
        isOpen={isAddModalOpen}
        onClose={handleCloseModal}
        onSave={editingBook ? handleEditBook : handleAddBook}
        editingBook={editingBook}
      />

      <SwapRequest
        isOpen={!!swapBook}
        onClose={() => setSwapBook(null)}
        targetBook={swapBook}
        onSuccess={() => {
          showToast('交换请求已发送！', 'success');
          setSwapBook(null);
        }}
        onError={(message) => {
          showToast(message, 'error');
        }}
      />
    </div>
  );
}
