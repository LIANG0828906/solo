import React from 'react';
import { Heart, MapPin, Calendar } from 'lucide-react';
import type { User } from '../types';
import { calculateAge, getInitials } from '../utils/helpers';

interface UserCardProps {
  user: User;
  hasSentHeart: boolean;
  onSendHeart: (userId: string) => void;
}

const UserCard: React.FC<UserCardProps> = ({ user, hasSentHeart, onSendHeart }) => {
  const age = calculateAge(user.birthYear);

  return (
    <div className="relative rounded-2xl overflow-hidden transform transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl group">
      <div
        className="absolute inset-0 opacity-80"
        style={{
          background: `linear-gradient(135deg, ${user.avatarColor}20 0%, ${user.avatarColor}40 100%)`,
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
        }}
      />
      <div
        className="absolute inset-0 opacity-60"
        style={{
          background: 'linear-gradient(180deg, transparent 0%, rgba(255,255,255,0.9) 100%)',
        }}
      />

      <div className="relative p-4 md:p-6 glass-card">
        <div className="flex items-start gap-3 md:gap-4 mb-3 md:mb-4">
          <div
            className="w-14 h-14 md:w-20 md:h-20 rounded-xl md:rounded-2xl flex items-center justify-center text-white text-xl md:text-3xl font-bold shadow-lg flex-shrink-0"
            style={{ backgroundColor: user.avatarColor }}
          >
            {getInitials(user.nickname)}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base md:text-xl font-bold text-gray-800 truncate">
              {user.nickname}
            </h3>
            <div className="flex items-center gap-2 md:gap-3 mt-0.5 md:mt-1 text-gray-500 text-xs md:text-sm">
              <span className="flex items-center gap-0.5 md:gap-1">
                <Calendar className="w-3 h-3 md:w-4 md:h-4" />
                {age}岁
              </span>
              <span className="flex items-center gap-0.5 md:gap-1">
                <MapPin className="w-3 h-3 md:w-4 md:h-4" />
                {user.city}
              </span>
            </div>
            <span
              className="inline-block mt-1 md:mt-2 px-2 md:px-3 py-0.5 md:py-1 rounded-full text-[10px] md:text-xs font-medium"
              style={{
                backgroundColor: user.gender === 'female' ? '#FFE5E5' : '#E5F0FF',
                color: user.gender === 'female' ? '#FF6B6B' : '#4D96FF',
              }}
            >
              {user.gender === 'female' ? '👩 女' : '👨 男'}
            </span>
          </div>
        </div>

        <p className="text-gray-600 text-xs md:text-sm mb-3 md:mb-4 line-clamp-2">{user.bio}</p>

        <div className="flex flex-wrap gap-1 md:gap-1.5 mb-3 md:mb-4">
          {user.interests.slice(0, 4).map((interest) => (
            <span
              key={interest}
              className="px-1.5 md:px-2.5 py-0.5 md:py-1 rounded-full text-[10px] md:text-xs bg-gray-100 text-gray-600"
            >
              {interest}
            </span>
          ))}
          {user.interests.length > 4 && (
            <span className="px-1.5 md:px-2.5 py-0.5 md:py-1 rounded-full text-[10px] md:text-xs bg-gray-100 text-gray-400">
              +{user.interests.length - 4}
            </span>
          )}
        </div>

        <button
          onClick={() => onSendHeart(user.id)}
          disabled={hasSentHeart}
          className={`w-full py-2.5 md:py-3 rounded-xl font-semibold text-sm md:text-base transition-all duration-300 flex items-center justify-center gap-2 ${
            hasSentHeart
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-[#FF6B6B] to-[#FFB26B] text-white hover:shadow-lg transform hover:-translate-y-0.5 active:translate-y-0'
          }`}
        >
          <Heart
            className={`w-4 h-4 md:w-5 md:h-5 ${hasSentHeart ? '' : 'group-hover:animate-pulse'}`}
            fill={hasSentHeart ? 'none' : 'currentColor'}
          />
          {hasSentHeart ? '已发送 💌' : '发送心动 💗'}
        </button>
      </div>
    </div>
  );
};

export default React.memo(UserCard);
