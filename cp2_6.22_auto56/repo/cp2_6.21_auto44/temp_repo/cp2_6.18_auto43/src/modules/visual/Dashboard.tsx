import { useEffect, useMemo, useState } from 'react';
import { LineChart, Line, ResponsiveContainer, Dot, XAxis, YAxis } from 'recharts';
import { useHealthStore } from '../../store/useHealthStore';
import { SummaryCard, SummaryCardData, DetailPoint } from './Cards/SummaryCard';
import { Calendar } from '../../components/Calendar';
import { AddRecordModal } from '../../components/AddRecordModal';
import {
  isAbnormalBP,
  getMonthlyAverageDoses,
  getAbnormalRatio,
  getDateForLastNDays,
  formatDate,
  queryByDateRange
} from '../data';

interface MiniPoint {
  date: string;
  doses: number;
}

const MiniDoseChart = ({ data }: { data: MiniPoint[] }) => {
  const hasData = data.length > 0;
  const minY = 0;
  const maxY = hasData ? Math.max(...data.map((d) => d.doses), 1) : 5;

  return (
    <div style={styles.miniChartWrap}>
      <div style={styles.miniChartHeader}>
        <span style={styles.miniChartTitle}>最近 7 天用药趋势</span>
        <span style={styles.miniChartSub}>每日服药次数</span>
      </div>
      <div style={{ height: 80, width: '100%' }}>
        {!hasData ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#9CA3AF', fontSize: 12 }}>暂无数据</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 12, right: 12, left: -18, bottom: -14 }}>
              <YAxis type="number" domain={[minY, maxY + 1]} hide />
              <XAxis dataKey="date" hide />
              <Line
                type="monotone"
                dataKey="doses"
                stroke="#3B82F6"
                strokeWidth={2}
                dot={(props: any) => {
                  const { cx, cy } = props;
                  return (
                    <Dot
                      {...props}
                      r={2.5}
                      cx={cx}
                      cy={cy}
                      fill="#fff"
                      stroke="#3B82F6"
                      strokeWidth={1}
                    />
                  );
                }}
                activeDot={{ r: 3.5, fill: '#fff', stroke: '#3B82F6', strokeWidth: 1.2 }}
                connectNulls
                isAnimationActive
                animationDuration={600}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

const computeDailyDoses = (records: any[], days: number): MiniPoint[] => {
  const dates = getDateForLastNDays(days);
  const start = dates[0];
  const end = dates[dates.length - 1];
  const filtered = queryByDateRange(records, start, end);
  const counter = new Map<string, number>();
  dates.forEach((d) => counter.set(d, 0));
  for (const r of filtered) {
    if (r.medication?.taken) {
      counter.set(r.date, (counter.get(r.date) || 0) + 1);
    }
  }
  return dates.map((d) => ({
    date: d.slice(5),
    doses: counter.get(d) || 0
  }));
};

const compute30DayBP = (records: any[]): DetailPoint[] => {
  const dates = getDateForLastNDays(30);
  const start = dates[0];
  const end = dates[dates.length - 1];
  const filtered = queryByDateRange(records, start, end);
  const byDay = new Map<string, { sys: number[]; dia: number[] }>();
  dates.forEach((d) => byDay.set(d, { sys: [], dia: [] }));
  for (const r of filtered) {
    const entry = byDay.get(r.date);
    if (!entry) continue;
    if (r.metrics?.systolic !== undefined) entry.sys.push(r.metrics.systolic);
    if (r.metrics?.diastolic !== undefined) entry.dia.push(r.metrics.diastolic);
  }
  const result: DetailPoint[] = [];
  for (const d of dates) {
    const e = byDay.get(d)!;
    const sys = e.sys.length ? Math.round(e.sys.reduce((a, b) => a + b, 0) / e.sys.length) : undefined;
    const dia = e.dia.length ? Math.round(e.dia.reduce((a, b) => a + b, 0) / e.dia.length) : undefined;
    if (sys !== undefined && dia !== undefined) {
      result.push({ date: d, value: `${sys}/${dia}` });
    }
  }
  return result;
};

const compute30DayAdherence = (records: any[]): DetailPoint[] => {
  const dates = getDateForLastNDays(30);
  const start = dates[0];
  const end = dates[dates.length - 1];
  const filtered = queryByDateRange(records, start, end);
  const byDay = new Map<string, { taken: number; total: number }>();
  dates.forEach((d) => byDay.set(d, { taken: 0, total: 0 }));
  for (const r of filtered) {
    const entry = byDay.get(r.date);
    if (!entry) continue;
    entry.total++;
    if (r.medication?.taken) entry.taken++;
  }
  const result: DetailPoint[] = [];
  for (const d of dates) {
    const e = byDay.get(d)!;
    if (e.total > 0) {
      result.push({ date: d, value: Math.round((e.taken / e.total) * 100) });
    }
  }
  return result;
};

const compute30DayAbnormalDays = (records: any[]): DetailPoint[] => {
  const dates = getDateForLastNDays(30);
  const start = dates[0];
  const end = dates[dates.length - 1];
  const filtered = queryByDateRange(records, start, end);
  const byDay = new Map<string, { abn: number; total: number }>();
  dates.forEach((d) => byDay.set(d, { abn: 0, total: 0 }));
  for (const r of filtered) {
    const entry = byDay.get(r.date);
    if (!entry) continue;
    if (r.metrics?.systolic !== undefined && r.metrics?.diastolic !== undefined) {
      entry.total++;
      if (isAbnormalBP(r.metrics.systolic, r.metrics.diastolic)) entry.abn++;
    }
  }
  const result: DetailPoint[] = [];
  for (const d of dates) {
    const e = byDay.get(d)!;
    if (e.total > 0) {
      result.push({ date: d, value: e.abn > 0 ? 1 : 0 });
    }
  }
  return result;
};

const compute30DayAbnormalRatio = (records: any[]): DetailPoint[] => {
  const dates = getDateForLastNDays(30);
  const start = dates[0];
  const end = dates[dates.length - 1];
  const filtered = queryByDateRange(records, start, end);
  const byDay = new Map<string, { abn: number; total: number }>();
  dates.forEach((d) => byDay.set(d, { abn: 0, total: 0 }));
  for (const r of filtered) {
    const entry = byDay.get(r.date);
    if (!entry) continue;
    if (r.metrics?.systolic !== undefined && r.metrics?.diastolic !== undefined) {
      entry.total++;
      if (isAbnormalBP(r.metrics.systolic, r.metrics.diastolic)) entry.abn++;
    }
  }
  const result: DetailPoint[] = [];
  for (const d of dates) {
    const e = byDay.get(d)!;
    if (e.total > 0) {
      result.push({ date: d, value: Math.round((e.abn / e.total) * 100) });
    }
  }
  return result;
};

export const Dashboard = () => {
  const records = useHealthStore((s) => s.records);
  const loading = useHealthStore((s) => s.loading);
  const weeklyStats = useHealthStore((s) => s.weeklyStats);
  const load = useHealthStore((s) => s.load);

  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => { load(); }, [load]);

  const miniData = useMemo(() => computeDailyDoses(records, 7), [records]);

  const cards: SummaryCardData[] = useMemo(() => {
    const { avgBloodPressure, adherenceRate, abnormalDays, totalDoses } = weeklyStats;
    const bpAbnormal = isAbnormalBP(avgBloodPressure.systolic, avgBloodPressure.diastolic);
    const avgBPText = avgBloodPressure.systolic
      ? `${avgBloodPressure.systolic}/${avgBloodPressure.diastolic}`
      : '--/--';
    const monthlyDoses = getMonthlyAverageDoses(records);
    const abnRatio = getAbnormalRatio(records);
    return [
      {
        title: '本周平均血压',
        value: avgBPText,
        sub: bpAbnormal ? '血压偏高，建议关注' : '血压水平正常',
        progress: bpAbnormal ? 45 : 85,
        status: bpAbnormal ? 'bad' : 'good',
        unit: 'mmHg',
        detailData: compute30DayBP(records)
      },
      {
        title: '服药依从率',
        value: `${adherenceRate}`,
        sub: `本周已服 ${totalDoses} 次`,
        progress: adherenceRate,
        status: adherenceRate >= 80 ? 'good' : adherenceRate >= 50 ? 'neutral' : 'bad',
        unit: '%',
        detailData: compute30DayAdherence(records)
      },
      {
        title: '本周异常天数',
        value: `${abnormalDays}`,
        sub: `月均服药 ${monthlyDoses} 次`,
        progress: 100 - abnormalDays * 14,
        status: abnormalDays <= 1 ? 'good' : abnormalDays <= 2 ? 'neutral' : 'bad',
        unit: '天',
        detailData: compute30DayAbnormalDays(records)
      },
      {
        title: '血压异常比率',
        value: `${abnRatio}`,
        sub: abnRatio <= 20 ? '控制良好' : abnRatio <= 40 ? '需调整' : '建议就医',
        progress: 100 - abnRatio,
        status: abnRatio <= 20 ? 'good' : abnRatio <= 40 ? 'neutral' : 'bad',
        unit: '%',
        detailData: compute30DayAbnormalRatio(records)
      }
    ];
  }, [weeklyStats, records]);

  return (
    <div style={styles.page}>
      <div style={styles.hero}>
        <div>
          <div style={styles.heroTitle}>MediTrack 健康概览</div>
          <div style={styles.heroSub}>
            记录用药与健康指标，科学管理慢性病 · 共 {records.length} 条历史记录
          </div>
        </div>
        <div style={styles.heroBadge}>
          <span style={styles.heroDot} />
          实时同步 · 本地存储
        </div>
      </div>

      <div style={styles.mainRow}>
        <div style={{ flex: 1 }}>
          <div style={styles.sectionHeader}>
            <span style={styles.sectionTitle}>本周摘要</span>
            <span style={styles.sectionHint}>点击卡片右上角查看30天详情</span>
          </div>
          {loading ? (
            <div style={styles.cardRow}>
              {[0,1,2,3].map((i) => (
                <div key={i} className="skeleton-block" style={styles.skeletonCard} />
              ))}
            </div>
          ) : (
            <div style={styles.cardRow}>
              {cards.map((c, i) => (
                <SummaryCard key={i} data={c} />
              ))}
            </div>
          )}

          <div style={{ marginTop: 20 }}>
            {loading ? (
              <div className="skeleton-block" style={{ height: 110, borderRadius: 8 }} />
            ) : (
              <MiniDoseChart data={miniData} />
            )}
          </div>

          <div style={{ ...styles.sectionHeader, marginTop: 28 }}>
            <span style={styles.sectionTitle}>用药日历</span>
            <span style={styles.sectionHint}>点击日期查看详情</span>
          </div>
          {loading ? (
            <div className="skeleton-block" style={{ width: 280, height: 220, borderRadius: 12 }} />
          ) : (
            <Calendar records={records} />
          )}
        </div>
      </div>

      <button
        style={styles.addBtn}
        onClick={() => setModalOpen(true)}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.1)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
        }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>

      <AddRecordModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  page: {
    maxWidth: 1200,
    margin: '0 auto',
    padding: '28px 32px 100px',
    position: 'relative'
  },
  hero: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 28,
    padding: '22px 26px',
    background: 'linear-gradient(135deg,#6366F1 0%,#818CF8 60%,#A78BFA 100%)',
    borderRadius: 16,
    boxShadow: '0 10px 30px rgba(99,102,241,0.28)',
    color: '#fff'
  },
  heroTitle: { fontSize: 22, fontWeight: 800, letterSpacing: 0.3 },
  heroSub: { fontSize: 13, opacity: 0.9, marginTop: 4, fontWeight: 400 },
  heroBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '6px 14px',
    background: 'rgba(255,255,255,0.18)',
    borderRadius: 100,
    fontSize: 12,
    fontWeight: 500,
    backdropFilter: 'blur(4px)'
  },
  heroDot: {
    width: 7, height: 7, borderRadius: '50%',
    background: '#34D399',
    boxShadow: '0 0 0 4px rgba(52,211,153,0.25)',
    animation: 'pulse 1.8s ease-in-out infinite'
  },
  mainRow: { display: 'flex', gap: 24 },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14
  },
  sectionTitle: { fontSize: 15, fontWeight: 700, color: '#1F2937' },
  sectionHint: { fontSize: 11, color: '#9CA3AF', fontWeight: 500 },
  cardRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 200px)',
    gap: 16
  },
  skeletonCard: {
    width: 200,
    height: 120,
    borderRadius: 12
  },
  miniChartWrap: {
    background: '#fff',
    borderRadius: 8,
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
    padding: '12px 16px 8px',
    width: 'calc(4 * 200px + 3 * 16px)',
    maxWidth: '100%'
  },
  miniChartHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2
  },
  miniChartTitle: { fontSize: 13, fontWeight: 600, color: '#1F2937' },
  miniChartSub: { fontSize: 11, color: '#9CA3AF' },
  addBtn: {
    position: 'fixed',
    right: 32,
    bottom: 32,
    width: 56,
    height: 56,
    borderRadius: '50%',
    border: 'none',
    cursor: 'pointer',
    background: 'linear-gradient(135deg,#6366F1,#818CF8)',
    boxShadow: '0 10px 24px rgba(99,102,241,0.45)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 90,
    transition: 'transform 0.25s cubic-bezier(0.22,1,0.36,1), box-shadow 0.25s ease',
    animation: 'pulseRing 2.4s ease-in-out infinite'
  }
};
