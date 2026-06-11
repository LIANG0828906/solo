import React, { useRef, useEffect, useState } from 'react';
import { Recipe } from '../types';

interface RecipeCardProps {
  recipe: Recipe;
  onClick: () => void;
}

const RecipeCard: React.FC<RecipeCardProps> = ({ recipe, onClick }) => {
  const imgRef = useRef<HTMLImageElement>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;

    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const target = entry.target as HTMLImageElement;
              if (target.dataset.src) {
                target.src = target.dataset.src;
                target.removeAttribute('data-src');
              }
              observer.unobserve(target);
            }
          });
        },
        { rootMargin: '100px' }
      );
      observer.observe(img);
      return () => observer.disconnect();
    } else {
      if (img.dataset.src) {
        img.src = img.dataset.src;
      }
    }
  }, [recipe.image]);

  return (
    <div className="recipe-card" onClick={onClick}>
      <img
        ref={imgRef}
        className="recipe-card-image"
        data-src={recipe.image}
        src=""
        alt={recipe.title}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        style={{ opacity: loaded ? 1 : 0, transition: 'opacity 0.3s ease' }}
      />
      <div className="recipe-card-content">
        <h3 className="recipe-card-title">{recipe.title}</h3>
        <div className="recipe-card-meta">
          <span>👨‍🍳 {recipe.author}</span>
          <span>⏱ {recipe.totalTime}分钟</span>
        </div>
        <div className="recipe-card-tags">
          {recipe.tags.slice(0, 3).map((tag, idx) => (
            <span key={idx} className="tag">
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RecipeCard;
