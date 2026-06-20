import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, SortAsc, Users, Search, X, BookOpen } from 'lucide-react';
import { api } from '@/api';
import type { Book } from '@/types';
import { BookListSkeleton } from '@/components/Skeleton';
import { cn } from '@/lib/utils';

type SortKey = 'addedAt' | 'title' | 'author';

interface BookWithCount extends Book {
  readersCount: number;
}

const SORT_OPTIONS: { label: string; value: SortKey }[] = [
  { label: '按添加时间', value: 'addedAt' },
  { label: '按书名', value: 'title' },
  { label: '按作者', value: 'author' },
];

function AddBookModal({
  open,
  onClose,
  onAdded,
}: {
  open: boolean;
  onClose: () => void;
  onAdded: (book: BookWithCount) => void;
}) {
  const [form, setForm] = useState({
    title: '',
    author: '',
    coverUrl: '',
    description: '',
    isbn: '',
    totalChapters: 20,
  });
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.author) return;
    setLoading(true);
    try {
      const book = await api.addBook(form);
      onAdded(book);
      setForm({ title: '', author: '', coverUrl: '', description: '', isbn: '', totalChapters: 20 });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center animate-fade-in">
      <div className="absolute inset-0 bg-espresso/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-warm-white rounded-card shadow-hover p-8 w-full max-w-lg animate-bubble-in">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-serif text-2xl font-bold text-espresso flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-forest" />
            添加新书
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-latte/30 transition-colors duration-200 text-coffee"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-espresso mb-1.5">书名 *</label>
            <input
              type="text"
              required
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              className="w-full px-4 py-2.5 rounded-card border border-latte/60 bg-cream focus:outline-none focus:border-forest focus:ring-2 focus:ring-forest/20 transition-all duration-200 text-espresso"
              placeholder="请输入书名"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-espresso mb-1.5">作者 *</label>
            <input
              type="text"
              required
              value={form.author}
              onChange={e => setForm({ ...form, author: e.target.value })}
              className="w-full px-4 py-2.5 rounded-card border border-latte/60 bg-cream focus:outline-none focus:border-forest focus:ring-2 focus:ring-forest/20 transition-all duration-200 text-espresso"
              placeholder="请输入作者"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-espresso mb-1.5">封面图 URL</label>
            <input
              type="text"
              value={form.coverUrl}
              onChange={e => setForm({ ...form, coverUrl: e.target.value })}
              className="w-full px-4 py-2.5 rounded-card border border-latte/60 bg-cream focus:outline-none focus:border-forest focus:ring-2 focus:ring-forest/20 transition-all duration-200 text-espresso"
              placeholder="https://..."
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-espresso mb-1.5">ISBN</label>
              <input
                type="text"
                value={form.isbn}
                onChange={e => setForm({ ...form, isbn: e.target.value })}
                className="w-full px-4 py-2.5 rounded-card border border-latte/60 bg-cream focus:outline-none focus:border-forest focus:ring-2 focus:ring-forest/20 transition-all duration-200 text-espresso"
                placeholder="可选"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-espresso mb-1.5">章节数</label>
              <input
                type="number"
                min={1}
                value={form.totalChapters}
                onChange={e => setForm({ ...form, totalChapters: parseInt(e.target.value) || 1 })}
                className="w-full px-4 py-2.5 rounded-card border border-latte/60 bg-cream focus:outline-none focus:border-forest focus:ring-2 focus:ring-forest/20 transition-all duration-200 text-espresso"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-espresso mb-1.5">简介</label>
            <textarea
              rows={3}
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              className="w-full px-4 py-2.5 rounded-card border border-latte/60 bg-cream focus:outline-none focus:border-forest focus:ring-2 focus:ring-forest/20 transition-all duration-200 text-espresso resize-none"
              placeholder="请输入书籍简介"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-card border border-latte/60 text-coffee font-medium hover:bg-latte/10 transition-colors duration-200"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={loading || !form.title || !form.author}
              className="flex-1 py-2.5 rounded-card bg-gradient-to-r from-forest to-forest-light text-warm-white font-medium shadow-soft hover:shadow-hover hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-soft"
            >
              {loading ? '添加中...' : '添加书籍'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function BookCard({ book, index, isNew }: { book: BookWithCount; index: number; isNew?: boolean }) {
  const navigate = useNavigate();
  return (
    <div
      onClick={() => navigate(`/book/${book.id}`)}
      className={cn(
        'group bg-warm-white rounded-card overflow-hidden shadow-soft cursor-pointer',
        'transition-all duration-200 ease-out hover:-translate-y-1 hover:shadow-hover',
        isNew ? 'animate-fade-in-up' : 'animate-fade-in-up'
      )}
      style={{ animationDelay: isNew ? '0ms' : `${Math.min(index, 30) * 40}ms` }}
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-latte/30">
        {book.coverUrl ? (
          <img
            src={book.coverUrl}
            alt={book.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <BookOpen className="w-16 h-16 text-latte" />
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-espresso/60 to-transparent" />
      </div>
      <div className="p-4">
        <h3 className="font-serif font-semibold text-espresso text-base mb-1 line-clamp-1 group-hover:text-forest transition-colors duration-200">
          {book.title}
        </h3>
        <p className="text-sm text-coffee mb-3 line-clamp-1">{book.author}</p>
        <div className="flex items-center gap-1.5 text-coffee">
          <Users className="w-3.5 h-3.5 text-forest" />
          <span className="text-xs">{book.readersCount} 人在读</span>
        </div>
      </div>
    </div>
  );
}

export default function BookList() {
  const [books, setBooks] = useState<BookWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState<SortKey>('addedAt');
  const [query, setQuery] = useState('');
  const [sortOpen, setSortOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [newBookId, setNewBookId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await api.getBooks();
        setBooks(data);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = books
    .filter(b => {
      if (!query) return true;
      const q = query.toLowerCase();
      return b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q);
    })
    .sort((a, b) => {
      if (sortKey === 'addedAt') {
        return new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime();
      }
      return a[sortKey].localeCompare(b[sortKey], 'zh-CN');
    });

  const handleAdded = (book: BookWithCount) => {
    setBooks(prev => [book, ...prev]);
    setNewBookId(book.id);
    setTimeout(() => setNewBookId(null), 1000);
  };

  return (
    <div>
      <div className="flex flex-col gap-6 mb-8">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="font-serif text-3xl font-bold text-espresso mb-2">书籍库</h1>
            <p className="text-coffee">共收录 {books.length} 本好书，每一本都是一次心灵之旅</p>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-card bg-gradient-to-r from-forest to-forest-light text-warm-white font-medium shadow-soft hover:shadow-hover hover:-translate-y-0.5 transition-all duration-200"
          >
            <Plus className="w-4.5 h-4.5" />
            添加书籍
          </button>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex-1 relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-coffee" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="搜索书名或作者..."
              className="w-full pl-11 pr-4 py-2.5 rounded-card border border-latte/60 bg-warm-white focus:outline-none focus:border-forest focus:ring-2 focus:ring-forest/20 transition-all duration-200 text-espresso placeholder:text-coffee/60"
            />
          </div>
          <div className="relative">
            <button
              onClick={() => setSortOpen(o => !o)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-card border border-latte/60 bg-warm-white text-espresso font-medium hover:bg-cream transition-colors duration-200"
            >
              <SortAsc className="w-4 h-4" />
              {SORT_OPTIONS.find(o => o.value === sortKey)?.label}
            </button>
            {sortOpen && (
              <div className="absolute right-0 mt-2 w-44 bg-warm-white rounded-card shadow-hover border border-latte/40 py-1.5 z-50 animate-bubble-in">
                {SORT_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => { setSortKey(opt.value); setSortOpen(false); }}
                    className={cn(
                      'w-full text-left px-4 py-2 text-sm transition-colors duration-200',
                      sortKey === opt.value ? 'text-forest bg-forest/5 font-medium' : 'text-espresso hover:bg-cream'
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      {loading ? (
        <BookListSkeleton />
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <BookOpen className="w-16 h-16 text-latte mx-auto mb-4" />
          <p className="text-coffee text-lg">暂无书籍，点击右上角添加第一本</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {filtered.map((book, i) => (
            <BookCard key={book.id} book={book} index={i} isNew={book.id === newBookId} />
          ))}
        </div>
      )}
      <AddBookModal open={modalOpen} onClose={() => setModalOpen(false)} onAdded={handleAdded} />
    </div>
  );
}
