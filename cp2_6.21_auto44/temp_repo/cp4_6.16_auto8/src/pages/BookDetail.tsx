import { useState, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ChevronLeft, Minus, Plus, ShoppingCart, UserRound,
  CalendarDays, Tag, PackageOpen, BookOpenCheck, Home, BookX
} from 'lucide-react';
import { useBooksStore } from '@/store/booksStore';
import { BookCard } from '@/components/BookCard';
import { useRipple } from '@/hooks/useRipple';
import styles from '@/styles/BookDetail.module.css';

export function BookDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const createRipple = useRipple();

  const getBookById = useBooksStore((s) => s.getBookById);
  const getRecommendedBooks = useBooksStore((s) => s.getRecommendedBooks);
  const addToCart = useBooksStore((s) => s.addToCart);

  const book = id ? getBookById(id) : undefined;
  const recommendedBooks = useMemo(
    () => (id ? getRecommendedBooks(id) : []),
    [id, getRecommendedBooks]
  );

  const [quantity, setQuantity] = useState(1);
  const [qtyAnim, setQtyAnim] = useState(false);

  const isLowStock = book ? book.stock <= 10 : false;

  const triggerQtyAnim = () => {
    setQtyAnim(true);
    setTimeout(() => setQtyAnim(false), 260);
  };

  const handleDecrease = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
      triggerQtyAnim();
    }
  };

  const handleIncrease = () => {
    if (book && quantity < book.stock) {
      setQuantity(quantity + 1);
      triggerQtyAnim();
    }
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    if (!book || book.stock === 0) return;
    createRipple(e);
    addToCart(book.id, quantity);
  };

  if (!book) {
    return (
      <div className={styles.container}>
        <div className={styles.notFound}>
          <BookX size={64} strokeWidth={1} color="var(--color-wood-light)" />
          <h2>未找到这本书</h2>
          <p>可能已被售出或不存在，看看其他好书吧～</p>
          <button className={styles.homeBtn} onClick={() => navigate('/')}>
            <Home size={18} />
            返回首页
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Link to="/" className={styles.backLink}>
        <ChevronLeft size={18} strokeWidth={2} />
        返回图书列表
      </Link>

      <div className={styles.wrap}>
        <div className={styles.coverSection}>
          <div className={styles.coverFrame}>
            <img className={styles.cover} src={book.cover} alt={book.title} />
          </div>
        </div>

        <div className={styles.info}>
          <span className={styles.categoryBadge}>
            <Tag size={12} /> {book.category}
          </span>

          <h1 className={styles.title}>{book.title}</h1>

          <div className={styles.author}>
            <UserRound size={16} strokeWidth={1.8} />
            <span>作者：</span>
            <span className={styles.authorName}>{book.author}</span>
          </div>

          <div className={styles.metaRow}>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>
                <CalendarDays size={11} /> 上架时间
              </span>
              <span className={styles.metaValue}>{book.publishDate}</span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>
                <PackageOpen size={11} /> 库存状态
              </span>
              <span className={`${styles.stockStatus} ${isLowStock ? styles.low : ''}`}>
                <BookOpenCheck size={14} />
                {book.stock === 0 ? '缺货' : isLowStock ? `仅剩 ${book.stock} 本` : `库存充足 (${book.stock})`}
              </span>
            </div>
          </div>

          <div className={styles.priceBox}>
            <span className={styles.priceLabel}>售价</span>
            <span className={styles.price}>{book.price.toFixed(2)}</span>
          </div>

          <div>
            <div className={styles.descLabel}>内容简介</div>
            <p className={styles.desc}>{book.description}</p>
          </div>

          <div className={styles.purchaseSection}>
            <div className={styles.quantityControl}>
              <button
                className={styles.qtyBtn}
                onClick={handleDecrease}
                disabled={quantity <= 1}
                aria-label="减少"
              >
                <Minus size={18} strokeWidth={2.2} />
              </button>
              <span className={`${styles.qtyValue} ${qtyAnim ? 'quantity-bounce' : ''}`}>
                {quantity}
              </span>
              <button
                className={styles.qtyBtn}
                onClick={handleIncrease}
                disabled={book.stock === 0 || quantity >= book.stock}
                aria-label="增加"
              >
                <Plus size={18} strokeWidth={2.2} />
              </button>
            </div>
            <button
              className={`${styles.addToCartBtn} ripple-container`}
              onClick={handleAddToCart}
              disabled={book.stock === 0}
            >
              <ShoppingCart size={18} strokeWidth={1.8} />
              {book.stock === 0 ? '暂时缺货' : '加入购物车'}
            </button>
          </div>
        </div>
      </div>

      {recommendedBooks.length > 0 && (
        <section className={styles.recommendedSection}>
          <h2 className={styles.sectionTitle}>
            <BookOpenCheck size={22} />
            同类好书推荐
          </h2>
          <div className={styles.recommendedGrid}>
            {recommendedBooks.map((b) => (
              <BookCard key={b.id} book={b} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
