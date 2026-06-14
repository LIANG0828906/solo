import { memo, useState } from 'react';
import type { GiftIdea } from '@/types';
import { Tag, ShoppingCart, ExternalLink } from 'lucide-react';

interface GiftCardProps {
  gift: GiftIdea;
  index: number;
}

export const GiftCard = memo(function GiftCard({ gift }: GiftCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  return (
    <div
      className={`gift-card flip-card h-72 ${isFlipped ? 'flipped' : ''}`}
      onClick={handleFlip}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleFlip();
        }
      }}
    >
      <div className="flip-card-inner">
        <div
          className="flip-card-front p-6 flex flex-col justify-between"
          style={{ background: gift.gradient }}
        >
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Tag size={20} className="text-white/80" />
              <span className="text-sm font-medium text-white/80">
                {gift.category}
              </span>
            </div>
            <h3 className="text-2xl font-bold font-display text-white leading-tight">
              {gift.name}
            </h3>
          </div>

          <div>
            <div className="flex flex-wrap gap-1.5 mb-4">
              {gift.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-2 py-1 rounded-full bg-white/20 text-white"
                >
                  {tag}
                </span>
              ))}
            </div>
            <p className="text-white/70 text-sm flex items-center gap-1">
              <ShoppingCart size={14} />
              点击翻转查看购买建议
            </p>
          </div>
        </div>

        <div className="flip-card-back bg-white/10 backdrop-blur-md p-6 flex flex-col justify-between border border-white/20">
          <div>
            <h4 className="text-lg font-bold text-[#D4AF37] mb-3">
              {gift.name}
            </h4>
            <p className="text-gray-200 text-sm leading-relaxed">
              {gift.description}
            </p>
          </div>

          <div>
            <p className="text-xs text-gray-400 mb-2">推荐购买平台：</p>
            <div className="flex flex-wrap gap-2">
              {gift.platforms.map((platform) => (
                <a
                  key={platform}
                  href="#"
                  onClick={(e) => e.stopPropagation()}
                  className="text-xs px-3 py-1.5 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] hover:bg-[#D4AF37] hover:text-[#1a1a2e] transition-all duration-200 flex items-center gap-1"
                >
                  {platform}
                  <ExternalLink size={10} />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
