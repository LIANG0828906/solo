import { useState, useEffect } from 'react';
import { Calendar, Tag, Trash2, Undo2, ShoppingBag } from 'lucide-react';
import { api, Sale } from '../services/api';

interface PendingUndo {
  id: string;
  timeoutId: number;
}

export default function SalesReport() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('全部');
  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set());
  const [pendingUndos, setPendingUndos] = useState<PendingUndo[]>([]);
  const [visibleItems, setVisibleItems] = useState<Set<string>>(new Set());

  const categories = ['全部', '饮料', '零食', '日用品'];

  useEffect(() => {
    loadSales();
  }, [dateFilter, categoryFilter]);

  useEffect(() => {
    sales.forEach((sale, index) => {
      setTimeout(() => {
        setVisibleItems((prev) => new Set(prev).add(sale.id));
      }, index * 100);
    });
  }, [sales]);

  async function loadSales() {
    setLoading(true);
    try {
      const params: { date?: string; category?: string } = {};
      if (dateFilter) params.date = dateFilter;
      if (categoryFilter && categoryFilter !== '全部') params.category = categoryFilter;
      const data = await api.getSales(params);
      setSales(data);
      setVisibleItems(new Set());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(sale: Sale) {
    setRemovingIds((prev) => new Set(prev).add(sale.id));
    try {
      await api.deleteSale(sale.id);
      const timeoutId = window.setTimeout(() => {
        setSales((prev) => prev.filter((s) => s.id !== sale.id));
        setRemovingIds((prev) => {
          const next = new Set(prev);
          next.delete(sale.id);
          return next;
        });
        setPendingUndos((prev) => prev.filter((p) => p.id !== sale.id));
      }, 5000);

      setPendingUndos((prev) => [...prev, { id: sale.id, timeoutId }]);
      setTimeout(() => {
        setPendingUndos((prev) => prev.filter((p) => p.id !== sale.id));
      }, 5000);
    } catch (err: any) {
      alert(err.message);
      setRemovingIds((prev) => {
        const next = new Set(prev);
        next.delete(sale.id);
        return next;
      });
    }
  }

  async function handleUndo(saleId: string) {
    const pending = pendingUndos.find((p) => p.id === saleId);
    if (!pending) return;
    clearTimeout(pending.timeoutId);
    try {
      await api.undoDeleteSale(saleId);
      setRemovingIds((prev) => {
        const next = new Set(prev);
        next.delete(saleId);
        return next;
      });
      setPendingUndos((prev) => prev.filter((p) => p.id !== saleId));
      loadSales();
    } catch (err: any) {
      alert(err.message);
    }
  }

  function formatDate(dateStr: string) {
    const d = new Date(dateStr);
    return d.toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold mb-1" style={{ color: 'var(--wood-dark)' }}>
            销售报表
          </h2>
          <p className="text-sm" style={{ color: '#8B7355' }}>
            最近 30 笔销售记录
          </p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Calendar style={{ width: 18, height: 18, color: '#8B7355' }} />
          <input
            type="date"
            className="input-field max-w-48"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Tag style={{ width: 18, height: 18, color: '#8B7355' }} />
          {categories.map((cat) => (
            <button
              key={cat}
              className={`category-pill ${categoryFilter === cat ? 'active' : ''}`}
              onClick={() => setCategoryFilter(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="product-card p-5 animate-pulse">
              <div className="h-5 w-32 bg-gray-200 rounded mb-3" />
              <div className="h-4 w-full bg-gray-100 rounded mb-2" />
              <div className="h-4 w-2/3 bg-gray-100 rounded" />
            </div>
          ))}
        </div>
      ) : sales.length === 0 ? (
        <div className="text-center py-16" style={{ color: '#8B7355' }}>
          <ShoppingBag style={{ width: 48, height: 48, margin: '0 auto 16px', opacity: 0.3 }} />
          <p>暂无销售记录</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sales.map((sale) => {
            const isRemoving = removingIds.has(sale.id);
            const hasPendingUndo = pendingUndos.some((p) => p.id === sale.id);
            const isVisible = visibleItems.has(sale.id);

            return (
              <div
                key={sale.id}
                className={`product-card p-5 relative ${isRemoving ? 'animate-slide-out' : ''} ${isVisible ? 'animate-fade-up' : 'opacity-0 translate-y-4'}`}
                style={{ transition: 'opacity 0.5s ease, transform 0.5s ease' }}
              >
                {hasPendingUndo && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-white/95 z-10">
                    <div className="text-center">
                      <p className="mb-3 font-medium" style={{ color: 'var(--wood-dark)' }}>
                        记录已删除
                      </p>
                      <button
                        className="btn-primary flex items-center gap-2 mx-auto"
                        onClick={() => handleUndo(sale.id)}
                      >
                        <Undo2 style={{ width: 16, height: 16 }} />
                        撤销删除
                      </button>
                    </div>
                  </div>
                )}
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="text-sm font-medium" style={{ color: '#8B7355' }}>
                      {formatDate(sale.createdAt)}
                    </p>
                    <p className="text-xs" style={{ color: '#A0896C' }}>
                      单号: {sale.id.slice(0, 8)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold" style={{ color: 'var(--wood-primary)' }}>
                      ¥{sale.totalAmount.toFixed(2)}
                    </span>
                    {!hasPendingUndo && (
                      <button
                        className="p-2 rounded-lg hover:bg-red-50"
                        onClick={() => handleDelete(sale)}
                        title="删除记录"
                      >
                        <Trash2 style={{ width: 18, height: 18, color: 'var(--alert-red)' }} />
                      </button>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  {sale.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between items-center text-sm py-1 border-b last:border-b-0"
                      style={{ borderColor: 'var(--cream-dark)' }}
                    >
                      <span style={{ color: 'var(--wood-dark)' }}>
                        {item.productName} × {item.quantity}
                      </span>
                      <span style={{ color: '#8B7355' }}>
                        ¥{item.unitPrice.toFixed(2)} · ¥{item.subtotal.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
