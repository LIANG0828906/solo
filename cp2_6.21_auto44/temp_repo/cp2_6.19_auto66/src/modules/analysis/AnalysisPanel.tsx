import React, { useMemo, useState } from 'react';
import { Wallet, TrendingUp, Award, RefreshCw } from 'lucide-react';
import { useAssetStore } from '../asset/assetStore';
import {
  calculateTotalMarketValue,
  calculateTotalPortfolioReturn,
  calculateReturnRate,
  getTopPerformer,
  formatCurrency,
  formatPercentage,
} from '@/utils/calculations';

const AnalysisPanel: React.FC = () => {
  const { assets, loadFromStorage } = useAssetStore();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const totalMarketValue = useMemo(() => calculateTotalMarketValue(assets), [assets]);
  const totalReturn = useMemo(() => calculateTotalPortfolioReturn(assets), [assets]);
  const topPerformer = useMemo(() => getTopPerformer(assets), [assets]);
  const portfolioReturnRate = useMemo(() => {
    const totalCost = assets.reduce((sum, a) => sum + a.buyPrice * a.quantity, 0);
    if (totalCost <= 0) return 0;
    return ((totalMarketValue - totalCost) / totalCost) * 100;
  }, [assets, totalMarketValue]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadFromStorage();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const metrics = [
    {
      title: '总市值',
      value: `¥${formatCurrency(totalMarketValue)}`,
      icon: Wallet,
      color: 'from-blue-500 to-blue-600',
      showRefresh: true,
    },
    {
      title: '总收益',
      value: `${totalReturn >= 0 ? '+' : ''}¥${formatCurrency(totalReturn)}`,
      subValue: formatPercentage(portfolioReturnRate),
      icon: TrendingUp,
      color: totalReturn >= 0 ? 'from-emerald-500 to-emerald-600' : 'from-red-500 to-red-600',
      valueColor: totalReturn >= 0 ? 'text-success' : 'text-danger',
    },
    {
      title: '最高收益率',
      value: topPerformer
        ? formatPercentage(calculateReturnRate(topPerformer.buyPrice, topPerformer.currentPrice))
        : '--',
      subValue: topPerformer?.name || '--',
      icon: Award,
      color: 'from-yellow-500 to-amber-600',
      highlight: true,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      {metrics.map((metric, index) => {
        const Icon = metric.icon;
        return (
          <div
            key={metric.title}
            className={`card p-6 animate-slide-in-left relative overflow-hidden ${
              metric.highlight ? 'border-2 border-warning' : ''
            }`}
            style={{ animationDelay: `${index * 150}ms` }}
          >
            {metric.highlight && (
              <div className="absolute inset-0 bg-gradient-to-br from-warning/5 to-transparent pointer-events-none" />
            )}

            <div className="relative flex items-start justify-between">
              <div>
                <p className="text-sm text-text-secondary mb-1">{metric.title}</p>
                <p className={`text-2xl font-bold ${metric.valueColor || 'text-text-primary'}`}>
                  {metric.value}
                </p>
                {metric.subValue && (
                  <p className="text-sm text-text-secondary mt-1">{metric.subValue}</p>
                )}
              </div>

              <div className="flex items-start gap-2">
                {metric.showRefresh && (
                  <button
                    onClick={handleRefresh}
                    className="p-2 text-text-secondary hover:text-accent transition-colors"
                    title="刷新数据"
                  >
                    <RefreshCw
                      size={18}
                      className={isRefreshing ? 'animate-spin text-accent' : ''}
                    />
                  </button>
                )}
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${metric.color} flex items-center justify-center shadow-lg`}
                >
                  <Icon className="text-white" size={22} />
                </div>
              </div>
            </div>

            {metric.highlight && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-warning rounded-full animate-pulse" />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default AnalysisPanel;
