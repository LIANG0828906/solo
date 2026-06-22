import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Star } from 'lucide-react';
import { useStore } from '@/store/index';
import BookReview from '@/components/BookReview';

function Skeleton() {
  return (
    <div className="container mx-auto px-4 pt-20 pb-8 animate-pulse">
      <div className="mb-6 h-8 w-20 rounded bg-cream-dark" />
      <div className="flex flex-col gap-8 md:flex-row">
        <div className="h-80 w-full rounded-xl bg-cream-dark md:w-64" />
        <div className="flex-1 space-y-4">
          <div className="h-8 w-3/4 rounded bg-cream-dark" />
          <div className="h-5 w-1/3 rounded bg-cream-dark" />
          <div className="h-5 w-1/4 rounded bg-cream-dark" />
          <div className="h-20 w-full rounded bg-cream-dark" />
        </div>
      </div>
    </div>
  );
}

export default function BookDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentBook, booksLoading, fetchBookById } = useStore();

  useEffect(() => {
    if (id) fetchBookById(id);
  }, [id, fetchBookById]);

  if (booksLoading) return <Skeleton />;

  if (!currentBook) {
    return (
      <div className="container mx-auto px-4 pt-20 pb-8 text-center">
        <p className="text-text-muted">未找到该书籍</p>
        <button onClick={() => navigate(-1)} className="btn-primary mt-4">
          返回
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 pt-20 pb-8">
      <button
        onClick={() => navigate(-1)}
        className="mb-6 flex items-center gap-1 text-sm text-text-light transition-colors hover:text-orange"
      >
        <ArrowLeft size={16} />
        返回
      </button>

      <div className="flex flex-col gap-8 md:flex-row">
        <img
          src={currentBook.cover}
          alt={currentBook.title}
          className="h-80 w-full rounded-xl object-cover shadow-md md:w-64"
        />
        <div className="flex-1">
          <h1 className="font-serif text-2xl font-bold text-text">{currentBook.title}</h1>
          <p className="mt-2 text-text-light">{currentBook.author}</p>
          <div className="mt-2 flex items-center gap-1">
            {Array.from({ length: 5 }, (_, i) => (
              <Star
                key={i}
                size={18}
                className={
                  i < Math.round(currentBook.rating)
                    ? 'fill-orange text-orange'
                    : 'text-cream-dark'
                }
              />
            ))}
            <span className="ml-2 font-medium text-orange">{currentBook.rating}</span>
          </div>
          <p className="mt-4 leading-relaxed text-text-light">{currentBook.description}</p>
          {currentBook.chapters.length > 0 && (
            <div className="mt-6">
              <h3 className="mb-2 font-serif font-semibold text-text">章节目录</h3>
              <ul className="space-y-1">
                {currentBook.chapters.map((ch, i) => (
                  <li key={i} className="text-sm text-text-muted">
                    {ch}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      <div className="mt-10">
        <BookReview bookId={currentBook.id} />
      </div>
    </div>
  );
}
