import { memo } from 'react';
import { Clock, Users, TrendingUp } from 'lucide-react';
import type { BestTimeRecommendation } from '@/types';
import { format, parseISO } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface BestTimeBarProps {
  recommendation: BestTimeRecommendation | null;
}

const BestTimeBar = memo(function BestTimeBar({ recommendation }: BestTimeBarProps) {
  if (!recommendation) {
    return (
      <div className="bg-gradient-to-r from-dark-800 to-dark-700 rounded-card p-4 border border-dark-600">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-dark-700 flex items-center justify-center">
            <Clock className="w-5 h-5 text-dark-400" />
          </div>
          <div>
            <div className="text-sm text-dark-300">等待投票数据</div>
            <div className="text-xs text-dark-500">
              暂无足够投票数据计算最佳时间
            </div>
          </div>
        </div>
      </div>
    );
  }

  const coveragePercent = Math.round(recommendation.coverage * 100);
  const isHighCoverage = recommendation.coverage >= 0.5;

  return (
    <div
      className={`rounded-card p-4 border transition-all duration-500 ${
        isHighCoverage
          ? 'bg-gradient-to-r from-primary-600/30 to-primary-700/20 border-primary-500/50 shadow-glow'
          : 'bg-gradient-to-r from-dark-800 to-dark-700 border-dark-600'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center ${
              isHighCoverage
                ? 'bg-primary-600 text-white'
                : 'bg-dark-700 text-dark-300'
            }`}
          >
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-medium text-dark-200">
              {isHighCoverage ? '推荐最佳时间' : '当前最优选'}
            </div>
            <div className="text-lg font-bold text-dark-100">
              {recommendation.date}
              <span className="text-sm font-normal text-dark-400 ml-2">
                {recommendation.startTime} - {recommendation.endTime}
              </span>
            </div>
          </div>
        </div>

        <div className="text-right">
          <div
          className="text-2xl font-bold text-primary-400"
          >
            {coveragePercent}%
          </div>
          <div className="text-xs text-dark-400 flex items-center gap-1 justify-end">
            <Users className="w-3 h-3" />
            {recommendation.participantCount}/{recommendation.totalParticipants} 人
          </div>
        </div>
      </div>

      <div className="mt-3 h-2 bg-dark-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-primary-500 to-primary-400 rounded-full transition-all duration-1000 ease-out"
          style={{ width: `${coveragePercent}%` }}
        />
      </div>
    </div>
  );
});

export default BestTimeBar;
