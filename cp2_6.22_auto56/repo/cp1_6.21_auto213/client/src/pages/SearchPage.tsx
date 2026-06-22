import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { client } from '../api/client';
import { Card } from '../components/Card';

interface Recipe {
  id: string;
  title: string;
  author: string;
  coverImage: string;
  cookTime: number;
  avgRating: number;
  favoritesCount: number;
  commentsCount: number;
}

export const SearchPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const [keyword, setKeyword] = useState(initialQuery);
  const [category, setCategory] = useState('');
  const [timeMin, setTimeMin] = useState(5);
  const [timeMax, setTimeMax] = useState(120);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchRecipes = useCallback(async (kw: string, cat: string, tMin: number, tMax: number) => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = {};
      if (kw) params.search = kw;
      if (cat) params.category = cat;
      if (tMin > 5) params.timeMin = tMin;
      if (tMax < 120) params.timeMax = tMax;
      const res = await client.get('/recipes', { params });
      setRecipes(res.data);
    } catch {
      setRecipes([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecipes(keyword, category, timeMin, timeMax);
  }, [keyword, category, timeMin, timeMax, fetchRecipes]);

  const handleKeywordChange = (value: string) => {
    setKeyword(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchRecipes(value, category, timeMin, timeMax);
    }, 300);
  };

  return (
    <div className="search-page-layout">
      <div className="search-sidebar">
        <h3>筛选条件</h3>

        <div className="filter-group">
          <label>关键字</label>
          <input
            type="text"
            value={keyword}
            onChange={(e) => handleKeywordChange(e.target.value)}
            placeholder="搜索菜谱..."
          />
        </div>

        <div className="filter-group">
          <label>菜系</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">全部</option>
            <option value="家常菜">家常菜</option>
            <option value="川菜">川菜</option>
            <option value="粤菜">粤菜</option>
          </select>
        </div>

        <div className="filter-group">
          <label>烹饪时长</label>
          <input
            type="range"
            min={5}
            max={120}
            step={5}
            value={timeMax}
            onChange={(e) => setTimeMax(Number(e.target.value))}
          />
          <div className="range-label">
            <span>5分钟</span>
            <span>{timeMax}分钟</span>
          </div>
        </div>
      </div>

      <div className="search-results">
        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner" />
          </div>
        ) : recipes.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#9CA3AF' }}>
            没有找到相关菜谱
          </div>
        ) : (
          <div className="search-grid">
            {recipes.map((recipe) => (
              <Card key={recipe.id} recipe={recipe} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
