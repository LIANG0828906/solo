import React, { useState, useMemo, useCallback } from 'react';
import MoodDiary, { DiaryEntry } from './components/MoodDiary';
import RecommendationList from './components/RecommendationList';
import { matchMood, getMoodValue, MatchResult } from './components/MoodMatcher';

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

interface TrendPoint {
  date: string;
  label: string;
  value: number;
}

const MoodTrend: React.FC<{ data: TrendPoint[] }> = ({ data }) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const chartW = 560;
  const chartH = 300;
  const pad = { top: 30, right: 24, bottom: 40, left: 44 };
  const innerW = chartW - pad.left - pad.right;
  const innerH = chartH - pad.top - pad.bottom;

  const minV = -2;
  const maxV = 2;
  const rangeV = maxV - minV;

  const getX = (i: number) => pad.left + (i / Math.max(data.length - 1, 1)) * innerW;
  const getY = (v: number) => pad.top + (1 - (v - minV) / rangeV) * innerH;

  const linePath = data
    .map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i).toFixed(1)} ${getY(d.value).toFixed(1)}`)
    .join(' ');

  const areaPath =
    linePath +
    ` L ${getX(data.length - 1).toFixed(1)} ${getY(minV).toFixed(1)} L ${getX(0).toFixed(1)} ${getY(minV).toFixed(1)} Z`;

  return (
    <div className="trend-section" style={{ height: 360, width: '100%', position: 'relative' }}>
      <svg
        viewBox={`0 0 ${chartW} ${chartH}`}
        style={{ width: '100%', height: '100%', overflow: 'visible' }}
      >
        <defs>
          <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4CAF50" />
            <stop offset="100%" stopColor="#FF5252" />
          </linearGradient>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(76,175,80,0.18)" />
            <stop offset="100%" stopColor="rgba(255,82,82,0.08)" />
          </linearGradient>
        </defs>

        {[-2, -1, 0, 1, 2].map((v) => (
          <React.Fragment key={v}>
            <line
              x1={pad.left}
              y1={getY(v)}
              x2={chartW - pad.right}
              y2={getY(v)}
              stroke="#E8E8E8"
              strokeDasharray="4"
            />
            <text
              x={pad.left - 10}
              y={getY(v) + 4}
              textAnchor="end"
              fill="#AAA"
              fontSize="12"
            >
              {v > 0 ? '+' : ''}
              {v}
            </text>
          </React.Fragment>
        ))}

        <path d={areaPath} fill="url(#areaGrad)" />
        <path
          d={linePath}
          fill="none"
          stroke="url(#lineGrad)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {data.map((d, i) => {
          const cx = getX(i);
          const cy = getY(d.value);
          const isHovered = hoveredIndex === i;
          return (
            <g
              key={d.date}
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <circle cx={cx} cy={cy} r="14" fill="transparent" />
              <circle
                cx={cx}
                cy={cy}
                r={isHovered ? 6 : 4}
                fill="#7FDBDA"
                stroke="#fff"
                strokeWidth="2"
                style={{ transition: 'r 0.15s ease' }}
              />
              <text
                x={cx}
                y={chartH - 10}
                textAnchor="middle"
                fill="#999"
                fontSize="12"
              >
                {d.label}
              </text>
              {isHovered && (
                <g>
                  <rect
                    x={cx - 48}
                    y={cy - 36}
                    width="96"
                    height="26"
                    rx="8"
                    fill="#333"
                  />
                  <text
                    x={cx}
                    y={cy - 19}
                    textAnchor="middle"
                    fill="#fff"
                    fontSize="12"
                  >
                    {d.label}　情绪值: {d.value > 0 ? '+' : ''}
                    {d.value}
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
};

function App() {
  const [entries, setEntries] = useState<Record<string, DiaryEntry>>({});
  const [selectedDate, setSelectedDate] = useState<string>(formatDate(new Date()));
  const [matchResults, setMatchResults] = useState<MatchResult[]>([]);

  const handleSubmit = useCallback(
    (text: string) => {
      const results = matchMood(text);
      const keywords = results.map((r) => r.keyword);
      const moodValue = keywords.reduce((sum, kw) => sum + getMoodValue(kw), 0);

      const today = formatDate(new Date());
      const entry: DiaryEntry = { date: today, text, keywords, moodValue };

      setEntries((prev) => ({ ...prev, [today]: entry }));
      setMatchResults(results);
      setSelectedDate(today);
    },
    [],
  );

  const trendData = useMemo(() => {
    const data: TrendPoint[] = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = formatDate(d);
      data.push({
        date: dateStr,
        label: `${d.getMonth() + 1}/${d.getDate()}`,
        value: entries[dateStr]?.moodValue ?? 0,
      });
    }
    return data;
  }, [entries]);

  return (
    <div style={styles.appContainer}>
      <header style={styles.header}>
        <h1 style={styles.headerTitle}>🌿 校园心情日记</h1>
        <p style={styles.headerSub}>记录每一刻心情，发现更好的自己</p>
      </header>

      <div style={styles.trendWrapper}>
        <h3 style={styles.sectionTitle}>一周情绪趋势</h3>
        <MoodTrend data={trendData} />
      </div>

      <div className="diary-section" style={styles.diarySection}>
        <MoodDiary
          entries={entries}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          onSubmit={handleSubmit}
        />
        <RecommendationList matchResults={matchResults} />
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  appContainer: {
    background: '#F4F4F9',
    minHeight: '100vh',
    padding: '40px 20px 60px',
  },
  header: {
    textAlign: 'center',
    marginBottom: '32px',
  },
  headerTitle: {
    fontSize: '28px',
    fontWeight: 700,
    color: '#333',
    marginBottom: '8px',
  },
  headerSub: {
    fontSize: '15px',
    color: '#999',
  },
  trendWrapper: {
    maxWidth: '640px',
    margin: '0 auto 28px',
    background: '#fff',
    borderRadius: '20px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
    padding: '24px',
  },
  sectionTitle: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#333',
    marginBottom: '16px',
  },
  diarySection: {
    width: '600px',
    maxWidth: '100%',
    margin: '0 auto',
    background: '#FFFFFF',
    borderRadius: '20px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
    padding: '32px',
  },
};

export default App;
