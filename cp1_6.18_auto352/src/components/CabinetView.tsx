import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, Network } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { fetchCards, fetchCardsByTag } from '@/modules/cardModule';
import { cn } from '@/lib/utils';
import type { Card } from '@/types';

const categoryColors: Record<string, string> = {
  tech: '#FF8A65',
  life: '#81C784',
  study: '#64B5F6',
  creation: '#BA68C8',
  default: '#BCAAA4',
};

export default function CabinetView() {
  const navigate = useNavigate();
  const { tag } = useParams();
  const { cards, setCards, setIsFormOpen, setIsGraphOpen } = useStore();
  const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set());

  useEffect(() => {
    const loadCards = async () => {
      try {
        const data = tag ? await fetchCardsByTag(tag) : await fetchCards();
        setCards(data);
      } catch (error) {
        console.error('Failed to load cards:', error);
      }
    };
    loadCards();
  }, [tag, setCards]);

  const handleImageLoad = (id: number) => {
    setLoadedImages((prev) => new Set(prev).add(id));
  };

  const handleCardClick = (id: number) => {
    navigate(`/card/${id}`);
  };

  const leftColumnCards = cards.filter((_, index) => index % 2 === 0);
  const rightColumnCards = cards.filter((_, index) => index % 2 === 1);

  const renderCard = (card: Card) => (
    <div
      key={card.id}
      onClick={() => handleCardClick(card.id)}
      className={cn(
        'relative w-[200px] h-[120px] rounded-[6px] bg-white overflow-hidden cursor-pointer',
        'transition-all duration-300 ease-out hover:shadow-xl',
        'flex'
      )}
      style={{ 
        marginBottom: '16px',
        transform: 'translateY(0)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-8px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      <div
        className="w-2 h-full rounded-l-[6px] flex-shrink-0"
        style={{ backgroundColor: categoryColors[card.category] || categoryColors.default }}
      />
      <div className="flex-1 p-3 flex flex-col justify-between overflow-hidden">
        <div className="flex-1 overflow-hidden">
          <h3
            className="text-[16px] font-bold leading-tight"
            style={{
              color: '#3E2723',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              fontFamily: "'Noto Serif SC', serif",
            }}
          >
            {card.title}
          </h3>
        </div>
        <div className="mt-2">
          {card.image && (
            <div className="absolute top-2 right-2 w-12 h-12 rounded overflow-hidden bg-gray-100">
              {!loadedImages.has(card.id) && (
                <div className="w-full h-full bg-gray-200 animate-pulse" />
              )}
              <img
                src={card.image}
                alt={card.title}
                loading="lazy"
                onLoad={() => handleImageLoad(card.id)}
                className={cn(
                  'w-full h-full object-cover transition-opacity duration-300',
                  !loadedImages.has(card.id) && 'opacity-0'
                )}
              />
            </div>
          )}
          {card.tags.length > 0 && (
            <p className="text-xs text-gray-500 truncate">
              {card.tags.slice(0, 3).join(', ')}
            </p>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div
      className="min-h-screen p-6 relative"
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
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <h1 
            className="text-3xl font-bold mb-2"
            style={{ color: '#3E2723', fontFamily: "'Noto Serif SC', serif" }}
          >
            🗄️ 袖珍档案室
          </h1>
          <p className="text-sm" style={{ color: '#5D4037' }}>
            在这里整理你的知识，构建属于你的知识网络
          </p>
        </div>

        {tag && (
          <div className="mb-6 flex items-center justify-center gap-2">
            <span 
              className="px-4 py-2 rounded-full text-sm font-medium"
              style={{ backgroundColor: '#EFEBE9', color: '#795548' }}
            >
              标签筛选: {tag}
            </span>
            <button
              onClick={() => navigate('/')}
              className="text-sm underline"
              style={{ color: '#8D6E63' }}
            >
              查看全部
            </button>
          </div>
        )}

        <div className="flex justify-center gap-8">
          <div className="flex flex-col">
            {leftColumnCards.map(renderCard)}
          </div>
          <div className="flex flex-col">
            {rightColumnCards.map(renderCard)}
          </div>
        </div>

        {cards.length === 0 && (
          <div className="text-center py-16" style={{ color: '#5D4037' }}>
            <p className="text-lg mb-2">暂无档案卡片</p>
            <p className="text-sm">点击右下角按钮创建你的第一张卡片</p>
          </div>
        )}
      </div>

      <div className="fixed right-6 bottom-6 flex flex-col gap-3 z-30">
        <button
          onClick={() => setIsGraphOpen(true)}
          className={cn(
            'w-10 h-10 rounded-full shadow-lg',
            'flex items-center justify-center',
            'transition-all duration-200 hover:scale-110 hover:shadow-xl',
            'text-white'
          )}
          style={{ backgroundColor: '#8D6E63' }}
          title="知识图谱"
        >
          <Network size={20} />
        </button>
        <button
          onClick={() => setIsFormOpen(true)}
          className={cn(
            'w-14 h-14 rounded-full shadow-lg',
            'flex items-center justify-center',
            'transition-all duration-200 hover:scale-110 hover:shadow-xl',
            'text-white'
          )}
          style={{ backgroundColor: '#8D6E63' }}
          title="添加卡片"
        >
          <Plus size={28} />
        </button>
      </div>
    </div>
  );
}
