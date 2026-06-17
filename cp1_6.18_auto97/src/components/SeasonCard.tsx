import { useState, useEffect, useRef } from 'react';
import { Heart, ChefHat } from 'lucide-react';
import { useRecipeStore, type SolarTermRecipe } from '../stores/recipeStore';
import { StarRating } from './StarRating';
import { DecorationIllustration } from './DecorationIllustration';
import { SolarTermIcon } from './SolarTermIcon';
import { CollectionPanel } from './CollectionPanel';

interface SeasonCardProps {
  recipe: SolarTermRecipe;
  index: number;
}

const ingredientIconMap: Record<string, string> = {
  bread: '🍞',
  leaf: '🌿',
  wheat: '🌾',
  beef: '🥩',
  cherry: '🍒',
  cookie: '🍪',
  apple: '🍎',
  gem: '💎',
  cloud: '☁️',
  droplet: '💧',
  egg: '🥚',
  flower: '🌸',
  bean: '🫘',
  sprout: '🌱',
  wine: '🍷',
  melon: '🍉',
  fish: '🐟',
  seed: '🌰',
  crab: '🦀',
};

export function SeasonCard({ recipe, index }: SeasonCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [showPanel, setShowPanel] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const toggleFavorite = useRecipeStore((state) => state.toggleFavorite);
  const updateRating = useRecipeStore((state) => state.updateRating);
  const updateNote = useRecipeStore((state) => state.updateNote);
  const isFavorite = useRecipeStore((state) => state.isFavorite(recipe.id));
  const favorite = useRecipeStore((state) => state.getFavorite(recipe.id));

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const handleFavoriteClick = () => {
    setIsAnimating(true);
    toggleFavorite(recipe.id);
    
    if (!isFavorite) {
      setShowPanel(true);
    } else {
      setShowPanel(false);
    }
    
    setTimeout(() => setIsAnimating(false), 200);
  };

  const handleRatingChange = (rating: number) => {
    if (!isFavorite) {
      toggleFavorite(recipe.id);
      setShowPanel(true);
    }
    updateRating(recipe.id, rating);
  };

  const handleNoteChange = (note: string) => {
    updateNote(recipe.id, note);
  };

  return (
    <div
      ref={cardRef}
      className="relative"
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
        transition: `opacity 0.6s ease ${index * 0.08}s, transform 0.6s ease ${index * 0.08}s`,
      }}
    >
      <div
        className="relative overflow-hidden"
        style={{
          width: '420px',
          maxWidth: '100%',
          borderRadius: '24px',
          backgroundColor: '#FFFAF5',
          boxShadow: '0 8px 24px rgba(80,60,40,0.12)',
        }}
      >
        <div className="relative h-36 overflow-hidden" style={{ borderRadius: '24px 24px 0 0' }}>
          <DecorationIllustration
            type={recipe.decoration}
            color={recipe.decorationColor}
            width={420}
            height={144}
          />
          <div
            className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-full"
            style={{ backgroundColor: 'rgba(255,250,245,0.9)', backdropFilter: 'blur(8px)' }}
          >
            <SolarTermIcon icon={recipe.solarTermIcon} color={recipe.decorationColor} size={18} />
            <span
              className="text-sm font-medium"
              style={{ color: '#5D4E37', fontFamily: '"Noto Serif SC", serif' }}
            >
              {recipe.solarTerm}
            </span>
          </div>
        </div>

        <div className="p-6">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3
                className="text-2xl font-bold mb-1"
                style={{
                  color: '#3D2914',
                  fontFamily: '"Ma Shan Zheng", cursive',
                  letterSpacing: '2px',
                }}
              >
                {recipe.dishName}
              </h3>
              <p className="text-sm" style={{ color: '#8B7355', fontFamily: '"Noto Serif SC", serif' }}>
                {recipe.description}
              </p>
            </div>
            <button
              onClick={handleFavoriteClick}
              className="flex-shrink-0 p-2 rounded-full transition-all duration-200 hover:scale-110"
              style={{
                transform: isAnimating ? 'scale(1.3)' : 'scale(1)',
                transition: 'transform 0.2s ease',
              }}
              aria-label={isFavorite ? '取消收藏' : '收藏'}
            >
              <Heart
                size={28}
                style={{
                  fill: isFavorite ? '#E56B5D' : 'none',
                  stroke: isFavorite ? '#E56B5D' : '#CCBBA8',
                  strokeWidth: 2,
                  transition: 'fill 0.2s ease, stroke 0.2s ease',
                }}
              />
            </button>
          </div>

          <div className="mb-5">
            <div className="flex items-center gap-2 mb-3">
              <ChefHat size={16} style={{ color: '#B8A48C' }} />
              <span className="text-xs font-medium" style={{ color: '#B8A48C' }}>
                时令食材
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {recipe.ingredients.map((ing, i) => (
                <div
                  key={i}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
                  style={{ backgroundColor: '#F5EDE3' }}
                >
                  <span className="text-base">{ingredientIconMap[ing.icon] || '🍽️'}</span>
                  <span
                    className="text-xs font-medium"
                    style={{ color: '#6B5344', fontFamily: '"Noto Serif SC", serif' }}
                  >
                    {ing.name}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t pt-4" style={{ borderColor: '#E8DDD0' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs mb-1.5" style={{ color: '#B8A48C' }}>品鉴评分</p>
                <StarRating
                  rating={favorite?.rating || 0}
                  onChange={handleRatingChange}
                  size={24}
                />
              </div>
              <button
                onClick={() => setShowPanel(!showPanel)}
                className="text-xs px-3 py-1.5 rounded-full transition-colors"
                style={{
                  backgroundColor: isFavorite ? 'rgba(229,107,93,0.1)' : '#F5EDE3',
                  color: isFavorite ? '#E56B5D' : '#8B7355',
                }}
              >
                {showPanel ? '收起面板' : '品鉴笔记'}
              </button>
            </div>
          </div>

          {showPanel && (
            <div
              className="mt-4 pt-4 border-t"
              style={{
                borderColor: '#E8DDD0',
                animation: 'slideDown 0.3s ease-out',
              }}
            >
              <div className="mb-4">
                <label className="text-xs mb-2 block" style={{ color: '#B8A48C' }}>
                  品鉴笔记
                </label>
                <textarea
                  value={favorite?.note || ''}
                  onChange={(e) => handleNoteChange(e.target.value)}
                  placeholder="记录这道菜的味道和感受..."
                  className="w-full p-3 text-sm resize-none rounded-lg transition-colors outline-none"
                  style={{
                    height: '80px',
                    border: '1px solid #D4C9B8',
                    backgroundColor: '#FFFAF5',
                    color: '#5D4E37',
                    fontFamily: '"Noto Serif SC", serif',
                    borderRadius: '8px',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#B8A48C';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#D4C9B8';
                  }}
                />
              </div>
              
              <CollectionPanel recipeId={recipe.id} />
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
