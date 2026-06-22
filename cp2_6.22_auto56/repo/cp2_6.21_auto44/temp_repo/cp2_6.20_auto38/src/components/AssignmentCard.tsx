import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import type { Assignment } from '../types';

dayjs.extend(relativeTime);

const STATUS_LABELS: Record<Assignment['status'], string> = {
  not_started: '未开始',
  in_progress: '进行中',
  submitted: '已提交',
};

const STATUS_CLASSES: Record<Assignment['status'], string> = {
  not_started: 'status-not-started',
  in_progress: 'status-in-progress',
  submitted: 'status-submitted',
};

const LANGUAGE_LABELS: Record<string, string> = {
  python: 'Python',
  javascript: 'JavaScript',
  java: 'Java',
};

interface AssignmentCardProps {
  assignment: Assignment;
}

export default function AssignmentCard({ assignment }: AssignmentCardProps) {
  const navigate = useNavigate();
  const deadline = dayjs(assignment.deadline);
  const deadlineText = deadline.fromNow();
  const isOverdue = deadline.isBefore(dayjs());

  const handleClick = () => {
    navigate(`/assignments/${assignment.id}`);
  };

  return (
    <div className="assignment-card fade-in" onClick={handleClick}>
      <h3 className="assignment-card__title">{assignment.title}</h3>
      <p className="assignment-card__description">
        {assignment.description.replace(/[#*`_]/g, '').slice(0, 100)}...
      </p>
      <div className="assignment-card__meta">
        <span className={`assignment-card__deadline ${isOverdue ? 'overdue' : ''}`}>
          ⏰ {deadlineText}
        </span>
        <span className={`status-badge ${STATUS_CLASSES[assignment.status]}`}>
          {STATUS_LABELS[assignment.status]}
        </span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: 'var(--text-secondary)', paddingTop: '8px', borderTop: '1px solid var(--border-light)' }}>
        <span>语言: {LANGUAGE_LABELS[assignment.language] || assignment.language}</span>
        <span>测试用例: {assignment.testCases.length} 个</span>
      </div>
    </div>
  );
}
