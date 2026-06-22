import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Book, Reader } from '../types';

interface BookCardProps {
  book: Book;
  readers: Reader[];
  onBorrow: (bookId: string) => void;
  onReturn: (bookId: string, note: string) => void;
}

export default function BookCard({ book, readers, onBorrow, onReturn }: BookCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [returnNote, setReturnNote] = useState('');
  const [showReturnInput, setShowReturnInput] = useState(false);

  const currentHolder = readers.find(r => r.id === book.currentHolderId);

  const handleBorrowClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onBorrow(book.id);
  };

  const handleReturnClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (book.isDrifting) {
      setShowReturnInput(true);
    }
  };

  const handleSubmitReturn = (e: React.MouseEvent) => {
    e.stopPropagation();
    const note = returnNote.trim() || '无阅读心得';
    onReturn(book.id, note);
    setReturnNote('');
    setShowReturnInput(false);
  };

  const handleCardClick = () => {
    if (!showReturnInput) {
      setIsFlipped(!isFlipped);
    }
  };

  const sortedLogs = [...book.driftLogs].sort(
    (a, b) => new Date(a.borrowDate).getTime() - new Date(b.borrowDate).getTime()
  );

  return (
    <div
      style={{
        perspective: '1000px',
        width: '180px',
        height: '240px',
        margin: '0 auto',
      }}
    >
      <motion.div
        onClick={handleCardClick}
        style={{
          width: '100%',
          height: '100%',
          position: 'relative',
          cursor: 'pointer',
          transformStyle: 'preserve-3d',
        }}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6, ease: 'easeInOut' }}
        whileHover={{
          y: -5,
          boxShadow: '0px 8px 20px rgba(62,39,35,0.25)',
        }}
      >
        <motion.div
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            backfaceVisibility: 'hidden',
            borderRadius: '10px',
            backgroundColor: '#F5F0EB',
            border: '2px solid #D7C4B0',
            boxShadow: '0px 4px 12px rgba(62,39,35,0.15)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
          whileHover={{
            borderColor: '#8B7355',
          }}
          transition={{
            borderColor: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
            y: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
          }}
        >
          <div
            style={{
              backgroundColor: book.coverColor,
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
            }}
          >
            <span style={{ color: 'white', fontSize: '36px', opacity: 0.9 }}>📖</span>
            {book.isDrifting && (
              <span
                style={{
                  position: 'absolute',
                  top: '8px',
                  right: '8px',
                  backgroundColor: '#4CAF50',
                  color: 'white',
                  fontSize: '10px',
                  padding: '2px 6px',
                  borderRadius: '4px',
                }}
              >
                漂流中
              </span>
            )}
          </div>
          <div
            style={{
              padding: '10px 12px',
              backgroundColor: '#F5F0EB',
            }}
          >
            <h3
              style={{
                fontSize: '14px',
                fontWeight: 600,
                color: '#3E2723',
                marginBottom: '4px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {book.title}
            </h3>
            <p style={{ fontSize: '11px', color: '#8B7355' }}>
              起点：{book.startCity}
            </p>
          </div>
        </motion.div>

        <motion.div
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            backfaceVisibility: 'hidden',
            borderRadius: '10px',
            backgroundColor: '#F5F0EB',
            border: '2px solid #D7C4B0',
            boxShadow: '0px 4px 12px rgba(62,39,35,0.15)',
            padding: '12px',
            display: 'flex',
            flexDirection: 'column',
            transform: 'rotateY(180deg)',
          }}
          whileHover={{
            borderColor: '#8B7355',
          }}
          transition={{
            borderColor: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
          }}
        >
          <h4
            style={{
              fontSize: '13px',
              fontWeight: 600,
              color: '#3E2723',
              marginBottom: '8px',
              paddingBottom: '6px',
              borderBottom: '1px solid #D7C4B0',
            }}
          >
            📜 漂流传阅记录
          </h4>

          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              fontSize: '11px',
            }}
          >
            {sortedLogs.length === 0 ? (
              <p style={{ color: '#8B7355', textAlign: 'center', marginTop: '20px' }}>
                暂无漂流记录
              </p>
            ) : (
              sortedLogs.map((log, index) => {
                const reader = readers.find(r => r.id === log.readerId);
                return (
                  <div
                    key={log.id}
                    style={{
                      marginBottom: '8px',
                      padding: '6px',
                      backgroundColor: 'rgba(215, 196, 176, 0.3)',
                      borderRadius: '4px',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginBottom: '3px',
                      }}
                    >
                      <span style={{ fontWeight: 500, color: '#5D4037' }}>
                        {index + 1}. {reader?.name || '未知读者'}
                      </span>
                      <span style={{ color: '#8B7355' }}>{log.cityName}</span>
                    </div>
                    <div style={{ color: '#8B7355', fontSize: '10px' }}>
                      {log.borrowDate} ~ {log.returnDate || '阅读中'}
                    </div>
                    {log.note && (
                      <p
                        style={{
                          marginTop: '4px',
                          color: '#6D4C41',
                          fontStyle: 'italic',
                          fontSize: '10px',
                          lineHeight: 1.4,
                        }}
                      >
                        &ldquo;{log.note}&rdquo;
                      </p>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {currentHolder && (
            <div
              style={{
                fontSize: '11px',
                color: '#4CAF50',
                paddingTop: '6px',
                borderTop: '1px solid #D7C4B0',
              }}
            >
              🏃 当前持有者：{currentHolder.name}
            </div>
          )}

          <AnimatePresence>
            {!showReturnInput ? (
              <motion.div
                key="buttons"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                style={{ marginTop: '8px', display: 'flex', gap: '6px' }}
              >
                {!book.isDrifting ? (
                  <button
                    onClick={handleBorrowClick}
                    style={{
                      flex: 1,
                      backgroundColor: '#5D4037',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '6px 10px',
                      fontSize: '11px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#4E342E';
                      e.currentTarget.style.boxShadow = '0px 2px 6px rgba(62,39,35,0.3)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#5D4037';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                    onMouseDown={(e) => {
                      e.currentTarget.style.transform = 'scale(0.96)';
                    }}
                    onMouseUp={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  >
                    借阅
                  </button>
                ) : (
                  <button
                    onClick={handleReturnClick}
                    style={{
                      flex: 1,
                      backgroundColor: '#5D4037',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '6px 10px',
                      fontSize: '11px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#4E342E';
                      e.currentTarget.style.boxShadow = '0px 2px 6px rgba(62,39,35,0.3)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#5D4037';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                    onMouseDown={(e) => {
                      e.currentTarget.style.transform = 'scale(0.96)';
                    }}
                    onMouseUp={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  >
                    归还
                  </button>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="returnInput"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                style={{ marginTop: '8px' }}
              >
                <textarea
                  value={returnNote}
                  onChange={(e) => setReturnNote(e.target.value.slice(0, 140))}
                  placeholder="写下你的阅读心得（1-140字）"
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    width: '100%',
                    height: '50px',
                    padding: '6px',
                    fontSize: '10px',
                    border: '1px solid #D7C4B0',
                    borderRadius: '4px',
                    resize: 'none',
                    backgroundColor: 'white',
                    color: '#3E2723',
                    marginBottom: '6px',
                  }}
                />
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowReturnInput(false);
                      setReturnNote('');
                    }}
                    style={{
                      flex: 1,
                      backgroundColor: '#D7C4B0',
                      color: '#5D4037',
                      border: 'none',
                      borderRadius: '4px',
                      padding: '4px',
                      fontSize: '10px',
                      cursor: 'pointer',
                    }}
                  >
                    取消
                  </button>
                  <button
                    onClick={handleSubmitReturn}
                    style={{
                      flex: 1,
                      backgroundColor: '#5D4037',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      padding: '4px',
                      fontSize: '10px',
                      cursor: 'pointer',
                    }}
                  >
                    确认归还
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <p
            style={{
              fontSize: '9px',
              color: '#A1887F',
              textAlign: 'center',
              marginTop: '6px',
            }}
          >
            点击卡片返回正面
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
