import { useNavigate } from 'react-router-dom';
import { UserRound } from 'lucide-react';
import type { Book } from '@/types';
import styles from '@/styles/BookCard.module.css';

interface Props {
  book: Book;
}

export function BookCard({ book }: Props) {
  const navigate = useNavigate();
  const isLowStock = book.stock <= 10;

  const handleClick = () => {
    navigate(`/book/${book.id}`);
  };

  return (
    <article className={styles.card} onClick={handleClick}>
      <div className={styles.coverWrap}>
        <img className={styles.cover} src={book.cover} alt={book.title} loading="lazy" />
        <div className={styles.coverOverlay} />
        <span className={styles.categoryTag}>{book.category}</span>
        <span className={`${styles.stockBadge} ${isLowStock ? styles.low : ''}`}>
          {isLowStock ? `仅剩 ${book.stock} 本` : '有货'}
        </span>
      </div>
      <div className={styles.body}>
        <h3 className={styles.title}>{book.title}</h3>
        <p className={styles.author}>
          <UserRound size={14} strokeWidth={1.8} />
          <span>{book.author}</span>
        </p>
        <div className={styles.footer}>
          <span className={styles.price}>{book.price.toFixed(2)}</span>
          <button className={styles.viewBtn} onClick={(e) => { e.stopPropagation(); handleClick(); }}>
            查看详情
          </button>
        </div>
      </div>
    </article>
  );
}
