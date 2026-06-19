import { memo, useState } from 'react';
import { Clock, Users, TrendingUp, Sparkles, Copy, Check } from 'lucide-react';
import type { BestTimeRecommendation } from '@/types';

interface BestTimeBarProps {
  recommendation: BestTimeRecommendation | null;
}

const BestTimeBar = memo(function BestTimeBar({ recommendation }: BestTimeBarProps) {
  const [copied, setCopied] = useState(false);

  if (!recommendation) {
    return (
      <div className="bg-gradient-to-r from-dark-800 to-dark-700 rounded-card p-4 border border-dark-600">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-dark-700 flex items-center justify-center">
            <Clock className="w-5 h-5 text-dark-400" />
          </div>
          <div>
            <div className="text-sm text-dark-300">等待投票数据</div>
            <div className="text-xs text-dark-500">暂无足够投票数据计算最佳时间</div>
          </div>
        </div>
      </div>
    );
  }

  const coveragePercent = Math.round(recommendation.coverage * 100);
  const isHighCoverage = recommendation.coverage >= 0.5;

  const recommendationText = `${recommendation.date} ${recommendation.startTime}-${recommendation.endTime}，覆盖 ${recommendation.participantCount}/${recommendation.totalParticipants} 人（${coveragePercent}%）`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(recommendationText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('复制失败:', err);
    }
  };

  return (
    <div
      className={`rounded-card p-4 border relative overflow-hidden transition-all duration-500 ${
        isHighCoverage
          ? 'bg-gradient-to-r from-primary-600/30 to-primary-700/20 border-primary-500/50'
          : 'bg-gradient-to-r from-dark-800 to-dark-700 border-dark-600'
      }`}
    >
      {isHighCoverage && (
        <>
          <div
            className="absolute inset-0 opacity-40 pointer-events-none"
            style={{
              background:
                'radial-gradient(ellipse at 20% 50%, rgba(79, 70, 229, 0.35) 0%, transparent 60%)',
              animation: 'breathe 3s ease-in-out infinite',
            }}
          />
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'linear-gradient(90deg, transparent 0%, rgba(129, 140, 248, 0.15) 50%, transparent 100%)',
              animation: 'shimmer 2.5s ease-in-out infinite',
            }}
          />
        </>
      )}

      <div className="relative flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 relative ${
              isHighCoverage
                ? 'bg-primary-600 text-white'
                : 'bg-dark-700 text-dark-300'
            }`}
          >
            {isHighCoverage ? (
              <Sparkles
                className="w-5 h-5"
                style={{ animation: 'sparkle-pulse 2s ease-in-out infinite' }}
              />
            ) : (
              <TrendingUp className="w-5 h-5" />
            )}
            {isHighCoverage && (
              <span
                className="absolute inset-0 rounded-full border-2 border-primary-400 opacity-75"
                style={{ animation: 'ping-soft 2s cubic-bezier(0, 0, 0.2, 1) infinite' }}
              />
            )}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-medium text-dark-200 flex items-center gap-2 flex-wrap">
              {isHighCoverage ? (
                <>
                  推荐最佳时间
                  <span
                    className="text-[10px] px-1.5 py-0.5 rounded bg-primary-500/30 text-primary-300 font-semibold"
                    style={{ animation: 'badge-pop 3s ease-in-out infinite' }}
                  >
                    推荐
                  </span>
                </>
              ) : (
                '当前最优选'
              )}
            </div>
            <div className="text-lg font-bold text-dark-100 truncate">
              {recommendation.date}
              <span className="text-sm font-normal text-dark-400 ml-2">
                {recommendation.startTime} - {recommendation.endTime}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 flex-shrink-0">
          <div className="text-right">
            <div
              className={`text-2xl font-bold ${
                isHighCoverage ? 'text-primary-400' : 'text-dark-300'
              }`}
              style={
                isHighCoverage
                  ? { animation: 'number-pulse 2.5s ease-in-out infinite' }
                  : undefined
              }
            >
              {coveragePercent}%
            </div>
            <div className="text-xs text-dark-400 flex items-center gap-1 justify-end">
              <Users className="w-3 h-3" />
              {recommendation.participantCount}/{recommendation.totalParticipants} 人
            </div>
          </div>

          <button
            onClick={handleCopy}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-medium text-sm transition-all duration-200 ease-bounce-subtle hover:scale-105 ${
              copied
                ? 'bg-green-600 text-white'
                : isHighCoverage
                ? 'bg-primary-600/80 hover:bg-primary-600 text-white'
                : 'bg-dark-700 hover:bg-dark-600 text-dark-200'
            }`}
            title="复制推荐时间"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                已复制
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                复制
              </>
            )}
          </button>
        </div>
      </div>

      <div className="relative mt-3 h-2 bg-dark-700 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-1000 ease-out relative"
          style={{
            width: `${coveragePercent}%`,
            background: isHighCoverage
              ? 'linear-gradient(90deg, #4F46E5, #818CF8, #4F46E5)'
              : 'linear-gradient(90deg, #475569, #64748b)',
            backgroundSize: isHighCoverage ? '200% 100%' : undefined,
            animation: isHighCoverage ? 'progress-shine 2s ease-in-out infinite' : undefined,
          }}
        >
          {isHighCoverage && (
            <div
              className="absolute inset-0 opacity-50"
              style={{
                background:
                  'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)',
                animation: 'shimmer-fast 1.5s ease-in-out infinite',
              }}
            />
          )}
        </div>
      </div>

      <style>{`
        @keyframes breathe {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.05); }
        }

        @keyframes shimmer {
          0%, 100% { transform: translateX(-100%); }
          50% { transform: translateX(100%); }
        }

        @keyframes shimmer-fast {
          0%, 100% { transform: translateX(-100%); opacity: 0.3; }
          50% { transform: translateX(100%); opacity: 0.7; }
        }

        @keyframes sparkle-pulse {
          0%, 100% { transform: scale(1) rotate(0deg); opacity: 1; }
          50% { transform: scale(1.15) rotate(5deg); opacity: 0.85; }
        }

        @keyframes ping-soft {
          75%, 100% { transform: scale(1.6); opacity: 0; }
        }

        @keyframes number-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.08); }
        }

        @keyframes badge-pop {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }

        @keyframes progress-shine {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
      `}</style>
    </div>
  );
});

export default BestTimeBar;
