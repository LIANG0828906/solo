import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import type { Assignment } from '../types';

dayjs.extend(relativeTime);

interface AssignmentCardProps {
  assignment: Assignment;
}

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

export default function AssignmentCard({ assignment }: AssignmentCardProps) {
  const navigate = useNavigate();
  const deadline = dayjs(assignment.deadline);
  const relativeTime = deadline.fromNow();
  const isOverdue = deadline.isBefore(dayjs());

  const handleClick = () => {
    navigate(`/assignments/${assignment.id}`);
  };

  return (
    <div className="assignment-card fade-in" onClick={handleClick}>
      <div className="assignment-card-header">
        <h3 className="assignment-card-title">{assignment.title}</h3>
        <span className={`status-badge ${STATUS_CLASSES[assignment.status]}`}>
          {STATUS_LABELS[assignment.status]}
        </span>
      </div>
      <div className="assignment-card-footer">
        <span className={`assignment-card-deadline ${isOverdue ? 'overdue' : ''}`}>
          截止时间: {deadline.format('YYYY-MM-DD HH:mm')} ({relativeTime})
        </span>
        <span className="assignment-card-language">{assignment.language}</span>
      </div>
    </div>
  );
}
