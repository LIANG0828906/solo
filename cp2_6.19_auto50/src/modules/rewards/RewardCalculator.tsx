import React, { useState, useEffect, useMemo } from 'react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { useJobStore } from '../../store/useJobStore';

const RewardCalculator: React.FC = () => {
  const getTotalBonus = useJobStore((state) => state.getTotalBonus);
  const getMonthlyBonus = useJobStore((state) => state.getMonthlyBonus);
  const referrals = useJobStore((state) => state.referrals);

  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimated(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const totalReward = useMemo(() => {
    return getTotalBonus();
  }, [referrals, getTotalBonus]);

  const monthlyData = useMemo(() => {
    const data = getMonthlyBonus();
    return data.map((item) => ({
      month: new Date(`${item.month}-01`),
      label: format(new Date(`${item.month}-01`), 'M月', { locale: zhCN }),
      amount: item.amount,
    }));
  }, [referrals, getMonthlyBonus]);

  const maxAmount = Math.max(...monthlyData.map((d) => d.amount), 1);

  const hiredCount = useMemo(() => {
    return referrals.filter((ref) => ref.status === '已入职').length;
  }, [referrals]);

  return (
    <div className="reward-calculator">
      <style>{`
        .reward-calculator {
          padding: 24px;
          max-width: 900px;
          margin: 0 auto;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        .page-title {
          font-size: 24px;
          font-weight: 600;
          color: #202124;
          margin-bottom: 24px;
        }
        .summary-section {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 24px;
          margin-bottom: 32px;
        }
        .summary-card {
          background: linear-gradient(135deg, #1A73E8 0%, #6EB1FF 100%);
          border-radius: 16px;
          padding: 24px;
          color: #fff;
          box-shadow: 0 4px 20px rgba(26, 115, 232, 0.3);
        }
        .summary-card.secondary {
          background: linear-gradient(135deg, #34A853 0%, #66DF80 100%);
          box-shadow: 0 4px 20px rgba(52, 168, 83, 0.3);
        }
        .summary-label {
          font-size: 14px;
          opacity: 0.9;
          margin-bottom: 8px;
        }
        .summary-value {
          font-size: 32px;
          font-weight: 700;
        }
        .chart-container {
          background: #fff;
          border-radius: 16px;
          padding: 32px 24px;
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
        }
        .chart-title {
          font-size: 20px;
          font-weight: 600;
          color: #202124;
          margin-bottom: 24px;
        }
        .bar-chart {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          height: 300px;
          padding: 0 8px;
          gap: 8px;
        }
        .bar-wrapper {
          display: flex;
          flex-direction: column;
          align-items: center;
          flex: 1;
          min-width: 0;
        }
        .bar-value {
          font-size: 12px;
          font-weight: 600;
          color: #1A73E8;
          margin-bottom: 8px;
          opacity: 0;
          animation: fadeInValue 0.5s ease-out forwards;
          animation-delay: 0.8s;
          white-space: nowrap;
        }
        @keyframes fadeInValue {
          to { opacity: 1; }
        }
        .bar {
          width: 100%;
          max-width: 50px;
          background: linear-gradient(180deg, #1A73E8 0%, #6EB1FF 100%);
          border-radius: 8px 8px 0 0;
          transform: scaleY(0);
          transform-origin: bottom;
          transition: transform 0.8s cubic-bezier(0.16, 1, 0.3, 1);
          position: relative;
          min-height: 4px;
        }
        .bar::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(180deg, rgba(255,255,255,0.3) 0%, transparent 50%);
          border-radius: 8px 8px 0 0;
        }
        .bar.animated {
          transform: scaleY(1);
        }
        .bar-label {
          margin-top: 12px;
          font-size: 13px;
          color: #5F6368;
          font-weight: 500;
        }
        .chart-grid {
          position: absolute;
          left: 0;
          right: 0;
          top: 0;
          bottom: 32px;
          pointer-events: none;
        }
        .chart-grid line {
          stroke: #E8EAED;
          stroke-width: 1;
          stroke-dasharray: 4 4;
        }
        .chart-wrapper {
          position: relative;
          padding-left: 50px;
        }
        .y-axis {
          position: absolute;
          left: 0;
          top: 0;
          bottom: 32px;
          width: 40px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          font-size: 11px;
          color: #9AA0A6;
        }
        @media (max-width: 768px) {
          .reward-calculator {
            padding: 16px;
          }
          .page-title {
            font-size: 20px;
            margin-bottom: 16px;
          }
          .summary-section {
            gap: 12px;
            margin-bottom: 20px;
          }
          .summary-card {
            padding: 16px;
          }
          .summary-value {
            font-size: 24px;
          }
          .chart-container {
            padding: 20px 12px;
          }
          .chart-title {
            font-size: 16px;
            margin-bottom: 16px;
          }
          .bar-chart {
            height: 200px;
            gap: 4px;
          }
          .bar-value {
            font-size: 10px;
          }
          .bar {
            max-width: 35px;
            border-radius: 4px 4px 0 0;
          }
          .bar-label {
            font-size: 11px;
          }
          .chart-wrapper {
            padding-left: 35px;
          }
          .y-axis {
            width: 30px;
            font-size: 9px;
          }
        }
      `}</style>

      <h2 className="page-title">奖励计算</h2>

      <div className="summary-section">
        <div className="summary-card">
          <div className="summary-label">累计推荐奖金</div>
          <div className="summary-value">¥{totalReward.toLocaleString('zh-CN')}</div>
        </div>
        <div className="summary-card secondary">
          <div className="summary-label">成功入职人数</div>
          <div className="summary-value">{hiredCount} 人</div>
        </div>
      </div>

      <div className="chart-container">
        <div className="chart-title">月度奖金趋势（近12个月）</div>
        <div className="chart-wrapper">
          <div className="y-axis">
            <span>¥{maxAmount.toLocaleString('zh-CN')}</span>
            <span>¥{Math.round(maxAmount * 0.75).toLocaleString('zh-CN')}</span>
            <span>¥{Math.round(maxAmount * 0.5).toLocaleString('zh-CN')}</span>
            <span>¥{Math.round(maxAmount * 0.25).toLocaleString('zh-CN')}</span>
            <span>¥0</span>
          </div>
          <svg className="chart-grid" width="100%" height="100%">
            <line x1="0" y1="0%" x2="100%" y2="0%" />
            <line x1="0" y1="25%" x2="100%" y2="25%" />
            <line x1="0" y1="50%" x2="100%" y2="50%" />
            <line x1="0" y1="75%" x2="100%" y2="75%" />
            <line x1="0" y1="100%" x2="100%" y2="100%" />
          </svg>
          <div className="bar-chart">
            {monthlyData.map((data, index) => {
              const heightPercent = (data.amount / maxAmount) * 100;
              return (
                <div key={index} className="bar-wrapper">
                  <div className="bar-value">
                    {data.amount > 0 ? `¥${data.amount.toLocaleString('zh-CN')}` : ''}
                  </div>
                  <div
                    className={`bar ${animated ? 'animated' : ''}`}
                    style={{
                      height: `${Math.max(heightPercent, 1)}%`,
                      transitionDelay: `${index * 0.05}s`,
                    }}
                  />
                  <div className="bar-label">{data.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RewardCalculator;
