import React, { useMemo } from 'react';
import { User, Sparkles, ChefHat } from 'lucide-react';
import { useAppStore } from '@/stores/appStore';
import { IngredientPanel } from '@/components/IngredientPanel';
import { RecipeCard } from '@/components/RecipeCard';
import { RecipeModal } from '@/components/RecipeModal';
import { PreferencePanel } from '@/components/PreferencePanel';

export const Home: React.FC = () => {
  const { selectedIngredients, recommendations, isGenerating, generateRecommendationsAction } = useAppStore();

  const canGenerate = selectedIngredients.length > 0;

  const handleGenerate = () => {
    if (canGenerate) {
      const startTime = performance.now();
      generateRecommendationsAction().then(() => {
        const endTime = performance.now();
        console.debug(`总渲染耗时: ${(endTime - startTime).toFixed(2)}ms`);
      });
    }
  };

  const showEmptyState = useMemo(() => {
    return recommendations.length === 0 && !isGenerating && selectedIngredients.length > 0;
  }, [recommendations.length, isGenerating, selectedIngredients.length]);

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5F5F5' }}>
      <header
        className="h-14 bg-white sticky top-0 z-40"
        style={{ boxShadow: '0 1px 0 #E0E0E0' }}
      >
        <div className="max-w-7xl mx-auto h-full px-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ChefHat className="w-6 h-6 text-green-600" />
            <h1 className="text-xl font-bold" style={{ fontSize: '22px', color: '#333333' }}>
              智慧厨房
            </h1>
          </div>
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ backgroundColor: '#E0E0E0' }}
          >
            <User className="w-5 h-5 text-gray-500" />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="md:w-[300px] flex-shrink-0 space-y-4">
            <IngredientPanel />
            <PreferencePanel />
          </div>

          <div className="flex-1">
            <div className="sticky top-16 bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4 z-30">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-800">推荐食谱</h2>
                  {selectedIngredients.length > 0 && (
                    <p className="text-sm text-gray-500">
                      已选择 {selectedIngredients.length} 种食材
                    </p>
                  )}
                </div>
                <button
                  onClick={handleGenerate}
                  disabled={!canGenerate || isGenerating}
                  className="flex items-center gap-2 font-medium transition-all duration-200 active:scale-95 disabled:cursor-not-allowed"
                  style={{
                    width: '160px',
                    height: '44px',
                    borderRadius: '8px',
                    fontSize: '16px',
                    backgroundColor: canGenerate ? '#4CAF50' : '#BDBDBD',
                    color: '#FFFFFF',
                  }}
                  onMouseEnter={(e) => {
                    if (canGenerate) {
                      e.currentTarget.style.backgroundColor = '#388E3C';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = canGenerate ? '#4CAF50' : '#BDBDBD';
                  }}
                  title={!canGenerate ? '请先添加食材' : ''}
                >
                  <Sparkles className="w-5 h-5" />
                  {isGenerating ? '生成中...' : '生成食谱'}
                </button>
              </div>
            </div>

            {isGenerating && (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-500 border-t-transparent" />
              </div>
            )}

            {showEmptyState && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <span style={{ fontSize: '64px' }}>🍳</span>
                <p className="mt-4" style={{ fontSize: '16px', color: '#757575' }}>
                  暂无匹配食谱，试试添加更多食材
                </p>
              </div>
            )}

            {!isGenerating && recommendations.length > 0 && (
              <div className="grid gap-4 justify-center" style={{
                gridTemplateColumns: 'repeat(auto-fit, 220px)'
              }}>
                {recommendations.map((result) => (
                  <RecipeCard key={result.recipe.id} result={result} />
                ))}
              </div>
            )}

            {selectedIngredients.length === 0 && !isGenerating && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <span style={{ fontSize: '64px' }}>🥗</span>
                <p className="mt-4" style={{ fontSize: '16px', color: '#757575' }}>
                  请从左侧添加食材，开始探索美味食谱
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      <RecipeModal />
    </div>
  );
};
