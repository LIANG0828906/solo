import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ChefHat, Star, Thermometer, Droplets } from 'lucide-react';
import { recipeApi, experimentApi } from '../api';
import { CATEGORY_COLORS } from '../types';
import type { Recipe, Experiment } from '../types';
import { ExperimentLog } from '../components/ExperimentLog';
import { StarRating } from '../components/StarRating';
import { AnimatedNumber } from '../components/AnimatedNumber';

export function RecipeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadData(id);
    }
  }, [id]);

  const loadData = async (recipeId: string) => {
    setLoading(true);
    try {
      const [recipeRes, expRes] = await Promise.all([
        recipeApi.getById(recipeId),
        experimentApi.getByRecipeId(recipeId),
      ]);
      setRecipe(recipeRes.data);
      setExperiments(expRes.data);
    } catch (error) {
      console.error('Failed to load recipe:', error);
      alert('加载配方失败');
    } finally {
      setLoading(false);
    }
  };

  const handleAddExperiment = async (data: Omit<Experiment, 'id' | 'recipeId' | 'createdAt'>) => {
    if (!id) return;
    try {
      await experimentApi.create(id, data);
      loadData(id);
    } catch (error) {
      console.error('Failed to add experiment:', error);
      alert('添加实验记录失败');
    }
  };

  const handleDeleteExperiment = async (expId: string) => {
    try {
      await experimentApi.delete(expId);
      const updatedExperiments = experiments.filter((e) => e.id !== expId);
      setExperiments(updatedExperiments);
      
      if (recipe) {
        const avgRating = updatedExperiments.length > 0
          ? updatedExperiments.reduce((sum, e) => sum + e.rating, 0) / updatedExperiments.length
          : 0;
        setRecipe({ ...recipe, latestRating: Math.round(avgRating * 10) / 10 });
      }
    } catch (error) {
      console.error('Failed to delete experiment:', error);
      alert('删除实验记录失败');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-24 px-6 flex items-center justify-center">
        <div className="animate-spin w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="min-h-screen pt-24 px-6 text-center text-gray-500">
        配方不存在
      </div>
    );
  }

  const categoryColor = CATEGORY_COLORS[recipe.category];

  return (
    <div className="min-h-screen pt-24 px-6 pb-12">
      <div className="max-w-4xl mx-auto">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft size={20} />
          返回首页
        </button>

        <div
          className="relative overflow-hidden rounded-3xl mb-8"
          style={{
            background: 'linear-gradient(135deg, #fffaf0 0%, #fff8e1 100%)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
          }}
        >
          <div
            className="absolute top-0 left-0 right-0 h-2"
            style={{ backgroundColor: categoryColor.ribbon }}
          />

          <div className="p-8 pt-10">
            <div className="flex items-start justify-between mb-4">
              <div
                className="px-4 py-1.5 rounded-full text-sm font-medium"
                style={{
                  backgroundColor: categoryColor.bg,
                  color: categoryColor.text,
                }}
              >
                {categoryColor.label}
              </div>

              {recipe.latestRating > 0 && (
                <div className="flex items-center gap-2">
                  <StarRating value={Math.round(recipe.latestRating)} readonly size={20} />
                  <span className="text-xl font-bold" style={{ color: '#e67e22' }}>
                    <AnimatedNumber value={recipe.latestRating} decimals={1} />
                  </span>
                </div>
              )}
            </div>

            <h1 className="text-3xl font-bold text-gray-800 mb-4">{recipe.name}</h1>

            <p className="text-gray-500 flex items-center gap-2 mb-6">
              <ChefHat size={18} />
              {recipe.ovenModel || '未指定烤箱'}
            </p>

            {recipe.finalProduct.images.length > 0 && (
              <div className="grid grid-cols-3 gap-3 mb-6">
                {recipe.finalProduct.images.map((img, i) => (
                  <img
                    key={i}
                    src={img}
                    alt={`成品 ${i + 1}`}
                    className="w-full h-32 object-cover rounded-xl"
                  />
                ))}
              </div>
            )}

            {recipe.finalProduct.description && (
              <div className="p-4 bg-white/50 rounded-xl">
                <p className="text-gray-700">{recipe.finalProduct.description}</p>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <span
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white"
                style={{ backgroundColor: '#e67e22' }}
              >
                {recipe.ingredients.length}
              </span>
              原料列表
            </h2>
            <ul className="space-y-2">
              {recipe.ingredients.map((ing) => (
                <li
                  key={ing.id}
                  className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-orange-50 transition-colors"
                >
                  <span className="text-gray-700">{ing.name}</span>
                  <span className="text-gray-500 font-medium">
                    {ing.amount} {ing.unit}
                  </span>
                </li>
              ))}
              {recipe.ingredients.length === 0 && (
                <li className="text-gray-400 text-center py-4">暂无原料</li>
              )}
            </ul>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <span
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white"
                style={{ backgroundColor: '#e8a87c' }}
              >
                {recipe.steps.length}
              </span>
              制作步骤
            </h2>
            <ol className="space-y-3">
              {recipe.steps.map((step) => (
                <li key={step.id} className="flex gap-3">
                  <div
                    className="flex-shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-orange-400 to-pink-400 text-white flex items-center justify-center text-sm font-bold"
                  >
                    {step.order}
                  </div>
                  <p className="text-gray-700 pt-0.5">{step.description}</p>
                </li>
              ))}
              {recipe.steps.length === 0 && (
                <li className="text-gray-400 text-center py-4">暂无步骤</li>
              )}
            </ol>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <ExperimentLog
            experiments={experiments}
            onAdd={handleAddExperiment}
            onDelete={handleDeleteExperiment}
          />
        </div>
      </div>
    </div>
  );
}
