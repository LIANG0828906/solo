import React from 'react';
import { useStore } from '@/stores/useStore';
import { AnimatedNumber } from '@/components/common/animatedNumber';

const StatItem: React.FC<{
  label: string;
  value: number;
  compareValue: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
}> = ({ label, value, compareValue, prefix = '', suffix = '', decimals = 0 }) => {
  const showIncrease = value > compareValue;

  return (
    <div className="stat-item">
      <span className="stat-label">{label}</span>
      <div className="stat-value-row">
        <AnimatedNumber
          value={value}
          prefix={prefix}
          suffix={suffix}
          decimals={decimals}
        />
        {showIncrease && compareValue > 0 && (
          <span className="stat-increase" title="较昨日同期增长">
            ↑
          </span>
        )}
      </div>
    </div>
  );
};

export const StatisticsBar: React.FC = () => {
  const statistics = useStore((state) => state.statistics);

  return (
    <div className="statistics-bar">
      <div className="statistics-container">
        <StatItem
          label="今日订单"
          value={statistics.todayOrders}
          compareValue={statistics.yesterdayOrders}
          suffix="单"
        />
        <StatItem
          label="今日收入"
          value={statistics.todayRevenue}
          compareValue={statistics.yesterdayRevenue}
          prefix="¥"
          decimals={2}
        />
        <StatItem
          label="待处理"
          value={statistics.pendingOrders}
          compareValue={0}
          suffix="单"
        />
        <StatItem
          label="已送达"
          value={statistics.deliveredOrders}
          compareValue={0}
          suffix="单"
        />
      </div>
      <style>{`
        .statistics-bar {
          background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%);
          padding: 20px 0;
        }
        .statistics-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 24px;
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 24px;
        }
        .stat-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }
        .stat-label {
          color: rgba(255, 255, 255, 0.8);
          font-size: 14px;
          font-weight: 400;
        }
        .stat-value-row {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .animated-number {
          color: white;
          font-size: 28px;
          font-weight: 700;
          line-height: 1.2;
        }
        .stat-increase {
          color: #4ADE80;
          font-size: 20px;
          font-weight: 700;
          animation: bounce 0.6s ease-in-out infinite;
        }
        @media (max-width: 768px) {
          .statistics-container {
            grid-template-columns: repeat(2, 1fr);
            gap: 16px;
            padding: 0 16px;
          }
          .stat-label {
            font-size: 12px;
          }
          .animated-number {
            font-size: 22px;
          }
          .stat-increase {
            font-size: 16px;
          }
        }
      `}</style>
    </div>
  );
};
