import { useMemo, useState, useEffect, useCallback } from 'react';
import { XCircle, Clock, ShoppingBag, User, AlertCircle } from 'lucide-react';
import { useMarketStore } from '@/store/useMarketStore';

function formatTime(ts: number): string {
  const d = new Date(ts);
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(
    d.getMinutes()
  ).padStart(2, '0')}`;
}

function canCancel(createdAt: number): boolean {
  return Date.now() - createdAt < 5 * 60 * 1000;
}

function remainingTime(createdAt: number): string {
  const left = Math.max(0, 5 * 60 * 1000 - (Date.now() - createdAt));
  const mins = Math.floor(left / 60000);
  const secs = Math.floor((left % 60000) / 1000);
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

export function TransactionModule() {
  const transactions = useMarketStore(s => s.transactions);
  const cancelTransaction = useMarketStore(s => s.cancelTransaction);

  const [, forceTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => forceTick(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const sorted = useMemo(
    () => [...transactions].sort((a, b) => b.createdAt - a.createdAt),
    [transactions]
  );

  const handleCancel = useCallback(
    (txId: string, createdAt: number) => {
      if (!canCancel(createdAt)) {
        alert('可取消时间已过');
        return;
      }
      if (confirm('确定取消这笔交易吗？库存将被恢复。')) {
        const ok = cancelTransaction(txId);
        if (!ok) {
          alert('取消失败，请刷新后重试');
        }
      }
    },
    [cancelTransaction]
  );

  if (sorted.length === 0) {
    return (
      <div className="glass-card p-12 text-center">
        <ShoppingBag size={48} className="mx-auto mb-3 text-amber-400" />
        <p className="text-amber-700">暂无交易记录</p>
        <p className="text-sm text-amber-600 mt-1">去首页购买商品后，交易记录将显示在这里</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {sorted.map((tx, idx) => {
        const isCancelled = tx.status === 'cancelled';
        const canCancelNow = !isCancelled && canCancel(tx.createdAt);

        return (
          <div
            key={tx.id}
            className={`glass-card p-4 transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]
                       hover:bg-amber-100/50 opacity-0 animate-fade-in-up
                       ${isCancelled ? 'border-red-400/50 bg-red-50/40' : ''}`}
            style={{ animationDelay: `${Math.min(idx * 60, 400)}ms` }}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-semibold text-amber-900 truncate">{tx.productName}</h4>
                  {isCancelled ? (
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-500 text-white">
                      已取消
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-500 text-white">
                      已完成
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-amber-700">
                  <span className="flex items-center gap-1">
                    <User size={14} /> {tx.buyerNickname}
                  </span>
                  <span>摊位: {tx.stallName}</span>
                  <span>
                    ¥{tx.unitPrice} × {tx.quantity} ={' '}
                    <span className="font-semibold text-amber-900">¥{tx.totalPrice}</span>
                  </span>
                </div>
                <div className="flex items-center gap-1 mt-1 text-xs text-amber-600">
                  <Clock size={12} />
                  <span>{formatTime(tx.createdAt)}</span>
                  {canCancelNow && <span className="text-amber-600">· 可取消 ({remainingTime(tx.createdAt)})</span>}
                </div>
              </div>

              {canCancelNow && (
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1 text-xs text-amber-700 bg-amber-100 px-2 py-1 rounded-full">
                    <AlertCircle size={12} />
                    {remainingTime(tx.createdAt)}
                  </span>
                  <button
                    onClick={() => handleCancel(tx.id, tx.createdAt)}
                    className="btn-danger flex items-center gap-1 !py-1.5 !px-3 !text-sm whitespace-nowrap"
                  >
                    <XCircle size={14} />
                    取消交易
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
