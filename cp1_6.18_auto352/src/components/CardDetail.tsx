import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { fetchCard, fetchCards } from '@/modules/cardModule';
import type { Card } from '@/types';
import { cn } from '@/lib/utils';

export default function CardDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);

  const [card, setCard] = useState<Card | null>(null);
  const [relatedCards, setRelatedCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        const cardId = parseInt(id, 10);
        const cardData = await fetchCard(cardId);
        setCard(cardData);

        if (cardData.relatedCards && cardData.relatedCards.length > 0) {
          const allCards = await fetchCards();
          const related = allCards.filter((c) => cardData.relatedCards.includes(c.id));
          setRelatedCards(related);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : '加载失败');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id]);

  const handleScroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const scrollAmount = 140;
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
        <div className="text-lg text-[#5D4037]">加载中...</div>
      </div>
    );
  }

  if (error || !card) {
    return (
      <div className="min-h-screen p-6 flex flex-col items-center justify-center gap-4">
        <div className="text-lg text-[#5D4037]">{error || '卡片不存在'}</div>
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 bg-[#795548] text-white rounded-lg hover:bg-[#6D4C41] transition-colors"
        >
          返回
        </button>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen p-6"
      style={{
        backgroundColor: '#D7CCC8',
        backgroundImage: `repeating-linear-gradient(
          0deg,
          transparent,
          transparent 2px,
          #BCAAA4 2px,
          #BCAAA4 3px
        )`,
        fontFamily: "'Noto Sans SC', sans-serif",
      }}
    >
      <div className="mx-auto" style={{ width: '70%' }}>
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-[#795548] hover:text-[#5D4037] transition-colors mb-6"
        >
          <ArrowLeft size={20} />
          <span>返回</span>
        </button>

        <img
          src={card.image}
          alt={card.title}
          className="w-full rounded-lg object-cover"
          style={{ height: '300px' }}
        />

        <h1
          className="font-bold"
          style={{ fontSize: '24px', color: '#3E2723', margin: '16px 0' }}
        >
          {card.title}
        </h1>

        <p
          style={{ fontSize: '16px', color: '#5D4037', lineHeight: '1.6' }}
          className="mb-6"
        >
          {card.content}
        </p>

        {card.tags && card.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            {card.tags.map((tag) => (
              <button
                key={tag}
                onClick={() => navigate(`/tag/${encodeURIComponent(tag)}`)}
                className="rounded-full px-4 py-1.5 text-sm transition-colors hover:bg-[#D7CCC8]"
                style={{ backgroundColor: '#EFEBE9', color: '#795548' }}
              >
                {tag}
              </button>
            ))}
          </div>
        )}

        {relatedCards.length > 0 && (
          <div className="relative">
            <h2
              className="font-semibold mb-4"
              style={{ fontSize: '18px', color: '#3E2723' }}
            >
              关联卡片
            </h2>

            <div className="relative">
              {relatedCards.length > 3 && (
                <button
                  onClick={() => handleScroll('left')}
                  className={cn(
                    'absolute left-0 top-1/2 -translate-y-1/2 z-10',
                    'w-10 h-10 flex items-center justify-center rounded-full',
                    'transition-opacity opacity-70 hover:opacity-100'
                  )}
                  style={{
                    background: 'linear-gradient(to right, #D7CCC8, transparent)',
                  }}
                >
                  <ChevronLeft size={24} className="text-[#5D4037]" />
                </button>
              )}

              <div
                ref={scrollRef}
                className="flex gap-4 overflow-x-auto px-4 py-2"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {relatedCards.map((relatedCard) => (
                  <div
                    key={relatedCard.id}
                    onClick={() => navigate(`/card/${relatedCard.id}`)}
                    className="flex-shrink-0 cursor-pointer transition-transform hover:scale-105"
                    style={{ width: '120px' }}
                  >
                    <img
                      src={relatedCard.image}
                      alt={relatedCard.title}
                      className="w-full h-24 object-cover rounded-lg mb-2"
                    />
                    <p
                      className="text-sm font-medium line-clamp-2"
                      style={{ color: '#5D4037' }}
                    >
                      {relatedCard.title}
                    </p>
                  </div>
                ))}
              </div>

              {relatedCards.length > 3 && (
                <button
                  onClick={() => handleScroll('right')}
                  className={cn(
                    'absolute right-0 top-1/2 -translate-y-1/2 z-10',
                    'w-10 h-10 flex items-center justify-center rounded-full',
                    'transition-opacity opacity-70 hover:opacity-100'
                  )}
                  style={{
                    background: 'linear-gradient(to left, #D7CCC8, transparent)',
                  }}
                >
                  <ChevronRight size={24} className="text-[#5D4037]" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <style>{`
        div::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
