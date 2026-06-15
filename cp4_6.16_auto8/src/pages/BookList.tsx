import { useState, useMemo } from 'react';
import { LayoutGrid, Filter, ArrowUpDown, Library } from 'lucide-react';
import { useBooksStore } from '@/store/booksStore';
import { CATEGORIES, type Category, type SortBy } from '@/types';
import { BookCard } from '@/components/BookCard';
import styles from '@/styles/BookList.module.css';

export function BookList() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
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

  const handleFilterChange = (cat: Category) => {
    setFilter(cat);
    setMobileSidebarOpen(false);
  };

  return (
    <div className={styles.layout}>
      <button
        className={styles.mobileFilterBtn}
        onClick={() => setMobileSidebarOpen(true)}
        aria-label="筛选"
      >
        <Filter size={20} />
      </button>

      <div
        className={`${styles.mobileSidebarOverlay} ${mobileSidebarOpen ? styles.show : ''}`}
        onClick={() => setMobileSidebarOpen(false)}
      />

      <aside className={`${styles.sidebar} ${mobileSidebarOpen ? styles.open : ''}`}>
        <h2 className={styles.sidebarTitle}>
          <Filter size={18} />
          图书筛选
        </h2>

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
