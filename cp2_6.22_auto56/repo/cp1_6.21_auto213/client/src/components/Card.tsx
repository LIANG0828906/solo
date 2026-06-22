import React, { useRef, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

interface Recipe {
  id: string;
  title: string;
  author: string;
  coverImage: string;
  cookTime: number;
  avgRating: number;
  favoritesCount: number;
  commentsCount: number;
}

interface CardProps {
  recipe: Recipe;
}

const LazyImage: React.FC<{ src: string; alt: string }> = ({ src, alt }) => {
  const imgRef = useRef<HTMLImageElement>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          img.src = src;
          observer.unobserve(img);
        }
      },
      { rootMargin: '200px' }
    );

    observer.observe(img);
    return () => observer.disconnect();
  }, [src]);

  return (
    <img
      ref={imgRef}
      className="card-cover"
      src={loaded ? src : 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'}
      alt={alt}
      onLoad={() => setLoaded(true)}
    />
  );
};

export const Card: React.FC<CardProps> = ({ recipe }) => {
  const filledStars = Math.round(recipe.avgRating);

  return (
    <Link to={`/recipe/${recipe.id}`} className="masonry-item" style={{ display: 'block' }}>
      <div className="recipe-card">
        <div className="card-cover-wrapper">
          <LazyImage src={recipe.coverImage} alt={recipe.title} />
        </div>
        <div className="card-info">
          <div className="card-title">{recipe.title}</div>
          <div className="card-author">{recipe.author} · {recipe.cookTime}分钟</div>
          <div className="card-stars">
            {Array.from({ length: 5 }, (_, i) => (
              <span key={i} className={`card-star${i < filledStars ? '' : ' empty'}`}>★</span>
            ))}
          </div>
          <div className="card-footer">
            <span>❤️ {recipe.favoritesCount}</span>
            <span>💬 {recipe.commentsCount}</span>
          </div>
        </div>
      </div>
    </Link>
  );
};
