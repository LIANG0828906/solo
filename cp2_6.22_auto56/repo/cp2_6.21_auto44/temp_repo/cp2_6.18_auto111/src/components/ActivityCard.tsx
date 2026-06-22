import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Calendar, Users, Check } from 'lucide-react';
import { useAppStore, type Activity } from '@/store/appStore';
import { formatDate, getProgressGradient, getInitials, getNameColor } from '@/utils/helpers';

interface ActivityCardProps {
  activity: Activity;
  showJoinButton?: boolean;
}

const ActivityCard: React.FC<ActivityCardProps> = ({ activity, showJoinButton = true }) => {
  const navigate = useNavigate();
  const { currentUser, joinActivity, leaveActivity, loading, users } = useAppStore();
  const [ripple, setRipple] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  const isParticipant = currentUser ? activity.participants.includes(currentUser.id) : false;
  const progress = activity.participants.length / activity.capacity;
  const progressGradient = getProgressGradient(progress);

  const handleCardClick = () => {
    navigate(`/activity/${activity.id}`);
  };

  const handleJoinLeave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUser || loading || isJoining) return;

    setIsJoining(true);
    setRipple(true);
    setTimeout(() => setRipple(false), 300);

    if (isParticipant) {
      await leaveActivity(activity.id, currentUser.id);
    } else {
      await joinActivity(activity.id, currentUser.id);
    }
    setIsJoining(false);
  };

  const getParticipantsToShow = () => {
    const participantUsers = activity.participants
      .map(id => users.find(u => u.id === id))
      .filter(Boolean)
      .slice(0, 5);
    return participantUsers;
  };

  const participantsToShow = getParticipantsToShow();
  const extraParticipants = activity.participants.length - participantsToShow.length;

  return (
    <div
      onClick={handleCardClick}
      className="
        relative overflow-hidden rounded-xl cursor-pointer
        bg-white/80 backdrop-blur-md
        shadow-md hover:shadow-xl
        transform hover:-translate-y-1
        transition-all duration-200 ease-out
        w-full md:w-[240px]
      "
    >
      <div className="p-4">
        <div className="mb-2">
          <span className="inline-block px-2 py-1 text-xs font-medium bg-indigo-100 text-indigo-600 rounded-full">
            {activity.category}
          </span>
        </div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2 line-clamp-2">
          {activity.title}
        </h3>
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {activity.description}
        </p>

        <div className="space-y-2 mb-4">
          <div className="flex items-center text-xs text-gray-500">
            <Calendar className="w-4 h-4 mr-1 text-indigo-500" />
            <span>{formatDate(activity.date)}</span>
          </div>
          <div className="flex items-center text-xs text-gray-500">
            <MapPin className="w-4 h-4 mr-1 text-red-500" />
            <span className="truncate">{activity.location}</span>
          </div>
        </div>

        <div className="mb-3">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span className="flex items-center">
              <Users className="w-3 h-3 mr-1" />
              参与人数
            </span>
            <span>{activity.participants.length}/{activity.capacity}</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(progress * 100, 100)}%`, background: progressGradient }}
            />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex -space-x-2">
            {participantsToShow.map((user, index) => (
              user && (
                <div
                  key={user.id}
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium text-white border-2 border-white"
                  style={{ backgroundColor: getNameColor(user.name), zIndex: 5 - index }}
                >
                  {getInitials(user.name)}
                </div>
              )
            ))}
            {extraParticipants > 0 && (
              <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center text-xs font-medium text-gray-600 border-2 border-white">
                +{extraParticipants}
              </div>
            )}
          </div>

          {showJoinButton && currentUser && (
            <button
              onClick={handleJoinLeave}
              disabled={isJoining || loading}
              className={`
                relative overflow-hidden px-3 py-1.5 rounded-full text-xs font-medium
                transition-all duration-200 transform
                ${ripple ? 'scale-110' : 'scale-100'}
                ${isParticipant
                  ? 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                  : activity.participants.length >= activity.capacity
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-[#6366f1] text-white hover:bg-indigo-700'
                }
              `}
              style={{
                filter: !isParticipant && activity.participants.length < activity.capacity
                  ? 'brightness(1)' : undefined
              }}
            >
              {isParticipant ? (
                <span className="flex items-center">
                  <Check className="w-3 h-3 mr-1" />
                  已参加
                </span>
              ) : activity.participants.length >= activity.capacity ? (
                '已满员'
              ) : (
                '加入活动'
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ActivityCard;
