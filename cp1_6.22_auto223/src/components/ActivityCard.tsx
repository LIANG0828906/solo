import { Calendar, MapPin, Users, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Activity } from '@/types';
import { formatShortDate, isRegistrationOpen } from '@/utils/dateFormat';

interface ActivityCardProps {
  activity: Activity;
}

export const ActivityCard: React.FC<ActivityCardProps> = ({ activity }) => {
  const navigate = useNavigate();
  const statusClass = `status-${activity.status}`;
  const statusText = {
    upcoming: '即将开始',
    ongoing: '进行中',
    ended: '已结束',
  }[activity.status];

  const handleClick = () => {
    navigate(`/activity/${activity.id}`);
  };

  return (
    <div className="activity-card" onClick={handleClick} role="button" tabIndex={0}>
      <div className={`activity-card-status-bar ${statusClass}`} title={statusText} />
      <div className="activity-card-content">
        <h3 className="activity-card-title">{activity.name}</h3>
        <div className="activity-card-meta">
          <div className="activity-card-meta-item">
            <Calendar size={14} />
            <span>{formatShortDate(activity.date)}</span>
          </div>
          <div className="activity-card-meta-item">
            <MapPin size={14} />
            <span>{activity.location}</span>
          </div>
          <div className="activity-card-meta-item">
            <Users size={14} />
            <span>{activity.quota} 人限额</span>
          </div>
        </div>
        <p className="activity-card-description">{activity.description}</p>
        <div className="activity-card-footer">
          <span className="activity-card-quota">
            <Clock size={12} style={{ display: 'inline', marginRight: 4 }} />
            {isRegistrationOpen(activity.registrationDeadline) ? '报名中' : '已截止'}
          </span>
          <span className="activity-card-code">{activity.inviteCode}</span>
        </div>
      </div>
    </div>
  );
};
