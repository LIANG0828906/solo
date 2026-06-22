import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import RecipeCard from '../components/RecipeCard';
import { recipeApi } from '../api';
import type { Recipe } from '../types';

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}

const CATEGORIES = ['全部', '中餐', '西餐', '甜品', '其他'] as const;

const Home = () => {
  const navigate = useNavigate();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState<string>('全部');
  const [isHovering, setIsHovering] = useState(false);

  const debouncedSearch = useDebounce(searchTerm, 300);

  useEffect(() => {
    const fetchRecipes = async () => {
      try {
        setLoading(true);
        const data = await recipeApi.getRecipes();
        setRecipes(data);
      } catch (error) {
        console.error('Failed to fetch recipes:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchRecipes();
  }, []);

  const filteredRecipes = useMemo(() => {
    return recipes.filter((recipe) => {
      const matchesSearch = recipe.name.toLowerCase().includes(debouncedSearch.toLowerCase());
      const matchesCategory = category === '全部' || recipe.category === category;
      return matchesSearch && matchesCategory;
    });
  }, [recipes, debouncedSearch, category]);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  }, []);

  const handleCategoryChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setCategory(e.target.value);
  }, []);

  const handleUploadClick = useCallback(() => {
    navigate('/upload');
  }, [navigate]);

  return (
    <div>
      <div
        style={{
          padding: '32px 24px',
          maxWidth: '1200px',
          margin: '0 auto',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="搜索菜谱..."
            value={searchTerm}
            onChange={handleSearchChange}
            style={{
              width: '300px',
              borderRadius: '8px',
              border: '1px solid #E5E7EB',
              padding: '12px 16px',
              fontSize: '14px',
            }}
          />
          <select
            value={category}
            onChange={handleCategoryChange}
            style={{
              borderRadius: '8px',
              border: '1px solid #E5E7EB',
              padding: '12px 16px',
              marginLeft: '16px',
              background: 'white',
              cursor: 'pointer',
            }}
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="masonry-grid">
          {[...Array(6)].map((_, index) => (
            <div
              key={index}
              style={{
                height: '280px',
                borderRadius: '12px',
                background: '#f0f0f0',
                marginBottom: '16px',
                breakInside: 'avoid',
                animation: 'pulse 1.5s ease-in-out infinite',
              }}
            />
          ))}
        </div>
      ) : filteredRecipes.length > 0 ? (
        <div className="masonry-grid">
          {filteredRecipes.map((recipe) => (
            <div key={recipe.id} style={{ breakInside: 'avoid', marginBottom: '16px' }}>
              <RecipeCard recipe={recipe} />
            </div>
          ))}
        </div>
      ) : (
        <div
          style={{
            textAlign: 'center',
            padding: '60px 24px',
          }}
        >
          <p
            style={{
              fontSize: '16px',
              color: 'var(--text-secondary)',
              marginBottom: '24px',
            }}
          >
            还没有菜谱哦，去上传一个吧
          </p>
          <button
            onClick={handleUploadClick}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
            className={isHovering ? 'animate-bounce-in' : ''}
            style={{
              background: 'var(--primary)',
              color: 'white',
              padding: '12px 32px',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 500,
            }}
          >
            上传
          </button>
        </div>
      )}
    </div>
  );
};

export default Home;
