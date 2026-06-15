import React, { useState, useEffect, useRef } from 'react';
import { CrowdfundingSupport } from '../types';
import { formatCurrency } from '../utils/format';

interface CrowdfundingBarProps {
  goal: number;
  raised: number;
  deadline: string;
  supports: CrowdfundingSupport[];
  onSupport: (amount: number) => void;
  disabled?: boolean;
}

export function CrowdfundingBar({ goal, raised, deadline, supports, onSupport, disabled = false }: CrowdfundingBarProps) {
  const [amount, setAmount] = useState<number>(100);
  const [showInput, setShowInput] = useState(false);
  const [displayedRaised, setDisplayedRaised] = useState(0);
  const barRef = useRef<HTMLDivElement>(null);
  const hasAnimated = useRef(false);

  const percentage = goal > 0 ? Math.min((raised / goal) * 100, 100) : 0;

  useEffect(() => {
    if (!hasAnimated.current) {
      hasAnimated.current = true;
      const duration = 1500;
      const startTime = performance.now();
      const startValue = 0;
      const endValue = raised;

      function animate(currentTime: number) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeOut = 1 - Math.pow(1 - progress, 3);
        setDisplayedRaised(Math.floor(startValue + (endValue - startValue) * easeOut));

        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      }

      requestAnimationFrame(animate);
    } else {
      setDisplayedRaised(raised);
    }
  }, [raised]);

  const handleSupport = () => {
    if (amount >= 10 && amount <= 500 && Number.isInteger(amount)) {
      onSupport(amount);
      setShowInput(false);
    }
  };

  const quickAmounts = [10, 50, 100, 200, 500];

  return (
    <div className="bg-gradient-to-br from-white to-stone-50 rounded-2xl p-6 shadow-lg border border-stone-100">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-stone-800" style={{ fontFamily: "'Noto Serif SC', serif" }}>
          📚 众筹支持
        </h3>
        <span className="text-sm text-stone-500">截止：{deadline}</span>
      </div>

      <div ref={barRef} className="mb-4">
        <div className="relative h-4 bg-stone-100 rounded-full overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-600 transition-all duration-1000 ease-out"
            style={{ width: `${percentage}%` }}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-white/30 to-transparent" />
          </div>
        </div>
      </div>

      <div className="flex items-end justify-between mb-6">
        <div>
          <p className="text-xs text-stone-500 mb-1">已筹金额</p>
          <p className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            {formatCurrency(Math.floor(displayedRaised))}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-stone-500 mb-1">目标金额</p>
          <p className="text-lg font-semibold text-stone-600">{formatCurrency(goal)}</p>
        </div>
      </div>

      <div className="text-center mb-6">
        <span className="text-sm text-stone-600">
          已完成{' '}
          <span className="font-bold text-purple-600 text-lg">{percentage.toFixed(1)}%</span>
        </span>
      </div>

      {!showInput ? (
        <button
          onClick={() => !disabled && setShowInput(true)}
          disabled={disabled}
          className="w-full py-3 bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-600 text-white rounded-xl font-medium hover:from-blue-600 hover:via-purple-600 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          支持众筹
        </button>
      ) : (
        <div className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            {quickAmounts.map(amt => (
              <button
                key={amt}
                onClick={() => setAmount(amt)}
                className={`flex-1 min-w-[50px] py-2 rounded-lg text-sm font-medium transition-all ${
                  amount === amt
                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-md'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                ¥{amt}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              type="number"
              min={10}
              max={500}
              step={1}
              value={amount}
              onChange={(e) => setAmount(parseInt(e.target.value) || 0)}
              placeholder="输入金额 (10-500)"
              className="flex-1 px-4 py-2.5 border border-stone-200 rounded-lg focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 outline-none transition-all"
            />
            <button
              onClick={handleSupport}
              disabled={amount < 10 || amount > 500 || !Number.isInteger(amount)}
              className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              支付
            </button>
          </div>

          <button
            onClick={() => setShowInput(false)}
            className="w-full py-2 text-sm text-stone-400 hover:text-stone-600 transition-colors"
          >
            取消
          </button>
        </div>
      )}

      {supports.length > 0 && (
        <div className="mt-6 pt-6 border-t border-stone-100">
          <h4 className="text-sm font-medium text-stone-700 mb-3">贡献排行榜</h4>
          <div className="space-y-2">
            {supports.slice(0, 5).map((support, index) => (
              <div key={support.id} className="flex items-center gap-3">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                  index === 0 ? 'bg-amber-500' :
                  index === 1 ? 'bg-stone-400' :
                  index === 2 ? 'bg-amber-700' : 'bg-stone-200 text-stone-500'
                }`}>
                  {index + 1}
                </span>
                <img
                  src={support.userAvatar}
                  alt={support.userNickname}
                  className="w-7 h-7 rounded-full object-cover"
                />
                <span className="text-sm text-stone-700 flex-1 truncate">{support.userNickname}</span>
                <span className="text-sm font-semibold text-purple-600">¥{support.amount}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
