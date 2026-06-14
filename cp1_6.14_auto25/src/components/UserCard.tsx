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
        }}
      />
      <div
        className="absolute inset-0 opacity-60"
        style={{
          background: 'linear-gradient(180deg, transparent 0%, rgba(255,255,255,0.9) 100%)',
        }}
      />

      <div className="relative p-6 backdrop-blur-xl bg-white/70">
        <div className="flex items-start gap-4 mb-4">
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center text-white text-3xl font-bold shadow-lg flex-shrink-0"
            style={{ backgroundColor: user.avatarColor }}
          >
            {getInitials(user.nickname)}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-bold text-gray-800 truncate">
              {user.nickname}
            </h3>
            <div className="flex items-center gap-3 mt-1 text-gray-500 text-sm">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {age}岁
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {user.city}
              </span>
            </div>
            <span
              className="inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium"
              style={{
                backgroundColor: user.gender === 'female' ? '#FFE5E5' : '#E5F0FF',
                color: user.gender === 'female' ? '#FF6B6B' : '#4D96FF',
              }}
            >
              {user.gender === 'female' ? '👩 女' : '👨 男'}
            </span>
          </div>
        </div>

        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{user.bio}</p>

        <div className="flex flex-wrap gap-1.5 mb-4">
          {user.interests.slice(0, 5).map((interest) => (
            <span
              key={interest}
              className="px-2.5 py-1 rounded-full text-xs bg-gray-100 text-gray-600"
            >
              {interest}
            </span>
          ))}
          {user.interests.length > 5 && (
            <span className="px-2.5 py-1 rounded-full text-xs bg-gray-100 text-gray-400">
              +{user.interests.length - 5}
            </span>
          )}
        </div>

        <button
          onClick={() => onSendHeart(user.id)}
          disabled={hasSentHeart}
          className={`w-full py-3 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
            hasSentHeart
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-[#FF6B6B] to-[#FFB26B] text-white hover:shadow-lg transform hover:-translate-y-0.5 active:translate-y-0'
          }`}
        >
          <Heart
            className={`w-5 h-5 ${hasSentHeart ? '' : 'group-hover:animate-pulse'}`}
            fill={hasSentHeart ? 'none' : 'currentColor'}
          />
          {hasSentHeart ? '已发送心动 💌' : '发送心动 💗'}
        </button>
      </div>
    </div>
  );
};

export default React.memo(UserCard);
