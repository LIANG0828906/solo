import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, ShoppingCart } from 'lucide-react';
import { useBooksStore } from '@/store/booksStore';
import { CartDrawer } from './CartDrawer';
import styles from '@/styles/Navbar.module.css';

export function Navbar() {
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [badgePulse, setBadgePulse] = useState(false);
  const getCartTotalCount = useBooksStore((s) => s.getCartTotalCount);

  const totalCount = getCartTotalCount();
  const [prevCount, setPrevCount] = useState(totalCount);

  useEffect(() => {
    if (totalCount > prevCount) {
      setBadgePulse(true);
      const t = setTimeout(() => setBadgePulse(false), 520);
      return () => clearTimeout(t);
    }
    setPrevCount(totalCount);
  }, [totalCount, prevCount]);

  return (
    <>
      <nav className={styles.navbar}>
        <div className={styles.logo} onClick={() => navigate('/')} role="link" tabIndex={0}>
          <BookOpen size={30} strokeWidth={1.8} className={styles.logoIcon} />
          <span className={styles.logoText}>BookNook</span>
          <span className={styles.logoSubtitle}>独立书店</span>
        </div>
        <button
          className={styles.cartBtn}
          onClick={() => setDrawerOpen(true)}
          aria-label={`购物车，共${totalCount}件商品`}
        >
          <ShoppingCart size={22} strokeWidth={1.8} />
          {totalCount > 0 && (
            <span className={`${styles.cartBadge} ${badgePulse ? styles.badgePulse : ''}`}>
              {totalCount > 99 ? '99+' : totalCount}
            </span>
          )}
        </button>
      </nav>
      <CartDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  );
}
