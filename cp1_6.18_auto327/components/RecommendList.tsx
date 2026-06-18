import Link from 'next/link';
import { Sparkles, ArrowRight } from 'lucide-react';
import { RadarChart } from './RadarChart';
import { FlavorTagPill } from './FlavorTagPill';
import { RatingStars } from './RatingStars';
import { analyzeFlavorProfile, mixColors, hexToRgb } from '@/lib/flavorAnalyzer';
import type { RecommendedRecord } from '@/lib/recommender';
import type { RoastLevel } from '@prisma/client';

const ROAST_LABELS: Record<RoastLevel, string> = {
  LIGHT: '浅焙',
  MEDIUM: '中焙',
  DARK: '深焙',
  EXTRA_DARK: '极深焙',
};

interface RecommendListProps {
  recommendations: RecommendedRecord[];
  currentRecordId: string;
}

export function RecommendList({ recommendations, currentRecordId }: RecommendListProps) {
  if (recommendations.length === 0) {
    return (
      <div className="glass-card p-8 text-center">
        <div className="text-5xl mb-4">🔍</div>
        <h3 className="font-display text-xl font-semibold text-white mb-2">
          暂无推荐
        </h3>
        <p className="text-white/50 text-sm">
          多记录一些咖啡品尝体验，我们会为你推荐更多相似风味！
        </p>
      </div>
    );
  }

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-400/20 to-orange-500/20 flex items-center justify-center border border-yellow-400/20">
            <Sparkles className="w-5 h-5 text-yellow-400" />
          </div>
          <div>
            <h3 className="font-display text-xl font-bold text-white">
              为你推荐
            </h3>
            <p className="text-xs text-white/50">
              基于风味相似度智能匹配
            </p>
          </div>
        </div>
        <span className="text-xs text-white/40">
          {recommendations.length} 条匹配
        </span>
      </div>

      <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-2 -mx-2 px-2">
        {recommendations.map((rec, idx) => {
          const radarData = analyzeFlavorProfile([rec]);
          const mainColor = rec.flavorTags[0]?.color || '#FFD700';
          const similarityPercent = Math.round(rec.similarityScore * 100);

          return (
            <Link
              key={rec.id}
              href={`/records/${rec.id}`}
              className="group relative shrink-0 w-[260px] glass-card overflow-hidden animate-slide-up"
              style={{ animationDelay: `${idx * 120}ms` }}
              onClick={(e) => {
                if (rec.id === currentRecordId) e.preventDefault();
              }}
            >
              <div
                className="absolute inset-0 opacity-20 transition-opacity duration-500 group-hover:opacity-35"
                style={{
                  background: `linear-gradient(135deg, ${hexToRgb(mainColor, 0.6)} 0%, transparent 60%)`,
                }}
              />

              <div className="relative p-4">
                <div className="flex items-center justify-between mb-3">
                  <span
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border"
                    style={{
                      backgroundColor: `${mainColor}33`,
                      color: mainColor,
                      borderColor: `${mainColor}55`,
                    }}
                  >
                    <Sparkles className="w-3 h-3" />
                    {similarityPercent}% 匹配
                  </span>
                  <RatingStars value={rec.rating} readOnly size="sm" showEmoji={false} />
                </div>

                <div className="h-[140px] -mx-2 mb-3 -mt-2">
                  <RadarChart data={radarData} size="sm" />
                </div>

                <div className="mb-3">
                  <h4 className="font-display text-base font-bold text-white mb-1 line-clamp-1 group-hover:text-yellow-300 transition-colors">
                    {rec.coffeeName}
                  </h4>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-white/50 font-medium px-2 py-0.5 rounded bg-white/8">
                      {ROAST_LABELS[rec.roastLevel as RoastLevel]}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1 mb-3">
                  {rec.flavorTags.slice(0, 2).map((tag) => (
                    <FlavorTagPill
                      key={tag.id}
                      name={tag.name}
                      color={tag.color}
                      size="sm"
                    />
                  ))}
                  {rec.flavorTags.length > 2 && (
                    <span className="text-[10px] text-white/40 self-center px-1.5 py-0.5 rounded-full bg-white/8">
                      +{rec.flavorTags.length - 2}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-white/10">
                  <span className="text-[11px] text-white/40">
                    {new Date(rec.createdAt).toLocaleDateString('zh-CN', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                  <span className="flex items-center gap-1 text-xs font-medium text-yellow-400 group-hover:gap-2 transition-all">
                    品尝
                    <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
