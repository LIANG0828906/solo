import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Recipe } from '@/api/recipesApi';
import { useRecipesStore } from '@/store/recipesStore';

interface RecipeCardProps {
  recipe: Recipe;
  index?: number;
}

export function RecipeCard({ recipe, index = 0 }: RecipeCardProps) {
  const navigate = useNavigate();
  const [imgLoaded, setImgLoaded] = useState(false);
  const [inView, setInView] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const toggleFavorite = useRecipesStore((s) => s.toggleFavorite);
  const isFavorite = useRecipesStore((s) => s.isFavorite);
  const [heartAnim, setHeartAnim] = useState(false);
  const fav = isFavorite(recipe.id);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const handleCardClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.fav-btn')) return;
    navigate(`/recipe/${recipe.id}`);
  };

  const handleFavClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setHeartAnim(true);
    setTimeout(() => setHeartAnim(false), 200);
    await toggleFavorite(recipe.id);
  };

  return (
    <div
      ref={cardRef}
      onClick={handleCardClick}
      className="recipe-card fade-in-up cursor-pointer rounded-2xl bg-white overflow-hidden"
      style={{
        width: '100%',
        maxWidth: '280px',
        marginTop: 0,
        margin: '0 auto',
        animationDelay: `${index * 50}ms`,
        transition: 'transform 0.25s ease, box-shadow 0.25s ease',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.transform = 'translateY(-5px)';
        (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 20px rgba(0,0,0,0.3)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
        (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
      }}
    >
      <div className="relative bg-[#FFCC80]" style={{ aspectRatio: '280 / 168' }}>
        {inView && (
          <img
            src={recipe.image_url}
            alt={recipe.title}
            onLoad={() => setImgLoaded(true)}
            className={`w-full h-full object-cover transition-opacity duration-300 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
            style={{ aspectRatio: '280 / 168' }}
            loading="lazy"
          />
        )}
        {(!imgLoaded || !inView) && (
          <div className="absolute inset-0 flex items-center justify-center">
            <svg className="animate-spin h-8 w-8" style={{ color: '#FF7043' }} viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
        )}
        <button
          onClick={handleFavClick}
          className="fav-btn absolute top-3 right-3 rounded-full transition-all duration-200 hover:bg-white active:scale-95"
          style={{
            padding: '8px',
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(4px)',
          }}
        >
          <svg
            className={`w-5 h-5 transition-colors duration-200 ${heartAnim ? 'heart-animate' : ''}`}
            fill={fav ? '#E53935' : 'none'}
            stroke={fav ? '#E53935' : '#CCC'}
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>
      </div>

      <div className="p-4">
        <h3
          className="font-bold mb-2"
          style={{
            fontSize: '18px',
            color: '#2D2D2D',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {recipe.title}
        </h3>
        <p
          className="mb-3"
          style={{
            fontSize: '14px',
            color: '#666',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            minHeight: '42px',
          }}
        >
          {recipe.description}
        </p>
        <div className="flex flex-wrap" style={{ gap: '6px' }}>
          {recipe.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="rounded-full transition-all duration-200 hover:brightness-110 active:scale-95"
              style={{
                backgroundColor: '#FF7043',
                color: 'white',
                fontSize: '12px',
                padding: '4px 8px',
              }}
            >
              {tag}
            </span>
          ))}
          {recipe.tags.length > 3 && (
            <span
              className="rounded-full"
              style={{
                backgroundColor: '#FFCC80',
                color: '#333',
                fontSize: '12px',
                padding: '4px 8px',
              }}
            >
              +{recipe.tags.length - 3}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
