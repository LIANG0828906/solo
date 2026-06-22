import { useState } from 'react';
import { Clock, Droplets, Sun } from 'lucide-react';
import type { BrewRecord } from '@/types';

interface FlavorTimelineProps {
  brews: BrewRecord[];
  beanName?: string;
}

function getScoreColor(score: number): string {
  const ratio = Math.min(Math.max((score - 4) / 4, 0), 1);
  const r1 = 193, g1 = 18, b1 = 31;
  const r2 = 167, g2 = 201, b2 = 87;
  const r = Math.round(r1 + (r2 - r1) * ratio);
  const g = Math.round(g1 + (g2 - g1) * ratio);
  const b = Math.round(b1 + (b2 - b1) * ratio);
  return `rgb(${r}, ${g}, ${b})`;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

export default function FlavorTimeline({ brews, beanName }: FlavorTimelineProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleDotClick = (id: string) => {
    setSelectedId(id);
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div style={styles.container}>
      <h3 style={styles.title}>
        {beanName ? `${beanName} · ` : ''}风味探索时间线
      </h3>
      <p style={styles.subtitle}>{brews.length} 次冲煮记录</p>

      <div style={styles.timeline}>
        <div style={styles.timelineLine} />

        {brews.map((brew, index) => (
          <div
            key={brew.id}
            style={{
              ...styles.timelineItem,
              transform: expandedId === brew.id ? 'translateX(0)' : 'translateX(0)',
            }}
          >
            <div
              style={{
                ...styles.dot,
                backgroundColor: getScoreColor(brew.overallScore),
                transform: selectedId === brew.id ? 'scale(1.4)' : 'scale(1)',
                boxShadow: `0 0 12px ${getScoreColor(brew.overallScore)}80`,
              }}
              onClick={() => handleDotClick(brew.id)}
            />

            <div style={styles.dateLabel}>{formatDate(brew.createdAt)}</div>

            <div
              style={{
                ...styles.detailCard,
                opacity: expandedId === brew.id ? 1 : 0,
                transform:
                  expandedId === brew.id
                    ? 'translateX(0)'
                    : 'translateX(-20px)',
                pointerEvents: expandedId === brew.id ? 'auto' : 'none',
                maxHeight: expandedId === brew.id ? 500 : 0,
                padding: expandedId === brew.id ? 16 : '0 16px',
              }}
            >
              <div style={styles.detailHeader}>
                <span style={styles.detailScore}>
                  ★ {brew.overallScore.toFixed(1)}
                </span>
                <span style={styles.detailTemp}>
                  {brew.params.waterTemp}°C
                </span>
              </div>

              <div style={styles.detailParams}>
                <div style={styles.detailParam}>
                  <Droplets size={12} />
                  <span>研磨 {brew.params.grindSize} 档</span>
                </div>
                <div style={styles.detailParam}>
                  <Sun size={12} />
                  <span>粉水比 1:{brew.params.waterRatio}</span>
                </div>
                <div style={styles.detailParam}>
                  <Clock size={12} />
                  <span>注水 {brew.params.pourTime}s</span>
                </div>
              </div>

              {brew.notes && (
                <p style={styles.detailNotes}>{brew.notes}</p>
              )}

              <div style={styles.flavorMini}>
                {Object.entries(brew.flavor).map(([key, val]) => (
                  <div key={key} style={styles.flavorBar}>
                    <span style={styles.flavorLabel}>
                      {key === 'acidity' && '酸'}
                      {key === 'bitterness' && '苦'}
                      {key === 'sweetness' && '甜'}
                      {key === 'body' && '醇'}
                      {key === 'aftertaste' && '韵'}
                      {key === 'cleanliness' && '净'}
                    </span>
                    <div style={styles.flavorBarBg}>
                      <div
                        style={{
                          ...styles.flavorBarFill,
                          width: `${(val / 10) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    backgroundColor: '#16213e',
    borderRadius: 12,
    padding: 20,
    color: '#eee',
  },
  title: {
    fontSize: 16,
    fontWeight: 600,
    margin: 0,
    color: '#eee',
  },
  subtitle: {
    fontSize: 12,
    color: '#888',
    margin: '4px 0 20px 0',
  },
  timeline: {
    position: 'relative',
    paddingLeft: 20,
  },
  timelineLine: {
    position: 'absolute',
    left: 7,
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: '#2a3f5f',
    borderRadius: 1,
  },
  timelineItem: {
    position: 'relative',
    marginBottom: 16,
    paddingLeft: 20,
  },
  dot: {
    position: 'absolute',
    left: -1,
    top: 4,
    width: 14,
    height: 14,
    borderRadius: '50%',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    zIndex: 2,
  },
  dateLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 6,
    cursor: 'pointer',
  },
  detailCard: {
    backgroundColor: '#0f1729',
    borderRadius: 8,
    overflow: 'hidden',
    transition: 'all 0.3s ease-out',
  },
  detailHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  detailScore: {
    color: '#e94560',
    fontWeight: 700,
    fontSize: 16,
  },
  detailTemp: {
    color: '#d4a373',
    fontSize: 13,
    fontWeight: 500,
  },
  detailParams: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  detailParam: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    fontSize: 12,
    color: '#aaa',
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: '4px 8px',
    borderRadius: 6,
  },
  detailNotes: {
    fontSize: 12,
    color: '#888',
    margin: '8px 0',
    lineHeight: 1.4,
  },
  flavorMini: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    marginTop: 8,
  },
  flavorBar: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  flavorLabel: {
    fontSize: 11,
    color: '#888',
    width: 16,
    textAlign: 'center',
  },
  flavorBarBg: {
    flex: 1,
    height: 4,
    backgroundColor: '#1a2a4a',
    borderRadius: 2,
    overflow: 'hidden',
  },
  flavorBarFill: {
    height: '100%',
    backgroundColor: '#b5838d',
    borderRadius: 2,
    transition: 'width 0.3s ease',
  },
};
