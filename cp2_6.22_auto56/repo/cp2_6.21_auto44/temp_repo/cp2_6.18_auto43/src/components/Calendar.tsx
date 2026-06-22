import { useEffect, useMemo, useState } from 'react';
import { HealthRecord } from '../modules/data/types';
import { getCalendarStatus, getDailyRecords, formatDate } from '../modules/data';

const WEEK_LABELS = ['日', '一', '二', '三', '四', '五', '六'];

const pad = (n: number) => n.toString().padStart(2, '0');

interface Props {
  records: HealthRecord[];
}

export const Calendar = ({ records }: Props) => {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [activeDate, setActiveDate] = useState<string | null>(null);
  const [popupPos, setPopupPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const statusMap = useMemo(
    () => getCalendarStatus(records, year, month),
    [records, year, month]
  );

  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayISO = formatDate(new Date());

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const dotColor = (status: 'taken' | 'missed' | 'none') => {
    switch (status) {
      case 'taken': return '#34D399';
      case 'missed': return '#F87171';
      default: return '#D1D5DB';
    }
  };

  const prevMonth = () => {
    if (month === 0) { setYear(year - 1); setMonth(11); }
    else setMonth(month - 1);
    setActiveDate(null);
  };

  const nextMonth = () => {
    if (month === 11) { setYear(year + 1); setMonth(0); }
    else setMonth(month + 1);
    setActiveDate(null);
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.mt-calendar') && !target.closest('.mt-popup')) {
        setActiveDate(null);
      }
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  const dailyList = activeDate ? getDailyRecords(records, activeDate) : [];

  return (
    <div className="mt-calendar" style={styles.wrapper}>
      <div style={styles.header}>
        <button onClick={prevMonth} style={styles.navBtn}>‹</button>
        <div style={styles.title}>{year} 年 {month + 1} 月</div>
        <button onClick={nextMonth} style={styles.navBtn}>›</button>
      </div>
      <div style={styles.weekRow}>
        {WEEK_LABELS.map((w) => (
          <div key={w} style={styles.weekLabel}>{w}</div>
        ))}
      </div>
      <div style={styles.grid}>
        {cells.map((d, i) => {
          if (d === null) return <div key={i} style={styles.empty} />;
          const iso = `${year}-${pad(month + 1)}-${pad(d)}`;
          const status = statusMap.get(iso) || 'none';
          const isToday = iso === todayISO;
          const isActive = iso === activeDate;
          return (
            <div
              key={i}
              style={{
                ...styles.cell,
                background: isActive ? '#EEF2FF' : isToday ? '#FEF3C7' : 'transparent',
                color: isToday ? '#92400E' : '#374151',
                fontWeight: isToday ? 700 : 500,
                border: isActive ? '1px solid #C7D2FE' : '1px solid transparent'
              }}
              onClick={(e) => {
                setActiveDate(iso);
                const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                const parentRect = (e.currentTarget.closest('.mt-calendar') as HTMLElement)!.getBoundingClientRect();
                setPopupPos({
                  x: rect.left - parentRect.left + rect.width / 2,
                  y: rect.bottom - parentRect.top + 6
                });
              }}
            >
              <span style={styles.cellNum}>{d}</span>
              <span style={{ ...styles.dot, background: dotColor(status) }} />
            </div>
          );
        })}
      </div>
      <div style={styles.legend}>
        <span style={styles.legendItem}><span style={{ ...styles.legendDot, background: '#34D399' }} />按时</span>
        <span style={styles.legendItem}><span style={{ ...styles.legendDot, background: '#F87171' }} />漏服</span>
        <span style={styles.legendItem}><span style={{ ...styles.legendDot, background: '#D1D5DB' }} />无记录</span>
      </div>

      {activeDate && (
        <div
          className="mt-popup"
          style={{
            ...styles.popup,
            left: Math.min(Math.max(popupPos.x - 120, 4), 280 - 240 - 4),
            top: popupPos.y
          }}
        >
          <div style={styles.popupHeader}>
            <span style={styles.popupTitle}>{activeDate} 详细记录</span>
            <button style={styles.popupClose} onClick={() => setActiveDate(null)}>×</button>
          </div>
          <div style={styles.popupBody}>
            {dailyList.length === 0 ? (
              <div style={styles.popupEmpty}>该日暂无记录</div>
            ) : (
              dailyList.slice(0, 8).map((r) => (
                <div key={r.id} style={styles.popupItem}>
                  <div style={styles.popupItemTop}>
                    <span style={styles.popupTime}>{r.medication.time}</span>
                    <span style={{
                      ...styles.popupTag,
                      background: r.medication.taken ? '#D1FAE5' : '#FEE2E2',
                      color: r.medication.taken ? '#065F46' : '#991B1B'
                    }}>
                      {r.medication.taken ? '已服' : '漏服'}
                    </span>
                  </div>
                  <div style={styles.popupMed}>{r.medication.name} · {r.medication.dosage}</div>
                  {(r.metrics.systolic !== undefined || r.metrics.bloodSugar !== undefined) && (
                    <div style={styles.popupMetrics}>
                      {r.metrics.systolic !== undefined && (
                        <span>血压 {r.metrics.systolic}/{r.metrics.diastolic}</span>
                      )}
                      {r.metrics.bloodSugar !== undefined && (
                        <span>血糖 {r.metrics.bloodSugar}mmol/L</span>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    width: 280,
    height: 220,
    background: '#fff',
    borderRadius: 12,
    padding: 12,
    boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
    position: 'relative'
  },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  navBtn: {
    width: 24, height: 24, border: 'none', background: '#F3F4F6',
    borderRadius: 6, cursor: 'pointer', color: '#6B7280', fontSize: 16, fontWeight: 700,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'background 0.2s'
  },
  title: { fontSize: 13, fontWeight: 600, color: '#1F2937' },
  weekRow: { display: 'grid', gridTemplateColumns: 'repeat(7, 28px)', gap: 2, marginBottom: 2 },
  weekLabel: {
    width: 28, height: 18, fontSize: 10, color: '#9CA3AF', fontWeight: 600,
    display: 'flex', alignItems: 'center', justifyContent: 'center'
  },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(7, 28px)', gap: 2 },
  empty: { width: 28, height: 28 },
  cell: {
    width: 28, height: 28, borderRadius: 6, position: 'relative',
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', fontSize: 11, lineHeight: 1,
    transition: 'all 0.2s ease'
  },
  cellNum: { marginTop: 2 },
  dot: {
    position: 'absolute', bottom: 3, left: '50%', transform: 'translateX(-50%)',
    width: 5, height: 5, borderRadius: '50%'
  },
  legend: {
    display: 'flex', gap: 10, marginTop: 8, justifyContent: 'center',
    fontSize: 10, color: '#6B7280'
  },
  legendItem: { display: 'inline-flex', alignItems: 'center', gap: 3 },
  legendDot: { width: 6, height: 6, borderRadius: '50%', display: 'inline-block' },
  popup: {
    position: 'absolute', width: 240, background: '#fff', borderRadius: 8,
    boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 100,
    overflow: 'hidden', animation: 'popupIn 0.2s ease'
  },
  popupHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '10px 12px', borderBottom: '1px solid #F3F4F6', background: '#FAFBFC'
  },
  popupTitle: { fontSize: 12, fontWeight: 600, color: '#1F2937' },
  popupClose: {
    border: 'none', background: 'transparent', cursor: 'pointer',
    fontSize: 18, color: '#9CA3AF', lineHeight: 1
  },
  popupBody: { padding: 8, maxHeight: 240, overflowY: 'auto' },
  popupEmpty: { padding: '16px 0', textAlign: 'center', color: '#9CA3AF', fontSize: 12 },
  popupItem: {
    padding: '8px 10px', borderRadius: 6, marginBottom: 4,
    background: '#F9FAFB', border: '1px solid #F3F4F6'
  },
  popupItemTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  popupTime: { fontSize: 11, fontWeight: 600, color: '#6366F1' },
  popupTag: { fontSize: 10, padding: '2px 6px', borderRadius: 4, fontWeight: 600 },
  popupMed: { fontSize: 11, color: '#374151', marginBottom: 2 },
  popupMetrics: { fontSize: 10, color: '#6B7280', display: 'flex', gap: 10 }
};
