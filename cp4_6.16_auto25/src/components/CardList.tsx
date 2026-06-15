import { useEffect, useState } from 'react';
import { Loader2, BookOpen } from 'lucide-react';
import { useBookStore } from '@/stores/bookStore';
import BookCard from './BookCard';
import { cn } from '@/lib/utils';

interface CardListProps {
  className?: string;
}

export default function CardList({ className }: CardListProps) {
  const { loading, initialized, getFilteredBooks, fetchBooks } = useBookStore();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!initialized) {
      fetchBooks();
    }
  }, [initialized, fetchBooks]);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const books = getFilteredBooks();

  if (loading && !initialized) {
    return (
      <div className={cn('flex flex-col items-center justify-center py-20', className)}>
        <Loader2 size={40} className="text-oak-400 animate-spin mb-4" />
        <p className="text-oak-500 text-sm">加载中...</p>
      </div>
    );
  }

  if (books.length === 0) {
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
    <div
      className={cn(
        'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5',
        isVisible ? 'opacity-100' : 'opacity-0',
        'transition-opacity duration-300',
        className
      )}
    >
      {books.map((book, index) => (
        <BookCard key={book.id} book={book} index={index} />
      ))}
    </div>
  );
}
