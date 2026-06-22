import React from 'react';
import { Flame, Trophy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import styles from './热度排行榜.module.css';

interface TrendingItem {
  id: string;
  title: string;
  hotScore: number;
  votes: number;
  authorName: string;
}

interface TrendingListProps {
  items: TrendingItem[];
}

const TrendingList: React.FC<TrendingListProps> = ({ items }) => {
  const navigate = useNavigate();

  const getRankClass = (index: number) => {
    if (index === 0) return styles.rank1;
    if (index === 1) return styles.rank2;
    if (index === 2) return styles.rank3;
    return '';
  };

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>
        <Trophy size={18} className={styles.titleIcon} />
        热度排行榜
      </h3>
      <ul className={styles.list}>
        {items.map((item, index) => (
          <li
            key={item.id}
            className={styles.item}
            onClick={() => navigate(`/ideas/${item.id}`)}
          >
            <span className={`${styles.rankBadge} ${getRankClass(index)}`}>
              {index + 1}
            </span>
            <div className={styles.ideaInfo}>
              <div className={styles.ideaTitle}>{item.title}</div>
              <div className={styles.ideaMeta}>
                <Flame size={12} className={styles.fireIcon} />
                <span className={styles.hotScore}>{Math.round(item.hotScore)}</span>
                <span>·</span>
                <span>{item.authorName}</span>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TrendingList;
