import { useMemo } from 'react';
import type { StandupEntry } from '../types';

interface StandupLogProps {
  entries: StandupEntry[];
  onEdit?: (entry: StandupEntry) => void;
}

export function StandupLog({ entries, onEdit }: StandupLogProps) {
  const sortedEntries = useMemo(() => {
    return [...entries].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [entries]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 ${weekdays[date.getDay()]}`;
  };

  if (entries.length === 0) {
    return (
      <div className="standup-page">
        <h1 className="standup-page-title">站会记录</h1>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '300px',
            color: '#94A3B8',
            fontSize: '14px',
          }}
        >
          暂无站会记录，点击右下角按钮开始记录
        </div>
      </div>
    );
  }

  return (
    <div className="standup-page">
      <h1 className="standup-page-title">站会记录</h1>
      <div className="standup-timeline">
        {sortedEntries.map((entry) => (
          <div key={entry.id} className="standup-day">
            <h3 className="standup-date" onClick={() => onEdit?.(entry)} style={{ cursor: 'pointer' }}>
              {formatDate(entry.date)}
            </h3>
            {entry.yesterday && (
              <div className="standup-card">
                <div className="standup-card-label">昨天完成</div>
                <div className="standup-card-content">{entry.yesterday}</div>
              </div>
            )}
            {entry.today && (
              <div className="standup-card">
                <div className="standup-card-label">今天计划</div>
                <div className="standup-card-content">{entry.today}</div>
              </div>
            )}
            {entry.blockers && (
              <div className="standup-card" style={{ backgroundColor: '#FEE2E2' }}>
                <div className="standup-card-label" style={{ color: '#DC2626' }}>阻塞问题</div>
                <div className="standup-card-content">{entry.blockers}</div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
