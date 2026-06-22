import type { Sprint } from '../types';

interface SprintHeaderProps {
  sprint: Sprint;
  onSprintChange?: () => void;
}

export function SprintHeader({ sprint }: SprintHeaderProps) {
  const totalEstimate = sprint.tasks.reduce((sum, t) => sum + t.estimateHours, 0);
  const doneEstimate = sprint.tasks
    .filter((t) => t.column === 'done')
    .reduce((sum, t) => sum + t.estimateHours, 0);
  const progress = totalEstimate > 0 ? (doneEstimate / totalEstimate) * 100 : 0;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}月${date.getDate()}日`;
  };

  return (
    <header className="sprint-header">
      <div className="sprint-info">
        <h1 className="sprint-name">{sprint.name}</h1>
        <span className="sprint-date">
          {formatDate(sprint.startDate)} - {formatDate(sprint.endDate)}
        </span>
      </div>
      <div className="sprint-progress">
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="progress-text">{Math.round(progress)}%</span>
      </div>
    </header>
  );
}
