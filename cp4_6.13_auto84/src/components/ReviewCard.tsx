import React, { useState } from 'react';
import { Review } from '../types';
import { StarRating } from './StarRating';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import { ApiResponse } from '../types';
import { formatDate } from '../utils/format';

interface ReviewCardProps {
  review: Review;
  hasVoted?: boolean;
  isNew?: boolean;
}

export function ReviewCard({ review, hasVoted = false, isNew = false }: ReviewCardProps) {
  const [voted, setVoted] = useState(hasVoted);
  const [helpfulCount, setHelpfulCount] = useState(review.helpfulCount);
  const [isAnimating, setIsAnimating] = useState(false);
  const { user } = useAuth();

  const handleHelpful = async () => {
    if (!user || voted) return;
    
    try {
      setIsAnimating(true);
      const res = await api.voteHelpful(review.id) as ApiResponse<{ success: boolean; helpfulCount: number }>;
      if (res.success) {
        setVoted(true);
        setHelpfulCount(res.helpfulCount || helpfulCount + 1);
      }
      setTimeout(() => setIsAnimating(false), 300);
    } catch {
      setIsAnimating(false);
    }
  };

  return (
    <div
      className={`bg-white rounded-xl p-4 shadow-sm border border-stone-100 ${
        isNew ? 'animate-fade-in-top' : ''
      }`}
    >
      <div className="flex gap-3">
        <img
          src={review.userAvatar}
          alt={review.userNickname}
          className="w-10 h-10 rounded-full object-cover flex-shrink-0"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-1">
            <div>
              <h4 className="font-medium text-stone-800 text-sm">{review.userNickname}</h4>
              <p className="text-xs text-stone-400">{formatDate(review.createdAt)}</p>
            </div>
            <StarRating rating={review.rating} size="sm" />
          </div>
          <p className="text-stone-600 text-sm mt-2 leading-relaxed">{review.content}</p>
          <div className="mt-3 pt-3 border-t border-stone-50 flex items-center justify-between">
            <button
              onClick={handleHelpful}
              disabled={!user || voted}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                voted
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-stone-50 text-stone-500 hover:bg-amber-50 hover:text-amber-700'
              } ${isAnimating ? 'scale-95' : ''} ${!user ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
            >
              <svg className="w-4 h-4" fill={voted ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
              </svg>
              <span>有用</span>
              <span className="font-bold">{helpfulCount}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
