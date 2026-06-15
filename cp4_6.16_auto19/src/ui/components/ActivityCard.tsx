import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import type { Activity, Boardgame } from '@/types';
import styles from './ActivityCard.module.css';

interface ActivityCardProps {
  activity: Activity;
  boardgame?: Boardgame;
  playerCount?: number;
  delay?: number;
  style?: React.CSSProperties;
}

export function ActivityCard({ activity, boardgame, playerCount = 0, delay = 0, style }: ActivityCardProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/activity/${activity.id}`);
  };

  return (
    <div
      className={styles.card}
      onClick={handleClick}
      style={{
        animationDelay: `${delay}ms`,
        ...style,
      }}
    >
      <div className={styles.emoji}>{boardgame?.emoji || '🎲'}</div>
      <div className={styles.info}>
        <div className={styles.title}>{activity.title}</div>
        <div className={styles.meta}>
          <span className={styles.metaItem}>
            📅 {format(new Date(activity.dateTime), 'M月d日 HH:mm', { locale: zhCN })}
          </span>
          <span className={styles.metaItem}>📍 {activity.location}</span>
        </div>
      </div>
      <div className={styles.badge}>
        👥 {playerCount}
      </div>
    </div>
  );
}
