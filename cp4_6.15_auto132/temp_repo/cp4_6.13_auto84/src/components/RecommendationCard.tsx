import React, { useState } from 'react';
import { Recommendation } from '../types';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import { ApiResponse } from '../types';

interface RecommendationCardProps {
  recommendation: Recommendation;
  rank: number;
  hasVoted?: boolean;
}

export function RecommendationCard({ recommendation, rank, hasVoted = false }: RecommendationCardProps) {
  const [voted, setVoted] = useState(hasVoted);
  const [voteCount, setVoteCount] = useState(recommendation.voteCount);
  const [isAnimating, setIsAnimating] = useState(false);
  const { user } = useAuth();

  const handleVote = async () => {
    if (!user || voted) return;

    try {
      setIsAnimating(true);
      const res = await api.voteRecommendation(recommendation.id) as ApiResponse<{ success: boolean; voteCount: number }>;
      if (res.success) {
        setVoted(true);
        setVoteCount(res.voteCount || voteCount + 1);
      }
      setTimeout(() => setIsAnimating(false), 300);
    } catch {
      setIsAnimating(false);
    }
  };

  const rankColors = [
    'from-amber-500 to-amber-600',
    'from-stone-400 to-stone-500',
    'from-amber-700 to-amber-800',
  ];

  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-stone-100 hover:shadow-md transition-shadow group">
      <a
        href={recommendation.bookstoreUrl || '#'}
        target="_blank"
        rel="noopener noreferrer"
        className="block"
      >
        <div className="relative h-36 overflow-hidden">
          <img
            src={recommendation.coverImage}
            alt={recommendation.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div
            className={`absolute top-2 left-2 w-7 h-7 rounded-full bg-gradient-to-br ${rankColors[rank - 1] || 'from-stone-300 to-stone-400'} text-white text-sm font-bold flex items-center justify-center shadow-md`}
          >
            {rank}
          </div>
        </div>
        <div className="p-3">
          <h4 className="font-medium text-stone-800 text-sm truncate" style={{ fontFamily: "'Noto Serif SC', serif" }}>
            {recommendation.title}
          </h4>
          <p className="text-xs text-stone-500 mt-0.5 truncate">{recommendation.author}</p>
        </div>
      </a>
      <div className="px-3 pb-3">
        <button
          onClick={handleVote}
          disabled={!user || voted}
          className={`w-full py-2 rounded-lg text-sm font-medium transition-all ${
            voted
              ? 'bg-stone-100 text-stone-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600'
          } ${isAnimating ? 'scale-95' : ''}`}
        >
          {voted ? '已推荐' : '推荐'}
          <span className="ml-2 font-bold">{voteCount}</span>
        </button>
      </div>
    </div>
  );
}
