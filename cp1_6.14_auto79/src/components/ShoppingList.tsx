import { useEffect, useMemo, useState } from 'react';
import { ShoppingCart, Plus, Check, Trash2, X } from 'lucide-react';
import { transactionsApi, type GroceryItem } from '../services/api';

export default function ShoppingList() {
  const [items, setItems] = useState<GroceryItem[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [addingId, setAddingId] = useState<string | null>(null);
  const [fadingIds, setFadingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    transactionsApi.getGroceries().then(setItems);
  }, []);

  const sortedItems = useMemo(
    () =>
      [...items].sort(
        (a, b) =>
          Number(a.done) - Number(b.done) || +new Date(b.createdAt) - +new Date(a.createdAt)
      ),
    [items]
  );
  const total = items.reduce((s, it) => s + (it.done ? 0 : it.price), 0);
  const doneCount = items.filter((i) => i.done).length;

  const addItem = async () => {
    if (!newName.trim()) return;
    const t0 = performance.now();
    setShowAdd(false);
    const price = Number(newPrice) || 0;
    const created = await transactionsApi.addGrocery(newName.trim(), price);
    setAddingId(created.id);
    setItems((its) => [created, ...its]);
    setNewName('');
    setNewPrice('');
    setTimeout(() => setAddingId(null), 500);
    console.debug('[采买] 新增响应耗时:', (performance.now() - t0).toFixed(1), 'ms');
  };

  const toggleDone = async (it: GroceryItem) => {
    const next = !it.done;
    if (next) {
      setFadingIds((prev) => new Set(prev).add(it.id));
    }
    setItems((its) => its.map((x) => (x.id === it.id ? { ...x, done: next } : x)));
    await transactionsApi.updateGrocery(it.id, { done: next });
    if (!next) {
      setFadingIds((prev) => {
        const n = new Set(prev);
        n.delete(it.id);
        return n;
      });
    }
  };

  const removeItem = async (id: string) => {
    setFadingIds((prev) => new Set(prev).add(id));
    setTimeout(async () => {
      setItems((its) => its.filter((x) => x.id !== id));
      await transactionsApi.deleteGrocery(id);
      setFadingIds((prev) => {
        const n = new Set(prev);
        n.delete(id);
        return n;
      });
    }, 400);
  };

  return (
    <div className="fade-in space-y-5">
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="glass-card p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#6b7c8a] mb-2">待采买</p>
          <p className="font-serif-sc text-3xl font-bold text-[#356d7e]">
            {items.length - doneCount}
          </p>
          <p className="text-xs text-[#8b9bab] mt-1">件物品等待采购</p>
        </div>
        <div className="glass-card p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#6b7c8a] mb-2">已完成</p>
          <p className="font-serif-sc text-3xl font-bold text-[#27ae60]">{doneCount}</p>
          <p className="text-xs text-[#8b9bab] mt-1">
            完成率 {items.length ? Math.round((doneCount / items.length) * 100) : 0}%
          </p>
        </div>
        <div className="glass-card p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#6b7c8a] mb-2">预计花费</p>
          <p className="font-serif-sc text-3xl font-bold text-[#cfad7b]">¥{total.toLocaleString()}</p>
          <p className="text-xs text-[#8b9bab] mt-1">未完成项合计</p>
        </div>
      </div>

      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-serif-sc text-lg font-bold text-[#356d7e] flex items-center gap-2">
            <ShoppingCart size={18} />
            公共采买清单
          </h4>
          <button
            onClick={() => setShowAdd((v) => !v)}
            className="btn-primary !py-2.5 !px-5 !text-sm inline-flex items-center gap-1.5"
          >
            <Plus size={15} />
            {showAdd ? '收起' : '添加物品'}
          </button>
        </div>

        {showAdd && (
          <div className="mb-5 p-4 rounded-2xl bg-gradient-to-r from-[#e8c99b]/20 via-white/60 to-[#4a90a4]/15 border border-white slide-in-right">
            <div className="grid sm:grid-cols-[1fr,160px,auto] gap-3">
              <input
                type="text"
                className="px-4 py-3 rounded-xl bg-white/80 border-2 border-white outline-none focus:border-[#4a90a4] transition-colors placeholder:text-[#a9b8c3]"
                placeholder="物品名称，如：垃圾袋、洗衣液..."
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addItem()}
                autoFocus
              />
              <div className="flex items-center gap-2 rounded-xl border-2 border-white bg-white/80 px-4 py-3 focus-within:border-[#4a90a4] transition-colors">
                <span className="text-[#6b7c8a] font-medium">¥</span>
                <input
                  type="number"
                  className="flex-1 bg-transparent outline-none font-semibold tabular-nums"
                  placeholder="预估价格"
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addItem()}
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={addItem}
                  className="px-5 rounded-xl bg-gradient-to-br from-[#4a90a4] to-[#6eb4c7] text-white font-semibold hover:shadow-lg transition-all hover:-translate-y-0.5 inline-flex items-center gap-1.5"
                >
                  <Check size={16} />
                  确认
                </button>
                <button
                  onClick={() => {
                    setShowAdd(false);
                    setNewName('');
                    setNewPrice('');
                  }}
                  className="px-4 rounded-xl bg-white/70 hover:bg-white border border-white text-[#6b7c8a] font-medium transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          </div>
        )}

        {sortedItems.length === 0 ? (
          <div className="text-center py-16 text-[#8b9bab]">
            <ShoppingCart size={48} className="mx-auto mb-3 opacity-40" />
            <p>清单空空如也～</p>
            <p className="text-sm mt-1 opacity-70">点击右上角按钮添加第一件采购物品吧</p>
          </div>
        ) : (
          <div className="space-y-2">
            {sortedItems.map((it, i) => {
              const isFading = fadingIds.has(it.id);
              return (
                <div
                  key={it.id}
                  className={`group flex items-center gap-4 p-3.5 rounded-xl border-2 transition-all duration-400 ${
                    isFading
                      ? 'item-fading border-transparent'
                      : it.done
                      ? 'bg-[#eef0f2] border-transparent opacity-55'
                      : 'border-white/70 bg-white/75 hover:bg-white hover:border-white'
                  } ${addingId === it.id ? 'slide-in-right' : ''}`}
                  style={{ animationDelay: `${i * 0.03}s` }}
                >
                  <button
                    onClick={() => toggleDone(it)}
                    className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center border-2 transition-all ${
                      it.done
                        ? 'bg-gradient-to-br from-[#27ae60] to-[#2ecc71] border-[#27ae60] text-white'
                        : 'border-[#4a90a4]/30 hover:border-[#4a90a4] bg-white'
                    }`}
                  >
                    {it.done && <Check size={15} strokeWidth={3} />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium ${it.done ? 'line-through' : ''}`}>{it.name}</p>
                    <p className="text-xs text-[#8b9bab] mt-0.5">
                      {new Date(it.createdAt).toLocaleDateString('zh-CN', {
                        month: 'short',
                        day: 'numeric',
                      })}
                      {it.done && ' · 已完成'}
                    </p>
                  </div>
                  <p
                    className={`shrink-0 font-serif-sc font-bold ${
                      it.done ? 'text-[#8b9bab]' : 'text-[#cfad7b]'
                    } tabular-nums`}
                  >
                    ¥{it.price.toFixed(it.price % 1 ? 1 : 0)}
                  </p>
                  <button
                    onClick={() => removeItem(it.id)}
                    className="shrink-0 opacity-0 group-hover:opacity-100 w-8 h-8 rounded-lg flex items-center justify-center text-[#e74c3c] hover:bg-[#e74c3c]/10 transition-all"
                    aria-label="删除"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
