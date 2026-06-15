import { useState, useMemo, useEffect, useRef } from 'react';
import { LayoutGrid, Filter, ArrowUpDown, Library, X, ChevronDown } from 'lucide-react';
import { useBooksStore } from '@/store/booksStore';
import { CATEGORIES, type Category, type SortBy } from '@/types';
import { BookCard } from '@/components/BookCard';
import styles from '@/styles/BookList.module.css';

const FILTER_ANIM_MS = 380;

export function BookList() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarMounted, setSidebarMounted] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const books = useBooksStore((s) => s.books);
  const filter = useBooksStore((s) => s.filter);
  const sortBy = useBooksStore((s) => s.sortBy);
  const setFilter = useBooksStore((s) => s.setFilter);
  const setSortBy = useBooksStore((s) => s.setSortBy);
  const getFilteredBooks = useBooksStore((s) => s.getFilteredBooks);

  const filteredBooks = useMemo(() => getFilteredBooks(), [books, filter, sortBy, getFilteredBooks]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { 全部: books.length };
    books.forEach((b) => {
      counts[b.category] = (counts[b.category] || 0) + 1;
    });
    return counts;
  }, [books]);

  useEffect(() => {
    if (sidebarOpen) {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
      setSidebarMounted(true);
      const t = requestAnimationFrame(() => {
        requestAnimationFrame(() => setSidebarVisible(true));
      });
      return () => cancelAnimationFrame(t);
    } else if (sidebarMounted) {
      setSidebarVisible(false);
      closeTimerRef.current = setTimeout(() => {
        setSidebarMounted(false);
        closeTimerRef.current = null;
      }, FILTER_ANIM_MS);
    }
    return () => {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
    };
  }, [sidebarOpen, sidebarMounted]);

  useEffect(() => {
    if (sidebarVisible) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [sidebarVisible]);

  const handleFilterChange = (cat: Category) => {
    setFilter(cat);
    setSidebarOpen(false);
  };

  return (
    <div className={styles.layout}>
      <button
        className={styles.mobileFilterBtn}
        onClick={() => setSidebarOpen(true)}
        aria-label="打开筛选面板"
      >
        <Filter size={18} />
        <span className={styles.mobileFilterText}>筛选</span>
        <ChevronDown size={14} className={`${styles.chevron} ${sidebarOpen ? styles.chevronUp : ''}`} />
      </button>

      {sidebarMounted && (
        <>
          <div
            className={`${styles.mobileSidebarOverlay} ${sidebarVisible ? styles.show : ''}`}
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        </>
      )}

      <aside
        className={`${styles.sidebar} ${sidebarVisible ? styles.open : ''} ${!sidebarMounted ? styles.hidden : ''}`}
      >
        <div className={styles.sidebarHeader}>
          <h2 className={styles.sidebarTitle}>
            <Filter size={18} />
            图书筛选
          </h2>
          <button
            className={styles.sidebarCloseBtn}
            onClick={() => setSidebarOpen(false)}
            aria-label="关闭筛选"
          >
            <X size={18} />
          </button>
        </div>

        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>
            <Library size={14} />
            图书分类
          </label>
          <div className={styles.categoryBtns}>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                className={`${styles.categoryBtn} ${filter === cat ? styles.active : ''}`}
                onClick={() => handleFilterChange(cat)}
              >
                <span>{cat}</span>
                <span className={styles.categoryCount}>{categoryCounts[cat] || 0}</span>
              </button>
            ))}
          </div>
        </div>

        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>
            <ArrowUpDown size={14} />
            排序方式
          </label>
          <select
            className={styles.sortSelect}
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortBy)}
          >
            <option value="default">默认排序</option>
            <option value="price-asc">价格从低到高</option>
            <option value="price-desc">价格从高到低</option>
            <option value="date-desc">最新上架</option>
          </select>
        </div>
      </aside>

      <main className={styles.main}>
        <header className={styles.header}>
          <h1 className={styles.title}>
            {filter === '全部' ? '全部藏书' : `${filter}类图书`}
            <LayoutGrid size={22} style={{ display: 'inline', marginLeft: 10, verticalAlign: -3 }} />
          </h1>
          <span className={styles.bookCount}>共 {filteredBooks.length} 本图书</span>
        </header>

        {filteredBooks.length === 0 ? (
          <div className={styles.empty}>
            <p>暂无该分类下的图书～</p>
          </div>
        ) : (
          <div className={styles.grid}>
            {filteredBooks.map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
