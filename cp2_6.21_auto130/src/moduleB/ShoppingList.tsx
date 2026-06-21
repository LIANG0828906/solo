import { useMemo, useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { RefreshCw, Check } from 'lucide-react';
import { useAppStore } from '@/state/appStore';
import { cn } from '@/lib/utils';
import type { ShoppingItem, SupermarketZone } from '@/state/appStore';
import { ZONE_INFO, ZONE_ORDER } from '@/data/mockData';
import ToastContainer from '@/components/ToastContainer';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function ShoppingList() {
  const { inviteCode } = useParams<{ inviteCode: string }>();
  const shoppingItems = useAppStore((s) => s.shoppingItems);
  const toggleShoppingItem = useAppStore((s) => s.toggleShoppingItem);
  const forceSyncShoppingList = useAppStore((s) => s.forceSyncShoppingList);
  const loading = useAppStore((s) => s.loading.shoppingSync);
  const init = useAppStore((s) => s.init);

  const [syncing, setSyncing] = useState(false);
  const [animatingItems, setAnimatingItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    init();
  }, [init]);

  const groupedItems = useMemo(() => {
    const g: Record<SupermarketZone, ShoppingItem[]> = {
      produce: [],
      meat_seafood: [],
      dairy_eggs: [],
      seasoning: [],
      staples: [],
      other: [],
    };
    shoppingItems.forEach((item) => {
      g[item.supermarketZone]?.push(item);
    });
    return g;
  }, [shoppingItems]);

  const purchasedCount = shoppingItems.filter((i) => i.purchased).length;
  const totalCount = shoppingItems.length;
  const progress = totalCount > 0 ? (purchasedCount / totalCount) * 100 : 0;
  const totalPrice = shoppingItems.reduce((sum, i) => sum + (i.estimatedPrice || 0), 0);
  const purchasedPrice = shoppingItems
    .filter((i) => i.purchased)
    .reduce((sum, i) => sum + (i.estimatedPrice || 0), 0);

  const handleSync = async () => {
    setSyncing(true);
    try {
      await forceSyncShoppingList();
    } finally {
      setTimeout(() => setSyncing(false), 500);
    }
  };

  const handleToggle = (ingredientId: string) => {
    const item = shoppingItems.find((i) => i.ingredientId === ingredientId);
    if (!item) return;

    setAnimatingItems((prev) => new Set(prev).add(ingredientId));
    toggleShoppingItem(ingredientId);

    setTimeout(() => {
      setAnimatingItems((prev) => {
        const next = new Set(prev);
        next.delete(ingredientId);
        return next;
      });
    }, 300);
  };

  const showLoading = loading || syncing;

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-3xl mx-auto pb-32 relative">
      <ToastContainer />

      {showLoading && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-[1px] z-40 flex items-center justify-center animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl px-6 py-5 flex items-center gap-3">
            <LoadingSpinner size="md" />
            <span className="text-gray-700 font-medium">正在同步最新清单...</span>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
            <span className="chip bg-primary/15 text-primary-dark border border-primary/20">
              房间 {inviteCode || 'demo-001'}
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-display text-gray-800 flex items-center gap-3">
            🛒 本周采购清单
          </h1>
          <p className="text-gray-500 mt-1 text-sm">按超市区域分组，高效购物不遗漏</p>
        </div>
        <button
          className={cn('btn-secondary', syncing && 'pointer-events-none')}
          onClick={handleSync}
          disabled={syncing}
          title="强制从后端拉取最新版本并覆盖本地勾选状态"
        >
          <RefreshCw className={cn('w-4 h-4', syncing && 'animate-spin')} />
          同步
        </button>
      </div>

      {shoppingItems.length === 0 && !showLoading && (
        <div className="card p-12 text-center animate-fade-in">
          <div className="text-5xl mb-4">📭</div>
          <div className="font-display text-lg text-gray-700 mb-2">清单还是空的</div>
          <div className="text-sm text-gray-500">先去菜单规划页面添加食谱吧</div>
        </div>
      )}

      <div className="space-y-4">
        {ZONE_ORDER.map((zone) => {
          const items = groupedItems[zone];
          if (!items || items.length === 0) return null;
          const info = ZONE_INFO[zone];
          const zonePurchased = items.filter((i) => i.purchased).length;
          return (
            <div key={zone} className="card overflow-hidden animate-fade-in">
              <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                <span className={cn('chip border px-3 py-1.5 font-semibold', info.color)}>
                  <span className="mr-1 text-base">{info.emoji}</span>
                  {info.label}
                  <span className="ml-1.5 text-xs opacity-70">
                    {zonePurchased}/{items.length}
                  </span>
                </span>
                {zonePurchased === items.length && items.length > 0 && (
                  <span className="chip bg-green-100 text-green-700 border border-green-200 text-xs">
                    ✓ 已买齐
                  </span>
                )}
              </div>

              <ul className="divide-y divide-gray-50">
                {items.map((item) => {
                  const isAnimating = animatingItems.has(item.ingredientId);
                  return (
                    <li
                      key={item.ingredientId}
                      className={cn(
                        'pl-5 pr-4 py-3 flex items-center gap-3 transition-all duration-300',
                        item.purchased && 'bg-gray-50/50',
                        isAnimating && 'animate-fade-in'
                      )}
                    >
                      <button
                        className={cn(
                          'w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-all duration-200',
                          item.purchased
                            ? 'bg-primary border-primary'
                            : 'border-gray-300 hover:border-primary/60 hover:bg-primary/5'
                        )}
                        onClick={() => handleToggle(item.ingredientId)}
                        aria-label={item.purchased ? '取消已购' : '标记已购'}
                      >
                        {item.purchased && (
                          <Check className="w-3 h-3 text-white stroke-[3] animate-pop" />
                        )}
                      </button>

                      <div className="flex-1 min-w-0">
                        <div
                          className={cn(
                            'text-gray-800 transition-all duration-300',
                            item.purchased && 'line-through text-gray-400'
                          )}
                        >
                          {item.name}
                        </div>
                        <div
                          className={cn(
                            'text-xs text-gray-500 mt-0.5 transition-all duration-300',
                            item.purchased && 'text-gray-300'
                          )}
                        >
                          {Number.isInteger(item.totalQuantity)
                            ? item.totalQuantity
                            : item.totalQuantity.toFixed(1)}
                          {item.unit}
                        </div>
                      </div>

                      {item.estimatedPrice !== undefined && (
                        <span
                          className={cn(
                            'text-sm font-medium transition-all duration-300',
                            item.purchased ? 'text-gray-300' : 'text-primary-dark'
                          )}
                        >
                          ¥{item.estimatedPrice.toFixed(1)}
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-3 md:p-4 bg-gradient-to-t from-orange-50 via-orange-50/95 to-transparent pointer-events-none z-30">
        <div className="max-w-3xl mx-auto card p-4 pointer-events-auto shadow-xl border-orange-100">
          <div className="flex items-center justify-between gap-4 mb-3">
            <div className="flex items-baseline gap-2">
              <span className="text-xs text-gray-500">进度</span>
              <span className="font-semibold text-gray-800">
                {purchasedCount}
                <span className="text-gray-400 font-normal">/{totalCount}</span>
              </span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-xs text-gray-500">预估总价</span>
              <span className="font-semibold text-primary-dark text-lg">
                ¥{totalPrice.toFixed(0)}
              </span>
            </div>
          </div>

          <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden relative">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary-light to-primary transition-all duration-500 ease-out relative"
              style={{ width: `${progress}%` }}
            >
              {progress > 5 && (
                <div className="absolute inset-0 bg-white/20 rounded-full" />
              )}
            </div>
          </div>

          {purchasedPrice > 0 && (
            <div className="flex items-center justify-between mt-2 text-xs">
              <span className="text-gray-400">
                已购 {purchasedCount} 项 · 已花 ¥{purchasedPrice.toFixed(0)}
              </span>
              <span className="text-gray-400">
                剩余 ¥{(totalPrice - purchasedPrice).toFixed(0)}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
