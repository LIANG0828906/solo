import React, { useMemo } from 'react';
import { Coins, CheckCircle2 } from 'lucide-react';
import type { Activity, Debt } from '@/types';

interface FloatingStatsProps {
  activity: Activity | null;
  debts: Debt[];
}

export default function FloatingStats({ activity, debts }: FloatingStatsProps) {
  const stats = useMemo(() => {
    const totalDebt = debts.reduce((sum, debt) => sum + debt.amount, 0);
    const settledCount = debts.filter(d => d.hasRedPacket).length;
    const totalCount = debts.length;
    const settledPercentage = totalCount > 0 ? (settledCount / totalCount) * 100 : 0;

    const totalExpense = activity?.expenses.reduce((sum, exp) => sum + exp.amount, 0) || 0;
    const settledAmount = debts.filter(d => d.hasRedPacket).reduce((sum, d) => sum + d.amount, 0);

    return {
      totalDebt,
      totalExpense,
      settledCount,
      totalCount,
      settledPercentage,
      settledAmount,
    };
  }, [activity, debts]);

  return (
    <div className="floating-stats">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #D4A574 0%, #C19A6B 100%)' }}
            >
              <Coins className="text-white" size={20} />
            </div>
            <div>
              <p className="text-sm opacity-70">待结算总额</p>
              <p className="text-2xl font-bold">¥{stats.totalDebt.toFixed(2)}</p>
            </div>
          </div>

          <div className="text-right">
            <p className="text-sm opacity-70">已用红包结算</p>
            <p className="text-xl font-bold" style={{ color: '#D4A574' }}>
              ¥{stats.settledAmount.toFixed(2)}
            </p>
          </div>
        </div>

        <div className="mb-1">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} style={{ color: '#D4A574' }} />
              <span className="text-sm">结算进度</span>
            </div>
            <span className="text-sm font-bold" style={{ color: '#D4A574' }}>
              {stats.settledPercentage.toFixed(0)}%
            </span>
          </div>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${stats.settledPercentage}%` }}
            />
          </div>
          <p className="text-xs opacity-60 mt-1 text-right">
            {stats.settledCount} / {stats.totalCount} 笔债务已结算
          </p>
        </div>
      </div>
    </div>
  );
}
