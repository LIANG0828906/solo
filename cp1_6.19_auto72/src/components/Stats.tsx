import { useMemo, useState, useEffect } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  Legend,
} from 'recharts';
import { MOOD_CONFIGS, MoodLevel, getMoodConfig, MoodRecord } from '../types';
import { getRecordsByMonth, getAllRecords, formatDateKey } from '../data';

interface StatsProps {
  refreshSignal: number;
}

interface PieDataItem {
  name: string;
  value: number;
  level: MoodLevel;
  color: string;
  emoji: string;
}

export default function Stats({ refreshSignal }: StatsProps) {
  const now = new Date();
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [progressAnimKey, setProgressAnimKey] = useState(0);

  useEffect(() => {
    setProgressAnimKey((k) => k + 1);
  }, [refreshSignal]);

  const monthRecords = useMemo(
    () => getRecordsByMonth(now.getFullYear(), now.getMonth()),
    [now.getFullYear(), now.getMonth(), refreshSignal]
  );

  const pieData: PieDataItem[] = useMemo(() => {
    const counts = new Map<MoodLevel, number>();
    MOOD_CONFIGS.forEach((c) => counts.set(c.level, 0));
    monthRecords.forEach((r) => {
      counts.set(r.level, (counts.get(r.level) || 0) + 1);
    });
    const arr: PieDataItem[] = [];
    MOOD_CONFIGS.forEach((c) => {
      const count = counts.get(c.level) || 0;
      if (count > 0) {
        arr.push({
          name: c.name,
          value: count,
          level: c.level,
          color: c.color,
          emoji: c.emoji,
        });
      }
    });
    return arr;
  }, [monthRecords]);

  const { streak, volatilityIndex, volatilityLabel } = useMemo(() => {
    const all = getAllRecords();
    const map = new Map<string, MoodRecord>();
    all.forEach((r) => map.set(r.date, r));

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let currentStreak = 0;
    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = formatDateKey(d);
      const rec = map.get(key);
      if (!rec) continue;
      if (rec.level === MoodLevel.Sunny || rec.level === MoodLevel.Cloudy) {
        currentStreak++;
      } else {
        if (i === 0) continue;
        break;
      }
    }

    const todayKey = formatDateKey(today);
    const hasToday = map.get(todayKey);
    if (!hasToday) {
      const d = new Date(today);
      d.setDate(d.getDate() - 1);
      let alt = 0;
      for (let i = 1; i < 365; i++) {
        const dd = new Date(today);
        dd.setDate(dd.getDate() - i);
        const k = formatDateKey(dd);
        const r = map.get(k);
        if (!r) continue;
        if (r.level === MoodLevel.Sunny || r.level === MoodLevel.Cloudy) {
          alt++;
        } else {
          break;
        }
      }
      if (alt > currentStreak) currentStreak = alt;
    }

    const sorted = [...all].sort((a, b) => a.date.localeCompare(b.date));
    let sum = 0;
    let count = 0;
    for (let i = 1; i < sorted.length; i++) {
      const prev = sorted[i - 1];
      const curr = sorted[i];
      const d1 = new Date(prev.date);
      const d2 = new Date(curr.date);
      const diffDays = Math.round((d2.getTime() - d1.getTime()) / 86400000);
      if (diffDays === 1) {
        sum += Math.abs(curr.level - prev.level);
        count++;
      }
    }
    const idx = count > 0 ? sum / count : 0;
    const normalized = Math.min(100, (idx / 5) * 100);
    let label = '稳定';
    if (normalized < 20) label = '非常稳定';
    else if (normalized < 40) label = '比较稳定';
    else if (normalized < 60) label = '略有波动';
    else if (normalized < 80) label = '波动较大';
    else label = '剧烈波动';

    return { streak: currentStreak, volatilityIndex: normalized, volatilityLabel: label };
  }, [refreshSignal]);

  const progressGradient = `linear-gradient(90deg, #2ecc71 0%, #f1c40f 50%, #e74c3c 100%)`;

  const onLegendEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };
  const onLegendLeave = () => {
    setActiveIndex(null);
  };

  const totalRecords = monthRecords.length;
  const avgLevel =
    totalRecords > 0
      ? monthRecords.reduce((s, r) => s + r.level, 0) / totalRecords
      : MoodLevel.Overcast;
  const avgCfg = getMoodConfig(Math.round(avgLevel) as MoodLevel);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#444' }}>📊 本月情绪分布</h3>
          <span style={{ fontSize: 12, color: '#999' }}>共 {totalRecords} 条记录</span>
        </div>

        {pieData.length > 0 ? (
          <>
            <div style={{ width: '100%', height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="48%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                    isAnimationActive
                    animationDuration={700}
                    onMouseEnter={(_, i) => setActiveIndex(i)}
                    onMouseLeave={() => setActiveIndex(null)}
                  >
                    {pieData.map((entry, i) => (
                      <Cell
                        key={i}
                        fill={entry.color}
                        stroke="#fff"
                        strokeWidth={2}
                        style={{
                          transform: activeIndex === i ? 'scale(1.05)' : 'scale(1)',
                          transformOrigin: 'center',
                          transition: 'transform 0.25s ease-out',
                          filter: activeIndex === i ? 'drop-shadow(0 2px 8px rgba(0,0,0,0.2))' : undefined,
                          cursor: 'pointer',
                        }}
                      />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    formatter={(value: number, name: string, props: any) => {
                      const percent = totalRecords > 0 ? ((value / totalRecords) * 100).toFixed(0) : 0;
                      return [
                        <span key="v" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 16 }}>{props.payload.emoji}</span>
                          <span>{name} · {value}天 ({percent}%)</span>
                        </span>,
                        '',
                      ];
                    }}
                    contentStyle={{
                      borderRadius: 10,
                      border: 'none',
                      boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                      fontSize: 13,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div style={{ marginTop: 8 }}>
              {pieData.map((item, i) => {
                const percent = totalRecords > 0 ? (item.value / totalRecords) * 100 : 0;
                const isActive = activeIndex === i;
                return (
                  <div
                    key={item.level}
                    onMouseEnter={() => onLegendEnter(null, i)}
                    onMouseLeave={onLegendLeave}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '6px 8px',
                      borderRadius: 8,
                      background: isActive ? 'rgba(100,100,100,0.06)' : 'transparent',
                      cursor: 'pointer',
                      transition: 'background 0.2s',
                      marginBottom: 2,
                    }}
                  >
                    <span style={{ fontSize: 16, marginRight: 8 }}>{item.emoji}</span>
                    <span
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: 3,
                        background: item.color,
                        marginRight: 8,
                        transform: isActive ? 'scale(1.3)' : 'scale(1)',
                        transition: 'transform 0.2s',
                      }}
                    />
                    <span style={{ fontSize: 13, color: '#555', fontWeight: isActive ? 600 : 500, flex: 1 }}>
                      {item.name}
                    </span>
                    <span style={{ fontSize: 12, color: '#999', marginRight: 8 }}>{item.value}天</span>
                    <div style={{ width: 60, height: 4, borderRadius: 2, background: 'rgba(100,100,100,0.1)', overflow: 'hidden' }}>
                      <div style={{ width: `${percent}%`, height: '100%', background: item.color, borderRadius: 2, transition: 'width 0.3s' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: '#aaa', fontSize: 13 }}>
            暂无记录，快去记录第一条心情吧~
          </div>
        )}
      </div>

      <div className="card">
        <h3 style={{ fontSize: 16, fontWeight: 700, color: '#444', marginBottom: 18 }}>🎯 情绪指标</h3>

        <div
          style={{
            padding: 16,
            borderRadius: 14,
            background: `linear-gradient(135deg, ${avgCfg.color}22, ${avgCfg.color}08)`,
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 14,
          }}
        >
          <div style={{ fontSize: 36 }}>{avgCfg.emoji}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, color: '#888', marginBottom: 2 }}>本月平均心情</div>
            <div style={{ fontSize: 17, fontWeight: 700, color: '#333' }}>{avgCfg.name}</div>
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#555' }}>☀️ 连续好心情天数</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
              <span style={{ fontSize: 22, fontWeight: 800, color: '#FFA500' }}>{streak}</span>
              <span style={{ fontSize: 12, color: '#999' }}>天</span>
            </div>
          </div>
          <div
            style={{
              padding: '12px 14px',
              borderRadius: 12,
              background:
                streak >= 7
                  ? 'linear-gradient(135deg, #FFD70018, #FFA50018)'
                  : streak >= 3
                  ? 'linear-gradient(135deg, #FFD70010, #B0C4DE10)'
                  : 'rgba(100,100,100,0.04)',
              fontSize: 12,
              color: '#777',
              lineHeight: 1.6,
            }}
          >
            {streak >= 14
              ? '🏆 太棒了！连续两周好心情，继续保持！'
              : streak >= 7
              ? '🌟 已连续一周阳光明媚，状态超棒！'
              : streak >= 3
              ? '😊 保持得不错，让心情继续晴朗下去~'
              : streak >= 1
              ? '💪 有进步，争取连续更多晴天！'
              : '🌱 调整状态，从今天开始记录好心情吧！'}
          </div>
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#555' }}>🌊 情绪波动指数</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span
                style={{
                  fontSize: 16,
                  fontWeight: 800,
                  color:
                    volatilityIndex < 30
                      ? '#2ecc71'
                      : volatilityIndex < 60
                      ? '#f39c12'
                      : '#e74c3c',
                }}
              >
                {volatilityIndex.toFixed(0)}
              </span>
              <span style={{ fontSize: 11, color: '#999' }}>/ 100</span>
            </div>
          </div>
          <div
            style={{
              width: '100%',
              height: 10,
              borderRadius: 5,
              background: '#E0E0E0',
              overflow: 'hidden',
              marginBottom: 8,
              position: 'relative',
            }}
          >
            <div
              key={`prog-${progressAnimKey}`}
              style={{
                height: '100%',
                borderRadius: 5,
                background: progressGradient,
                width: `${volatilityIndex}%`,
                transition: 'width 0.8s ease-out',
                animation: 'progress-grow 0.8s ease-out',
              }}
            />
          </div>
          <div
            style={{
              fontSize: 12,
              color:
                volatilityIndex < 30
                  ? '#27ae60'
                  : volatilityIndex < 60
                  ? '#d68910'
                  : '#c0392b',
              fontWeight: 600,
            }}
          >
            {volatilityLabel}
            <span style={{ color: '#aaa', fontWeight: 400, marginLeft: 6 }}>
              （指数越低越稳定）
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
