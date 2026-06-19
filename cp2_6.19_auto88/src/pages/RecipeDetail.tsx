import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { ArrowLeft, Clock, Users, ChefHat, Edit3, Trash2 } from 'lucide-react';
import StarRating from '../components/StarRating';
import FavoriteButton from '../components/FavoriteButton';
import CommentList from '../components/CommentList';
import Toast from '../components/Toast';
import { useUiController as useStore } from '../module3/uiController';
import type { Recipe, Comment } from '../types';
import * as db from '../utils/db';
import { recipeManager } from '../module1/recipeManager';

export default function RecipeDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser, toast, hideToast, rateRecipe, deleteRecipe, showToast } = useStore();
  
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRating, setUserRating] = useState(0);

  useEffect(() => {
    if (id) {
      loadRecipeData(id);
    }
  }, [id]);

  const loadRecipeData = async (recipeId: string) => {
    try {
      setLoading(true);
      const recipeData = await recipeManager.getRecipe(recipeId);
      
      if (recipeData) {
        setRecipe(recipeData);
      } else {
        showToast('食谱不存在', 'error');
        navigate('/');
      }
    } catch (error) {
      console.error('Failed to load recipe:', error);
      showToast('加载食谱失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRating = async (rating: number) => {
    if (!currentUser || !recipe) return;
    setUserRating(rating);
    await rateRecipe(recipe.id, rating);
    loadRecipeData(recipe.id);
  };

  const handleEdit = () => {
    if (recipe) {
      navigate(`/edit/${recipe.id}`);
    }
  };

  const handleDelete = async () => {
    if (!recipe) return;
    if (confirm('确定要删除这个食谱吗？')) {
      await deleteRecipe(recipe.id);
      navigate('/');
    }
  };

  const getStepsMarkdown = () => {
    if (!recipe) return '';
    return recipe.steps
      .sort((a, b) => a.order - b.order)
      .map((step) => `**步骤 ${step.order}**\n\n${step.description}`)
      .join('\n\n---\n\n');
  };

  const difficultyText = {
    easy: '简单',
    medium: '中等',
    hard: '困难',
  };

  const difficultyColor = {
    easy: 'text-green-600 bg-green-50',
    medium: 'text-yellow-600 bg-yellow-50',
    hard: 'text-red-600 bg-red-50',
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg)]">
        <div className="max-w-4xl mx-auto px-4 pt-24 pb-8">
          <div className="animate-pulse">
            <div className="h-96 bg-gray-200 rounded-xl mb-6" />
            <div className="h-8 bg-gray-200 rounded w-3/4 mb-4" />
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
            <div className="h-4 bg-gray-200 rounded w-2/3" />
          </div>
        </div>
      </div>
    );
  }

  if (!recipe) {
    return null;
  }

  const isAuthor = currentUser?.id === recipe.authorId;

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <div 
        className="fixed inset-0 bg-cover bg-center opacity-20"
        style={{ backgroundImage: `url(${recipe.coverImage})` }}
      />
      <div className="fixed inset-0 glass backdrop-blur-xl" />
      
      <div className="relative z-10">
        <div className="max-w-4xl mx-auto px-4 pt-20 pb-8">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 px-4 py-2 mb-6 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            返回
          </button>

          <div className="card overflow-hidden mb-6">
            <div className="relative">
              <img
                src={recipe.coverImage}
                alt={recipe.title}
                className="w-full h-64 md:h-96 object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(recipe.title)}&image_size=landscape_16_9`;
                }}
              />
              <div className="absolute top-4 right-4">
                <FavoriteButton recipeId={recipe.id} />
              </div>
              {isAuthor && (
                <div className="absolute top-4 left-4 flex gap-2">
                  <button
                    onClick={handleEdit}
                    className="p-2 bg-white/90 rounded-full shadow-lg hover:bg-white transition-colors"
                  >
                    <Edit3 className="w-5 h-5 text-[var(--primary)]" />
                  </button>
                  <button
                    onClick={handleDelete}
                    className="p-2 bg-white/90 rounded-full shadow-lg hover:bg-white transition-colors"
                  >
                    <Trash2 className="w-5 h-5 text-red-500" />
                  </button>
                </div>
              )}
              <div className={`absolute bottom-4 left-4 px-3 py-1 rounded-full text-sm font-medium ${difficultyColor[recipe.difficulty]}`}>
                {difficultyText[recipe.difficulty]}
              </div>
            </div>

            <div className="p-6">
              <h1 className="text-3xl md:text-4xl font-bold text-[var(--text-primary)] mb-4">
                {recipe.title}
              </h1>
              
              <div className="flex flex-wrap items-center gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <ChefHat className="w-5 h-5 text-[var(--primary)]" />
                  <span className="text-[var(--text-secondary)]">{recipe.authorName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-[var(--text-secondary)]" />
                  <span className="text-[var(--text-secondary)]">{recipe.cookingTime}分钟</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-[var(--text-secondary)]" />
                  <span className="text-[var(--text-secondary)]">{recipe.servings}人份</span>
                </div>
              </div>

              <div className="flex items-center gap-4 mb-6">
                <StarRating
                  rating={userRating || recipe.rating}
                  onChange={currentUser ? handleRating : undefined}
                  readonly={!currentUser}
                />
                <span className="text-[var(--text-secondary)]">
                  {recipe.rating.toFixed(1)} ({recipe.ratingCount || 0} 评价)
                </span>
              </div>

              <p className="text-[var(--text-secondary)] text-lg mb-6">
                {recipe.description}
              </p>

              {recipe.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {recipe.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 bg-[var(--primary)]/10 text-[var(--primary)] rounded-full text-sm"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="card p-6 mb-6">
            <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">食材清单</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {recipe.ingredients.map((ingredient, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-[var(--bg)] rounded-lg"
                >
                  <span className="text-[var(--text-primary)]">{ingredient.name}</span>
                  <span className="text-[var(--text-secondary)]">{ingredient.quantity}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-6 mb-6">
            <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">烹饪步骤</h2>
            <div className="prose prose-lg max-w-none">
              <ReactMarkdown>{getStepsMarkdown()}</ReactMarkdown>
            </div>
          </div>

          <div className="card p-6">
            <CommentList recipeId={recipe.id} currentUserId={currentUser?.id || ''} />
          </div>
        </div>
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
        />
      )}
    </div>
  );
}
