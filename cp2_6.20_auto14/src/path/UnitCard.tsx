import React, { useState } from 'react';
import { ChevronDown, ChevronUp, ChevronRight, AlertTriangle, CheckCircle, Clock, BookOpen, FileText } from 'lucide-react';
import type { Unit } from '@/types';
import QuizEngine from '@/assessment/QuizEngine';
import { useLearningStore } from '@/store/useLearningStore';

interface UnitCardProps {
  unit: Unit;
  index: number;
  isLast: boolean;
  isFirst?: boolean;
  showPulse?: boolean;
}

const UnitCard: React.FC<UnitCardProps> = ({ unit, index, isLast, isFirst = false, showPulse = false }) => {
  const { toggleUnitExpand, setUnitInProgress } = useLearningStore();
  const [isHovered, setIsHovered] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isArrowHovered, setIsArrowHovered] = useState(false);

  const handleStartQuiz = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (unit.status === 'pending') {
      setUnitInProgress(unit.id);
    }
    toggleUnitExpand(unit.id);
  };

  const handleCardClick = () => {
    setIsPreviewOpen((prev) => !prev);
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
            ${showPulse ? 'animate-pulse-guide' : ''}
          `}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onClick={handleCardClick}
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
                className="text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1"
                style={{
                  backgroundColor: isFirst ? '#ed8936' : '#1a365d',
                  color: '#fff',
                }}
              >
                {isFirst && <ChevronRight className="w-3 h-3" />}
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

            <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
              <div className="flex items-center justify-center text-sm text-gray-400">
                {isPreviewOpen ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
                <span className="ml-1">
                  {isPreviewOpen ? '收起预览' : '预览题目'}
                </span>
              </div>

              <button
                onClick={handleStartQuiz}
                className={`
                  w-full py-2 px-3 rounded-lg text-sm font-medium
                  flex items-center justify-center gap-1
                  transition-all duration-200
                  ${unit.isExpanded
                    ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    : 'text-white hover:opacity-90'
                  }
                `}
                style={!unit.isExpanded ? {
                  background: 'linear-gradient(90deg, #1a365d 0%, #ed8936 100%)',
                } : undefined}
              >
                {unit.isExpanded ? (
                  <>
                    <ChevronUp className="w-4 h-4" />
                    <span>收起测验</span>
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4" />
                    <span>开始测验</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {unit.status === 'warning' && (
            <div className="absolute top-3 right-3">
              <div className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse-warning" />
            </div>
          )}

          {showPulse && (
            <div
              className="absolute inset-0 rounded-2xl pointer-events-none"
              style={{
                boxShadow: '0 0 0 0 rgba(237, 137, 54, 0.7)',
                animation: 'pulseOutline 2s ease-out 3',
                borderRadius: '16px',
              }}
            />
          )}
        </div>

        {isPreviewOpen && !unit.isExpanded && (
          <div
            className="mt-3 w-[180px] md:w-[320px]"
            style={{
              animation: 'slideDown 0.3s ease forwards',
            }}
          >
            <div className="bg-white rounded-xl shadow-md p-4 border border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <h4
                  className="text-sm font-bold flex items-center gap-1"
                  style={{ color: '#1a365d' }}
                >
                  <FileText className="w-4 h-4 text-orange-500" />
                  单元测验预览
                </h4>
                <span className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded-full">
                  共 {unit.quiz.length} 题
                </span>
              </div>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {unit.quiz.map((q, i) => (
                  <div
                    key={q.id}
                    className="p-2 rounded-lg bg-gray-50 hover:bg-orange-50 transition-colors"
                  >
                    <div className="flex items-start gap-2">
                      <span
                        className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white"
                        style={{ backgroundColor: '#1a365d' }}
                      >
                        {i + 1}
                      </span>
                      <p className="text-xs text-gray-700 flex-1 line-clamp-2">
                        {q.question}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-xs text-gray-400 text-center">
                💡 点击「开始测验」按钮进入正式答题
              </p>
            </div>
          </div>
        )}

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
        <div
          className="hidden md:flex items-center justify-center w-12 pt-12 relative"
          onMouseEnter={() => setIsArrowHovered(true)}
          onMouseLeave={() => setIsArrowHovered(false)}
        >
          <svg
            width="48"
            height="24"
            viewBox="0 0 48 24"
            className={`transition-all duration-300 ${isArrowHovered ? 'scale-110' : ''}`}
            style={{
              strokeDasharray: 1000,
              strokeDashoffset: 1000,
              animation: `drawLine 0.8s ease forwards`,
              animationDelay: `${animationDelay + 0.3}s`,
              filter: isArrowHovered ? 'drop-shadow(0 0 4px rgba(237, 137, 54, 0.6))' : 'none',
            }}
          >
            <defs>
              <linearGradient id={`arrowGradient-${unit.id}`} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop
                  offset="0%"
                  stopColor="#1a365d"
                  stopOpacity={isArrowHovered ? 0.8 : 0.3}
                />
                <stop
                  offset="100%"
                  stopColor="#ed8936"
                  stopOpacity={isArrowHovered ? 1 : 0.8}
                />
              </linearGradient>
            </defs>
            <path
              d="M0 12 L36 12 M36 12 L30 6 M36 12 L30 18"
              stroke={`url(#arrowGradient-${unit.id})`}
              strokeWidth={isArrowHovered ? 3 : 2}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>

          {isArrowHovered && (
            <div
              className="absolute -top-6 left-1/2 transform -translate-x-1/2 whitespace-nowrap z-10"
              style={{
                animation: 'fadeIn 0.2s ease forwards',
              }}
            >
              <div
                className="px-3 py-1 rounded-lg text-xs font-medium text-white shadow-md"
                style={{
                  background: 'linear-gradient(90deg, #1a365d 0%, #ed8936 100%)',
                }}
              >
                下一单元
                <div
                  className="absolute left-1/2 -translate-x-1/2 -bottom-1 w-2 h-2 rotate-45"
                  style={{ backgroundColor: '#ed8936' }}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default React.memo(UnitCard);
