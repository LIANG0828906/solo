import React, { useEffect, useState } from 'react';
import type { Score } from './types';
import styles from './styles/ScoreBoard.module.css';

interface ScoreBoardProps {
  score: Score;
  isLive?: boolean;
}

function calculateAccuracy(score: Score): number {
  const total = score.perfect + score.good + score.miss;
  if (total === 0) return 100;
  return Math.round(((score.perfect * 100 + score.good * 50) / (total * 100)) * 100);
}

function getBadge(accuracy: number): { type: 'bronze' | 'silver' | 'gold' | 'platinum'; label: string } {
  if (accuracy >= 95) return { type: 'platinum', label: '节奏大师' };
  if (accuracy >= 85) return { type: 'gold', label: '专业乐手' };
  if (accuracy >= 70) return { type: 'silver', label: '进阶学员' };
  return { type: 'bronze', label: '初学者' };
}

function getGrade(accuracy: number): string {
  if (accuracy >= 98) return 'S+';
  if (accuracy >= 95) return 'S';
  if (accuracy >= 90) return 'A';
  if (accuracy >= 80) return 'B';
  if (accuracy >= 70) return 'C';
  return 'D';
}

const ScoreBoard: React.FC<ScoreBoardProps> = ({ score, isLive = true }) => {
  const [scorePop, setScorePop] = useState(false);
  const [comboPulse, setComboPulse] = useState(false);
  const accuracy = calculateAccuracy(score);
  const badge = getBadge(accuracy);

  useEffect(() => {
    if (score.total > 0) {
      setScorePop(true);
      const timer = setTimeout(() => setScorePop(false), 300);
      return () => clearTimeout(timer);
    }
  }, [score.total]);

  useEffect(() => {
    if (score.combo > 0 && score.combo % 10 === 0) {
      setComboPulse(true);
      const timer = setTimeout(() => setComboPulse(false), 500);
      return () => clearTimeout(timer);
    }
  }, [score.combo]);

  if (!isLive) {
    const totalHits = score.perfect + score.good + score.miss;
    const avgDeviation = score.hitCount > 0 ? Math.abs(score.totalDeviation / score.hitCount).toFixed(1) : '0';

    return (
      <div>
        <div className={styles.gradeDisplay}>
          <div className={styles.grade}>{getGrade(accuracy)}</div>
          <div className={styles.gradeLabel}>综合评级</div>
        </div>

        <div className={styles.resultStats}>
          <div className={styles.resultCard}>
            <div className={styles.resultCardLabel}>总击打</div>
            <div className={styles.resultCardValue}>{totalHits}</div>
          </div>
          <div className={styles.resultCard}>
            <div className={styles.resultCardLabel}>最高连击</div>
            <div className={`${styles.resultCardValue} ${styles.perfect}`}>{score.maxCombo}</div>
          </div>
          <div className={styles.resultCard}>
            <div className={styles.resultCardLabel}>Perfect</div>
            <div className={`${styles.resultCardValue} ${styles.perfect}`}>{score.perfect}</div>
          </div>
          <div className={styles.resultCard}>
            <div className={styles.resultCardLabel}>Good</div>
            <div className={`${styles.resultCardValue} ${styles.good}`}>{score.good}</div>
          </div>
          <div className={styles.resultCard}>
            <div className={styles.resultCardLabel}>Miss</div>
            <div className={`${styles.resultCardValue} ${styles.miss}`}>{score.miss}</div>
          </div>
          <div className={styles.resultCard}>
            <div className={styles.resultCardLabel}>平均偏差</div>
            <div className={styles.resultCardValue}>{avgDeviation}ms</div>
          </div>
        </div>

        <div className={styles.progressBarContainer}>
          <div className={styles.progressBarLabel}>
            <span style={{ color: 'var(--perfect-color)' }}>Perfect {score.perfect}</span>
            <span style={{ color: 'var(--good-color)' }}>Good {score.good}</span>
            <span style={{ color: 'var(--miss-color)' }}>Miss {score.miss}</span>
          </div>
          <div className={styles.progressBarTrack}>
            {totalHits > 0 && (
              <>
                <div
                  className={`${styles.progressSegment} ${styles.perfect}`}
                  style={{ width: `${(score.perfect / totalHits) * 100}%` }}
                />
                <div
                  className={`${styles.progressSegment} ${styles.good}`}
                  style={{ width: `${(score.good / totalHits) * 100}%` }}
                />
                <div
                  className={`${styles.progressSegment} ${styles.miss}`}
                  style={{ width: `${(score.miss / totalHits) * 100}%` }}
                />
              </>
            )}
          </div>
        </div>

        <div className={styles.progressBarContainer}>
          <div className={styles.progressBarLabel}>
            <span>准确率</span>
            <span style={{ color: 'var(--accent)' }}>{accuracy}%</span>
          </div>
          <div className={styles.progressBarTrack}>
            <div
              className={`${styles.progressSegment} ${styles.perfect}`}
              style={{ width: `${accuracy}%` }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={styles.container}>
        <div className={styles.label}>得分</div>
        <div className={`${styles.value} ${scorePop ? styles.pop : ''}`}>
          {score.total.toLocaleString()}
        </div>
        <div className={styles.accuracyBar}>
          <div className={styles.accuracyFill} style={{ width: `${accuracy}%` }} />
        </div>
        <div className={styles.statRow}>
          <span className={styles.statLabel}>准确率</span>
          <span className={styles.statValue}>{accuracy}%</span>
        </div>
        <div className={`${styles.badge} ${styles[badge.type]}`}>
          {badge.label}
        </div>
      </div>

      <div className={styles.container}>
        <div className={styles.label}>连击</div>
        <div className={`${styles.value} ${styles.comboValue} ${comboPulse ? styles.pulse : ''}`}>
          {score.combo}
        </div>
        <div className={styles.statRow}>
          <span className={styles.statLabel}>最高连击</span>
          <span className={styles.statValue}>{score.maxCombo}</span>
        </div>
        <div className={styles.statRow}>
          <span className={styles.statLabel} style={{ color: 'var(--perfect-color)' }}>Perfect</span>
          <span className={styles.statValue}>{score.perfect}</span>
        </div>
        <div className={styles.statRow}>
          <span className={styles.statLabel} style={{ color: 'var(--good-color)' }}>Good</span>
          <span className={styles.statValue}>{score.good}</span>
        </div>
        <div className={styles.statRow}>
          <span className={styles.statLabel} style={{ color: 'var(--miss-color)' }}>Miss</span>
          <span className={styles.statValue}>{score.miss}</span>
        </div>
      </div>
    </>
  );
};

export default ScoreBoard;
