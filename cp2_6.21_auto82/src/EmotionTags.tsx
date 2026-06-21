import React, { useMemo } from 'react';
import { Heart } from 'lucide-react';
import {
  PaletteColor,
  findDominantColor,
  getEmotionTags,
  hexToHsl,
} from './colorEngine';

export interface EmotionTagsProps {
  colors: PaletteColor[];
}

const EmotionTags: React.FC<EmotionTagsProps> = ({ colors }) => {
  const { dominant, tags } = useMemo(() => {
    const filled = colors.filter((c) => c.hex).map((c) => c.hex);
    const dom = findDominantColor(filled);
    if (!dom) return { dominant: null as string | null, tags: [] as string[] };
    const hsl = hexToHsl(dom);
    return { dominant: dom, tags: getEmotionTags(hsl.h) };
  }, [colors]);

  return (
    <div className="emotion-tags">
      <span className="emotion-label">
        <Heart size={12} style={{ display: 'inline', verticalAlign: '-2px', marginRight: '4px' }} />
        情感标签
      </span>
      {dominant ? (
        tags.map((t, i) => (
          <span
            key={i}
            className="emotion-tag"
            style={{
              background: `linear-gradient(135deg, ${dominant}88 0%, rgba(114, 9, 183, 0.6) 100%)`,
              animationDelay: `${i * 0.05}s`,
            }}
          >
            {t}
          </span>
        ))
      ) : (
        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          添加颜色自动推荐
        </span>
      )}
    </div>
  );
};

export default React.memo(EmotionTags);
