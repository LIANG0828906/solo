import { useState, useCallback } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { X } from 'lucide-react';
import type { Subscription, Category } from '@/types';
import { CATEGORY_CONFIG, BILLING_CYCLE_LABELS } from '@/types';

type CalendarValue = Date | [Date | null, Date | null] | null;

interface CalendarViewProps {
  subscriptions: Subscription[];
}

interface DayDetail {
  date: Date;
  subs: Subscription[];
}

function formatDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function CalendarView({ subscriptions }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState<CalendarValue>(new Date());
  const [dayDetail, setDayDetail] = useState<DayDetail | null>(null);
  const [fadeKey, setFadeKey] = useState(0);

  const billingMap = new Map<string, Subscription[]>();
  for (const sub of subscriptions) {
    const key = sub.nextBillingDate.slice(0, 10);
    const list = billingMap.get(key) ?? [];
    list.push(sub);
    billingMap.set(key, list);
  }

  const handleActiveStartDateChange = useCallback(() => {
    setFadeKey((k) => k + 1);
  }, []);

  const tileContent = useCallback(
    ({ date, view }: { date: Date; view: string }) => {
      if (view !== 'month') return null;
      const key = formatDateKey(date);
      const subs = billingMap.get(key);
      if (!subs || subs.length === 0) return null;
      if (subs.length === 1) {
        return <div className="billing-dot" />;
      }
      return (
        <div className="billing-dots">
          {subs.slice(0, 3).map((_, i) => (
            <span key={i} />
          ))}
        </div>
      );
    },
    [billingMap]
  );

  const tileClassName = useCallback(
    ({ date, view }: { date: Date; view: string }) => {
      if (view !== 'month') return '';
      const key = formatDateKey(date);
      return billingMap.has(key) ? 'react-calendar__tile--hasBilling' : '';
    },
    [billingMap]
  );

  const handleDayClick = (value: Date) => {
    const key = formatDateKey(value);
    const subs = billingMap.get(key);
    if (subs && subs.length > 0) {
      setDayDetail({ date: value, subs });
    }
  };

  return (
    <div key={fadeKey} style={{ animation: 'fadeIn 0.3s ease' }}>
      <div className="rounded-xl p-3 border" style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
        <Calendar
          onChange={setCurrentDate}
          value={currentDate}
          onActiveStartDateChange={handleActiveStartDateChange}
          tileContent={tileContent}
          tileClassName={tileClassName}
          onClickDay={handleDayClick}
          locale="zh-CN"
          prev2Label={null}
          next2Label={null}
        />
      </div>

      {dayDetail && (
        <div className="modal-overlay" onClick={() => setDayDetail(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                {formatDateKey(dayDetail.date)} 扣款详情
              </h3>
              <button onClick={() => setDayDetail(null)} style={{ color: 'var(--color-text-secondary)' }}>
                <X size={18} />
              </button>
            </div>
            <div className="space-y-2.5">
              {dayDetail.subs.map((sub) => {
                const cfg = CATEGORY_CONFIG[sub.category as Category];
                return (
                  <div
                    key={sub.id}
                    className="rounded-lg p-3 border flex items-center gap-3"
                    style={{ background: 'var(--color-card)', borderColor: 'var(--color-border)' }}
                  >
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ background: cfg.color }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate" style={{ color: 'var(--color-text)' }}>
                        {sub.name}
                      </p>
                      <p className="text-[10px]" style={{ color: 'var(--color-text-secondary)' }}>
                        {cfg.label} · {BILLING_CYCLE_LABELS[sub.billingCycle]}
                      </p>
                    </div>
                    <span className="text-sm font-bold flex-shrink-0" style={{ color: 'var(--color-text)' }}>
                      ¥{sub.price.toFixed(2)}
                    </span>
                  </div>
                );
              })}
              <div className="pt-2 border-t flex justify-between" style={{ borderColor: 'var(--color-border)' }}>
                <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>当日合计</span>
                <span className="text-sm font-bold" style={{ color: 'var(--color-accent)' }}>
                  ¥{dayDetail.subs.reduce((s, sub) => s + sub.price, 0).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
