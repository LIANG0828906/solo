import { useMemo } from 'react';
import { useStore } from '../store';
import type { YearEvent, MonthGroup } from '../mockData';
import styles from '../styles/Gallery.module.css';

interface GalleryProps {
  yearData: MonthGroup[];
}

function getGradientStyle(evt: YearEvent): React.CSSProperties {
  const h1 = (evt.imageIndex * 36 + 10) % 360;
  const h2 = (h1 + 40) % 360;
  return {
    background: `linear-gradient(135deg, hsla(${h1}, 50%, 35%, 0.55), hsla(${h2}, 45%, 28%, 0.55))`,
  };
}

function getThumbnailGradient(evt: YearEvent): React.CSSProperties {
  const h1 = (evt.imageIndex * 36 + 30) % 360;
  const h2 = (h1 + 60) % 360;
  return {
    background: `linear-gradient(135deg, hsl(${h1}, 55%, 45%), hsl(${h2}, 50%, 35%))`,
  };
}

const SENTIMENT_LABELS: Record<string, string> = {
  positive: '积极',
  neutral: '中立',
  negative: '消极',
};

export default function Gallery({ yearData }: GalleryProps) {
  const { currentMonth, sentimentFilter, selectedEvent, setSelectedEvent } = useStore();

  const monthData = yearData[currentMonth];
  const events = monthData?.events || [];

  const filteredEvents = useMemo(() => {
    if (sentimentFilter === 'all') return events;
    return events.filter((e) => e.sentiment === sentimentFilter);
  }, [events, sentimentFilter]);

  const hasPanel = selectedEvent !== null;

  return (
    <div className={`${styles.galleryArea} ${hasPanel ? styles.galleryAreaWithPanel : ''}`}>
      <div className={styles.filterBar}>
        <span className={styles.filterLabel}>筛选</span>
        {[
          { key: 'all', label: '全部', activeClass: styles.filterBtnAll },
          { key: 'positive', label: '积极', activeClass: styles.filterBtnActivePositive },
          { key: 'neutral', label: '中立', activeClass: styles.filterBtnActiveNeutral },
          { key: 'negative', label: '消极', activeClass: styles.filterBtnActiveNegative },
        ].map(({ key, label, activeClass }) => (
          <button
            key={key}
            className={`${styles.filterBtn} ${sentimentFilter === key ? activeClass : ''}`}
            onClick={() => useStore.getState().setSentimentFilter(key as any)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className={styles.galleryGrid}>
        {filteredEvents.length === 0 ? (
          <div className={styles.emptyState}>本月暂无匹配事件</div>
        ) : (
          filteredEvents.map((evt, idx) => (
            <div
              key={evt.id}
              className={styles.eventCard}
              style={{ animationDelay: `${idx * 0.06}s` }}
              onClick={() => setSelectedEvent(evt)}
            >
              <div className={styles.cardBg} style={getGradientStyle(evt)} />
              <div className={styles.cardContent}>
                <div className={styles.cardThumbnail}>
                  <div className={styles.cardThumbnailInner} style={getThumbnailGradient(evt)} />
                  <span className={styles.cardDateBadge}>{evt.date}</span>
                </div>
                <div className={styles.cardTitle}>{evt.title}</div>
                <div className={styles.cardSummary}>{evt.summary}</div>
                <div
                  className={`${styles.cardSentiment} ${
                    evt.sentiment === 'positive'
                      ? styles.cardSentimentPositive
                      : evt.sentiment === 'neutral'
                      ? styles.cardSentimentNeutral
                      : styles.cardSentimentNegative
                  }`}
                >
                  {SENTIMENT_LABELS[evt.sentiment]}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
