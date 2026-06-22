import { motion } from 'framer-motion';
import { Book, useBookStore } from './useBookStore';

interface BookCardProps {
  book: Book;
}

export const BookCard = ({ book }: BookCardProps) => {
  const { selectedBook, selectBook, fetchSuggestion } = useBookStore();
  const isSelected = selectedBook?.id === book.id;
  const isLowStock = book.stock < 5;

  const handleClick = () => {
    if (isSelected) {
      selectBook(null);
    } else {
      selectBook(book);
      fetchSuggestion(book.id);
    }
  };

  return (
    <motion.div
      layout
      onClick={handleClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      animate={isLowStock ? {
        x: [0, -3, 3, -3, 3, 0],
        transition: {
          duration: 0.5,
          repeat: Infinity,
          repeatDelay: 3,
        },
      } : {}}
      style={{
        width: '280px',
        height: '160px',
        borderRadius: '8px',
        backgroundColor: '#f5f5f5',
        padding: '16px',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        boxSizing: 'border-box',
        border: isLowStock ? '2px solid #E53935' : isSelected ? '2px solid #1a237e' : '2px solid transparent',
        boxShadow: isSelected ? '0 4px 12px rgba(26, 35, 126, 0.3)' : '0 2px 8px rgba(0, 0, 0, 0.1)',
        transition: 'all 0.15s ease-out',
      }}
    >
      <div>
        <h3
          style={{
            margin: 0,
            fontSize: '16px',
            fontWeight: 600,
            color: '#1a237e',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {book.title}
        </h3>
        <p
          style={{
            margin: '4px 0 0 0',
            fontSize: '13px',
            color: '#666',
          }}
        >
          {book.author}
        </p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <span
            style={{
              display: 'inline-block',
              padding: '4px 10px',
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: 500,
              backgroundColor: isLowStock ? '#E53935' : book.stock < 15 ? '#FFA726' : '#66BB6A',
              color: '#fff',
            }}
          >
            {isLowStock ? '库存紧急' : book.stock < 15 ? '库存偏低' : '库存正常'}
          </span>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div
            style={{
              fontSize: '24px',
              fontWeight: 700,
              color: isLowStock ? '#E53935' : '#333',
            }}
          >
            {book.stock}
          </div>
          <div style={{ fontSize: '11px', color: '#999' }}>当前库存</div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#888' }}>
        <span>近7日销量: {book.weeklySales}</span>
        <span>单价: ¥{book.price.toFixed(2)}</span>
      </div>
    </motion.div>
  );
};
