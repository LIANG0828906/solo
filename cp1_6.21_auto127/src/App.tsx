import { useState, useEffect, createContext, useContext, ReactNode, useCallback } from 'react';
import axios from 'axios';
import { Book, Record, AppContextType } from './types';
import BookManager from './BookManager';
import RecordManager from './RecordManager';

const AppContext = createContext<AppContextType | undefined>(undefined);

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
}

function AppProvider({ children }: { children: ReactNode }) {
  const [books, setBooks] = useState<Book[]>([]);
  const [records, setRecords] = useState<Record[]>([]);

  const loadBooks = useCallback(async () => {
    try {
      const response = await axios.get('/api/books');
      setBooks(response.data);
    } catch (error) {
      console.error('Failed to load books:', error);
    }
  }, []);

  const loadRecords = useCallback(async () => {
    try {
      const response = await axios.get('/api/records');
      setRecords(response.data);
    } catch (error) {
      console.error('Failed to load records:', error);
    }
  }, []);

  const addBook = useCallback(async (title: string, author: string, isbn: string) => {
    const response = await axios.post('/api/books', { title, author, isbn });
    setBooks((prev) => [...prev, response.data]);
  }, []);

  const deleteBook = useCallback(async (id: string) => {
    await axios.delete(`/api/books/${id}`);
    setBooks((prev) => prev.filter((b) => b.id !== id));
    setRecords((prev) => prev.filter((r) => r.bookId !== id || r.isReturned));
  }, []);

  const borrowBook = useCallback(async (bookId: string, borrower: string, borrowDate: string) => {
    const response = await axios.post('/api/records', { bookId, borrower, borrowDate });
    setRecords((prev) => [...prev, response.data]);
    setBooks((prev) =>
      prev.map((b) => (b.id === bookId ? { ...b, isBorrowed: true } : b))
    );
  }, []);

  const returnBook = useCallback(async (recordId: string, returnDate: string) => {
    const response = await axios.patch(`/api/records/${recordId}`, { returnDate });
    setRecords((prev) =>
      prev.map((r) => (r.id === recordId ? response.data : r))
    );
    const updatedRecord = response.data;
    setBooks((prev) =>
      prev.map((b) =>
        b.id === updatedRecord.bookId ? { ...b, isBorrowed: false } : b
      )
    );
  }, []);

  useEffect(() => {
    loadBooks();
    loadRecords();
  }, [loadBooks, loadRecords]);

  const value: AppContextType = {
    books,
    records,
    loadBooks,
    loadRecords,
    addBook,
    deleteBook,
    borrowBook,
    returnBook,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

type TabType = 'books' | 'records';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('books');
  const [fadeKey, setFadeKey] = useState(0);

  const handleTabChange = (tab: TabType) => {
    if (tab !== activeTab) {
      setActiveTab(tab);
      setFadeKey((k) => k + 1);
    }
  };

  return (
    <AppProvider>
      <div style={styles.app}>
        <header style={styles.header}>
          <h1 style={styles.headerTitle}>个人图书借阅管理器</h1>
        </header>
        <nav style={styles.tabs}>
          <button
            style={{
              ...styles.tabButton,
              ...(activeTab === 'books' ? styles.activeTab : styles.inactiveTab),
            }}
            onClick={() => handleTabChange('books')}
          >
            图书管理
          </button>
          <button
            style={{
              ...styles.tabButton,
              ...(activeTab === 'records' ? styles.activeTab : styles.inactiveTab),
            }}
            onClick={() => handleTabChange('records')}
          >
            借阅记录
          </button>
        </nav>
        <main
          key={fadeKey}
          style={styles.content}
        >
          {activeTab === 'books' ? <BookManager /> : <RecordManager />}
        </main>
      </div>
    </AppProvider>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  app: {
    minHeight: '100vh',
    backgroundColor: '#F8FAFC',
  },
  header: {
    height: '56px',
    backgroundColor: '#1E293B',
    color: '#FFFFFF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: '20px',
    fontWeight: 600,
  },
  tabs: {
    display: 'flex',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderBottom: '1px solid #E2E8F0',
  },
  tabButton: {
    padding: '16px 32px',
    fontSize: '16px',
    fontWeight: 500,
    border: 'none',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    transition: 'color 0.2s',
  },
  activeTab: {
    color: '#6366F1',
    borderBottom: '2px solid #6366F1',
  },
  inactiveTab: {
    color: '#64748B',
    borderBottom: '2px solid transparent',
  },
  content: {
    padding: '24px',
    maxWidth: '1200px',
    margin: '0 auto',
    animation: 'fadeIn 0.2s ease-in-out',
  },
};
