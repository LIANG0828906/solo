import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import ToastContainer from './components/ToastContainer';
import BookShelf from './book-management/BookShelf';
import BookDetail from './book-management/BookDetail';
import Dashboard from './statistics/Dashboard';
import { useAppStore } from './store';
import { bookApi } from './services/api';
import { wsService } from './services/websocket';

function App() {
  const { user, setBooks, updateBookStatus, addToast, setLoading } = useAppStore();

  useEffect(() => {
    const fetchBooks = async () => {
      setLoading(true);
      try {
        const { books } = await bookApi.getBooks(1, 20);
        setBooks(books);
      } catch (error) {
        console.error('Failed to fetch books:', error);
        addToast('加载书籍数据失败', 'warning');
      } finally {
        setLoading(false);
      }
    };

    fetchBooks();
  }, [setBooks, setLoading, addToast]);

  useEffect(() => {
    wsService.connect(user.id);

    const unsubscribe = wsService.onMessage((message) => {
      const actionText = message.type === 'borrow' ? '借出了' : '归还了';
      addToast(`${message.user} ${actionText}《${message.book_title}》`);
      updateBookStatus(
        message.book_id,
        message.type === 'borrow' ? 'borrowed' : 'available',
        message.type === 'borrow' ? message.user : undefined
      );
    });

    return () => {
      unsubscribe();
      wsService.disconnect();
    };
  }, [user.id, addToast, updateBookStatus]);

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <main style={{ flex: 1, padding: '24px', overflow: 'auto' }}>
        <Routes>
          <Route path="/" element={<BookShelf />} />
          <Route path="/books/:id" element={<BookDetail />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </main>
      <ToastContainer />
    </div>
  );
}

export default App;
