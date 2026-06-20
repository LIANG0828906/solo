import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTrainingStore } from '@/stores/trainingStore';
import { getScoreColor } from '@/calculators/PoseComparator';
import type { TrainingRecord } from '@/types';
import styles from './HistoryList.module.css';

function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function groupByDate(records: TrainingRecord[]): Record<string, TrainingRecord[]> {
  const groups: Record<string, TrainingRecord[]> = {};

  for (const record of records) {
    const dateKey = new Date(record.createdAt).toDateString();
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(record);
  }

  return groups;
}

interface HistoryCardProps {
  record: TrainingRecord;
  onView: () => void;
  onDelete: () => void;
}

function HistoryCard({ record, onView, onDelete }: HistoryCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDeleting(true);
    setTimeout(() => {
      onDelete();
    }, 300);
  };

  return (
    <div
      className={`${styles.card} ${isDeleting ? styles.deleting : ''}`}
      onClick={onView}
    >
      <div className={styles.cardIcon}>🏋️</div>
      <div className={styles.cardInfo}>
        <div className={styles.cardAction}>{record.actionName}</div>
        <div className={styles.cardMeta}>
          <span>⏱ {formatDuration(record.duration)}</span>
          <span>•</span>
          <span>
            {new Date(record.createdAt).toLocaleTimeString('zh-CN', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>
      </div>
      <div
        className={styles.cardScore}
        style={{ color: getScoreColor(record.totalScore) }}
      >
        {record.totalScore}
        <span className={styles.scoreUnit}>分</span>
      </div>
      <button
        className={styles.deleteButton}
        onClick={handleDelete}
        aria-label="删除记录"
      >
        ✕
      </button>
    </div>
  );
}

export default function HistoryList() {
  const { history, deleteRecord, setCurrentReport } = useTrainingStore();
  const navigate = useNavigate();

  const handleView = (record: TrainingRecord) => {
    setCurrentReport(record);
    navigate('/report');
  };

  if (history.length === 0) {
    return (
      <div className={styles.empty}>
        <div className={styles.emptyIcon}>📋</div>
        <h3>暂无训练记录</h3>
        <p>开始你的第一次训练吧！</p>
      </div>
    );
  }

  const grouped = groupByDate(history);
  const sortedDates = Object.keys(grouped).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  );

  return (
    <div className={styles.history}>
      <h2 className={styles.title}>历史记录</h2>

      <div className={styles.groups}>
        {sortedDates.map((dateKey) => (
          <div key={dateKey} className={styles.dateGroup}>
            <h3 className={styles.dateTitle}>
              {formatDate(grouped[dateKey][0].createdAt)}
            </h3>
            <div className={styles.cards}>
              {grouped[dateKey].map((record) => (
                <HistoryCard
                  key={record.id}
                  record={record}
                  onView={() => handleView(record)}
                  onDelete={() => deleteRecord(record.id)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
