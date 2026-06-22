import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Recipe, fetchRecipeById, deleteRecipe, generateShareLink, generateEmbedCode } from '../api';
import { useAuth } from '../store/AuthContext';
import CommentList from './CommentList';

export default function RecipeDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isFavorite, toggleFavorite } = useAuth();

  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [showShareModal, setShowShareModal] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [allStepImages, setAllStepImages] = useState<{ image: string; stepIndex: number }[]>([]);
  const [copied, setCopied] = useState(false);
  const [copiedEmbed, setCopiedEmbed] = useState(false);

  useEffect(() => {
    if (id) {
      loadRecipe();
    }
  }, [id]);

  useEffect(() => {
    if (recipe) {
      const images: { image: string; stepIndex: number }[] = [];
      recipe.steps.forEach((step, stepIndex) => {
        step.images.forEach((image) => {
          images.push({ image, stepIndex });
        });
      });
      setAllStepImages(images);
    }
  }, [recipe]);

  const loadRecipe = async () => {
    try {
      setLoading(true);
      const data = await fetchRecipeById(id!);
      setRecipe(data);
    } catch (error) {
      console.error('加载菜谱失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!recipe) return;
    if (!window.confirm('确定要删除这个菜谱吗？')) return;

    try {
      await deleteRecipe(recipe.id);
      navigate('/');
    } catch (error) {
      console.error('删除失败:', error);
      alert('删除失败');
    }
  };

  const handleFavorite = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    try {
      await toggleFavorite(recipe!.id);
    } catch (error) {
      console.error('收藏失败:', error);
    }
  };

  const openLightbox = (imageIndex: number) => {
    if (allStepImages[imageIndex]) {
      setLightboxImage(allStepImages[imageIndex].image);
      setLightboxIndex(imageIndex);
    }
  };

  const closeLightbox = () => {
    setLightboxImage(null);
  };

  const prevImage = () => {
    if (lightboxIndex > 0) {
      const newIndex = lightboxIndex - 1;
      setLightboxIndex(newIndex);
      setLightboxImage(allStepImages[newIndex].image);
    }
  };

  const nextImage = () => {
    if (lightboxIndex < allStepImages.length - 1) {
      const newIndex = lightboxIndex + 1;
      setLightboxIndex(newIndex);
      setLightboxImage(allStepImages[newIndex].image);
    }
  };

  const copyLink = async () => {
    if (!recipe) return;
    try {
      await navigator.clipboard.writeText(generateShareLink(recipe.id));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('复制失败:', error);
    }
  };

  const copyEmbedCode = async () => {
    if (!recipe) return;
    try {
      await navigator.clipboard.writeText(generateEmbedCode(recipe));
      setCopiedEmbed(true);
      setTimeout(() => setCopiedEmbed(false), 2000);
    } catch (error) {
      console.error('复制失败:', error);
    }
  };

  const getDifficultyText = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return '初级';
      case 'medium': return '中级';
      case 'hard': return '高级';
      default: return difficulty;
    }
  };

  const getDifficultyStars = () => {
    if (!recipe) return 0;
    switch (recipe.difficulty) {
      case 'easy': return 1;
      case 'medium': return 3;
      case 'hard': return 5;
      default: return 1;
    }
  };

  const isOwner = user && recipe && user.id === recipe.authorId;
  const isFav = recipe ? isFavorite(recipe.id) : false;

  if (loading) {
    return (
      <div className="container main-content">
        <div className="loading">
          <div className="loading-spinner"></div>
          <span>加载中...</span>
        </div>
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="container main-content">
        <div className="empty-state">
          <div className="empty-state-icon">🍳</div>
          <p className="empty-state-text">菜谱不存在或已被删除</p>
          <button className="btn btn-primary" onClick={() => navigate('/')}>
            返回首页
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container main-content">
      <div className="recipe-detail">
        <div className="recipe-detail-main">
          <div className="recipe-detail-header">
            <h1 className="recipe-detail-title">{recipe.name}</h1>
            <div className="recipe-detail-info">
              <div className="recipe-detail-info-item">
                <span>👨‍🍳</span>
                <span>{recipe.authorName}</span>
              </div>
              <div className="recipe-detail-info-item">
                <span>⏱️</span>
                <span>{recipe.cookTime}分钟</span>
              </div>
              <div className="recipe-detail-info-item">
                <span>⭐</span>
                <span>{getDifficultyText(recipe.difficulty)}</span>
              </div>
              <div className="recipe-detail-info-item">
                <span>🍽️</span>
                <span>{recipe.cuisine}</span>
              </div>
              {recipe.ratingCount > 0 && (
                <div className="recipe-detail-info-item">
                  <span>🌟</span>
                  <span>{recipe.rating} ({recipe.ratingCount}条评价)</span>
                </div>
              )}
            </div>
            <p className="recipe-detail-description">{recipe.description}</p>
          </div>

          <div className="steps-gallery">
            <h3>烹饪步骤</h3>
            <div className="masonry-grid">
              {recipe.steps.map((step, stepIndex) => (
                <div key={stepIndex} className="masonry-item">
                  <div className="step-card">
                    {step.images.length > 0 && (
                      <img
                        src={step.images[0]}
                        alt={`步骤${stepIndex + 1}`}
                        className="step-card-image"
                        onClick={() => {
                          const globalIndex = allStepImages.findIndex(
                            (img) => img.image === step.images[0] && img.stepIndex === stepIndex
                          );
                          if (globalIndex !== -1) {
                            openLightbox(globalIndex);
                          }
                        }}
                        loading="lazy"
                      />
                    )}
                    <div className="step-card-content">
                      <span className="step-number">{stepIndex + 1}</span>
                      <p className="step-description">{step.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <CommentList recipeId={recipe.id} />
        </div>

        <div className="recipe-detail-sidebar">
          <div className="action-buttons">
            <button
              className={`btn ${isFav ? 'btn-primary' : 'btn-outline'}`}
              onClick={handleFavorite}
            >
              {isFav ? '❤️ 已收藏' : '🤍 收藏'}
            </button>
            <button className="btn btn-secondary" onClick={() => setShowShareModal(true)}>
              📤 分享
            </button>
          </div>

          {isOwner && (
            <div className="action-buttons">
              <button
                className="btn btn-outline"
                onClick={() => navigate(`/edit-recipe/${recipe.id}`)}
              >
                ✏️ 编辑
              </button>
              <button className="btn btn-outline" onClick={handleDelete}>
                🗑️ 删除
              </button>
            </div>
          )}

          <div className="ingredients-card">
            <h3>🥗 食材清单</h3>
            <ul className="ingredients-list">
              {recipe.ingredients.map((ingredient, index) => (
                <li key={index} className="ingredient-item">
                  <span className="ingredient-name">{ingredient.name}</span>
                  <span className="ingredient-amount">{ingredient.amount}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="ingredients-card">
            <h3>👨‍🍳 作者信息</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <img
                src={recipe.authorAvatar}
                alt={recipe.authorName}
                style={{ width: '48px', height: '48px', borderRadius: '50%' }}
              />
              <div>
                <div style={{ fontWeight: 600 }}>{recipe.authorName}</div>
                <div style={{ fontSize: '13px', color: 'var(--color-text-light)' }}>
                  美食创作者
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {lightboxImage && (
        <div className="modal-overlay" onClick={closeLightbox}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <span className="modal-close" onClick={closeLightbox}>
              ✕
            </span>
            {lightboxIndex > 0 && (
              <button className="modal-nav prev" onClick={prevImage}>
                ‹
              </button>
            )}
            <img src={lightboxImage} alt="步骤图" className="modal-image" />
            {lightboxIndex < allStepImages.length - 1 && (
              <button className="modal-nav next" onClick={nextImage}>
                ›
              </button>
            )}
            <div className="modal-step-info">
              步骤 {allStepImages[lightboxIndex]?.stepIndex + 1} / {recipe.steps.length}
              <span style={{ marginLeft: '12px' }}>
                ({lightboxIndex + 1} / {allStepImages.length} 张图片)
              </span>
            </div>
          </div>
        </div>
      )}

      {showShareModal && (
        <>
          <div className="modal-overlay" onClick={() => setShowShareModal(false)}></div>
          <div className="share-modal">
            <h3>分享菜谱</h3>

            <div>
              <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>分享链接</h4>
              <div className="share-link">
                <input
                  type="text"
                  value={generateShareLink(recipe.id)}
                  readOnly
                />
                <button className="btn btn-primary" onClick={copyLink}>
                  {copied ? '已复制!' : '复制'}
                </button>
              </div>
            </div>

            <div className="embed-code">
              <h4>嵌入代码</h4>
              <pre>{generateEmbedCode(recipe)}</pre>
              <button
                className="btn btn-outline"
                style={{ width: '100%', marginTop: '8px' }}
                onClick={copyEmbedCode}
              >
                {copiedEmbed ? '已复制嵌入代码!' : '复制嵌入代码'}
              </button>
            </div>

            <div className="embed-preview">
              <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px', color: 'var(--color-text-light)' }}>
                预览效果
              </h4>
              <div style={{
                border: '1px solid #e8e8e8',
                borderRadius: '12px',
                padding: '16px',
                fontFamily: 'sans-serif',
                background: '#fffaf0'
              }}>
                <h3 style={{ margin: '0 0 12px 0', color: '#e85d3a', fontSize: '18px' }}>
                  {recipe.name}
                </h3>
                <p style={{ margin: '0 0 12px 0', color: '#666', fontSize: '14px' }}>
                  {recipe.description}
                </p>
                <h4 style={{ margin: '12px 0 8px 0', color: '#2d2d2d', fontSize: '14px' }}>
                  食材列表
                </h4>
                <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                  {recipe.ingredients.slice(0, 3).map((ing, i) => (
                    <li
                      key={i}
                      style={{
                        padding: '4px 0',
                        fontSize: '13px',
                        color: '#2d2d2d',
                        display: 'flex',
                        justifyContent: 'space-between'
                      }}
                    >
                      <span>{ing.name}</span>
                      <span style={{ color: '#666' }}>{ing.amount}</span>
                    </li>
                  ))}
                </ul>
                <a
                  href="#"
                  style={{
                    display: 'inline-block',
                    marginTop: '12px',
                    color: '#e85d3a',
                    textDecoration: 'none',
                    fontSize: '13px',
                    fontWeight: 500
                  }}
                >
                  查看完整菜谱 →
                </a>
              </div>
            </div>

            <button
              className="btn btn-outline"
              style={{ width: '100%', marginTop: '20px' }}
              onClick={() => setShowShareModal(false)}
            >
              关闭
            </button>
          </div>
        </>
      )}
    </div>
  );
}
