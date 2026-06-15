import React from 'react';
import { X, Users, Wheat, Minus, Plus } from 'lucide-react';
import { useGameStore } from '@/store/gameStore';
import { WORKER_FOOD_COST } from '@/types';

interface HireWorkerModalProps {
  open: boolean;
  onClose: () => void;
}

export const HireWorkerModal: React.FC<HireWorkerModalProps> = ({ open, onClose }) => {
  const workers = useGameStore((s) => s.workers);
  const resources = useGameStore((s) => s.resources);
  const hireWorker = useGameStore((s) => s.hireWorker);

  const [count, setCount] = React.useState(1);

  React.useEffect(() => {
    if (open) setCount(1);
  }, [open]);

  if (!open) return null;

  const totalCost = WORKER_FOOD_COST * count;
  const maxAffordable = Math.floor(resources.food / WORKER_FOOD_COST);
  const canHire = maxAffordable >= count && count > 0;

  const handleHire = () => {
    if (hireWorker(count)) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center fade-in"
      style={{ background: 'rgba(61,43,31,0.55)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="w-[92%] max-w-md p-5 rounded-2xl fade-in-up"
        style={{
          background: 'var(--bg-papyrus)',
          border: '2px solid var(--gold)',
          boxShadow: 'var(--shadow-lg)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold" style={{ color: 'var(--text-brown)' }}>
            雇佣新工人
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: 'var(--text-brown-light)' }}
          >
            <X size={20} />
          </button>
        </div>

        <div
          className="p-4 rounded-xl mb-4 relative overflow-hidden"
          style={{
            background:
              'linear-gradient(135deg, rgba(207,181,59,0.18) 0%, rgba(207,181,59,0.06) 100%)',
            border: '1.5px dashed var(--gold)',
          }}
        >
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: 'var(--gold)', color: 'var(--text-brown)' }}
            >
              <Users size={22} />
            </div>
            <div>
              <div className="font-bold text-sm" style={{ color: 'var(--text-brown)' }}>
                古埃及劳工
              </div>
              <div className="text-xs" style={{ color: 'var(--text-brown-light)' }}>
                雇佣后进入空闲池，可派遣至各岗位
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className="flex items-center gap-1 px-2 py-1 rounded-lg"
                style={{ background: 'var(--food-bg)' }}
              >
                <Wheat size={14} style={{ color: 'var(--food-color)' }} />
                <span
                  className="font-bold text-sm"
                  style={{ color: 'var(--food-color)' }}
                >
                  {WORKER_FOOD_COST}
                </span>
              </div>
              <span className="text-xs" style={{ color: 'var(--text-brown-light)' }}>
                食物 / 人
              </span>
            </div>
            <div
              className="text-xs px-2 py-1 rounded-lg"
              style={{ background: 'rgba(34,139,34,0.1)', color: 'var(--food-color)' }}
            >
              当前食物: {Math.floor(resources.food)}
            </div>
          </div>
        </div>

        <div className="mb-4">
          <div className="text-xs font-medium mb-2" style={{ color: 'var(--text-brown-light)' }}>
            雇佣数量
          </div>
          <div
            className="flex items-center justify-between p-3 rounded-xl"
            style={{ background: 'rgba(61,43,31,0.05)' }}
          >
            <button
              onClick={() => setCount((c) => Math.max(1, c - 1))}
              disabled={count <= 1}
              className="w-9 h-9 rounded-xl flex items-center justify-center font-bold transition-all"
              style={{
                background: 'rgba(185,28,28,0.1)',
                color: 'var(--error)',
                border: '1px solid rgba(185,28,28,0.2)',
              }}
            >
              <Minus size={14} />
            </button>

            <div className="text-center">
              <div
                className="text-3xl font-bold"
                style={{ color: 'var(--text-brown)' }}
              >
                {count}
              </div>
              <div className="text-[10px]" style={{ color: 'var(--text-brown-light)' }}>
                最大可雇佣 {maxAffordable} 人
              </div>
            </div>

            <button
              onClick={() => setCount((c) => Math.min(maxAffordable, c + 1))}
              disabled={count >= maxAffordable}
              className="w-9 h-9 rounded-xl flex items-center justify-center font-bold transition-all"
              style={{
                background: 'rgba(58,140,58,0.12)',
                color: 'var(--success)',
                border: '1px solid rgba(58,140,58,0.25)',
              }}
            >
              <Plus size={14} />
            </button>
          </div>
        </div>

        <div
          className="flex items-center justify-between px-4 py-3 rounded-xl mb-4"
          style={{ background: 'rgba(207,181,59,0.12)' }}
        >
          <span className="text-sm font-medium" style={{ color: 'var(--text-brown)' }}>
            总计消耗
          </span>
          <div className="flex items-center gap-1.5">
            <Wheat size={16} style={{ color: 'var(--food-color)' }} />
            <span
              className="text-lg font-bold"
              style={{
                color: canHire ? 'var(--food-color)' : 'var(--error)',
              }}
            >
              {totalCost}
            </span>
            <span className="text-xs" style={{ color: 'var(--text-brown-light)' }}>
              ({resources.food >= totalCost ? '✓' : '✗'})
            </span>
          </div>
        </div>

        <div className="flex gap-2.5">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl font-bold text-sm transition-all"
            style={{
              background: 'rgba(61,43,31,0.08)',
              color: 'var(--text-brown)',
              border: '1px solid rgba(61,43,31,0.15)',
            }}
          >
            取消
          </button>
          <button
            onClick={handleHire}
            disabled={!canHire}
            className="flex-1 px-4 py-2.5 rounded-xl font-bold text-sm transition-all hover:scale-[1.02]"
            style={{
              background: canHire
                ? 'linear-gradient(135deg, var(--gold) 0%, var(--gold-dark) 100%)'
                : 'rgba(156,163,175,0.3)',
              color: 'var(--text-brown)',
              boxShadow: canHire ? 'var(--shadow-md)' : undefined,
              border: '1px solid var(--gold-dark)',
            }}
          >
            雇佣 {count} 人
          </button>
        </div>
      </div>
    </div>
  );
};
