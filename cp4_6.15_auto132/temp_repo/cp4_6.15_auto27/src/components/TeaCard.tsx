import { Link } from 'react-router-dom';
import { Calendar, MapPin } from 'lucide-react';
import type { Tea } from '@/types';

interface Props {
  tea: Tea;
  style?: React.CSSProperties;
}

const varietyColors: Record<string, string> = {
  绿茶: '#6B8E23',
  红茶: '#B22222',
  乌龙茶: '#DAA520',
  白茶: '#E8DFD0',
  黄茶: '#F4A460',
  黑茶: '#5C4033',
  普洱: '#8B4513',
  再加工茶: '#9370DB',
};

export default function TeaCard({ tea, style }: Props) {
  const location = [tea.province, tea.city, tea.region].filter(Boolean).join(' / ');
  const lastBrew = tea.lastBrewDate
    ? new Date(tea.lastBrewDate).toLocaleDateString('zh-CN')
    : '暂无记录';

  return (
    <Link
      to={`/teas/${tea.id}`}
      className="tea-card block"
      style={{
        ...style,
        textDecoration: 'none',
        color: 'inherit',
      }}
    >
      <div
        className="h-44 w-full bg-gradient-to-br from-amber-50 to-stone-100 flex items-center justify-center overflow-hidden"
        style={{
          backgroundImage:
            tea.photos[0]
              ? `url(${tea.photos[0]})`
              : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {!tea.photos[0] && (
          <div className="text-center">
            <div
              className="text-4xl mb-1"
              style={{ color: 'var(--color-wood-light)', opacity: 0.5 }}
            >
              🍵
            </div>
            <div
              className="text-xs"
              style={{ color: 'var(--color-text-light)' }}
            >
              暂无照片
            </div>
          </div>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3
            className="text-base font-semibold line-clamp-1"
            style={{ fontFamily: 'var(--font-serif)' }}
          >
            {tea.name}
          </h3>
          <span
            className="tea-tag shrink-0 text-white"
            style={{
              backgroundColor: varietyColors[tea.variety] || 'var(--color-tea)',
            }}
          >
            {tea.variety}
          </span>
        </div>
        {location && (
          <div
            className="flex items-center gap-1 text-xs mb-2"
            style={{ color: 'var(--color-text-light)' }}
          >
            <MapPin className="w-3 h-3" />
            <span className="line-clamp-1">{location}</span>
          </div>
        )}
        <div className="flex items-center justify-between pt-2" style={{ borderTop: '1px solid var(--color-border)' }}>
          <div
            className="text-xs"
            style={{ color: 'var(--color-text-light)' }}
          >
            {tea.year}年 · {tea.season}茶
          </div>
          <div
            className="flex items-center gap-1 text-xs"
            style={{ color: 'var(--color-tea)' }}
          >
            <Calendar className="w-3 h-3" />
            {lastBrew}
          </div>
        </div>
      </div>
    </Link>
  );
}
