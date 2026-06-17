import { useStore } from '../store';
import styles from '../styles/Timeline.module.css';

const MONTHS = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

interface TimelineProps {
  monthEventCounts: number[];
}

function getDotClass(count: number): string {
  if (count <= 5) return styles.eventDotGray;
  if (count <= 10) return styles.eventDotBlue;
  return styles.eventDotOrange;
}

function getDotSize(count: number): number {
  return Math.max(6, Math.min(14, 6 + count));
}

export default function Timeline({ monthEventCounts }: TimelineProps) {
  const { currentMonth, setMonth, setShowReview } = useStore();

  return (
    <div className={styles.timelineWrapper}>
      <div className={styles.timelineTitle}>年度时光画廊</div>
      <div className={styles.timelineScroll}>
        {MONTHS.map((label, idx) => {
          const count = monthEventCounts[idx] || 0;
          const isActive = currentMonth === idx;
          const dotSize = getDotSize(count);

          return (
            <div
              key={idx}
              className={`${styles.monthNode} ${isActive ? styles.monthNodeActive : ''}`}
              onClick={() => setMonth(idx)}
            >
              <span className={styles.monthLabel}>{label}</span>
              <div className={styles.dotContainer}>
                <div
                  className={`${styles.eventDot} ${getDotClass(count)}`}
                  style={{ width: dotSize, height: dotSize }}
                />
              </div>
            </div>
          );
        })}
      </div>
      <button className={styles.reviewBtn} onClick={() => setShowReview(true)}>
        年度回顾 ✦
      </button>
    </div>
  );
}
