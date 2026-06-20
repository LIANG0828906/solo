import type { LearningStats } from '../types';

interface StatsPanelProps {
  stats: LearningStats | null;
  onStartReview: () => void;
}

export function StatsPanel({ stats, onStartReview }: StatsPanelProps) {
  if (!stats) {
    return (
      <div className="stats-panel glass-card">
        <div className="stats-card">
          <div className="stats-number" style={{ animation: 'pulse 1.5s ease-in-out infinite' }}>--</div>
          <div className="stats-label">今日学习</div>
        </div>
        <div className="stats-card">
          <div className="stats-number" style={{ animation: 'pulse 1.5s ease-in-out infinite 0.2s' }}>--</div>
          <div className="stats-label">累计收藏</div>
        </div>
        <div className="stats-card">
          <div className="stats-number" style={{ animation: 'pulse 1.5s ease-in-out infinite 0.4s' }}>--</div>
          <div className="stats-label">待复习</div>
        </div>
      </div>
    );
  }

  return (
    <div className="stats-panel glass-card">
      <div className="stats-card">
        <div className="stats-number">{stats.todayLearned}</div>
        <div className="stats-label">今日学习</div>
      </div>
      <div className="stats-card">
        <div className="stats-number">{stats.totalCollected}</div>
        <div className="stats-label">累计收藏</div>
      </div>
      <div 
        className="stats-card clickable" 
        onClick={onStartReview}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && onStartReview()}
      >
        <div className="stats-number">{stats.dueForReview}</div>
        <div className="stats-label">
          待复习
          {stats.dueForReview > 0 && (
            <span style={{ marginLeft: '4px', color: 'var(--accent-gold-dark)' }}>→</span>
          )}
        </div>
      </div>
    </div>
  );
}
