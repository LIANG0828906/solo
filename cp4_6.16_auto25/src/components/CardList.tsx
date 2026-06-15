import { useEffect, useState, useMemo, useRef, memo } from 'react';
import { Loader2, BookOpen } from 'lucide-react';
import { useBookStore } from '@/stores/bookStore';
import BookCard from './BookCard';
import { cn } from '@/lib/utils';

interface CardListProps {
  className?: string;
}

const INITIAL_VISIBLE_COUNT = 30;
const LOAD_MORE_COUNT = 20;

export function CardList({ className }: CardListProps) {
  const { loading, initialized, getFilteredBooks, fetchBooks, filterStatus, searchKeyword, books } = useBookStore();
  const [isVisible, setIsVisible] = useState(false);
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_COUNT);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!initialized) {
      fetchBooks();
    }
  }, [initialized, fetchBooks]);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const filteredBooks = useMemo(() => getFilteredBooks(), [books, filterStatus, searchKeyword, getFilteredBooks]);

  useEffect(() => {
    setVisibleCount(INITIAL_VISIBLE_COUNT);
  }, [filterStatus, searchKeyword]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && visibleCount < filteredBooks.length) {
          setVisibleCount((prev) => Math.min(prev + LOAD_MORE_COUNT, filteredBooks.length));
        }
      },
      { rootMargin: '200px' }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [visibleCount, filteredBooks.length]);

  const visibleBooks = useMemo(() => filteredBooks.slice(0, visibleCount), [filteredBooks, visibleCount]);
  const isLoadingMore = visibleCount < filteredBooks.length;

  if (loading && !initialized) {
    return (
      <div className={cn('flex flex-col items-center justify-center py-20', className)}>
        <Loader2 size={40} className="text-oak-400 animate-spin mb-4" />
        <p className="text-oak-500 text-sm">加载中...</p>
      </div>
    );
  }

  if (filteredBooks.length === 0) {
    return (
      <div className={cn('flex flex-col items-center justify-center py-20', className)}>
        <div className="w-20 h-20 rounded-full bg-oak-100 flex items-center justify-center mb-4">
          <BookOpen size={40} className="text-oak-400" />
        </div>
        <p className="text-oak-600 font-medium mb-1">暂无书籍</p>
        <p className="text-oak-400 text-sm">添加第一本书开始你的漂流之旅吧</p>
      </div>
    );
  }

  return (
    <div>
      <div
        className={cn(
          'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5',
          isVisible ? 'opacity-100' : 'opacity-0',
          'transition-opacity duration-300',
          className
        )}
      >
        {visibleBooks.map((book, index) => (
          <BookCard key={book.id} book={book} index={index} />
        ))}
      </div>
      {isLoadingMore && (
        <div ref={sentinelRef} className="flex justify-center py-8">
          <Loader2 size={24} className="text-oak-400 animate-spin" />
        </div>
      )}
    </div>
  );
}

export const MemoCardList = memo(CardList);

export default MemoCardList;
