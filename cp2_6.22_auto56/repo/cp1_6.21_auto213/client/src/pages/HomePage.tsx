import React, { useEffect, useState } from 'react';
import { client } from '../api/client';
import { Card } from '../components/Card';

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

interface Recommendation {
  id: string;
  title: string;
  coverImage: string;
}

export const HomePage: React.FC = () => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);

  useEffect(() => {
    client.get('/recipes').then((res) => {
      setRecipes(res.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    client.get('/interactions/recommendations/user1').then((res) => {
      setRecommendations(res.data);
    }).catch(() => {});
  }, []);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner" />
      </div>
    );
  }

  return (
    <>
      <div className="home-header">
        <h1 className="home-title">发现美味</h1>
        <p className="home-subtitle">探索社区烹饪爱好者分享的精选菜谱</p>
      </div>

      <div className="masonry">
        {recipes.map((recipe) => (
          <Card key={recipe.id} recipe={recipe} />
        ))}
      </div>

      {recommendations.length > 0 && (
        <div className="recommendation-section">
          <h2 className="recommendation-title">为你推荐</h2>
          <div className="recommendation-scroll">
            {recommendations.map((rec) => (
              <Link
                key={rec.id}
                to={`/recipe/${rec.id}`}
                style={{ flexShrink: 0, width: '120px', display: 'block' }}
              >
                <img
                  src={rec.coverImage}
                  alt={rec.title}
                  style={{
                    width: '120px',
                    height: '90px',
                    objectFit: 'cover',
                    borderRadius: '8px',
                  }}
                />
                <div style={{
                  fontSize: '13px',
                  fontWeight: 500,
                  marginTop: '6px',
                  color: '#1F2937',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}>
                  {rec.title}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </>
  );
};
