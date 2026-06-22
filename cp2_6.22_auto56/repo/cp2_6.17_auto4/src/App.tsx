import { useEffect } from 'react';
import Reader from '@/reader/Reader';
import { useBookStore } from '@/store/bookStore';

export default function App() {
  const loadBook = useBookStore((s) => s.loadBook);
  const book = useBookStore((s) => s.book);

  useEffect(() => {
    loadBook();
  }, [loadBook]);

  if (!book) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          background: '#2C2C2C',
          color: '#999',
          fontFamily: "'Noto Sans SC', sans-serif",
          fontSize: 16,
        }}
      >
        初始化中...
      </div>
    );
  }

  return <Reader />;
}
