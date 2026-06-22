import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter } from 'lucide-react';
import { getBooks } from '../../api';
import { CardSkeleton } from '../../components/Skeleton';
import type { Book } from '../../types';

const CATEGORIES = ['全部', '文学', '科技', '历史', '艺术', '科幻'];
const STATUS_OPTIONS = ['全部', '在架', '已借出'];

export default function BookCatalogue() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('全部');
  const [statusFilter, setStatusFilter] = useState('全部');
  const [showFilters, setShowFilters] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    getBooks()
      .then(setBooks)
      .catch(() => setBooks([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return books.filter((book) => {
      const matchSearch =
        !search ||
        book.title.toLowerCase().includes(search.toLowerCase()) ||
        book.author.toLowerCase().includes(search.toLowerCase());
      const matchCategory = category === '全部' || book.category === category;
      const matchStatus =
        statusFilter === '全部' ||
        (statusFilter === '在架' && book.availableQuantity > 0) ||
        (statusFilter === '已借出' && book.availableQuantity === 0);
      return matchSearch && matchCategory && matchStatus;
    });
  }, [books, search, category, statusFilter]);

  return (
    <div className="page-enter pt-20 pb-10 px-4">
      <div className="container mx-auto">
        <h1 className="text-2xl font-bold text-accent mb-6">图书目录</h1>

        <div className="mb-6 space-y-3">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="搜索书名或作者..."
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-secondary/60 bg-white focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`btn-press px-4 py-2 rounded-lg border flex items-center gap-2 transition-colors ${
                showFilters
                  ? 'bg-accent text-white border-accent'
                  : 'bg-white text-gray-600 border-secondary/60 hover:border-accent'
              }`}
            >
              <Filter className="w-4 h-4" />
              筛选
            </button>
          </div>

          {showFilters && (
            <div className="flex flex-wrap gap-4 p-4 bg-white rounded-lg border border-secondary/40">
              <div>
                <span className="text-sm text-gray-500 mr-2">分类：</span>
                <div className="inline-flex flex-wrap gap-1">
                  {CATEGORIES.map((c) => (
                    <button
                      key={c}
                      onClick={() => setCategory(c)}
                      className={`btn-press px-3 py-1 rounded-full text-sm transition-colors ${
                        category === c
                          ? 'bg-accent text-white'
                          : 'bg-secondary/60 text-gray-600 hover:bg-secondary'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <span className="text-sm text-gray-500 mr-2">状态：</span>
                <div className="inline-flex gap-1">
                  {STATUS_OPTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => setStatusFilter(s)}
                      className={`btn-press px-3 py-1 rounded-full text-sm transition-colors ${
                        statusFilter === s
                          ? 'bg-accent text-white'
                          : 'bg-secondary/60 text-gray-600 hover:bg-secondary'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-lg">未找到匹配的图书</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filtered.map((book) => (
              <div
                key={book.id}
                onClick={() => navigate(`/books/${book.id}`)}
                className="card-hover cursor-pointer rounded-xl bg-white shadow-sm overflow-hidden border border-secondary/20"
              >
                <div className="aspect-[3/4] overflow-hidden bg-secondary/30">
                  <img
                    src={book.cover}
                    alt={book.title}
                    className="img-fade-in w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
                <div className="p-3 relative">
                  <h3 className="font-medium text-gray-800 text-sm truncate">
                    {book.title}
                  </h3>
                  <p className="text-xs text-gray-500 truncate mt-0.5">
                    {book.author}
                  </p>
                  <span
                    className={`absolute bottom-3 right-3 text-xs px-2 py-0.5 rounded-full font-medium ${
                      book.availableQuantity > 0
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-600'
                    }`}
                  >
                    {book.availableQuantity > 0 ? '在架' : '已借出'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
