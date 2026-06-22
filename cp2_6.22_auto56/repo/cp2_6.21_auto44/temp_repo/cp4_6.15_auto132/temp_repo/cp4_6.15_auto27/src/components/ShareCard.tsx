import { forwardRef, useMemo } from 'react';
import { Star } from 'lucide-react';
import type { Tea, TastingNote } from '@/types';

interface Props {
  tea: Tea;
  bestNote?: TastingNote | null;
  quote?: string;
}

export const ShareCard = forwardRef<HTMLDivElement, Props>(
  function ShareCard({ tea, bestNote, quote }, ref) {
    const stars = useMemo(() => {
      if (!bestNote) return 0;
      return Math.round(bestNote.overallScore / 20);
    }, [bestNote]);

    const location = [tea.province, tea.city, tea.region].filter(Boolean).join(' · ');
    const displayQuote = quote || tea.description || '茶如人生，甘苦自知。';

    return (
      <div
        ref={ref}
        className="p-8 flex flex-col"
        style={{
          width: 420,
          height: 560,
          backgroundColor: '#F9F6F0',
          borderRadius: 20,
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          color: '#3A2E22',
          fontFamily: "'Noto Serif SC', serif",
        }}
      >
        <div className="flex items-center gap-2 mb-5">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-white text-lg"
            style={{ backgroundColor: '#6B8E23' }}
          >
            🍵
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 600, color: '#6B4828' }}>茶鉴</div>
            <div style={{ fontSize: 11, color: '#7A6B5A', fontFamily: 'Inter, sans-serif' }}>
              Tea Tasting Journal
            </div>
          </div>
        </div>

        <div
          className="rounded-xl overflow-hidden mb-5"
          style={{
            height: 160,
            backgroundImage: tea.photos[0] ? `url(${tea.photos[0]})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundColor: '#E8DFD0',
          }}
        >
          {!tea.photos[0] && (
            <div className="w-full h-full flex items-center justify-center">
              <span style={{ fontSize: 56, opacity: 0.3 }}>🍃</span>
            </div>
          )}
        </div>

        <h2 style={{ fontSize: 26, fontWeight: 700, color: '#6B4828', marginBottom: 6 }}>
          {tea.name}
        </h2>
        <div style={{ fontSize: 13, color: '#7A6B5A', marginBottom: 14, fontFamily: 'Inter, sans-serif' }}>
          {location} · {tea.year}年{tea.season}茶 · {tea.variety}
        </div>

        {bestNote && (
          <div className="flex items-center gap-3 mb-5">
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((n) => (
                <Star
                  key={n}
                  size={18}
                  fill={n <= stars ? '#6B8E23' : 'none'}
                  color={n <= stars ? '#6B8E23' : '#E8DFD0'}
                  strokeWidth={2}
                />
              ))}
            </div>
            <div
              style={{
                fontSize: 22,
                fontWeight: 700,
                color: '#6B8E23',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              {bestNote.overallScore}
            </div>
            <div style={{ fontSize: 12, color: '#7A6B5A' }}>分</div>
          </div>
        )}

        <div
          className="flex-1 flex items-center p-4 rounded-lg"
          style={{ backgroundColor: 'rgba(139, 94, 60, 0.06)', borderLeft: '3px solid #8B5E3C' }}
        >
          <p
            style={{
              fontSize: 15,
              lineHeight: 1.8,
              color: '#3A2E22',
              margin: 0,
              fontStyle: 'italic',
            }}
          >
            "{displayQuote}"
          </p>
        </div>

        <div
          className="flex items-center justify-between pt-5"
          style={{ borderTop: '1px dashed #E8DFD0' }}
        >
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm"
              style={{ backgroundColor: '#8B5E3C' }}
            >
              我
            </div>
            <span style={{ fontSize: 13, color: '#7A6B5A' }}>茶鉴品鉴师</span>
          </div>
          <span style={{ fontSize: 11, color: '#A67C52', fontFamily: 'Inter, sans-serif' }}>
            {new Date().toLocaleDateString('zh-CN')}
          </span>
        </div>
      </div>
    );
  }
);
