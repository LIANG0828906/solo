import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Clock, Trash2, ChefHat } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import { CATEGORIES } from '@/types';
import { useRecipeStore } from '@/store';

const CATEGORY_COLORS: Record<string, string> = {
  '早餐': '#FFE0B2',
  '午餐': '#C8E6C9',
  '晚餐': '#BBDEFB',
  '甜点': '#F8BBD0',
  '饮品': '#B2EBF2',
};

const RecipeManager: React.FC = () => {
  const navigate = useNavigate();
  const recipes = useRecipeStore((s) => s.recipes);
  const addRecipe = useRecipeStore((s) => s.addRecipe);
  const deleteRecipe = useRecipeStore((s) => s.deleteRecipe);

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    coverImage: '',
    cookTime: 0,
    category: '早餐' as string,
  });

  const debouncedSearch = useDebounce(search, 300);

  const filtered = useMemo(() => {
    return recipes.filter((r) => {
      const matchesSearch =
        !debouncedSearch ||
        r.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        r.description.toLowerCase().includes(debouncedSearch.toLowerCase());
      const matchesCategory = !category || r.category === category;
      return matchesSearch && matchesCategory;
    });
  }, [recipes, debouncedSearch, category]);

  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === 'cookTime' ? Number(value) : value,
    }));
  };

  const handleSave = () => {
    if (!form.name.trim()) return;
    addRecipe({
      name: form.name,
      description: form.description,
      coverImage: form.coverImage,
      cookTime: form.cookTime,
      category: form.category as any,
    });
    setForm({ name: '', description: '', coverImage: '', cookTime: 0, category: '早餐' });
    setModalOpen(false);
  };

  const handleCancel = () => {
    setForm({ name: '', description: '', coverImage: '', cookTime: 0, category: '早餐' });
    setModalOpen(false);
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm('确定要删除这个食谱吗？')) {
      deleteRecipe(id);
    }
  };

  const handleCardClick = (id: string) => {
    navigate(`/recipe/${id}`);
  };

  return (
    <div className="recipe-manager">
      <div className="recipe-manager__header">
        <div className="search-bar">
          <Search size={18} className="search-bar__icon" />
          <input
            type="text"
            placeholder="搜索食谱..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="category-filter"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="">全部分类</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <ChefHat size={48} />
          <p>未找到相关食谱</p>
        </div>
      ) : (
        <div className="recipe-grid">
          {filtered.map((recipe) => (
            <div
              key={recipe.id}
              className="recipe-card"
              onClick={() => handleCardClick(recipe.id)}
            >
              <div className="recipe-card__image">
                {recipe.coverImage ? (
                  <img src={recipe.coverImage} alt={recipe.name} />
                ) : (
                  <ChefHat size={40} />
                )}
              </div>
              <div className="recipe-card__content">
                <h3 className="recipe-card__title">{recipe.name}</h3>
                <p className="recipe-card__desc">{recipe.description}</p>
                <div className="recipe-card__meta">
                  <span>
                    <Clock size={14} />
                    {recipe.cookTime} 分钟
                  </span>
                  <span
                    className="recipe-card__category"
                    style={{ background: CATEGORY_COLORS[recipe.category] || '#eee' }}
                  >
                    {recipe.category}
                  </span>
                </div>
              </div>
              <button
                className="recipe-card__delete"
                onClick={(e) => handleDelete(e, recipe.id)}
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      <button className="new-recipe-btn" onClick={() => setModalOpen(true)}>
        <Plus size={24} />
      </button>

      {modalOpen && (
        <div className="modal-overlay" onClick={handleCancel}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>新建食谱</h2>
            <div className="recipe-form">
              <div className="recipe-form__field">
                <label>名称 *</label>
                <input
                  className="recipe-form__input"
                  name="name"
                  value={form.name}
                  onChange={handleFormChange}
                  maxLength={50}
                  placeholder="食谱名称"
                />
              </div>
              <div className="recipe-form__field">
                <label>描述</label>
                <textarea
                  className="recipe-form__textarea"
                  name="description"
                  value={form.description}
                  onChange={handleFormChange}
                  maxLength={500}
                  placeholder="食谱描述"
                  rows={4}
                />
              </div>
              <div className="recipe-form__field">
                <label>封面图片 URL</label>
                <input
                  className="recipe-form__input"
                  name="coverImage"
                  value={form.coverImage}
                  onChange={handleFormChange}
                  placeholder="https://..."
                />
              </div>
              <div className="recipe-form__field">
                <label>烹饪时间（分钟）</label>
                <input
                  className="recipe-form__input"
                  type="number"
                  name="cookTime"
                  value={form.cookTime}
                  onChange={handleFormChange}
                  min={0}
                />
              </div>
              <div className="recipe-form__field">
                <label>分类</label>
                <select
                  className="recipe-form__select"
                  name="category"
                  value={form.category}
                  onChange={handleFormChange}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div className="recipe-form__actions">
                <button onClick={handleCancel}>取消</button>
                <button onClick={handleSave} disabled={!form.name.trim()}>
                  保存
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecipeManager;
