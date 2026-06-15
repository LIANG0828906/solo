import React from 'react';
import { Calendar, MapPin, Users } from 'lucide-react';
import { Activity } from '../utils/apiClient';
import { formatDateTime, getStatusText, getStatusColor } from '../utils/format';
import { useNavigate } from 'react-router-dom';

interface ActivityCardProps {
  activity: Activity;
  showTimeline?: boolean;
}

export default function ActivityCard({ activity, showTimeline = false }: ActivityCardProps) {
  const navigate = useNavigate();
  const isEnded = activity.status === 'ended';

  const handleClick = () => {
    navigate(`/activities/${activity.id}`);
  };

  return (
    <div
      onClick={handleClick}
      className={`relative bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden ${
        isEnded ? 'opacity-60 saturate-50' : ''
      }`}
    >
      {showTimeline && (
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200">
          <div className="absolute top-8 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-primary-500 border-2 border-white" />
        </div>
      )}
      <div className={`${showTimeline ? 'pl-14' : ''} p-5`}>
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-800">{activity.title}</h3>
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
              activity.status
            )}`}
          >
            {getStatusText(activity.status)}
          </span>
        </div>
        {activity.description && (
          <p className="text-gray-500 text-sm mb-4 line-clamp-2">{activity.description}</p>
        )}
        <div className="flex flex-wrap gap-4 text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-primary-500" />
            <span>{formatDateTime(activity.startTime)}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin size={16} className="text-primary-500" />
            <span>{activity.location}</span>
          </div>
          <div className="flex items-center gap-2">
            <Users size={16} className="text-primary-500" />
            <span>
              {activity.currentParticipants}/{activity.maxParticipants} 人
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
