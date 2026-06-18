import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Calendar, Users, User, Check } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import {
  formatFullDate,
  getRandomGradient,
  getInitials,
  getNameColor,
  getProgressGradient
} from '@/utils/helpers';

const ActivityDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { activities, currentUser, joinActivity, leaveActivity, users, loading } = useAppStore();
  const [ripple, setRipple] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  const activity = activities.find(a => a.id === id);

  if (!activity) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">活动不存在</p>
          <button
            onClick={() => navigate('/')}
            className="text-[#6366f1] hover:text-indigo-700"
          >
            返回首页
          </button>
        </div>
      </div>
    );
  }

  const isParticipant = currentUser ? activity.participants.includes(currentUser.id) : false;
  const progress = activity.participants.length / activity.capacity;
  const progressGradient = getProgressGradient(progress);
  const gradient = getRandomGradient(activity.id);

  const participantUsers = activity.participants
    .map(pid => users.find(u => u.id === pid))
    .filter(Boolean);

  const recentParticipants = participantUsers.slice(-5);
  const extraCount = participantUsers.length - 5;

  const handleJoinLeave = async () => {
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

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-32">
      <div
        className="h-48 md:h-64 relative"
        style={{ background: gradient }}
      >
        <button
          onClick={() => navigate(-1)}
          className="absolute top-6 left-6 flex items-center text-white/90 hover:text-white transition-colors bg-black/20 backdrop-blur-sm px-4 py-2 rounded-full"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          返回
        </button>
      </div>

      <div className="max-w-3xl mx-auto px-4 -mt-20 relative z-10">
        <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg overflow-hidden animate-fade-in">
          <div className="p-6 md:p-8">
            <div className="mb-4">
              <span className="inline-block px-3 py-1 text-sm font-medium bg-indigo-100 text-indigo-600 rounded-full">
                {activity.category}
              </span>
            </div>

            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4">
              {activity.title}
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="flex items-center text-gray-600">
                <Calendar className="w-5 h-5 mr-3 text-[#6366f1]" />
                <div>
                  <p className="text-xs text-gray-400">活动时间</p>
                  <p className="text-sm font-medium">{formatFullDate(activity.date)}</p>
                </div>
              </div>
              <div className="flex items-center text-gray-600">
                <MapPin className="w-5 h-5 mr-3 text-[#ef4444]" />
                <div>
                  <p className="text-xs text-gray-400">活动地点</p>
                  <p className="text-sm font-medium">{activity.location}</p>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <div className="flex justify-between text-sm text-gray-500 mb-2">
                <span className="flex items-center">
                  <Users className="w-4 h-4 mr-1" />
                  报名进度
                </span>
                <span className="font-medium">
                  {activity.participants.length}/{activity.capacity} 人
                </span>
              </div>
              <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(progress * 100, 100)}%`, background: progressGradient }}
                />
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">活动详情</h3>
              <p className="text-gray-600 leading-relaxed">
                {activity.description}
              </p>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">组织者</h3>
              <div className="flex items-center">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium"
                  style={{ backgroundColor: getNameColor(activity.organizer) }}
                >
                  {getInitials(activity.organizer)}
                </div>
                <div className="ml-3">
                  <p className="font-medium text-gray-800">{activity.organizer}</p>
                  <p className="text-xs text-gray-500">活动组织者</p>
                </div>
              </div>
            </div>

            {participantUsers.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">
                  参与者 ({participantUsers.length})
                </h3>
                <div className="flex items-center">
                  <div className="flex -space-x-3">
                    {recentParticipants.map((user, index) => (
                      user && (
                        <div
                          key={user.id}
                          className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium text-white border-3 border-white"
                          style={{
                            backgroundColor: getNameColor(user.name),
                            zIndex: recentParticipants.length - index
                          }}
                        >
                          {getInitials(user.name)}
                        </div>
                      )
                    ))}
                  </div>
                  {extraCount > 0 && (
                    <div className="ml-4 text-sm text-gray-500">
                      等 {participantUsers.length} 人参加
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-gray-200 p-4">
        <div className="max-w-3xl mx-auto flex justify-center">
          <button
            onClick={handleJoinLeave}
            disabled={isJoining || loading || (!isParticipant && activity.participants.length >= activity.capacity)}
            className={`
              relative overflow-hidden w-60 h-12 rounded-full font-medium text-white
              transition-all duration-300 transform
              ${ripple ? 'scale-110' : 'scale-100'}
              ${isParticipant
                ? 'bg-gray-400 hover:bg-gray-500'
                : activity.participants.length >= activity.capacity
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-[#6366f1]'
              }
            `}
            style={{
              filter: !isParticipant && activity.participants.length < activity.capacity
                ? 'brightness(1)' : undefined
            }}
            onMouseEnter={(e) => {
              if (!isParticipant && activity.participants.length < activity.capacity) {
                e.currentTarget.style.filter = 'brightness(0.9)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.filter = 'brightness(1)';
            }}
          >
            {isParticipant ? (
              <span className="flex items-center justify-center">
                <Check className="w-5 h-5 mr-2" />
                已参加
              </span>
            ) : activity.participants.length >= activity.capacity ? (
              '名额已满'
            ) : (
              '加入活动'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ActivityDetail;
