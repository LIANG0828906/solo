import { useMemo, useState } from 'react';
import { PieChart } from 'react-minimal-pie-chart';
import { AlertTriangle } from 'lucide-react';
import type { Subscription, Category } from '@/types';
import { CATEGORY_CONFIG, BILLING_CYCLE_LABELS } from '@/types';

interface StatisticsPanelProps {
  subscriptions: Subscription[];
}

function getMonthlyPrice(sub: Subscription): number {
  switch (sub.billingCycle) {
    case 'monthly': return sub.price;
    case 'quarterly': return sub.price / 3;
    case 'yearly': return sub.price / 12;
    default: return sub.price;
  }
}

export function StatisticsPanel({ subscriptions }: StatisticsPanelProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const stats = useMemo(() => {
    const totalMonthly = subscriptions.reduce((sum, sub) => sum + getMonthlyPrice(sub), 0);

    const categoryMap = new Map<Category, number>();
    for (const sub of subscriptions) {
      const monthly = getMonthlyPrice(sub);
      categoryMap.set(sub.category, (categoryMap.get(sub.category) ?? 0) + monthly);
    }

    const pieData = (Object.entries(CATEGORY_CONFIG) as [Category, typeof CATEGORY_CONFIG[Category]][])
      .filter(([key]) => (categoryMap.get(key) ?? 0) > 0)
      .map(([key, cfg]) => ({
        title: cfg.label,
        value: categoryMap.get(key) ?? 0,
        color: cfg.pieColor,
        key,
      }));

    const now = new Date();
    const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const expiring = subscriptions.filter((sub) => {
      const d = new Date(sub.nextBillingDate);
      return d >= now && d <= sevenDaysLater;
    });

    return { totalMonthly, pieData, expiring };
  }, [subscriptions]);

  return (
    <div className="space-y-4">
      {/* Total Monthly */}
      <div
        className="rounded-xl p-4 border"
        style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
      >
        <p className="text-[10px] font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
          当月预估支出
        </p>
        <p className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
          ¥{stats.totalMonthly.toFixed(2)}
        </p>
        <p className="text-[10px] mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
          共 {subscriptions.length} 项订阅
        </p>
      </div>

      {/* Pie Chart */}
      {stats.pieData.length > 0 && (
        <div
          className="rounded-xl p-4 border"
          style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
        >
          <p className="text-[10px] font-medium mb-3" style={{ color: 'var(--color-text-secondary)' }}>
            分类支出占比
          </p>
          <div className="w-36 h-36 mx-auto mb-3">
            <PieChart
              data={stats.pieData}
              lineWidth={40}
              paddingAngle={2}
              animate
              style={{ width: '100%', height: '100%' }}
              label={({ dataEntry }) =>
                dataEntry.percentage > 10 ? `${dataEntry.percentage.toFixed(0)}%` : ''
              }
              labelStyle={{
                fontSize: '9px',
                fontFamily: 'Inter, sans-serif',
                fill: '#fff',
                fontWeight: 600,
              }}
              labelPosition={60}
              segmentsStyle={{
                transition: 'transform 0.2s ease',
                cursor: 'pointer',
                transformOrigin: 'center',
              }}
              segmentsShift={(index) => (index === hoveredIndex ? 4 : 0)}
              onMouseOver={(_, index) => setHoveredIndex(index)}
              onMouseOut={() => setHoveredIndex(null)}
            />
          </div>
          <div className="space-y-1.5">
            {stats.pieData.map((item) => (
              <div key={item.key} className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: item.color }} />
                <span className="text-[11px] flex-1" style={{ color: 'var(--color-text-secondary)' }}>
                  {item.title}
                </span>
                <span className="text-[11px] font-medium" style={{ color: 'var(--color-text)' }}>
                  ¥{item.value.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Expiring Soon */}
      <div
        className="rounded-xl p-4 border"
        style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
      >
        <div className="flex items-center gap-1.5 mb-3">
          <AlertTriangle size={12} style={{ color: 'var(--color-accent)' }} />
          <p className="text-[10px] font-medium" style={{ color: 'var(--color-accent)' }}>
            即将到期（7天内）
          </p>
          <span
            className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
            style={{ background: 'var(--color-accent)22', color: 'var(--color-accent)' }}
          >
            {stats.expiring.length}
          </span>
        </div>
        {stats.expiring.length === 0 ? (
          <p className="text-[11px]" style={{ color: 'var(--color-text-secondary)' }}>
            近7天无到期订阅
          </p>
        ) : (
          <div className="space-y-2">
            {stats.expiring.map((sub) => {
              const cfg = CATEGORY_CONFIG[sub.category as Category];
              const daysLeft = Math.ceil(
                (new Date(sub.nextBillingDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
              );
              return (
                <div
                  key={sub.id}
                  className="rounded-lg p-2.5 border flex items-center gap-2"
                  style={{ background: 'var(--color-card)', borderColor: 'var(--color-border)' }}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ background: cfg.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-medium truncate" style={{ color: 'var(--color-text)' }}>
                      {sub.name}
                    </p>
                    <p className="text-[9px]" style={{ color: 'var(--color-text-secondary)' }}>
                      ¥{sub.price.toFixed(2)}/{BILLING_CYCLE_LABELS[sub.billingCycle]}
                    </p>
                  </div>
                  <span className="text-[10px] font-medium flex-shrink-0" style={{ color: 'var(--color-accent)' }}>
                    {daysLeft}天
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
