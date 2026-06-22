import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ShoppingCart, AlertTriangle, BookOpen, Tag } from 'lucide-react';
import type { Book } from '../types';
import { useStore } from '../store/useStore';
import BookCard from '../components/BookCard';

export default function BookDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [book, setBook] = useState<Book | null>(null);
  const [related, setRelated] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const addToCart = useStore((s) => s.addToCart);
  const recordView = useStore((s) => s.recordView);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState(false);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      setLoading(true);
      const res = await fetch(`/api/books/${id}`);
      if (res.ok) {
        const data: Book = await res.json();
        setBook(data);
        recordView(data.category);

        const r = await fetch(`/api/books/category/${encodeURIComponent(data.category)}`);
        const rd = await r.json();
        setRelated((rd.list as Book[]).filter((b) => b.id !== id).slice(0, 10));
      }
      setLoading(false);
    };
    load();
  }, [id, recordView]);

  if (loading) {
    return (
      <div className="py-20 text-center text-brown-600">
        <BookOpen className="animate-pulse mx-auto mb-3" size={40} />
        正在加载图书详情…
      </div>
    );
  }

  if (!book) {
    return (
      <div className="py-20 text-center">
        <p className="text-brown-600 mb-4">未找到该图书</p>
        <button onClick={() => navigate('/')} className="px-5 py-2 bg-accent-500 text-white rounded-xl font-bold">
          返回首页
        </button>
      </div>
    );
  }

  const isLowStock = book.stock >= 1 && book.stock <= 3;
  const isOutOfStock = book.stock === 0;

  const stockLabel = isOutOfStock
    ? { text: '缺货', cls: 'bg-gray-400 text-white' }
    : isLowStock
    ? { text: `仅剩 ${book.stock} 本`, cls: 'bg-accent-500 text-white' }
    : { text: '有货', cls: 'bg-green-500 text-white' };

  return (
    <div className="pb-16">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-brown-700 hover:text-accent-600 font-semibold mb-5 transition-colors"
      >
        <ArrowLeft size={18} /> 返回
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <div className="lg:col-span-2">
          <div className="relative sticky top-4">
            <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-accent-400/20 to-tan-400/20 blur-2xl" />
            <img
              src={book.cover}
              alt={book.title}
              className="relative w-full max-w-sm mx-auto aspect-[3/4] object-cover rounded-3xl shadow-2xl ring-4 ring-white/60"
            />
          </div>
        </div>

        <div className="lg:col-span-3 flex flex-col">
          <span className={`inline-block self-start px-3 py-1 rounded-full text-xs font-bold mb-3 ${stockLabel.cls}`}>
            {stockLabel.text}
          </span>

          {isLowStock && (
            <div className="flex items-center gap-2 px-4 py-2.5 bg-accent-500/15 border border-accent-400/50 rounded-xl mb-4 animate-pulse-orange">
              <AlertTriangle size={18} className="text-accent-500 flex-shrink-0" />
              <span className="text-accent-600 font-semibold text-sm">库存紧张，欲购从速！</span>
            </div>
          )}

          <h1 className="text-3xl md:text-4xl font-extrabold text-brown-900 leading-tight">{book.title}</h1>
          <p className="text-lg text-brown-700 font-semibold mt-2">{book.author} 著</p>

          <div className="mt-5 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-cream-200 text-brown-700 rounded-full text-sm font-medium">
              <Tag size={14} /> {book.category}
            </span>
            <span className="px-3 py-1 bg-cream-200 text-brown-700 rounded-full text-sm font-medium">
              ISBN：{book.isbn}
            </span>
          </div>

          <div className="mt-6 pb-6 border-b border-cream-200">
            <span className="text-sm text-brown-600">价格</span>
            <div className="flex items-baseline gap-3 mt-1">
              <span className="text-4xl font-extrabold text-accent-600">¥{book.price.toFixed(2)}</span>
              <span className="text-brown-500 line-through">¥{(book.price * 1.3).toFixed(2)}</span>
            </div>
          </div>

          <div className="mt-6">
            <h3 className="font-bold text-brown-800 mb-2">内容简介</h3>
            <p className="text-brown-700 leading-relaxed text-[15px]">{book.description}</p>
          </div>

          <div className="mt-auto pt-6">
            <button
              onClick={() => addToCart(book)}
              disabled={isOutOfStock}
              className={`w-full md:w-auto px-10 py-3.5 rounded-2xl font-bold text-white flex items-center justify-center gap-2 shadow-lg transition-all
                ${isOutOfStock
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-accent-500 hover:bg-accent-600 shadow-accent-500/30 active:scale-95'}`}
            >
              <ShoppingCart size={20} />
              {isOutOfStock ? '暂时缺货' : '加入购物车'}
            </button>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-14">
          <h2 className="text-xl font-extrabold text-brown-800 mb-4">同分类好书推荐</h2>
          <div
            className="relative"
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
          >
            <div
              ref={scrollerRef}
              className="flex gap-4 overflow-x-auto pb-3 scroll-smooth -mx-2 px-2"
            >
              {related.map((b) => (
                <div key={b.id} className="flex-shrink-0 w-44">
                  <BookCard book={b} compact />
                </div>
              ))}
            </div>
            <div
              className={`pointer-events-none absolute left-0 top-0 bottom-3 w-16 bg-gradient-to-r from-cream-100 to-transparent rounded-l-2xl transition-opacity duration-300 ${hover ? 'opacity-0' : 'opacity-100'}`}
            />
            <div
              className={`pointer-events-none absolute right-0 top-0 bottom-3 w-16 bg-gradient-to-l from-cream-100 to-transparent rounded-r-2xl transition-opacity duration-300 ${hover ? 'opacity-0' : 'opacity-100'}`}
            />
          </div>
        </section>
      )}
    </div>
  );
}
