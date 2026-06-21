import { useState, useEffect, useMemo } from 'react';
import type { HistoryDayData, KeywordWeight } from './types';

interface HistoryChartProps {
  history: HistoryDayData[];
}

interface ComparisonData {
  word: string;
  weight1: number;
  weight2: number;
}

const HistoryChart = ({ history }: HistoryChartProps) => {
  const [selectedDay1, setSelectedDay1] = useState<number>(0);
  const [selectedDay2, setSelectedDay2] = useState<number>(6);
  const [animatedHeights, setAnimatedHeights] = useState<Record<string, number>>({});

  const comparisonData = useMemo((): ComparisonData[] => {
    if (!history.length || !history[selectedDay1] || !history[selectedDay2]) {
      return [];
    }

    const day1 = history[selectedDay1];
    const day2 = history[selectedDay2];

    const wordMap = new Map<string, { w1: number; w2: number }>();

    day1.keywords.forEach((kw: KeywordWeight) => {
      wordMap.set(kw.word, { w1: kw.weight, w2: 0 });
    });

    day2.keywords.forEach((kw: KeywordWeight) => {
      const existing = wordMap.get(kw.word);
      if (existing) {
        existing.w2 = kw.weight;
      } else {
        wordMap.set(kw.word, { w1: 0, w2: kw.weight });
      }
    });

    const result: ComparisonData[] = [];
    wordMap.forEach((value, word) => {
      if (value.w1 > 0 || value.w2 > 0) {
        result.push({
          word,
          weight1: value.w1,
          weight2: value.w2
        });
      }
    });

    return result
      .sort((a, b) => Math.max(b.weight1, b.weight2) - Math.max(a.weight1, a.weight2))
      .slice(0, 8);
  }, [history, selectedDay1, selectedDay2]);

  const maxWeight = useMemo(() => {
    let max = 0;
    comparisonData.forEach(d => {
      max = Math.max(max, d.weight1, d.weight2);
    });
    return max || 100;
  }, [comparisonData]);

  useEffect(() => {
    setAnimatedHeights({});
    const timer = setTimeout(() => {
      comparisonData.forEach((d, i) => {
        setTimeout(() => {
          setAnimatedHeights(prev => ({
            ...prev,
            [`${d.word}_1`]: d.weight1,
            [`${d.word}_2`]: d.weight2
          }));
        }, i * 30);
      });
    }, 50);
    return () => clearTimeout(timer);
  }, [comparisonData]);

  const chartWidth = 500;
  const chartHeight = 200;
  const paddingTop = 20;
  const paddingBottom = 60;
  const paddingLeft = 40;
  const paddingRight = 20;
  const innerWidth = chartWidth - paddingLeft - paddingRight;
  const innerHeight = chartHeight - paddingTop - paddingBottom;

  const barGroupWidth = comparisonData.length > 0 ? innerWidth / comparisonData.length : 0;
  const barWidth = Math.min(barGroupWidth * 0.35, 24);
  const barGap = barWidth * 0.3;

  const getBarHeight = (weight: number) => {
    return (weight / maxWeight) * innerHeight;
  };

  if (!history.length) {
    return (
      <div>
        <h3 style={styles.title}>📊 趋势对比</h3>
        <div style={styles.placeholder}>
          <div style={styles.placeholderIcon}>📈</div>
          <div style={styles.placeholderText}>选择话题后查看趋势对比</div>
        </div>
      </div>
    );
  }

  const dateLabels = history.map(h => {
    const date = new Date(h.date);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  });

  return (
    <div>
      <h3 style={styles.title}>📊 趋势对比</h3>

      <div style={styles.dateSelector}>
        <div style={styles.dateGroup}>
          <span style={styles.dateLabel}>日期 1:</span>
          <select
            style={styles.select}
            value={selectedDay1}
            onChange={(e) => setSelectedDay1(Number(e.target.value))}
          >
            {dateLabels.map((label, i) => (
              <option key={i} value={i} disabled={i === selectedDay2}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <span style={styles.vsText}>VS</span>
        <div style={styles.dateGroup}>
          <span style={styles.dateLabel}>日期 2:</span>
          <select
            style={styles.select}
            value={selectedDay2}
            onChange={(e) => setSelectedDay2(Number(e.target.value))}
          >
            {dateLabels.map((label, i) => (
              <option key={i} value={i} disabled={i === selectedDay1}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div style={styles.legend}>
        <div style={styles.legendItem}>
          <div style={{ ...styles.legendColor, backgroundColor: '#FF6B6B' }}></div>
          <span style={styles.legendText}>{dateLabels[selectedDay1]}</span>
        </div>
        <div style={styles.legendItem}>
          <div style={{ ...styles.legendColor, backgroundColor: '#4F46E5' }}></div>
          <span style={styles.legendText}>{dateLabels[selectedDay2]}</span>
        </div>
      </div>

      <svg width="100%" height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`} style={{ overflow: 'visible' }}>
        <line
          x1={paddingLeft}
          y1={chartHeight - paddingBottom}
          x2={chartWidth - paddingRight}
          y2={chartHeight - paddingBottom}
          stroke="#374151"
          strokeWidth="1"
        />
        <line
          x1={paddingLeft}
          y1={paddingTop}
          x2={paddingLeft}
          y2={chartHeight - paddingBottom}
          stroke="#374151"
          strokeWidth="1"
        />

        {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
          const y = chartHeight - paddingBottom - ratio * innerHeight;
          const value = Math.round(maxWeight * ratio);
          return (
            <g key={i}>
              <line
                x1={paddingLeft}
                y1={y}
                x2={chartWidth - paddingRight}
                y2={y}
                stroke="#374151"
                strokeWidth="0.5"
                strokeDasharray="4 4"
              />
              <text
                x={paddingLeft - 8}
                y={y + 4}
                textAnchor="end"
                fill="#9CA3AF"
                fontSize="11"
              >
                {value}
              </text>
            </g>
          );
        })}

        {comparisonData.map((d, i) => {
          const groupX = paddingLeft + i * barGroupWidth + barGroupWidth / 2;
          const bar1X = groupX - barWidth - barGap / 2;
          const bar2X = groupX + barGap / 2;
          const baseY = chartHeight - paddingBottom;
          
          const h1 = getBarHeight(animatedHeights[`${d.word}_1`] || 0);
          const h2 = getBarHeight(animatedHeights[`${d.word}_2`] || 0);
          
          const y1 = baseY - h1;
          const y2 = baseY - h2;

          return (
            <g key={d.word}>
              <rect
                x={bar1X}
                y={y1}
                width={barWidth}
                height={h1}
                fill="#FF6B6B"
                rx="4"
                style={{ transition: 'height 0.3s ease, y 0.3s ease' }}
              >
                <title>{`${d.word}: ${d.weight1}`}</title>
              </rect>

              <rect
                x={bar2X}
                y={y2}
                width={barWidth}
                height={h2}
                fill="#4F46E5"
                rx="4"
                style={{ transition: 'height 0.3s ease, y 0.3s ease' }}
              >
                <title>{`${d.word}: ${d.weight2}`}</title>
              </rect>

              <text
                x={groupX}
                y={chartHeight - paddingBottom + 20}
                textAnchor="middle"
                fill="#9CA3AF"
                fontSize="11"
                transform={`rotate(-30, ${groupX}, ${chartHeight - paddingBottom + 20})`}
              >
                {d.word}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  title: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#F9FAFB',
    marginBottom: '16px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  placeholder: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '200px',
    gap: '12px',
  },
  placeholderIcon: {
    fontSize: '48px',
    opacity: '0.3',
  },
  placeholderText: {
    fontSize: '14px',
    color: '#9CA3AF',
  },
  dateSelector: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '16px',
    flexWrap: 'wrap',
  },
  dateGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  dateLabel: {
    fontSize: '13px',
    color: '#9CA3AF',
  },
  select: {
    padding: '6px 12px',
    borderRadius: '6px',
    border: '1px solid #374151',
    backgroundColor: '#111827',
    color: '#F9FAFB',
    fontSize: '13px',
    cursor: 'pointer',
    outline: 'none',
  },
  vsText: {
    color: '#667eea',
    fontWeight: '700',
    fontSize: '14px',
  },
  legend: {
    display: 'flex',
    gap: '20px',
    marginBottom: '12px',
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  legendColor: {
    width: '16px',
    height: '16px',
    borderRadius: '4px',
  },
  legendText: {
    fontSize: '12px',
    color: '#9CA3AF',
  },
};

export default HistoryChart;
