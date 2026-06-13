import React from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Calendar, Star, ChevronRight } from 'lucide-react';
import type { Objective } from '../../types';
import { calculateObjectiveProgress, calculateKRProgress, getStatusInfo, getProgressColor, getAvatarColor, getInitials } from '../utils/helpers';

interface ObjectiveCardProps {
  objective: Objective;
  onConfidenceChange?: (objectiveId: string, krId: string, value: number) => void;
}

const ObjectiveCard: React.FC<ObjectiveCardProps> = ({ objective, onConfidenceChange }) => {
  const navigate = useNavigate();
  const progress = calculateObjectiveProgress(objective);
  const statusInfo = getStatusInfo(objective.status);
  const avatarColor = getAvatarColor(objective.owner);

  const handleClick = () => {
    navigate(`/objectives/${objective.id}`);
  };

  const handleConfidenceChange = (krId: string, value: number) => {
    if (onConfidenceChange) {
      onConfidenceChange(objective.id, krId, value);
    }
  };

  return (
    <div
      onClick={handleClick}
      className="bg-white rounded-xl shadow-md p-5 card-hover cursor-pointer relative overflow-hidden"
      style={{ animation: `floatUp 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards` }}
    >
      <div
        className="absolute top-3 left-3 px-2.5 py-1 rounded text-xs font-medium"
        style={{ backgroundColor: statusInfo.bgColor, color: statusInfo.color }}
      >
        {statusInfo.label}
      </div>

      <div className="flex justify-between items-start mb-4 mt-6">
        <div className="flex-1">
          <h3 className="text-lg font-bold text-gray-800 mb-1">{objective.title}</h3>
          <p className="text-sm text-gray-500 line-clamp-2">{objective.description}</p>
        </div>
        <div className="ml-4 flex-shrink-0">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
            style={{ backgroundColor: avatarColor }}
          >
            {getInitials(objective.owner)}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 mb-4 text-sm text-gray-600">
        <div className="flex items-center gap-1">
          <User size={14} />
          <span>{objective.owner}</span>
        </div>
        <div className="flex items-center gap-1">
          <Calendar size={14} />
          <span>{objective.year} {objective.quarter}</span>
        </div>
      </div>

      <div className="space-y-3">
        {objective.keyResults.map((kr) => {
          const krProgress = calculateKRProgress(kr);
          return (
            <div key={kr.id}>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-gray-700">{kr.title}</span>
                <span className="text-sm font-medium" style={{ color: getProgressColor(krProgress) }}>
                  {krProgress}%
                </span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden mb-1">
                <div
                  className="h-full rounded-full progress-animate"
                  style={{
                    width: `${krProgress}%`,
                    backgroundColor: getProgressColor(krProgress),
                    animationDelay: '0.2s'
                  }}
                />
              </div>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleConfidenceChange(kr.id, star);
                    }}
                    className="p-0.5"
                  >
                    <Star
                      size={14}
                      fill={star <= kr.confidence ? '#fbbf24' : 'none'}
                      className={star <= kr.confidence ? 'text-yellow-400' : 'text-gray-300'}
                    />
                  </button>
                ))}
                <span className="text-xs text-gray-500 ml-1">{kr.currentValue}/{kr.targetValue}{kr.unit}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">整体进度</span>
          <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full progress-animate"
              style={{
                width: `${progress}%`,
                backgroundColor: getProgressColor(progress),
                animationDelay: '0.3s'
              }}
            />
          </div>
          <span className="text-sm font-bold" style={{ color: getProgressColor(progress) }}>
            {progress}%
          </span>
        </div>
        <ChevronRight size={20} className="text-gray-400" />
      </div>
    </div>
  );
};

export default ObjectiveCard;
