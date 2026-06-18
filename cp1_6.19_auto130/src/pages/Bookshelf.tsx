import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import BookCard from '../components/BookCard';
import { useAppContext } from '../App';
import { Book, ReadStatus, statusColors, statusLabels } from '../data/books';

interface BookshelfProps {
  isMobile: boolean;
}

const Bookshelf: React.FC<BookshelfProps> = ({ isMobile }) => {
  const { books, updateBookStatus } = useAppContext();
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);

  const groupedBooks = useMemo(() => {
    const groups: Record<string, Book[]> = {};
    books.forEach(book => {
      if (!groups[book.theme]) {
        groups[book.theme] = [];
      }
      groups[book.theme].push(book);
    });
    return groups;
  }, [books]);

  const stats = useMemo(() => {
    const total = books.length;
    const read = books.filter(b => b.status === 'read').length;
    const reading = books.filter(b => b.status === 'reading').length;
    const unread = books.filter(b => b.status === 'unread').length;
    return { total, read, reading, unread };
  }, [books]);

  const handleStatusChange = (status: ReadStatus) => {
    if (selectedBook) {
      updateBookStatus(selectedBook.id, status);
      setSelectedBook({ ...selectedBook, status });
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.06
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.9 },
    show: { opacity: 1, y: 0, scale: 1 }
  };

  return (
    <div>
      <div
        style={{
          marginBottom: 32
        }}
      >
        <motion.h1
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          style={{
            fontSize: isMobile ? 24 : 28,
            fontWeight: 700,
            color: '#263238',
            marginBottom: 8
          }}
        >
          我的虚拟书架
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          style={{
            fontSize: 14,
            color: '#666'
          }}
        >
          共 {stats.total} 本书 · 已读 {stats.read} · 在读 {stats.reading} · 未读{' '}
          {stats.unread}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          style={{
            display: 'flex',
            gap: isMobile ? 10 : 16,
            marginTop: 20,
            flexWrap: 'wrap'
          }}
        >
          {[
            {
              label: '已读',
              count: stats.read,
              color: '#E8F5E9',
              dot: '#4CAF50',
              text: '#2E7D32'
            },
            {
              label: '正在阅读',
              count: stats.reading,
              color: '#E3F2FD',
              dot: '#2196F3',
              text: '#1565C0'
            },
            {
              label: '未读',
              count: stats.unread,
              color: '#F5F5F5',
              dot: '#9E9E9E',
              text: '#616161'
            }
          ].map(item => (
            <div
              key={item.label}
              style={{
                padding: '10px 16px',
                backgroundColor: item.color,
                borderRadius: 10,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                boxShadow: '0 2px 4px rgba(0,0,0,0.06)'
              }}
            >
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: item.dot
                }}
              />
              <span
                style={{
                  fontSize: 13,
                  color: item.text,
                  fontWeight: 500
                }}
              >
                {item.label}
              </span>
              <span
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: item.text
                }}
              >
                {item.count}
              </span>
            </div>
          ))}
        </motion.div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
        {Object.entries(groupedBooks).map(([theme, themeBooks], idx) => (
          <motion.div
            key={theme}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.1 + idx * 0.05 }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: 18,
                gap: 12
              }}
            >
              <div
                style={{
                  width: 4,
                  height: 22,
                  backgroundColor: '#4CAF50',
                  borderRadius: 2
                }}
              />
              <h2
                style={{
                  fontSize: isMobile ? 18 : 20,
                  fontWeight: 700,
                  color: '#263238'
                }}
              >
                {theme}
              </h2>
              <span
                style={{
                  fontSize: 13,
                  color: '#888',
                  backgroundColor: '#EEEEEE',
                  padding: '3px 10px',
                  borderRadius: 12
                }}
              >
                {themeBooks.length}本
              </span>
            </div>

            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="show"
              style={{
                display: 'grid',
                gridTemplateColumns: isMobile
                  ? 'repeat(2, minmax(0, 1fr))'
                  : 'repeat(5, 140px)',
                gap: isMobile ? 14 : 20,
                justifyContent: isMobile ? 'stretch' : 'flex-start'
              }}
            >
              {themeBooks.map(book => (
                <motion.div key={book.id} variants={itemVariants}>
                  <BookCard book={book} onClick={setSelectedBook} />
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {selectedBook && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setSelectedBook(null)}
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0,0,0,0.5)',
              zIndex: 2000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 20
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={e => e.stopPropagation()}
              style={{
                width: isMobile ? '100%' : 480,
                minHeight: 300,
                backgroundColor: '#fff',
                color: '#333',
                borderRadius: 16,
                boxShadow: '0 12px 40px rgba(0,0,0,0.2)',
                padding: isMobile ? 20 : 28,
                position: 'relative',
                maxHeight: '90vh',
                overflow: 'auto'
              }}
            >
              <button
                onClick={() => setSelectedBook(null)}
                style={{
                  position: 'absolute',
                  top: 14,
                  right: 14,
                  width: 32,
                  height: 32,
                  border: 'none',
                  backgroundColor: '#F5F5F5',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 18,
                  color: '#666',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={e => {
                  (e.target as HTMLButtonElement).style.backgroundColor =
                    '#E0E0E0';
                }}
                onMouseLeave={e => {
                  (e.target as HTMLButtonElement).style.backgroundColor =
                    '#F5F5F5';
                }}
              >
                ✕
              </button>

              <div style={{ display: 'flex', gap: isMobile ? 16 : 20 }}>
                <div
                  style={{
                    width: isMobile ? 90 : 110,
                    height: isMobile ? 130 : 160,
                    borderRadius: 10,
                    background: `linear-gradient(135deg, ${selectedBook.coverColor}, ${selectedBook.coverColor2})`,
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                  }}
                >
                  <span
                    style={{
                      fontSize: isMobile ? 36 : 44,
                      fontWeight: 'bold',
                      color: 'rgba(255,255,255,0.95)',
                      textShadow: '0 2px 8px rgba(0,0,0,0.3)'
                    }}
                  >
                    {selectedBook.title.charAt(0)}
                  </span>
                </div>

                <div
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    paddingRight: isMobile ? 0 : 30
                  }}
                >
                  <h3
                    style={{
                      fontSize: isMobile ? 18 : 20,
                      fontWeight: 700,
                      color: '#333',
                      marginBottom: 6,
                      lineHeight: 1.3
                    }}
                  >
                    {selectedBook.title}
                  </h3>
                  <div
                    style={{
                      fontSize: 13,
                      color: '#888',
                      marginBottom: 12
                    }}
                  >
                    作者：{selectedBook.author}
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      color: '#555',
                      lineHeight: 1.6,
                      marginBottom: isMobile ? 14 : 18
                    }}
                  >
                    {selectedBook.description}
                  </div>
                  <div
                    style={{
                      display: 'inline-flex',
                      alignSelf: 'flex-start',
                      padding: '3px 10px',
                      borderRadius: 8,
                      fontSize: 12,
                      fontWeight: 500,
                      marginBottom: isMobile ? 14 : 16,
                      backgroundColor: statusColors[selectedBook.status],
                      color:
                        selectedBook.status === 'read'
                          ? '#2E7D32'
                          : selectedBook.status === 'reading'
                          ? '#1565C0'
                          : '#616161'
                    }}
                  >
                    {statusLabels[selectedBook.status]}
                  </div>
                </div>
              </div>

              <div
                style={{
                  borderTop: '1px solid #F0F0F0',
                  paddingTop: isMobile ? 14 : 18,
                  marginTop: 4
                }}
              >
                <div
                  style={{
                    fontSize: 13,
                    color: '#666',
                    marginBottom: 10,
                    fontWeight: 500
                  }}
                >
                  切换阅读状态
                </div>
                <div
                  style={{
                    display: 'flex',
                    gap: 10,
                    flexWrap: 'wrap'
                  }}
                >
                  {(
                    [
                      { key: 'unread', bg: '#F5F5F5', activeBg: '#E0E0E0', color: '#616161' },
                      { key: 'reading', bg: '#E3F2FD', activeBg: '#BBDEFB', color: '#1565C0' },
                      { key: 'read', bg: '#E8F5E9', activeBg: '#C8E6C9', color: '#2E7D32' }
                    ] as const
                  ).map(s => {
                    const isActive = selectedBook.status === s.key;
                    return (
                      <motion.button
                        key={s.key}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.96 }}
                        onClick={() => handleStatusChange(s.key)}
                        style={{
                          flex: isMobile ? 1 : 'none',
                          padding: '10px 18px',
                          borderRadius: 10,
                          border: isActive ? `2px solid ${s.color}` : '2px solid transparent',
                          backgroundColor: isActive ? s.activeBg : s.bg,
                          color: s.color,
                          fontSize: 13,
                          fontWeight: 600,
                          cursor: 'pointer',
                          transition: 'all 0.25s ease',
                          minWidth: isMobile ? 0 : 100
                        }}
                      >
                        {statusLabels[s.key]}
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Bookshelf;
