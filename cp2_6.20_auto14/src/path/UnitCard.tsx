import React, { useState } from 'react';
import { ChevronDown, ChevronUp, AlertTriangle, CheckCircle, Clock, BookOpen } from 'lucide-react';
import type { Unit } from '@/types';
import QuizEngine from '@/assessment/QuizEngine';
import { useLearningStore } from '@/store/useLearningStore';

interface UnitCardProps {
  unit: Unit;
  index: number;
  isLast: boolean;
}

const UnitCard: React.FC<UnitCardProps> = ({ unit, index, isLast }) => {
  const { toggleUnitExpand, setUnitInProgress } = useLearningStore();
  const [isHovered, setIsHovered] = useState(false);

  const handleToggle = () => {
    if (unit.status === 'pending') {
      setUnitInProgress(unit.id);
    }
    toggleUnitExpand(unit.id);
  };

  const getStatusIcon = () => {
    switch (unit.status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500 animate-pulse-warning" />;
      case 'in-progress':
        return <Clock className="w-5 h-5 text-blue-500" />;
      default:
        return <BookOpen className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusLabel = () => {
    switch (unit.status) {
      case 'completed':
        return '已完成';
      case 'warning':
        return '需加强';
      case 'in-progress':
        return '进行中';
      default:
        return '待学习';
    }
  };

  const getDifficultyStars = () => {
    return '★'.repeat(unit.difficulty) + '☆'.repeat(5 - unit.difficulty);
  };

  const animationDelay = index * 0.1;

  return (
    <div
      className="relative flex items-start"
      style={{
        animation: 'fadeInLeft 0.6s ease forwards',
        animationDelay: `${animationDelay}s`,
        opacity: 0,
      }}
    >
      <div className="flex flex-col items-center">
        <div
          className={`
            relative w-[180px] bg-white rounded-2xl shadow-md cursor-pointer
            transition-all duration-300 ease-out overflow-hidden
            ${isHovered ? 'transform -translate-y-2 shadow-xl' : ''}
            ${unit.status === 'warning' ? 'ring-2 ring-yellow-400' : ''}
            ${unit.isExpanded ? 'ring-2 ring-orange-400' : ''}
          `}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onClick={handleToggle}
          style={{ borderRadius: '16px' }}
        >
          <div
            className="h-2 w-full"
            style={{
              background: 'linear-gradient(90deg, #1a365d 0%, #ed8936 100%)',
            }}
          />

          <div className="p-4">
            <div className="flex items-start justify-between mb-2">
              <span
                className="text-xs font-bold px-2 py-1 rounded-full"
                style={{
                  backgroundColor: '#1a365d',
                  color: '#fff',
                }}
              >
                第{unit.order}单元
              </span>
              {getStatusIcon()}
            </div>

            <h3
              className="text-lg font-bold mb-2"
              style={{ color: '#1a365d' }}
            >
              {unit.title}
            </h3>

            <p className="text-sm text-gray-500 mb-3 line-clamp-2">
              {unit.description}
            </p>

            <div className="flex items-center justify-between text-xs">
              <span className="text-orange-500 font-medium">
                {getDifficultyStars()}
              </span>
              <span className="text-gray-400">
                {getStatusLabel()}
              </span>
            </div>

            {unit.score !== undefined && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">得分</span>
                  <span
                    className={`font-bold ${
                      unit.score >= 80
                        ? 'text-green-500'
                        : unit.score >= 60
                        ? 'text-yellow-500'
                        : 'text-red-500'
                    }`}
                  >
                    {unit.score}分
                  </span>
                </div>
                <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${unit.score}%`,
                      backgroundColor:
                        unit.score >= 80
                          ? '#38a169'
                          : unit.score >= 60
                          ? '#d69e2e'
                          : '#e53e3e',
                    }}
                  />
                </div>
              </div>
            )}

            <div className="mt-3 flex items-center justify-center text-sm text-gray-400">
              {unit.isExpanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
              <span className="ml-1">
                {unit.isExpanded ? '收起测验' : '展开测验'}
              </span>
            </div>
          </div>

          {unit.status === 'warning' && (
            <div className="absolute top-3 right-3">
              <div className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse-warning" />
            </div>
          )}
        </div>

        {unit.isExpanded && (
          <div
            className="mt-4 w-[180px] md:w-[320px] lg:w-[400px]"
            style={{
              animation: 'fadeIn 0.3s ease forwards',
            }}
          >
            <QuizEngine unit={unit} />
          </div>
        )}
      </div>

      {!isLast && (
        <div className="hidden md:flex items-center justify-center w-12 pt-12">
          <svg
            width="48"
            height="24"
            viewBox="0 0 48 24"
            className="text-gray-300"
            style={{
              strokeDasharray: 1000,
              strokeDashoffset: 1000,
              animation: `drawLine 0.8s ease forwards`,
              animationDelay: `${animationDelay + 0.3}s`,
            }}
          >
            <defs>
              <linearGradient id="arrowGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#1a365d" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#ed8936" stopOpacity="0.8" />
              </linearGradient>
            </defs>
            <path
              d="M0 12 L36 12 M36 12 L30 6 M36 12 L30 18"
              stroke="url(#arrowGradient)"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
            />
          </svg>
        </div>
      )}
    </div>
  );
};

export default React.memo(UnitCard);
