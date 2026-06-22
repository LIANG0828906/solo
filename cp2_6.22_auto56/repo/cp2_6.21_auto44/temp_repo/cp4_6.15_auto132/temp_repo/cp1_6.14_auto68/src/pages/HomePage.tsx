import { useState, useEffect } from 'react';
import { PlusCircle, ChefHat } from 'lucide-react';
import { recipeApi } from '../api';
import type { Recipe } from '../types';
import { RecipeCard } from '../components/RecipeCard';
import { Link } from 'react-router-dom';

export function HomePage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecipes();
  }, []);

  const loadRecipes = async () => {
    setLoading(true);
    try {
      const res = await recipeApi.getAll();
      setRecipes(res.data);
    } catch (error) {
      console.error('Failed to load recipes:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-24 px-6 pb-12">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">我的配方</h1>
            <p className="text-gray-500">管理你的烘焙配方，记录每一次实验</p>
          </div>
          <Link
            to="/create"
            className="px-6 py-3 bg-gradient-to-r from-orange-500 to-pink-400 text-white rounded-xl flex items-center gap-2 transition-transform hover:scale-105 active:scale-100 shadow-lg shadow-orange-200"
            style={{ borderRadius: '10px' }}
          >
            <PlusCircle size={20} />
            新建配方
          </Link>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full"></div>
          </div>
        ) : recipes.length === 0 ? (
          <div className="text-center py-20">
          <div className="w-24 h-24 mx-auto mb-6 bg-orange-100 rounded-full flex items-center justify-center">
            <ChefHat size={48} style={{ color: '#e67e22' }} />
          </div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">还没有配方</h2>
          <p className="text-gray-500 mb-6">点击上方按钮创建你的第一个配方吧</p>
          <Link
            to="/create"
            className="px-6 py-3 bg-gradient-to-r from-orange-500 to-pink-400 text-white rounded-xl inline-flex items-center gap-2"
            style={{ borderRadius: '10px' }}
          >
            <PlusCircle size={20} />
            创建配方
          </Link>
        </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recipes.map((recipe, index) => (
              <RecipeCard key={recipe.id} recipe={recipe} index={index} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
