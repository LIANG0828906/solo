import { useMemo } from 'react';
import { useStore } from '../store';
import type { MonthGroup } from '../mockData';
import styles from '../styles/YearReview.module.css';

interface YearReviewProps {
  yearData: MonthGroup[];
}

export default function YearReview({ yearData }: YearReviewProps) {
  const { showReview, setShowReview } = useStore();

  const highlights = useMemo(() => {
    const all = yearData.flatMap((m) => m.events);
    const sorted = [...all].sort((a, b) => Math.abs(b.sentimentIntensity) - Math.abs(a.sentimentIntensity));
    return sorted.slice(0, 15);
  }, [yearData]);

  if (!showReview) return null;

  return (
    <div className={styles.reviewOverlay}>
      <button className={styles.closeReviewBtn} onClick={() => setShowReview(false)}>
        ✕
      </button>
      <div className={styles.reviewTitle}>年度回顾</div>
      <div className={styles.reviewSubtitle}>精选 15 个最具影响力的年度时刻</div>
      <div className={styles.reviewGrid}>
        {highlights.map((evt, idx) => {
          const h1 = (evt.imageIndex * 36 + 10) % 360;
          const h2 = (h1 + 40) % 360;
          const delay = (idx * 0.18).toFixed(2);
          return (
            <div
              key={evt.id}
              className={styles.reviewCard}
              style={{
                animationDelay: `${delay}s`,
                background: `linear-gradient(135deg, hsla(${h1}, 40%, 30%, 0.6), hsla(${h2}, 35%, 22%, 0.6))`,
              }}
            >
              <div className={styles.reviewCardTitle}>{evt.title}</div>
              <div className={styles.reviewCardDate}>{evt.date}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
