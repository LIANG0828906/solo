import { useEffect, useState, useMemo } from 'react';
import { Package, Truck, AlertTriangle, Search, Plus, Minus, Tag, X, BookOpen, Check } from 'lucide-react';
import type { Book, OrderStats } from '../types';
import { useCountUp } from '../hooks/useCountUp';

function StatCard({ label, value, icon: Icon, color }: { label: string; value: number; icon: any; color: string }) {
  const display = useCountUp(value, 1400);
  return (
    <div className={`relative bg-white rounded-2xl p-5 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden`}>
      <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-20 ${color}`} />
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-brown-600 text-sm font-semibold">{label}</p>
          <p className="text-4xl font-extrabold text-brown-900 mt-1 tabular-nums">{display}</p>
        </div>
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color} text-white shadow-md`}>
          <Icon size={22} />
        </div>
      </div>
    </div>
  );
}

interface ExpandRowProps {
  book: Book;
  onStockChange: (newStock: number) => void;
}

function ExpandRow({ book, onStockChange }: ExpandRowProps) {
  const [delta, setDelta] = useState(0);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [saved, setSaved] = useState(false);

  const targetStock = book.stock + delta;

  const handleConfirm = async () => {
    await fetch(`/api/books/${book.id}/stock`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stock: targetStock })
    });
    onStockChange(targetStock);
    setConfirmOpen(false);
    setDelta(0);
    setSaved(true);
    setTimeout(() => setSaved(false), 1000);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 py-4 px-2">
      <div className="md:col-span-3">
        <img src={book.cover} alt={book.title} className="w-24 h-32 object-cover rounded-xl shadow-md" />
      </div>
      <div className="md:col-span-5 space-y-2">
        <div>
          <span className="text-xs text-brown-500 font-semibold uppercase tracking-wide">分类标签</span>
          <div className="mt-1 flex flex-wrap gap-1.5">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-tan-300/40 text-brown-800 rounded-full text-xs font-bold">
              <Tag size={12} /> {book.category}
            </span>
            {book.isBestseller && (
              <span className="px-2.5 py-1 bg-accent-500/15 text-accent-600 rounded-full text-xs font-bold">
                ✨ 畅销书
              </span>
            )}
          </div>
        </div>
        <div>
          <span className="text-xs text-brown-500 font-semibold uppercase tracking-wide">ISBN</span>
          <p className="text-sm text-brown-700 font-mono mt-0.5">{book.isbn}</p>
        </div>
        <div>
          <span className="text-xs text-brown-500 font-semibold uppercase tracking-wide">简介</span>
          <p className="text-sm text-brown-700 mt-0.5 line-clamp-2">{book.description}</p>
        </div>
      </div>
      <div className="md:col-span-4">
        <div className="bg-cream-100 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-bold text-brown-700">调整库存</span>
            {saved && <span className="text-xs text-green-600 font-bold flex items-center gap-1"><Check size={14} />已保存</span>}
          </div>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => setDelta((d) => d - 1)}
              className="w-10 h-10 rounded-full bg-white shadow-sm text-brown-700 hover:bg-accent-500 hover:text-white transition-all active:scale-90 flex items-center justify-center"
            >
              <Minus size={18} />
            </button>
            <div className="text-center min-w-[100px]">
              <div className="text-2xl font-extrabold text-brown-900 tabular-nums">{targetStock}</div>
              <div className="text-xs text-brown-500">
                当前 {book.stock} {delta !== 0 && <span className={delta > 0 ? 'text-green-600 font-bold' : 'text-red-500 font-bold'}>({delta > 0 ? '+' : ''}{delta})</span>}
              </div>
            </div>
            <button
              onClick={() => setDelta((d) => d + 1)}
              className="w-10 h-10 rounded-full bg-white shadow-sm text-brown-700 hover:bg-accent-500 hover:text-white transition-all active:scale-90 flex items-center justify-center"
            >
              <Plus size={18} />
            </button>
          </div>
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => setDelta(0)}
              disabled={delta === 0}
              className="flex-1 py-2 rounded-xl bg-white text-brown-700 font-bold text-sm hover:bg-cream-200 transition-colors disabled:opacity-50"
            >
              重置
            </button>
            <button
              onClick={() => setConfirmOpen(true)}
              disabled={delta === 0}
              className="flex-1 py-2 rounded-xl bg-accent-500 text-white font-bold text-sm hover:bg-accent-600 transition-colors disabled:opacity-50 shadow-md shadow-accent-500/30"
            >
              确认修改
            </button>
          </div>
        </div>
      </div>

      {confirmOpen && (
        <div className="fixed inset-0 z-50 bg-brown-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 max-w-sm w-full shadow-2xl">
            <h4 className="font-extrabold text-brown-900 text-lg mb-2">确认库存调整</h4>
            <p className="text-brown-600 text-sm mb-4">
              《{book.title}》库存将从 <b>{book.stock}</b> 调整为 <b className="text-accent-600">{targetStock}</b>
            </p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmOpen(false)} className="flex-1 py-2 rounded-xl bg-cream-200 text-brown-700 font-bold hover:bg-cream-100 transition-colors">取消</button>
              <button onClick={handleConfirm} className="flex-1 py-2 rounded-xl bg-accent-500 text-white font-bold hover:bg-accent-600 transition-colors">确定</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Admin() {
  const [stats, setStats] = useState<OrderStats>({ todayOrders: 0, shippedCount: 0, lowStockCount: 0 });
  const [books, setBooks] = useState<Book[]>([]);
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [highlightId, setHighlightId] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/orders/stats').then((r) => r.json()).then(setStats);
    fetch('/api/books?pageSize=50').then((r) => r.json()).then((d) => setBooks(d.list));
  }, []);

  const filtered = useMemo(() => {
    const kw = search.trim().toLowerCase();
    if (!kw) return books;
    return books.filter(
      (b) => b.title.toLowerCase().includes(kw) || b.author.toLowerCase().includes(kw)
    );
  }, [books, search]);

  const handleStockChange = (id: string, newStock: number) => {
    setBooks((bs) => bs.map((b) => (b.id === id ? { ...b, stock: newStock } : b)));
    setHighlightId(id);
    setTimeout(() => setHighlightId(null), 1500);
  };

  return (
    <div className="space-y-6 pb-16">
      <header>
        <h1 className="text-2xl md:text-3xl font-extrabold text-brown-900">书店管理仪表盘</h1>
        <p className="text-brown-600 mt-1">掌握书店每日运营，精准管理库存</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
        <StatCard label="当日订单" value={stats.todayOrders} icon={Package} color="bg-tan-500" />
        <StatCard label="已发货" value={stats.shippedCount} icon={Truck} color="bg-brown-700" />
        <StatCard label="低库存预警" value={stats.lowStockCount} icon={AlertTriangle} color="bg-accent-500" />
      </div>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 md:p-5 border-b border-cream-200">
          <h2 className="text-lg font-extrabold text-brown-800 flex items-center gap-2">
            <BookOpen size={20} className="text-accent-500" />
            库存管理
          </h2>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-brown-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索书名或作者…"
              className="w-full md:w-72 pl-9 pr-8 py-2 rounded-xl bg-cream-100 text-brown-800 font-medium placeholder:text-brown-400 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:bg-white transition-all"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-brown-400 hover:text-brown-700">
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-cream-100 text-brown-700 text-xs uppercase tracking-wide">
                <th className="text-left px-4 md:px-5 py-3 font-extrabold">书名</th>
                <th className="text-left px-4 md:px-5 py-3 font-extrabold hidden md:table-cell">作者</th>
                <th className="text-left px-4 md:px-5 py-3 font-extrabold hidden lg:table-cell">ISBN</th>
                <th className="text-center px-4 md:px-5 py-3 font-extrabold">库存</th>
                <th className="text-right px-4 md:px-5 py-3 font-extrabold">价格</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-brown-500">
                    未找到匹配的图书
                  </td>
                </tr>
              ) : (
                filtered.map((b) => {
                  const expanded = expandedId === b.id;
                  const isLow = b.stock > 0 && b.stock < 5;
                  const isOut = b.stock === 0;
                  return (
                    <>
                      <tr
                        key={b.id}
                        onClick={() => setExpandedId(expanded ? null : b.id)}
                        className={`border-b border-cream-100 cursor-pointer select-none transition-colors hover:bg-cream-50
                          ${highlightId === b.id ? 'animate-highlight-fade' : ''}`}
                      >
                        <td className="px-4 md:px-5 py-3.5">
                          <div className="font-bold text-brown-800 line-clamp-1">{b.title}</div>
                          <div className="md:hidden text-xs text-brown-500 mt-0.5">{b.author}</div>
                        </td>
                        <td className="px-4 md:px-5 py-3.5 text-brown-700 hidden md:table-cell">{b.author}</td>
                        <td className="px-4 md:px-5 py-3.5 text-brown-600 font-mono text-xs hidden lg:table-cell">{b.isbn}</td>
                        <td className="px-4 md:px-5 py-3.5 text-center">
                          <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold
                            ${isOut ? 'bg-gray-200 text-gray-600' : isLow ? 'bg-accent-500/15 text-accent-600' : 'bg-green-100 text-green-700'}`}>
                            {isOut ? '缺货' : b.stock}
                          </span>
                        </td>
                        <td className="px-4 md:px-5 py-3.5 text-right font-extrabold text-accent-600">¥{b.price.toFixed(0)}</td>
                      </tr>
                      {expanded && (
                        <tr key={`exp-${b.id}`} className="bg-cream-50/50">
                          <td colSpan={5} className="px-4 md:px-6">
                            <div style={{ animation: 'expandRow 350ms ease forwards', overflow: 'hidden' }}>
                              <ExpandRow book={b} onStockChange={(ns) => handleStockChange(b.id, ns)} />
                            </div>
                            <style>{`
                              @keyframes expandRow {
                                0% { max-height: 0; opacity: 0; }
                                100% { max-height: 600px; opacity: 1; }
                              }
                            `}</style>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
