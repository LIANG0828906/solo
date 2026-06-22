import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Book } from '../types';

interface CarouselProps {
  books: Book[];
}

export default function Carousel({ books }: CarouselProps) {
  const navigate = useNavigate();
  const [idx, setIdx] = useState(0);
  const [animKey, setAnimKey] = useState(0);

  const next = useCallback(() => {
    setIdx((i) => (i + 1) % books.length);
    setAnimKey((k) => k + 1);
  }, [books.length]);

  const prev = useCallback(() => {
    setIdx((i) => (i - 1 + books.length) % books.length);
    setAnimKey((k) => k + 1);
  }, [books.length]);

  useEffect(() => {
    if (books.length < 2) return;
    const t = setInterval(next, 5000);
    return () => clearInterval(t);
  }, [next, books.length]);

  if (!books.length) return null;
  const book = books[idx];

  return (
    <div className="relative w-full rounded-3xl overflow-hidden bg-gradient-to-br from-cream-200 via-cream-100 to-tan-300/40 shadow-lg">
      <style>{`
        @keyframes carouselSlide {
          0% { transform: translateX(8%) scale(0.96); opacity: 0; }
          100% { transform: translateX(0) scale(1); opacity: 1; }
        }
      `}</style>
      <div
        key={animKey}
        className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 md:p-10 items-center min-h-[320px] md:min-h-[380px]"
        style={{ animation: 'carouselSlide 520ms cubic-bezier(0.22,1,0.36,1) forwards' }}
      >
        <div className="order-2 md:order-1 flex flex-col justify-center">
          <span className="inline-block self-start px-3 py-1 rounded-full bg-accent-500 text-white text-xs font-bold mb-3 shadow-md">
            ✨ 编辑精选
          </span>
          <h2 className="text-2xl md:text-4xl font-extrabold text-brown-900 leading-tight">
            {book.title}
          </h2>
          <p className="mt-2 text-brown-700 font-semibold">{book.author} 著</p>
          <p className="mt-3 text-brown-600 text-sm md:text-base line-clamp-3">
            {book.description}
          </p>
          <div className="mt-5 flex items-center gap-4">
            <span className="text-3xl font-extrabold text-accent-600">¥{book.price.toFixed(0)}</span>
            <button
              onClick={() => navigate(`/book/${book.id}`)}
              className="px-6 py-2.5 bg-brown-800 hover:bg-brown-900 text-white font-bold rounded-full shadow-lg transition-all active:scale-95"
            >
              立即阅读 →
            </button>
          </div>
        </div>
        <div className="order-1 md:order-2 flex justify-center">
          <div className="relative">
            <div className="absolute -inset-4 rounded-full bg-accent-400/20 blur-2xl" />
            <img
              src={book.cover}
              alt={book.title}
              className="relative w-44 md:w-56 h-60 md:h-72 object-cover rounded-2xl shadow-2xl ring-4 ring-white/50"
            />
          </div>
        </div>
      </div>

      <button
        onClick={prev}
        className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 backdrop-blur hover:bg-white text-brown-800 flex items-center justify-center shadow-md transition-all hover:scale-110 active:scale-95"
        aria-label="上一本"
      >
        <ChevronLeft size={22} />
      </button>
      <button
        onClick={next}
        className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 backdrop-blur hover:bg-white text-brown-800 flex items-center justify-center shadow-md transition-all hover:scale-110 active:scale-95"
        aria-label="下一本"
      >
        <ChevronRight size={22} />
      </button>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2">
        {books.map((_, i) => (
          <button
            key={i}
            onClick={() => { setIdx(i); setAnimKey((k) => k + 1); }}
            className={`rounded-full transition-all duration-300
              ${i === idx
                ? 'w-8 h-2.5 bg-accent-500 scale-110'
                : 'w-2.5 h-2.5 bg-brown-800/30 hover:bg-accent-500 hover:scale-150'}`}
            aria-label={`跳转到第 ${i + 1} 本`}
          />
        ))}
      </div>
    </div>
  );
}
