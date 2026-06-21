import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { getHeatmapColor, mealTypeLabels } from '@/utils/nutrition';
import type { FoodRecord } from '@/types';

interface TimelineProps {
  records: FoodRecord[];
  onDelete: (id: string) => void;
}

export default function Timeline({ records, onDelete }: TimelineProps) {
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());

  const handleDelete = (id: string) => {
    setDeletingIds((prev) => new Set(prev).add(id));
    setTimeout(() => {
      onDelete(id);
      setDeletingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, 300);
  };

  const sortedRecords = [...records].sort((a, b) => {
    return b.time.localeCompare(a.time);
  });

  if (sortedRecords.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">🍽️</div>
        <p>今天还没有记录饮食</p>
        <p style={{ fontSize: '12px', marginTop: '8px' }}>
          使用左侧搜索框添加食物记录
        </p>
      </div>
    );
  }

  return (
    <div className="timeline">
      {sortedRecords.map((record) => (
        <div
          key={record.id}
          className={`timeline-item ${deletingIds.has(record.id) ? 'deleting' : ''}`}
        >
          <div
            className="meal-card"
            style={{ backgroundColor: getHeatmapColor(record.calories) }}
          >
            <div className="meal-card-header">
              <div>
                <span className="meal-type-badge">
                  {mealTypeLabels[record.mealType]}
                </span>
                <div className="meal-card-title">
                  {record.foodName} ({record.amount}g)
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span className="meal-card-time">{record.time}</span>
                <button
                  className="meal-card-delete"
                  onClick={() => handleDelete(record.id)}
                  title="删除记录"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            <div className="meal-card-nutrition">
              <span>🔥 {record.calories} kcal</span>
              <span>💪 {record.protein}g</span>
              <span>🍞 {record.carbs}g</span>
              <span>🥑 {record.fat}g</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
