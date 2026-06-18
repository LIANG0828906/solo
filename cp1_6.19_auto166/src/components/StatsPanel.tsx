import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Book, Reader } from '../types';

interface StatsPanelProps {
  books: Book[];
  readers: Reader[];
}

interface ReaderStats {
  id: string;
  name: string;
  count: number;
}

export default function StatsPanel({ books, readers }: StatsPanelProps) {
  const stats = useMemo(() => {
    const totalBooks = books.length;
    const driftingBooks = books.filter(b => b.isDrifting).length;

    const readerBorrowCounts: Record<string, number> = {};
    books.forEach(book => {
      book.driftLogs.forEach(log => {
        readerBorrowCounts[log.readerId] = (readerBorrowCounts[log.readerId] || 0) + 1;
      });
    });

    const readerStats: ReaderStats[] = Object.entries(readerBorrowCounts)
      .map(([id, count]) => {
        const reader = readers.find(r => r.id === id);
        return {
          id,
          name: reader?.name || '未知读者',
          count,
        };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);

    let totalDistance = 0;
    books.forEach(book => {
      const sortedLogs = [...book.driftLogs].sort(
        (a, b) => new Date(a.borrowDate).getTime() - new Date(b.borrowDate).getTime()
      );
      for (let i = 1; i < sortedLogs.length; i++) {
        const prev = sortedLogs[i - 1].location;
        const curr = sortedLogs[i].location;
        const dx = curr.x - prev.x;
        const dy = curr.y - prev.y;
        const distance = Math.sqrt(dx * dx + dy * dy) * 2;
        totalDistance += distance;
      }
    });

    return {
      totalBooks,
      driftingBooks,
      topReaders: readerStats,
      totalDistance: Math.round(totalDistance),
    };
  }, [books, readers]);

  const NumberDisplay = ({ value, suffix = '' }: { value: number; suffix?: string }) => (
    <AnimatePresence mode="wait">
      <motion.span
        key={value}
        initial={{ scale: 1.3, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.7, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 400, damping: 15, duration: 0.3 }}
        style={{ display: 'inline-block', fontWeight: 700 }}
      >
        {value}{suffix}
      </motion.span>
    </AnimatePresence>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      style={{
        width: '280px',
        minHeight: '150px',
        backgroundColor: 'rgba(78, 52, 46, 0.85)',
        borderRadius: '12px',
        padding: '14px',
        color: 'white',
        boxShadow: '0px 4px 12px rgba(62,39,35,0.15)',
      }}
    >
      <h3
        style={{
          fontSize: '14px',
          fontWeight: 600,
          marginBottom: '12px',
          paddingBottom: '8px',
          borderBottom: '1px solid rgba(255,255,255,0.2)',
        }}
      >
        📊 漂流统计
      </h3>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
        <div>
          <p style={{ fontSize: '11px', opacity: 0.8, marginBottom: '2px' }}>总漂流图书</p>
          <p style={{ fontSize: '20px' }}>
            <NumberDisplay value={stats.totalBooks} />
            <span style={{ fontSize: '12px', fontWeight: 400, opacity: 0.7 }}> 本</span>
          </p>
        </div>
        <div>
          <p style={{ fontSize: '11px', opacity: 0.8, marginBottom: '2px' }}>在途图书</p>
          <p style={{ fontSize: '20px' }}>
            <NumberDisplay value={stats.driftingBooks} />
            <span style={{ fontSize: '12px', fontWeight: 400, opacity: 0.7 }}> 本</span>
          </p>
        </div>
      </div>

      <div style={{ marginBottom: '10px' }}>
        <p style={{ fontSize: '11px', opacity: 0.8, marginBottom: '4px' }}>🏆 最活跃读者</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
          {stats.topReaders.length === 0 ? (
            <p style={{ fontSize: '11px', opacity: 0.5 }}>暂无数据</p>
          ) : (
            stats.topReaders.map((reader, index) => (
              <motion.div
                key={reader.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.4 + index * 0.1 }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '11px',
                }}
              >
                <span
                  style={{
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    backgroundColor: index === 0 ? '#D4AF37' : index === 1 ? '#A9A9A9' : '#CD7F32',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '9px',
                    fontWeight: 700,
                    color: '#3E2723',
                  }}
                >
                  {index + 1}
                </span>
                <span
                  style={{
                    color: index === 0 ? '#D4AF37' : 'white',
                    fontWeight: index === 0 ? 600 : 400,
                  }}
                >
                  {reader.name}
                </span>
                <span style={{ marginLeft: 'auto', opacity: 0.7 }}>
                  {reader.count}次
                </span>
              </motion.div>
            ))
          )}
        </div>
      </div>

      <div
        style={{
          paddingTop: '8px',
          borderTop: '1px solid rgba(255,255,255,0.2)',
        }}
      >
        <p style={{ fontSize: '11px', opacity: 0.8, marginBottom: '2px' }}>
          📍 累计漂流里程
        </p>
        <p style={{ fontSize: '18px' }}>
          <NumberDisplay value={stats.totalDistance} />
          <span style={{ fontSize: '12px', fontWeight: 400, opacity: 0.7 }}> km</span>
        </p>
      </div>
    </motion.div>
  );
}
