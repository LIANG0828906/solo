import React from 'react';
import { Club } from '../types';
import { getCountdown, truncateText } from '../utils/format';
import { useNavigate } from 'react-router-dom';

interface BookClubCardProps {
  club: Club;
  style?: React.CSSProperties;
}

export function BookClubCard({ club, style }: BookClubCardProps) {
  const navigate = useNavigate();
  const countdown = getCountdown(club.endDate);

  const handleClick = () => {
    navigate(`/club/${club.id}`);
  };

  return (
    <div
      className="book-club-card bg-white rounded-xl overflow-hidden shadow-md cursor-pointer"
      style={style}
      onClick={handleClick}
    >
      <div className="relative h-44 overflow-hidden">
        <img
          src={club.coverImage}
          alt={club.name}
          className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <div className="absolute bottom-3 left-3 right-3">
          <h3 className="text-white font-semibold text-lg leading-tight line-clamp-2" style={{ fontFamily: "'Noto Serif SC', serif" }}>
            {club.name}
          </h3>
        </div>
        {club.hasCrowdfunding && (
          <div className="absolute top-3 right-3 px-2 py-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs rounded-full font-medium">
            众筹中
          </div>
        )}
      </div>
      <div className="p-4">
        <p className="text-stone-600 text-sm line-clamp-2 mb-3" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {truncateText(club.description, 60)}
        </p>
        <div className="flex items-center justify-between text-xs text-stone-500">
          <div className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span>{club.reviewCount} 篇书评</span>
          </div>
          <div className="flex items-center gap-1 text-amber-700 font-medium">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{countdown}</span>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-stone-100 flex items-center gap-2">
          <img
            src={club.creatorAvatar}
            alt={club.creatorNickname}
            className="w-6 h-6 rounded-full object-cover"
          />
          <span className="text-xs text-stone-500">发起人：{club.creatorNickname}</span>
        </div>
      </div>
    </div>
  );
}
