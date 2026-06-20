import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import RecipeForm from '../components/RecipeForm';
import Toast from '../components/Toast';
import { useUiController as useStore } from '../module3/uiController';
import type { Recipe, RecipeCreateData, RecipeUpdateData } from '../types';
import { recipeManager } from '../module1/recipeManager';
import { ArrowLeft } from 'lucide-react';

export default function RecipeCreate() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { toast, hideToast, createRecipe, updateRecipe, currentUser, initUser, showToast } = useStore();
  
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const isEditing = !!id;

  useEffect(() => {
    if (!currentUser) {
      initUser();
    }

    if (id) {
      loadRecipe(id);
    } else {
      setLoading(false);
    }
  }, [id, currentUser, initUser]);

  const loadRecipe = async (recipeId: string) => {
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

  const handleSubmit = async (data: RecipeCreateData | RecipeUpdateData): Promise<void> => {
    try {
      if (isEditing && id) {
        await updateRecipe(id, data as RecipeUpdateData);
        showToast('食谱更新成功！', 'success');
      } else {
        await createRecipe(data as RecipeCreateData);
        showToast('食谱创建成功！', 'success');
      }
      navigate('/');
    } catch (error) {
      console.error('Failed to save recipe:', error);
      showToast(isEditing ? '更新食谱失败' : '创建食谱失败', 'error');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg)]">
        <div className="max-w-4xl mx-auto px-4 pt-24 pb-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6" />
            <div className="h-64 bg-gray-200 rounded-xl mb-4" />
            <div className="h-32 bg-gray-200 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <div className="sticky top-0 z-20 bg-[var(--bg)]/85 backdrop-blur-md border-b border-[var(--border)]">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-[var(--border)] rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-[var(--text-secondary)]" />
            </button>
            <h1 className="text-xl font-bold text-[var(--text-primary)]">
              {isEditing ? '编辑食谱' : '创建新食谱'}
            </h1>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <RecipeForm initialData={recipe || undefined} onSubmit={handleSubmit} onCancel={() => navigate(-1)} />
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
