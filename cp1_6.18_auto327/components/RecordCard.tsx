import Link from 'next/link';
import { RatingStars } from './RatingStars';
import { FlavorTagPill } from './FlavorTagPill';
import { mixColors, hexToRgb } from '@/lib/flavorAnalyzer';
import type { RoastLevel } from '@prisma/client';

interface FlavorTag {
  id: string;
  name: string;
  color: string;
}

interface RecordCardProps {
  id: string;
  coffeeName: string;
  roastLevel: RoastLevel;
  rating: number;
  createdAt: Date | string;
  flavorTags: FlavorTag[];
  index?: number;
}

const ROAST_LABELS: Record<RoastLevel, { label: string; bg: string }> = {
  LIGHT: { label: '浅焙', bg: 'from-amber-300 to-amber-400' },
  MEDIUM: { label: '中焙', bg: 'from-orange-400 to-orange-500' },
  DARK: { label: '深焙', bg: 'from-orange-600 to-red-700' },
  EXTRA_DARK: { label: '极深', bg: 'from-red-800 to-gray-900' },
};

function formatDate(date: Date | string): string {
  const d = new Date(date);
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
  if (diff === 0) return '今天';
  if (diff === 1) return '昨天';
  if (diff < 7) return `${diff}天前`;
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}

export function RecordCard({
  id,
  coffeeName,
  roastLevel,
  rating,
  createdAt,
  flavorTags,
  index = 0,
}: RecordCardProps) {
  const colors = flavorTags.map((t) => t.color);
  const mixedColor = colors.length > 0 ? mixColors(colors) : '#16213E';
  const roastInfo = ROAST_LABELS[roastLevel] || ROAST_LABELS.MEDIUM;

  return (
    <Link
      href={`/records/${id}`}
      className="group relative block glass-card overflow-hidden animate-slide-up"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <div
        className="absolute inset-0 opacity-30 transition-opacity duration-500 group-hover:opacity-50"
        style={{
          background: `radial-gradient(ellipse at top right, ${hexToRgb(mixedColor, 0.8)} 0%, transparent 55%),
                       radial-gradient(ellipse at bottom left, ${hexToRgb(colors[1] || mixedColor, 0.5)} 0%, transparent 50%),
                       rgba(22, 33, 62, 0.4)`,
        }}
      />

      <div
        className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-20 -translate-y-1/2 translate-x-1/2 transition-transform duration-500 group-hover:scale-125"
        style={{ backgroundColor: mixedColor }}
      />

      <div className="relative p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`roast-badge bg-gradient-to-r ${roastInfo.bg} text-white shadow-sm`}
            >
              {roastInfo.label}
            </span>
            <span className="text-xs text-white/40 font-medium">
              {formatDate(createdAt)}
            </span>
          </div>
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-sm"
            style={{
              background: `linear-gradient(135deg, ${mixedColor}aa 0%, ${mixedColor}66 100%)`,
              boxShadow: `0 0 12px ${hexToRgb(mixedColor, 0.4)}`,
            }}
          >
            ☕
          </div>
        </div>

        <h3 className="font-display text-xl font-bold text-white mb-3 group-hover:text-yellow-300 transition-colors line-clamp-1">
          {coffeeName}
        </h3>

        <div className="mb-4">
          <RatingStars value={rating} readOnly size="sm" showEmoji={false} />
        </div>

        <div className="flex flex-wrap gap-1.5">
          {flavorTags.slice(0, 3).map((tag) => (
            <FlavorTagPill
              key={tag.id}
              name={tag.name}
              color={tag.color}
              size="sm"
            />
          ))}
          {flavorTags.length > 3 && (
            <span className="text-xs text-white/40 self-center">
              +{flavorTags.length - 3}
            </span>
          )}
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-yellow-400/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      </div>
    </Link>
  );
}
