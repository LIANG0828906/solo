import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, Plus, Check } from 'lucide-react';
import { useStore } from '@/store/index';
import type { Book } from '@/types';
import { cn } from '@/lib/utils';

function RatingStars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          size={14}
          className={i < Math.round(rating) ? 'fill-orange text-orange' : 'text-cream-dark'}
        />
      ))}
    </div>
  );
}

function BookCard({ book }: { book: Book }) {
  const navigate = useNavigate();
  const [inShelf, setInShelf] = useState(false);

  useEffect(() => {
    const shelf = JSON.parse(localStorage.getItem('bookShelf') || '[]');
    setInShelf(shelf.some((b: Book) => b.id === book.id));
  }, [book.id]);

  const handleAddToShelf = (e: React.MouseEvent) => {
    e.stopPropagation();
    const shelf = JSON.parse(localStorage.getItem('bookShelf') || '[]');
    if (inShelf) {
      const newShelf = shelf.filter((b: Book) => b.id !== book.id);
      localStorage.setItem('bookShelf', JSON.stringify(newShelf));
      setInShelf(false);
    } else {
      shelf.push(book);
      localStorage.setItem('bookShelf', JSON.stringify(shelf));
      setInShelf(true);
    }
    window.dispatchEvent(new Event('shelfUpdate'));
  };

  return (
    <div
      onClick={() => navigate(`/book/${book.id}`)}
      className="min-w-[200px] max-w-[200px] md:min-w-[220px] md:max-w-[220px] flex-shrink-0 cursor-pointer rounded-xl bg-white shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
    >
      <img
        src={book.cover}
        alt={book.title}
        className="h-48 w-full rounded-t-xl object-cover"
      />
      <div className="p-3">
        <h3 className="truncate text-sm font-semibold text-text">{book.title}</h3>
        <p className="mt-0.5 truncate text-xs text-text-light">{book.author}</p>
        <div className="mt-1.5 flex items-center">
          <RatingStars rating={book.rating} />
          <span className="text-xs text-orange font-medium ml-1">豆瓣 {book.rating}</span>
        </div>
        <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-text-muted">
          {book.recommendation}
        </p>
        <button
          onClick={handleAddToShelf}
          className={cn(
            'mt-3 w-full flex items-center justify-center gap-1 text-xs rounded-lg px-3 py-1.5 font-medium transition-all duration-200',
            inShelf
              ? 'bg-green-heatmap-3 text-white'
              : 'bg-orange/10 text-orange-dark hover:bg-orange hover:text-white active:scale-95'
          )}
        >
          {inShelf ? (
            <>
              <Check size={14} />
              <span>已在书架</span>
            </>
          ) : (
            <>
              <Plus size={14} />
              <span>加入书架</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default function BookRecommendation() {
  const { books: recommendations, fetchRecommendations } = useStore();

  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  const displayBooks = recommendations.slice(0, 5);

  return (
    <section>
      <h2 className="mb-4 font-serif text-xl font-semibold text-text">📖 今日推荐</h2>
      <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
        {displayBooks.map((book) => (
          <BookCard key={book.id} book={book} />
        ))}
      </div>
    </section>
  );
}
