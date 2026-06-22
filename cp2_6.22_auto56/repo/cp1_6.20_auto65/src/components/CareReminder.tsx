import { useNavigate } from 'react-router-dom';
import { Reminder, CARE_TYPE_LABELS } from '../types';
import { Droplet, Leaf } from './icons';

interface CareReminderProps {
  reminder: Reminder;
  style?: React.CSSProperties;
}

const typeIcons: Record<string, React.ReactNode> = {
  water: <Droplet />,
  fertilize: <Leaf />
};

export default function CareReminder({ reminder, style }: CareReminderProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/plant/${reminder.plantId}`);
  };

  const getStatusText = () => {
    if (reminder.status === 'overdue') {
      return `逾期 ${Math.abs(reminder.daysFromToday)} 天`;
    }
    return `还剩 ${reminder.daysFromToday} 天`;
  };

  const getStatusClass = () => {
    return reminder.status === 'overdue' ? 'tag-overdue' : 'tag-upcoming';
  };

  return (
    <div 
      className="card reminder-card"
      onClick={handleClick}
      style={style}
    >
      <div className="reminder-icon">
        {typeIcons[reminder.careType] || <Droplet />}
      </div>
      <div className="reminder-info">
        <div className="reminder-plant-name">{reminder.plantName}</div>
        <div className="reminder-type">
          {CARE_TYPE_LABELS[reminder.careType]}
        </div>
      </div>
      <span className={`tag ${getStatusClass()}`}>
        {getStatusText()}
      </span>
    </div>
  );
}
