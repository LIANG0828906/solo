import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { recipesApi, Recipe } from '@/api/recipesApi';
import { useRecipesStore } from '@/store/recipesStore';
import { ArrowLeft, ChefHat, ListOrdered, Heart, Sparkles } from 'lucide-react';
import { RecipeCard } from '@/components/RecipeCard';

export default function RecipeDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [heartAnim, setHeartAnim] = useState(false);
  const toggleFavorite = useRecipesStore((s) => s.toggleFavorite);
  const isFavorite = useRecipesStore((s) => s.isFavorite);
  const recommendations = useRecipesStore((s) => s.recommendations);
  const fetchRecommendations = useRecipesStore((s) => s.fetchRecommendations);
  const fetchFavorites = useRecipesStore((s) => s.fetchFavorites);

  useEffect(() => {
    const loadRecipe = async () => {
      if (!id) return;
      setLoading(true);
      const data = await recipesApi.getRecipeById(id);
      setRecipe(data);
      setLoading(false);
      fetchRecommendations();
    };
    loadRecipe();
    fetchFavorites();
  }, [id]);

  const handleFavClick = async () => {
    if (!recipe) return;
    setHeartAnim(true);
    setTimeout(() => setHeartAnim(false), 200);
    await toggleFavorite(recipe.id);
  };

  const handleRandomClick = async () => {
    const random = await recipesApi.getRandomRecipe();
    if (random) {
      navigate(`/recipe/${random.id}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#FFF8E1' }}>
        <div className="text-center">
          <div
            className="animate-spin rounded-full border-4 border-t-transparent mx-auto mb-4"
            style={{ borderColor: '#FFCC80', borderTopColor: '#FF7043', width: '48px', height: '48px' }}
          />
          <p className="text-lg" style={{ color: '#666' }}>加载中...</p>
        </div>
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#FFF8E1' }}>
        <div className="text-center">
          <div className="text-6xl mb-4">🍽️</div>
          <p className="text-xl mb-6" style={{ color: '#666' }}>
            该食谱不存在或已被删除
          </p>
          <Link
            to="/"
            className="inline-block text-base rounded-full transition-all duration-200 hover:brightness-110 active:scale-95"
            style={{
              padding: '12px 28px',
              backgroundColor: '#FF8A65',
              color: 'white',
            }}
          >
            返回首页
          </Link>
        </div>
      </div>
    );
  }

  const fav = isFavorite(recipe.id);

  return (
    <div className="min-h-screen pb-16" style={{ backgroundColor: '#FFF8E1' }}>
      <div className="max-w-7xl mx-auto px-4 pt-6 pb-4">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 text-base rounded-full transition-all duration-200 hover:brightness-110 active:scale-95"
            style={{
              padding: '10px 20px',
              backgroundColor: 'white',
              color: '#FF7043',
              border: '1px solid #FFCC80',
            }}
          >
            <ArrowLeft className="w-4 h-4" />
            返回首页
          </button>

          <button
            onClick={handleRandomClick}
            className="inline-flex items-center gap-2 text-base rounded-full transition-all duration-200 hover:brightness-110 active:scale-95"
            style={{
              padding: '10px 20px',
              backgroundColor: '#FF8A65',
              color: 'white',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#FF7043')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#FF8A65')}
          >
            <Sparkles className="w-4 h-4" />
            下一个
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col lg:flex-row gap-8 bg-white rounded-3xl p-6 lg:p-8 shadow-xl"
          style={{
            boxShadow: '0 10px 40px rgba(255, 112, 67, 0.15)',
          }}
        >
          <div className="lg:w-[60%] flex-shrink-0">
            <div
              className="rounded-2xl overflow-hidden shadow-lg"
              style={{
                aspectRatio: '4 / 3',
                backgroundColor: '#FFCC80',
              }}
            >
              <img
                src={recipe.image_url}
                alt={recipe.title}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          <div className="lg:flex-1 flex flex-col">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1 pr-4">
                <h1 className="text-3xl font-bold mb-3" style={{ color: '#2D2D2D' }}>
                  {recipe.title}
                </h1>
                <div className="flex flex-wrap gap-[6px]">
                  {recipe.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[12px] text-white rounded-full transition-all duration-200 hover:brightness-110 active:scale-95"
                      style={{
                        backgroundColor: '#FF7043',
                        padding: '4px 8px',
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <button
                onClick={handleFavClick}
                className="flex-shrink-0 rounded-full transition-all duration-200 hover:brightness-110 active:scale-95 shadow-md"
                style={{
                  padding: '14px',
                  backgroundColor: 'white',
                  border: '2px solid #FFCC80',
                }}
                title={fav ? '取消收藏' : '收藏此菜谱'}
              >
                <svg
                  className={`w-7 h-7 transition-colors duration-200 ${heartAnim ? 'heart-animate' : ''}`}
                  fill={fav ? '#E53935' : 'none'}
                  stroke={fav ? '#E53935' : '#CCC'}
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
              </button>
            </div>

            <p className="text-base mb-6 leading-relaxed" style={{ color: '#666' }}>
              {recipe.description}
            </p>

            <div className="mb-6">
              <div className="flex items-center gap-2 mb-4">
                <ChefHat className="w-5 h-5" style={{ color: '#FF7043' }} />
                <h2 className="text-xl font-bold" style={{ color: '#2D2D2D' }}>
                  所需食材
                </h2>
              </div>
              <ul className="custom-list list-none pl-2 space-y-3">
                {recipe.ingredients.map((ing, idx) => (
                  <li
                    key={idx}
                    className="text-base py-1 px-2 rounded-lg transition-colors"
                    style={{ color: '#333', backgroundColor: 'rgba(255, 204, 128, 0.15)' }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 204, 128, 0.3)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 204, 128, 0.15)')}
                  >
                    {ing}
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-2 mb-4">
                <ListOrdered className="w-5 h-5" style={{ color: '#FF7043' }} />
                <h2 className="text-xl font-bold" style={{ color: '#2D2D2D' }}>
                  制作步骤
                </h2>
              </div>
              <div className="space-y-[12px]">
                {recipe.steps.map((step, idx) => (
                  <div
                    key={idx}
                    className="flex gap-4 p-4 rounded-2xl transition-all duration-200 hover:shadow-md"
                    style={{ backgroundColor: 'rgba(255, 248, 225, 0.8)' }}
                  >
                    <div
                      className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center font-bold text-white text-base"
                      style={{ backgroundColor: '#FF7043' }}
                    >
                      {idx + 1}
                    </div>
                    <p className="flex-1 text-base leading-relaxed pt-1" style={{ color: '#333' }}>
                      {step}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {recommendations.length > 0 && (
          <div className="mt-16">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold inline-flex items-center gap-2" style={{ color: '#E64A19' }}>
                <Heart className="w-6 h-6" fill="#E64A19" stroke="#E64A19" />
                猜你喜欢
              </h2>
              <p className="text-sm mt-2" style={{ color: '#999' }}>
                根据你的收藏喜好为你推荐
              </p>
            </div>
            <div className="recipe-masonry w-full" style={{ width: '100%' }}>
              {recommendations.slice(0, 8).map((rec, idx) => (
                <div key={rec.id} className="w-full flex justify-center">
                  <RecipeCard recipe={rec} index={idx} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
