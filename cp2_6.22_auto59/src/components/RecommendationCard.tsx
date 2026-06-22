import { Sparkles, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useNutritionStore } from '@/store/useNutritionStore';
import { cn } from '@/lib/utils';

interface RecommendationCardProps {
  dishName?: string;
  reason?: string;
  nutrients?: string;
}

export default function RecommendationCard({
  dishName: propDishName,
  reason: propReason,
  nutrients: propNutrients,
}: RecommendationCardProps) {
  const navigate = useNavigate();
  const { recommendation } = useNutritionStore();

  const dishName = propDishName ?? recommendation?.dishName;
  const reason = propReason ?? recommendation?.reason;
  const nutrients = propNutrients ?? recommendation?.nutrients;

  const hasRecommendation = !!dishName;

  return (
    <div
      className={cn(
        'rounded-2xl p-5 shadow-card transition-all duration-300 hover:shadow-card-hover hover:-translate-y-0.5 animate-slide-in-right',
        hasRecommendation
          ? 'bg-gradient-to-br from-[rgba(76,175,80,0.1)] to-[rgba(255,152,0,0.2)]'
          : 'bg-gradient-to-br from-[rgba(76,175,80,0.08)] to-[rgba(76,175,80,0.03)]',
      )}
    >
      <div className="flex items-center gap-2 mb-4">
        <div
          className={cn(
            'w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0',
            hasRecommendation ? 'bg-accent-100' : 'bg-primary-100',
          )}
        >
          <Sparkles
            className={cn(
              'w-4 h-4',
              hasRecommendation ? 'text-accent-600' : 'text-primary-600',
            )}
          />
        </div>
        <h3 className="text-base font-bold text-gray-800">今日营养推荐</h3>
      </div>

      {!hasRecommendation ? (
        <div className="flex flex-col items-center text-center py-4">
          <CheckCircle2 className="w-12 h-12 text-primary-500 mb-3" />
          <p className="text-sm font-semibold text-primary-700">
            今天的营养摄入均衡，保持良好！
          </p>
          <p className="text-xs text-primary-500 mt-1">
            坚持健康饮食，身体会感谢你的
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <div>
            <p className="text-xs text-gray-500 mb-1">推荐菜肴</p>
            <p className="text-xl font-bold text-gray-900 leading-tight">
              {dishName}
            </p>
          </div>
          <div className="rounded-xl bg-white/60 backdrop-blur-sm p-3 space-y-2">
            <div className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-500 mt-1.5 flex-shrink-0" />
              <p className="text-xs text-gray-700 leading-relaxed">{reason}</p>
            </div>
            {nutrients && (
              <div className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-nutrient-protein mt-1.5 flex-shrink-0" />
                <p className="text-xs text-gray-600 leading-relaxed tabular-nums">
                  {nutrients}
                </p>
              </div>
            )}
          </div>
          <button
            onClick={() => navigate('/search')}
            className={cn(
              'w-full py-2.5 rounded-xl font-semibold text-white btn-ripple',
              'bg-gradient-to-r from-accent-500 to-accent-600 hover:from-accent-600 hover:to-accent-700',
              'transition-all duration-200 active:scale-[0.98]',
              'flex items-center justify-center gap-1.5',
            )}
          >
            去添加
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
