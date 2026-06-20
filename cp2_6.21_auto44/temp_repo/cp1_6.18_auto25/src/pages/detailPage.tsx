import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useRecipeStore } from '@/store/recipeStore';
import { CommentSection } from '@/components/commentSection';
import { formatRelativeTime } from '@/utils/time';

export const DetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { currentRecipe, loading, error, loadRecipeById, addComment, toggleCommentLike, clearCurrentRecipe } =
    useRecipeStore();

  useEffect(() => {
    if (id) {
      loadRecipeById(id);
    }
    return () => {
      clearCurrentRecipe();
    };
  }, [id, loadRecipeById, clearCurrentRecipe]);

  if (loading) {
    return (
      <div className="detail-loading">
        <div className="spinner"></div>
        <p>加载中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="detail-loading">
        <p>{error}</p>
        <button onClick={() => navigate('/')}>返回首页</button>
      </div>
    );
  }

  if (!currentRecipe) {
    return (
      <div className="detail-loading">
        <p>食谱不存在</p>
        <button onClick={() => navigate('/')}>返回首页</button>
      </div>
    );
  }

  return (
    <div className="detail-page">
      <nav className="detail-nav">
        <button className="back-btn" onClick={() => navigate('/')}>
          ←
        </button>
        <h1 className="detail-nav-title">巷陌食单</h1>
        <div style={{ width: 40 }}></div>
      </nav>

      <main className="detail-main">
        <div className="detail-layout">
          <div className="detail-left">
            <div className="detail-image-wrap">
              <img src={currentRecipe.imageUrl} alt={currentRecipe.name} className="detail-image" />
            </div>

            <div className="detail-header">
              <h1 className="detail-title">{currentRecipe.name}</h1>
              <div className="detail-meta">
                <div className="detail-author">
                  <div className="author-avatar-lg" style={{ backgroundColor: '#E8D5C4' }}>
                    {currentRecipe.author.charAt(0)}
                  </div>
                  <span>{currentRecipe.author}</span>
                </div>
                <span className="detail-time">{formatRelativeTime(currentRecipe.createdAt)}</span>
                <div className="detail-rating">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span
                      key={i}
                      className={`detail-star ${i < Math.round(currentRecipe.rating) ? 'on' : ''}`}
                    >
                      ★
                    </span>
                  ))}
                  <span className="detail-rating-num">{currentRecipe.rating.toFixed(1)}</span>
                </div>
              </div>
            </div>

            <section className="detail-section">
              <h2 className="detail-section-title">食材清单</h2>
              <ul className="ingredients-list">
                {currentRecipe.ingredients.map((ingredient, index) => (
                  <li key={index}>{ingredient}</li>
                ))}
              </ul>
            </section>

            <section className="detail-section">
              <h2 className="detail-section-title">分步指导</h2>
              <div className="steps-list">
                {currentRecipe.steps.map((step, index) => (
                  <div key={index} className="step-item" style={{ animationDelay: `${index * 0.1}s` }}>
                    <div className="step-number">{index + 1}</div>
                    <div className="step-content">
                      <p>{step}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <div className="detail-right">
            <CommentSection
              comments={currentRecipe.comments}
              recipeId={currentRecipe.id}
              onAddComment={addComment}
              onToggleLike={toggleCommentLike}
            />
          </div>
        </div>
      </main>
    </div>
  );
};
