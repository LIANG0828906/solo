import React, { useState, useEffect, createContext, useContext } from 'react';
import { Routes, Route, NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Bookshelf from './pages/Bookshelf';
import Challenge from './pages/Challenge';
import { Book, initialBooks, ReadStatus } from './data/books';

interface ReadingRecord {
  date: string;
  minutes: number;
}

interface AppContextType {
  books: Book[];
  updateBookStatus: (id: string, status: ReadStatus) => void;
  readingRecords: ReadingRecord[];
  addReadingTime: (date: string, minutes: number) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export const useAppContext = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used within AppProvider');
  return ctx;
};

const App: React.FC = () => {
  const [books, setBooks] = useState<Book[]>(initialBooks);
  const [readingRecords, setReadingRecords] = useState<ReadingRecord[]>(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const records: ReadingRecord[] = [];
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    for (let i = 1; i <= daysInMonth; i++) {
      records.push({
        date: `${i}`,
        minutes: Math.floor(Math.random() * 90) + (i < today.getDate() ? 10 : 0)
      });
    }
    return records;
  });

  const [isMobile, setIsMobile] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const updateBookStatus = (id: string, status: ReadStatus) => {
    setBooks(prev =>
      prev.map(book => (book.id === id ? { ...book, status } : book))
    );
  };

  const addReadingTime = (date: string, minutes: number) => {
    setReadingRecords(prev =>
      prev.map(r =>
        r.date === date ? { ...r, minutes: r.minutes + minutes } : r
      )
    );
  };

  const menuItems = [
    { to: '/', label: '我的书架', icon: '📚' },
    { to: '/challenge', label: '阅读挑战', icon: '🏆' }
  ];

  const SidebarContent = () => (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div
        style={{
          padding: isMobile ? '0 20px' : '24px 20px',
          display: 'flex',
          alignItems: 'center',
          height: isMobile ? '100%' : 'auto',
          flexDirection: isMobile ? 'row' : 'column',
          justifyContent: isMobile ? 'flex-start' : 'center',
          gap: isMobile ? 16 : 0
        }}
      >
        <div
          style={{
            fontSize: isMobile ? 20 : 28,
            marginRight: isMobile ? 8 : 0
          }}
        >
          📖
        </div>
        <div
          style={{
            color: '#fff',
            fontSize: isMobile ? 16 : 18,
            fontWeight: 700,
            textAlign: 'center',
            display: isMobile ? 'none' : 'block',
            marginTop: isMobile ? 0 : 8
          }}
        >
          线上读书会
        </div>
      </div>

      <nav
        style={{
          display: 'flex',
          flexDirection: isMobile ? 'row' : 'column',
          flex: isMobile ? 1 : 0,
          justifyContent: isMobile ? 'flex-end' : 'flex-start',
          height: '100%',
          alignItems: 'center'
        }}
      >
        {menuItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              padding: isMobile ? '0 20px' : '14px 20px',
              color: '#fff',
              textDecoration: 'none',
              fontSize: 15,
              fontWeight: 500,
              position: 'relative',
              cursor: 'pointer',
              borderLeft:
                !isMobile && isActive ? '2px solid #03A9F4' : 'none',
              borderBottom:
                isMobile && isActive ? '2px solid #03A9F4' : 'none',
              borderTop: 'none',
              borderRight: 'none',
              backgroundColor: 'transparent',
              transition: 'background-color 0.2s ease',
              height: isMobile ? '100%' : 'auto',
              whiteSpace: 'nowrap'
            } as React.CSSProperties)}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.backgroundColor =
                '#37474F';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.backgroundColor =
                'transparent';
            }}
          >
            <span style={{ marginRight: 10, fontSize: 18 }}>{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );

  return (
    <AppContext.Provider
      value={{ books, updateBookStatus, readingRecords, addReadingTime }}
    >
      <div
        style={{
          minHeight: '100vh',
          backgroundColor: '#FAFAFA'
        }}
      >
        {isMobile ? (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              height: 56,
              backgroundColor: '#263238',
              color: '#fff',
              zIndex: 1000,
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <SidebarContent />
          </div>
        ) : (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              bottom: 0,
              width: 200,
              backgroundColor: '#263238',
              color: '#fff',
              zIndex: 1000,
              boxShadow: '2px 0 8px rgba(0,0,0,0.1)'
            }}
          >
            <SidebarContent />
          </div>
        )}

        <main
          style={{
            marginLeft: isMobile ? 0 : 200,
            marginTop: isMobile ? 56 : 0,
            minHeight: '100vh',
            padding: isMobile ? '20px 16px' : '32px 40px',
            maxWidth: isMobile ? '100%' : 1200 + 200,
            margin: isMobile ? '56px auto 0' : '0 auto 0 200px'
          }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              style={{
                maxWidth: 1200,
                margin: isMobile ? '0 auto' : 0
              }}
            >
              <Routes>
                <Route path="/" element={<Bookshelf isMobile={isMobile} />} />
                <Route
                  path="/challenge"
                  element={<Challenge isMobile={isMobile} />}
                />
              </Routes>
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </AppContext.Provider>
  );
};

export default App;
