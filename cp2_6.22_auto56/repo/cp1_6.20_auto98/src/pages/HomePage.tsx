import { useState, useEffect } from 'react';
import { Recipe } from '../api';
import { fetchRecipes } from '../api';
import RecipeCard from '../components/RecipeCard';

export default function HomePage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [cuisine, setCuisine] = useState('all');
  const [difficulty, setDifficulty] = useState('all');
  const [maxTime, setMaxTime] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadRecipes();
  }, [cuisine, difficulty, maxTime]);

  const loadRecipes = async () => {
    try {
      setLoading(true);
      const data = await fetchRecipes({
        cuisine: cuisine === 'all' ? undefined : cuisine,
        difficulty: difficulty === 'all' ? undefined : difficulty,
        maxTime: maxTime ? Number(maxTime) : undefined,
        search: search || undefined
      });
      setRecipes(data);
    } catch (error) {
      console.error('加载菜谱失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      loadRecipes();
    }
  };

  return (
    <div className="container main-content">
      <div style={{ padding: '40px 0 20px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 700, marginBottom: '8px' }}>
          发现美食灵感 🍳
        </h1>
        <p style={{ color: 'var(--color-text-light)', fontSize: '16px' }}>
          探索来自世界各地的精彩菜谱，开启你的烹饪之旅
        </p>
      </div>

      <div className="filters-bar">
        <div className="filter-group">
          <label>菜系</label>
          <select value={cuisine} onChange={(e) => setCuisine(e.target.value)}>
            <option value="all">全部</option>
            <option value="中餐">中餐</option>
            <option value="西餐">西餐</option>
            <option value="日料">日料</option>
            <option value="韩餐">韩餐</option>
            <option value="甜品">甜品</option>
          </select>
        </div>
        <div className="filter-group">
          <label>难度</label>
          <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
            <option value="all">全部</option>
            <option value="easy">初级</option>
            <option value="medium">中级</option>
            <option value="hard">高级</option>
          </select>
        </div>
        <div className="filter-group">
          <label>烹饪时间</label>
          <select value={maxTime} onChange={(e) => setMaxTime(e.target.value)}>
            <option value="">不限</option>
            <option value="30">30分钟内</option>
            <option value="60">1小时内</option>
            <option value="120">2小时内</option>
          </select>
        </div>
        <div className="filter-group" style={{ marginLeft: 'auto' }}>
          <input
            type="text"
            placeholder="搜索菜谱..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleSearch}
            style={{ width: '200px' }}
          />
          <button className="btn btn-primary" onClick={loadRecipes}>
            搜索
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading">
          <div className="loading-spinner"></div>
          <span>加载中...</span>
        </div>
      ) : recipes.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🍽️</div>
          <p className="empty-state-text">暂无符合条件的菜谱</p>
          <p style={{ fontSize: '14px', color: 'var(--color-text-light)' }}>
            试试调整筛选条件，或创造你的第一个菜谱吧~
          </p>
        </div>
      ) : (
        <div className="recipe-grid" style={{ paddingBottom: '40px' }}>
          {recipes.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      )}
    </div>
  );
}
