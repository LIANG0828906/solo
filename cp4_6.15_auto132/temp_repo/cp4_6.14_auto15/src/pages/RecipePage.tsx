import { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import RecipeDetail from '../components/RecipeDetail';
import RecommendSection from '../components/RecommendSection';
import { getRecipeById, postRating } from '../utils/api';
import { useStore } from '../store/useStore';
import type { Recipe, IngredientDetail } from '../types';

export default function RecipePage() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeIngredient, setActiveIngredient] = useState<IngredientDetail | null>(null);
  const { showToast, isFavorite, addFavorite, removeFavorite } = useStore();

  useEffect(() => {
    if (!id) return;
    const fetchRecipe = async () => {
      setLoading(true);
      try {
        const data = await getRecipeById(id);
        setRecipe(data);
      } catch (error) {
        console.error('Failed to fetch recipe:', error);
        showToast('加载食谱失败', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchRecipe();
    setActiveIngredient(null);
  }, [id, showToast]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const handleRatingChange = async (rating: number) => {
    if (!id) return;
    try {
      const result = await postRating(id, rating);
      setRecipe((prev) =>
        prev ? { ...prev, rating: result.rating, ratingCount: result.ratingCount } : prev
      );
      showToast(`评分成功：${rating}星`, 'success');
    } catch (error) {
      console.error('Failed to post rating:', error);
      showToast('评分失败，请重试', 'error');
    }
  };

  const handleFavoriteToggle = () => {
    if (!id || !recipe) return;
    if (isFavorite(id)) {
      removeFavorite(id);
      showToast('已取消收藏', 'info');
    } else {
      addFavorite(id);
      showToast('收藏成功！', 'success');
    }
    setRecipe({ ...recipe });
  };

  return (
    <div style={{ minHeight: '100vh' }}>
      {loading ? (
        <div>
          <div className="skeleton" style={{
            width: '100%',
            height: '60vh',
          }} />
          <div className="app-container" style={{ padding: '24px 16px' }}>
            <div className="skeleton" style={{
              height: 40,
              width: '60%',
              borderRadius: 8,
              marginBottom: 20,
            }} />
            <div className="skeleton" style={{
              height: 20,
              width: '40%',
              borderRadius: 6,
              marginBottom: 12,
            }} />
            <div className="skeleton" style={{
              height: 20,
              width: '80%',
              borderRadius: 6,
              marginBottom: 12,
            }} />
            <div className="skeleton" style={{
              height: 200,
              width: '100%',
              borderRadius: 16,
              marginBottom: 24,
            }} />
            <div className="skeleton" style={{
              height: 300,
              width: '100%',
              borderRadius: 16,
            }} />
          </div>
        </div>
      ) : recipe ? (
        <>
          <RecipeDetail
            recipe={recipe}
            onIngredientClick={() => { /* 空的，实际逻辑在组件内部 */ }}
            onRatingChange={handleRatingChange}
            onFavoriteToggle={handleFavoriteToggle}
            activeIngredient={activeIngredient}
            setActiveIngredient={setActiveIngredient}
          />
          <div className="app-container" style={{ padding: '0 16px 48px' }}>
            <div style={{ marginBottom: 32 }}>
              <RecommendSection recipeId={recipe.id} />
            </div>
          </div>
        </>
      ) : (
        <div className="app-container" style={{
          padding: '100px 20px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>😔</div>
          <h2 style={{ marginBottom: 8 }}>食谱不存在</h2>
          <p style={{ color: 'var(--text-light)' }}>该食谱可能已被删除或不存在</p>
        </div>
      )}
    </div>
  );
}
