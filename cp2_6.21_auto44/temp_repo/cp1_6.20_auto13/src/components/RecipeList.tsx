import React, { useState, useMemo, useCallback } from 'react';
import { Recipe, Difficulty } from '../utils/api';

const PRESET_TAGS = ['早餐', '午餐', '晚餐', '甜点', '素食', '汤品', '小食', '快手菜'];

const DIFFICULTY_STARS: Record<Difficulty, number> = {
  '简单': 1,
  '中等': 2,
  '困难': 3,
};

interface FilterState {
  search: string;
  tags: string[];
  difficulty: Difficulty | '';
  timeMin: number;
  timeMax: number;
}

export default function RecipeList({
  recipes,
  onSelect,
  onAdd,
}: {
  recipes: Recipe[];
  onSelect: (id: string) => void;
  onAdd: () => void;
}) {
  const [filter, setFilter] = useState<FilterState>({
    search: '',
    tags: [],
    difficulty: '',
    timeMin: 0,
    timeMax: 180,
  });
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    recipes.forEach((r) => r.tags.forEach((t) => tagSet.add(t)));
    return Array.from(tagSet).sort();
  }, [recipes]);

  const filteredRecipes = useMemo(() => {
    return recipes.filter((r) => {
      if (filter.search) {
        const q = filter.search.toLowerCase();
        if (!r.name.toLowerCase().includes(q) && !r.description.toLowerCase().includes(q)) {
          return false;
        }
      }
      if (filter.tags.length > 0) {
        if (!filter.tags.some((t) => r.tags.includes(t))) return false;
      }
      if (filter.difficulty && r.difficulty !== filter.difficulty) return false;
      if (r.cookingTime < filter.timeMin || r.cookingTime > filter.timeMax) return false;
      return true;
    });
  }, [recipes, filter]);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFilter((prev) => ({ ...prev, search: e.target.value }));
  }, []);

  const handleDifficultyChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilter((prev) => ({ ...prev, difficulty: (e.target.value || '') as Difficulty | '' }));
  }, []);

  const handleTagToggle = useCallback((tag: string) => {
    setFilter((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag) ? prev.tags.filter((t) => t !== tag) : [...prev.tags, tag],
    }));
  }, []);

  const handleTimeMinChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value);
    setFilter((prev) => ({ ...prev, timeMin: Math.min(val, prev.timeMax) }));
  }, []);

  const handleTimeMaxChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value);
    setFilter((prev) => ({ ...prev, timeMax: Math.max(val, prev.timeMin) }));
  }, []);

  const renderStars = (difficulty: Difficulty) => {
    const count = DIFFICULTY_STARS[difficulty];
    return (
      <span className="difficulty-stars">
        {[1, 2, 3].map((i) => (
          <span key={i} className={`star ${i <= count ? '' : 'empty'}`}>
            ★
          </span>
        ))}
      </span>
    );
  };

  return (
    <>
      <button
        className="filter-toggle-btn"
        onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
      >
        {mobileFilterOpen ? '🔼 收起筛选' : '🔽 展开筛选'}
      </button>
      <div className="filter-bar">
        <div className={`filter-bar-inner ${mobileFilterOpen ? '' : 'collapsed'}`}>
          <div className="filter-group">
            <label>搜索</label>
            <input
              type="text"
              placeholder="按名称或简介搜索..."
              value={filter.search}
              onChange={handleSearchChange}
            />
          </div>
          <div className="filter-group">
            <label>标签</label>
            <select
              multiple
              value={filter.tags}
              onChange={(e) => {
                const selected = Array.from(e.target.selectedOptions, (o) => o.value);
                setFilter((prev) => ({ ...prev, tags: selected }));
              }}
              style={{ minHeight: 36, padding: '4px 8px' }}
            >
              {allTags.map((tag) => (
                <option key={tag} value={tag}>
                  {tag}
                </option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <label>难度</label>
            <select value={filter.difficulty} onChange={handleDifficultyChange}>
              <option value="">全部</option>
              <option value="简单">简单</option>
              <option value="中等">中等</option>
              <option value="困难">困难</option>
            </select>
          </div>
          <div className="filter-group">
            <label>烹饪时间 ({filter.timeMin}-{filter.timeMax} 分钟)</label>
            <div className="range-slider">
              <input
                type="range"
                min={0}
                max={180}
                value={filter.timeMin}
                onChange={handleTimeMinChange}
              />
              <input
                type="range"
                min={0}
                max={180}
                value={filter.timeMax}
                onChange={handleTimeMaxChange}
              />
            </div>
          </div>
        </div>
      </div>

      {filteredRecipes.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🍽️</div>
          <h3>暂无匹配的食谱</h3>
          <p>试试调整筛选条件，或添加一个新食谱吧</p>
          <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={onAdd}>
            ＋ 添加食谱
          </button>
        </div>
      ) : (
        <div className="recipe-grid">
          {filteredRecipes.map((recipe, index) => (
            <div
              key={recipe.id}
              className="recipe-card"
              style={{ animationDelay: `${index * 0.05}s` }}
              onClick={() => onSelect(recipe.id)}
            >
              {recipe.coverImage ? (
                <img
                  className="recipe-card-img"
                  src={recipe.coverImage}
                  alt={recipe.name}
                  loading="lazy"
                />
              ) : (
                <div className="recipe-card-img-placeholder">🍳</div>
              )}
              <div className="recipe-card-body">
                {recipe.tags.length > 0 && (
                  <div className="recipe-card-tags">
                    {recipe.tags.slice(0, 3).map((tag) => (
                      <span key={tag} className="tag-dot">
                        {tag}
                      </span>
                    ))}
                    {recipe.tags.length > 3 && (
                      <span className="tag-more">+{recipe.tags.length - 3}</span>
                    )}
                  </div>
                )}
                <div className="recipe-card-name">{recipe.name}</div>
                <div className="recipe-card-meta">
                  <span>⏱ {recipe.cookingTime}分钟</span>
                  {renderStars(recipe.difficulty)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
