import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  Search,
  ChevronDown,
  ChevronRight,
  Plus,
  X,
  Heart,
  Clock,
  Star,
  Upload,
  Trash2,
  ChefHat,
  Menu,
  Image as ImageIcon,
} from 'lucide-react';
import type { Recipe, Ingredient, Step } from '../types';
import RecipeCard from '../components/RecipeCard';

const categoryGroups: Record<string, string[]> = {
  家常菜: ['红烧肉', '番茄炒蛋', '糖醋排骨'],
  川菜: ['麻婆豆腐', '宫保鸡丁', '水煮鱼'],
  甜品: ['提拉米苏', '芒果班戟', '杨枝甘露'],
  主食: ['扬州炒饭', '牛肉面', '葱油饼'],
};

const categories = Object.keys(categoryGroups);

const getAllRecipes = async (): Promise<Recipe[]> => {
  try {
    const res = await fetch('/api/recipes');
    if (res.ok) return await res.json();
  } catch (e) {}
  return [];
};

const createRecipe = async (
  data: Omit<Recipe, 'id' | 'isFavorite' | 'createdAt'>
): Promise<Recipe | null> => {
  try {
    const res = await fetch('/api/recipes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (res.ok) return await res.json();
  } catch (e) {}
  return null;
};

const toggleFavoriteApi = async (id: string, isFavorite: boolean): Promise<Recipe | null> => {
  try {
    const res = await fetch(`/api/recipes/${id}/favorite`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isFavorite }),
    });
    if (res.ok) return await res.json();
  } catch (e) {}
  return null;
};

interface HomePageProps {
  showToast: (msg: string) => void;
}

const HomePage: React.FC<HomePageProps> = ({ showToast }) => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('全部');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(categories));
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [newRecipeId, setNewRecipeId] = useState<string | null>(null);

  const [formName, setFormName] = useState('');
  const [formDifficulty, setFormDifficulty] = useState(3);
  const [formCookTime, setFormCookTime] = useState(30);
  const [formCategory, setFormCategory] = useState(categories[0]);
  const [formImage, setFormImage] = useState('');
  const [formIngredients, setFormIngredients] = useState<Ingredient[]>([
    { name: '', amount: '' },
  ]);
  const [formSteps, setFormSteps] = useState<Step[]>([{ description: '' }]);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const stepFileRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    getAllRecipes().then((data) => setRecipes(data));
  }, []);

  const debounceSearch = useCallback(
    (() => {
      let timer: ReturnType<typeof setTimeout>;
      return (q: string) => {
        clearTimeout(timer);
        timer = setTimeout(() => setSearchQuery(q), 300);
      };
    })(),
    []
  );

  const filteredRecipes = useMemo(() => {
    return recipes.filter((r) => {
      const catMatch =
        activeCategory === '全部'
          ? true
          : activeCategory === '__favorites__'
          ? r.isFavorite
          : r.category === activeCategory;
      const qMatch = searchQuery
        ? r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.ingredients.some((i) => i.name.toLowerCase().includes(searchQuery.toLowerCase()))
        : true;
      return catMatch && qMatch;
    });
  }, [recipes, activeCategory, searchQuery]);

  const favoritesCount = useMemo(
    () => recipes.filter((r) => r.isFavorite).length,
    [recipes]
  );

  const handleToggleFavorite = async (id: string, fav: boolean) => {
    setRecipes((prev) => prev.map((r) => (r.id === id ? { ...r, isFavorite: fav } : r)));
    if (selectedRecipe && selectedRecipe.id === id) {
      setSelectedRecipe({ ...selectedRecipe, isFavorite: fav });
    }
    await toggleFavoriteApi(id, fav);
  };

  const toggleCategory = (cat: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  const resetForm = () => {
    setFormName('');
    setFormDifficulty(3);
    setFormCookTime(30);
    setFormCategory(categories[0]);
    setFormImage('');
    setFormIngredients([{ name: '', amount: '' }]);
    setFormSteps([{ description: '' }]);
  };

  const handleImageFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => setFormImage(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) handleImageFile(file);
  };

  const handleStepImageFile = (idx: number, file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setFormSteps((prev) =>
        prev.map((s, i) => (i === idx ? { ...s, image: e.target?.result as string } : s))
      );
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!formName.trim()) {
      showToast('请填写菜名');
      return;
    }
    const validIngredients = formIngredients.filter((i) => i.name.trim());
    const validSteps = formSteps.filter((s) => s.description.trim());
    if (!validIngredients.length) {
      showToast('请添加至少一种食材');
      return;
    }
    if (!validSteps.length) {
      showToast('请添加至少一个步骤');
      return;
    }
    const created = await createRecipe({
      name: formName.trim(),
      image:
        formImage ||
        'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjgwIiBoZWlnaHQ9IjEyMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjRkZDRUIxIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiNGRjcwNDMiIGZvbnQtc2l6ZT0iMjAiPuWMlueuo+iHqTwvdGV4dD48L3N2Zz4=',
      difficulty: formDifficulty,
      cookTime: Number(formCookTime) || 0,
      category: formCategory,
      ingredients: validIngredients,
      steps: validSteps,
    });
    if (created) {
      setRecipes((prev) => [created, ...prev]);
      setNewRecipeId(created.id);
      setTimeout(() => setNewRecipeId(null), 600);
      setIsModalOpen(false);
      resetForm();
      showToast('食谱创建成功！');
    } else {
      showToast('创建失败，请重试');
    }
  };

  const addIngredient = () => {
    setFormIngredients((prev) => [...prev, { name: '', amount: '' }]);
  };

  const removeIngredient = (idx: number) => {
    setFormIngredients((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateIngredient = (idx: number, field: keyof Ingredient, value: string) => {
    setFormIngredients((prev) =>
      prev.map((ing, i) => (i === idx ? { ...ing, [field]: value } : ing))
    );
  };

  const addStep = () => {
    setFormSteps((prev) => [...prev, { description: '' }]);
  };

  const removeStep = (idx: number) => {
    setFormSteps((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateStep = (idx: number, field: keyof Step, value: string) => {
    setFormSteps((prev) =>
      prev.map((s, i) => (i === idx ? { ...s, [field]: value } : s))
    );
  };

  const sidebarWidthStyle: React.CSSProperties = isSidebarOpen
    ? { transform: 'translateX(0)', opacity: 1 }
    : window.innerWidth < 768
    ? { transform: 'translateX(-100%)', opacity: 0 }
    : {};

  return (
    <>
      <div style={{ minHeight: '100vh', backgroundColor: '#FBE9E7', fontFamily: "'Noto Sans SC', sans-serif" }}>
        <div
          style={{
            height: 64,
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#FFFFFF',
            boxShadow: '0 2px 4px rgba(0,0,0,.06)',
            position: 'sticky',
            top: 0,
            zIndex: 30,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button
              className="hamburger-btn"
              onClick={() => {
                setIsSidebarOpen(!isSidebarOpen);
                setMobileMenuOpen(!mobileMenuOpen);
              }}
              style={{
                display: 'none',
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                padding: 8,
                borderRadius: 8,
              }}
            >
              <Menu size={24} color="#3E2723" />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <ChefHat size={28} color="#FF7043" />
              <span
                style={{
                  fontSize: 22,
                  fontWeight: 700,
                  color: '#3E2723',
                  fontFamily: "'Noto Serif SC', serif",
                }}
              >
                🍳 食谱管家
              </span>
            </div>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            style={{
              width: 180,
              height: 48,
              borderRadius: 24,
              border: 'none',
              background: 'linear-gradient(135deg,#FF8A65,#FF7043)',
              color: '#FFFFFF',
              fontSize: 15,
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(255,112,67,.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              transition: 'filter .2s, transform .2s',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.filter = 'brightness(1.1)';
              (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.02)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.filter = 'brightness(1)';
              (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
            }}
          >
            <Plus size={18} /> 创建食谱
          </button>
        </div>

        <div style={{ display: 'flex' }}>
          <aside
            style={{
              width: '25%',
              minWidth: 240,
              backgroundColor: '#F5F5F5',
              borderRight: '1px solid #E0E0E0',
              padding: 20,
              position: window.innerWidth < 768 ? 'fixed' : 'relative',
              top: window.innerWidth < 768 ? 64 : 0,
              left: 0,
              height: window.innerWidth < 768 ? 'calc(100vh - 64px)' : 'auto',
              zIndex: 50,
              overflowY: 'auto',
              transition: 'transform .3s, opacity .3s',
              ...sidebarWidthStyle,
            }}
            className="sidebar-panel"
          >
            <div style={{ position: 'relative', marginBottom: 20 }}>
              <Search
                size={18}
                style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#9E9E9E' }}
              />
              <input
                type="text"
                placeholder="搜索菜名或食材..."
                onChange={(e) => debounceSearch(e.target.value)}
                style={{
                  height: 44,
                  borderRadius: 12,
                  border: '2px solid #E0E0E0',
                  paddingLeft: 42,
                  paddingRight: 16,
                  width: '100%',
                  boxSizing: 'border-box',
                  fontSize: 14,
                  outline: 'none',
                  transition: 'border-color .2s',
                  backgroundColor: '#FFFFFF',
                }}
                onFocus={(e) => ((e.currentTarget as HTMLInputElement).style.borderColor = '#FF7043')}
                onBlur={(e) => ((e.currentTarget as HTMLInputElement).style.borderColor = '#E0E0E0')}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div
                onClick={() => {
                  setActiveCategory('全部');
                  if (window.innerWidth < 768) {
                    setIsSidebarOpen(false);
                    setMobileMenuOpen(false);
                  }
                }}
                style={{
                  height: 42,
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0 14px',
                  cursor: 'pointer',
                  fontSize: 14,
                  fontWeight: activeCategory === '全部' ? 600 : 500,
                  backgroundColor: activeCategory === '全部' ? '#FF7043' : 'transparent',
                  color: activeCategory === '全部' ? '#FFFFFF' : '#424242',
                  transition: 'background-color .2s, color .2s',
                }}
                onMouseEnter={(e) => {
                  if (activeCategory !== '全部')
                    (e.currentTarget as HTMLDivElement).style.backgroundColor = '#FFF8E1';
                }}
                onMouseLeave={(e) => {
                  if (activeCategory !== '全部')
                    (e.currentTarget as HTMLDivElement).style.backgroundColor = 'transparent';
                }}
              >
                🍽️ 全部食谱
              </div>

              <div
                onClick={() => {
                  setActiveCategory('__favorites__');
                  if (window.innerWidth < 768) {
                    setIsSidebarOpen(false);
                    setMobileMenuOpen(false);
                  }
                }}
                style={{
                  height: 42,
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0 14px',
                  cursor: 'pointer',
                  fontSize: 14,
                  fontWeight: activeCategory === '__favorites__' ? 600 : 500,
                  backgroundColor: activeCategory === '__favorites__' ? '#FF7043' : 'transparent',
                  color: activeCategory === '__favorites__' ? '#FFFFFF' : '#424242',
                  transition: 'background-color .2s, color .2s',
                }}
                onMouseEnter={(e) => {
                  if (activeCategory !== '__favorites__')
                    (e.currentTarget as HTMLDivElement).style.backgroundColor = '#FFF8E1';
                }}
                onMouseLeave={(e) => {
                  if (activeCategory !== '__favorites__')
                    (e.currentTarget as HTMLDivElement).style.backgroundColor = 'transparent';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Heart
                    size={16}
                    color={activeCategory === '__favorites__' ? '#FFFFFF' : '#E53935'}
                    fill={activeCategory === '__favorites__' ? '#FFFFFF' : '#E53935'}
                  />
                  我的收藏
                </div>
                {favoritesCount > 0 && (
                  <span
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: '50%',
                      backgroundColor: activeCategory === '__favorites__' ? '#FFFFFF' : '#E53935',
                      color: activeCategory === '__favorites__' ? '#E53935' : '#FFFFFF',
                      fontSize: 11,
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {favoritesCount}
                  </span>
                )}
              </div>

              <div style={{ height: 12 }} />

              {categories.map((cat) => (
                <div key={cat}>
                  <div
                    onClick={() => toggleCategory(cat)}
                    style={{
                      height: 42,
                      borderRadius: 8,
                      display: 'flex',
                      alignItems: 'center',
                      padding: '0 14px',
                      cursor: 'pointer',
                      fontSize: 14,
                      fontWeight: 600,
                      color: '#424242',
                      userSelect: 'none',
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLDivElement).style.backgroundColor = '#FFF8E1';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLDivElement).style.backgroundColor = 'transparent';
                    }}
                  >
                    {expandedCategories.has(cat) ? (
                      <ChevronDown size={16} style={{ marginRight: 6 }} />
                    ) : (
                      <ChevronRight size={16} style={{ marginRight: 6 }} />
                    )}
                    📂 {cat}
                  </div>
                  <div
                    style={{
                      overflow: 'hidden',
                      maxHeight: expandedCategories.has(cat) ? '500px' : 0,
                      transition: 'max-height 0.3s ease',
                      paddingLeft: 22,
                    }}
                  >
                    <div
                      onClick={() => {
                        setActiveCategory(cat);
                        if (window.innerWidth < 768) {
                          setIsSidebarOpen(false);
                          setMobileMenuOpen(false);
                        }
                      }}
                      style={{
                        height: 42,
                        borderRadius: 8,
                        display: 'flex',
                        alignItems: 'center',
                        padding: '0 14px',
                        cursor: 'pointer',
                        fontSize: 14,
                        fontWeight: activeCategory === cat ? 600 : 500,
                        backgroundColor: activeCategory === cat ? '#FF7043' : 'transparent',
                        color: activeCategory === cat ? '#FFFFFF' : '#616161',
                        transition: 'background-color .2s, color .2s',
                      }}
                      onMouseEnter={(e) => {
                        if (activeCategory !== cat)
                          (e.currentTarget as HTMLDivElement).style.backgroundColor = '#FFF8E1';
                      }}
                      onMouseLeave={(e) => {
                        if (activeCategory !== cat)
                          (e.currentTarget as HTMLDivElement).style.backgroundColor = 'transparent';
                      }}
                    >
                      🍴 {cat}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </aside>

          {mobileMenuOpen && window.innerWidth < 768 && (
            <div
              onClick={() => {
                setIsSidebarOpen(false);
                setMobileMenuOpen(false);
              }}
              style={{
                position: 'fixed',
                inset: 0,
                backgroundColor: 'rgba(0,0,0,.4)',
                zIndex: 40,
                top: 64,
              }}
            />
          )}

          <main
            style={{
              flex: 1,
              padding: 24,
              minWidth: 0,
              paddingRight: selectedRecipe && window.innerWidth >= 768 ? 424 : 24,
              transition: 'padding-right .3s',
            }}
          >
            {filteredRecipes.length === 0 ? (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '80px 20px',
                  textAlign: 'center',
                }}
              >
                <ChefHat size={64} color="#BDBDBD" style={{ marginBottom: 16 }} />
                <p style={{ fontSize: 18, color: '#757575', margin: '0 0 8px 0', fontWeight: 600 }}>
                  {searchQuery ? '没有找到匹配的食谱' : '暂无食谱'}
                </p>
                <p style={{ fontSize: 14, color: '#9E9E9E', margin: 0 }}>
                  {searchQuery ? '试试换个关键词搜索吧' : '点击右上角按钮创建你的第一道食谱！'}
                </p>
              </div>
            ) : (
              <div className="recipe-grid">{filteredRecipes.map((r) => (
                <RecipeCard
                  key={r.id}
                  recipe={r}
                  onClick={() => setSelectedRecipe(r)}
                  onToggleFavorite={handleToggleFavorite}
                  isNew={r.id === newRecipeId}
                />
              ))}</div>
            )}
          </main>
        </div>

        {selectedRecipe && (
          <div
            className="detail-panel"
            style={{
              position: 'fixed',
              right: 0,
              top: 0,
              width: window.innerWidth < 768 ? '100%' : 400,
              height: '100vh',
              backgroundColor: '#FFFFFF',
              zIndex: 40,
              boxShadow: '-4px 0 20px rgba(0,0,0,.1)',
              borderRadius: window.innerWidth < 768 ? 0 : '16px 0 0 16px',
              overflowY: 'auto',
              transform: 'translateX(0)',
              animation: 'slideInRight .3s ease',
            }}
          >
            <div style={{ position: 'relative' }}>
              <img
                src={selectedRecipe.image}
                alt={selectedRecipe.name}
                style={{ width: '100%', height: 220, objectFit: 'cover', display: 'block' }}
              />
              <button
                onClick={() => setSelectedRecipe(null)}
                style={{
                  position: 'absolute',
                  top: 16,
                  right: 16,
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  border: 'none',
                  backgroundColor: 'rgba(0,0,0,.5)',
                  color: '#FFFFFF',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={18} />
              </button>
              <button
                onClick={() => handleToggleFavorite(selectedRecipe.id, !selectedRecipe.isFavorite)}
                style={{
                  position: 'absolute',
                  top: 16,
                  left: 16,
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  border: 'none',
                  backgroundColor: 'rgba(255,255,255,.95)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Heart
                  size={18}
                  color={selectedRecipe.isFavorite ? '#E53935' : '#9E9E9E'}
                  fill={selectedRecipe.isFavorite ? '#E53935' : 'none'}
                />
              </button>
            </div>
            <div style={{ padding: 24 }}>
              <h2
                style={{
                  margin: '0 0 12px 0',
                  fontSize: 22,
                  fontWeight: 700,
                  color: '#3E2723',
                  fontFamily: "'Noto Serif SC', serif",
                }}
              >
                {selectedRecipe.name}
              </h2>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingBottom: 16,
                  borderBottom: '1px solid #F0F0F0',
                  marginBottom: 20,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star
                      key={i}
                      size={16}
                      color={i < selectedRecipe.difficulty ? '#FFB300' : '#E0E0E0'}
                      fill={i < selectedRecipe.difficulty ? '#FFB300' : 'none'}
                    />
                  ))}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#757575', fontSize: 14 }}>
                  <Clock size={16} />
                  {selectedRecipe.cookTime}分钟
                </div>
                <div
                  style={{
                    padding: '4px 12px',
                    backgroundColor: '#FFF3E0',
                    color: '#FF7043',
                    borderRadius: 12,
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  {selectedRecipe.category}
                </div>
              </div>

              <div style={{ marginBottom: 24 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#3E2723', margin: '0 0 12px 0' }}>
                  🥕 食材清单
                </h3>
                <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                  {selectedRecipe.ingredients.map((ing, idx) => (
                    <li
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '8px 0',
                        borderBottom: '1px dashed #F0F0F0',
                        fontSize: 14,
                        color: '#424242',
                      }}
                    >
                      <span
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          backgroundColor: '#FF7043',
                          marginRight: 10,
                        }}
                      />
                      <span style={{ flex: 1 }}>{ing.name}</span>
                      <span style={{ color: '#757575' }}>{ing.amount}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#3E2723', margin: '0 0 12px 0' }}>
                  👨‍🍳 步骤详解
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {selectedRecipe.steps.map((step, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: 12 }}>
                      <div
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg,#FF8A65,#FF7043)',
                          color: '#FFFFFF',
                          fontSize: 13,
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        {idx + 1}
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: '0 0 8px 0', fontSize: 14, color: '#424242', lineHeight: 1.6 }}>
                          {step.description}
                        </p>
                        {step.image && (
                          <img
                            src={step.image}
                            alt={`步骤${idx + 1}`}
                            style={{ width: '100%', maxHeight: 180, objectFit: 'cover', borderRadius: 8 }}
                          />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {isModalOpen && (
          <div
            className="modal-overlay"
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0,0,0,.5)',
              zIndex: 100,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 16,
            }}
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setIsModalOpen(false);
                resetForm();
              }
            }}
          >
            <div
              className="modal-content"
              style={{
                width: window.innerWidth < 768 ? 'calc(100% - 32px)' : 600,
                maxHeight: '90vh',
                backgroundColor: '#FFFFFF',
                borderRadius: 16,
                padding: 24,
                overflowY: 'auto',
                animation: 'modalScaleIn .3s cubic-bezier(.34,1.56,.64,1)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 20,
                }}
              >
                <h2
                  style={{
                    margin: 0,
                    fontSize: 20,
                    fontWeight: 700,
                    color: '#3E2723',
                    fontFamily: "'Noto Serif SC', serif",
                  }}
                >
                  ✨ 创建新食谱
                </h2>
                <button
                  onClick={() => {
                    setIsModalOpen(false);
                    resetForm();
                  }}
                  style={{
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer',
                    padding: 6,
                    borderRadius: 6,
                  }}
                >
                  <X size={20} color="#757575" />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#424242', marginBottom: 6 }}>
                    菜名 <span style={{ color: '#E53935' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="例如：红烧肉"
                    style={{
                      width: '100%',
                      height: 42,
                      borderRadius: 8,
                      border: '1px solid #E0E0E0',
                      padding: '0 14px',
                      boxSizing: 'border-box',
                      fontSize: 14,
                      outline: 'none',
                      transition: 'border-color .2s',
                    }}
                    onFocus={(e) => ((e.currentTarget as HTMLInputElement).style.borderColor = '#FF7043')}
                    onBlur={(e) => ((e.currentTarget as HTMLInputElement).style.borderColor = '#E0E0E0')}
                  />
                </div>

                <div style={{ display: 'flex', gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#424242', marginBottom: 6 }}>
                      难度
                    </label>
                    <select
                      value={formDifficulty}
                      onChange={(e) => setFormDifficulty(Number(e.target.value))}
                      style={{
                        width: '100%',
                        height: 42,
                        borderRadius: 8,
                        border: '1px solid #E0E0E0',
                        padding: '0 14px',
                        boxSizing: 'border-box',
                        fontSize: 14,
                        outline: 'none',
                        backgroundColor: '#FFFFFF',
                      }}
                    >
                      {[1, 2, 3, 4, 5].map((n) => (
                        <option key={n} value={n}>
                          {'⭐'.repeat(n)} {['入门', '简单', '中等', '困难', '大师'][n - 1]}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#424242', marginBottom: 6 }}>
                      烹饪时间（分钟）
                    </label>
                    <input
                      type="number"
                      value={formCookTime}
                      onChange={(e) => setFormCookTime(Number(e.target.value))}
                      min={1}
                      style={{
                        width: '100%',
                        height: 42,
                        borderRadius: 8,
                        border: '1px solid #E0E0E0',
                        padding: '0 14px',
                        boxSizing: 'border-box',
                        fontSize: 14,
                        outline: 'none',
                      }}
                      onFocus={(e) => ((e.currentTarget as HTMLInputElement).style.borderColor = '#FF7043')}
                      onBlur={(e) => ((e.currentTarget as HTMLInputElement).style.borderColor = '#E0E0E0')}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#424242', marginBottom: 6 }}>
                    分类
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    style={{
                      width: '100%',
                      height: 42,
                      borderRadius: 8,
                      border: '1px solid #E0E0E0',
                      padding: '0 14px',
                      boxSizing: 'border-box',
                      fontSize: 14,
                      outline: 'none',
                      backgroundColor: '#FFFFFF',
                    }}
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#424242', marginBottom: 6 }}>
                    封面图片
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageFile(file);
                    }}
                  />
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOver(true);
                    }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    className="upload-zone"
                    style={{
                      width: 280,
                      height: 180,
                      border: `2px dashed ${dragOver ? '#FF7043' : '#E0E0E0'}`,
                      borderRadius: 8,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      backgroundColor: dragOver ? 'rgba(255,112,67,.05)' : '#FAFAFA',
                      transition: 'all .2s',
                      overflow: 'hidden',
                      position: 'relative',
                    }}
                  >
                    {formImage ? (
                      <>
                        <img
                          src={formImage}
                          alt="预览"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                        <div
                          style={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            backgroundColor: 'rgba(0,0,0,.5)',
                            color: '#FFFFFF',
                            textAlign: 'center',
                            padding: '6px 0',
                            fontSize: 12,
                          }}
                        >
                          点击更换图片
                        </div>
                      </>
                    ) : (
                      <>
                        <Upload size={32} color={dragOver ? '#FF7043' : '#9E9E9E'} />
                        <p
                          style={{
                            marginTop: 10,
                            fontSize: 13,
                            color: dragOver ? '#FF7043' : '#757575',
                            margin: 0,
                          }}
                        >
                          点击或拖拽上传图片
                        </p>
                      </>
                    )}
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <label style={{ fontSize: 14, fontWeight: 600, color: '#424242' }}>
                      🥕 食材列表 <span style={{ color: '#E53935' }}>*</span>
                    </label>
                    <button
                      onClick={addIngredient}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        border: 'none',
                        background: 'none',
                        color: '#FF7043',
                        cursor: 'pointer',
                        fontSize: 13,
                        fontWeight: 600,
                      }}
                    >
                      <Plus size={14} /> 添加
                    </button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {formIngredients.map((ing, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          gap: 8,
                          animation: 'fadeIn .2s ease',
                        }}
                      >
                        <input
                          type="text"
                          value={ing.name}
                          onChange={(e) => updateIngredient(idx, 'name', e.target.value)}
                          placeholder="食材名称"
                          style={{
                            flex: 1,
                            height: 38,
                            borderRadius: 8,
                            border: '1px solid #E0E0E0',
                            padding: '0 12px',
                            fontSize: 13,
                            outline: 'none',
                          }}
                          onFocus={(e) => ((e.currentTarget as HTMLInputElement).style.borderColor = '#FF7043')}
                          onBlur={(e) => ((e.currentTarget as HTMLInputElement).style.borderColor = '#E0E0E0')}
                        />
                        <input
                          type="text"
                          value={ing.amount}
                          onChange={(e) => updateIngredient(idx, 'amount', e.target.value)}
                          placeholder="用量"
                          style={{
                            width: 100,
                            height: 38,
                            borderRadius: 8,
                            border: '1px solid #E0E0E0',
                            padding: '0 12px',
                            fontSize: 13,
                            outline: 'none',
                          }}
                          onFocus={(e) => ((e.currentTarget as HTMLInputElement).style.borderColor = '#FF7043')}
                          onBlur={(e) => ((e.currentTarget as HTMLInputElement).style.borderColor = '#E0E0E0')}
                        />
                        {formIngredients.length > 1 && (
                          <button
                            onClick={() => removeIngredient(idx)}
                            style={{
                              width: 38,
                              height: 38,
                              borderRadius: 8,
                              border: 'none',
                              backgroundColor: '#FFEBEE',
                              color: '#E53935',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <label style={{ fontSize: 14, fontWeight: 600, color: '#424242' }}>
                      👨‍🍳 步骤详解 <span style={{ color: '#E53935' }}>*</span>
                    </label>
                    <button
                      onClick={addStep}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        border: 'none',
                        background: 'none',
                        color: '#FF7043',
                        cursor: 'pointer',
                        fontSize: 13,
                        fontWeight: 600,
                      }}
                    >
                      <Plus size={14} /> 添加步骤
                    </button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {formSteps.map((step, idx) => (
                      <div
                        key={idx}
                        style={{
                          animation: 'slideDown .2s ease',
                        }}
                      >
                        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                          <div
                            style={{
                              width: 28,
                              height: 28,
                              borderRadius: '50%',
                              background: 'linear-gradient(135deg,#FF8A65,#FF7043)',
                              color: '#FFFFFF',
                              fontSize: 13,
                              fontWeight: 700,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                              marginTop: 4,
                            }}
                          >
                            {idx + 1}
                          </div>
                          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                            <textarea
                              value={step.description}
                              onChange={(e) => updateStep(idx, 'description', e.target.value)}
                              placeholder="描述这个步骤..."
                              rows={3}
                              style={{
                                width: '100%',
                                borderRadius: 8,
                                border: '1px solid #E0E0E0',
                                padding: 10,
                                fontSize: 13,
                                outline: 'none',
                                resize: 'vertical',
                                boxSizing: 'border-box',
                                fontFamily: 'inherit',
                              }}
                              onFocus={(e) => ((e.currentTarget as HTMLTextAreaElement).style.borderColor = '#FF7043')}
                              onBlur={(e) => ((e.currentTarget as HTMLTextAreaElement).style.borderColor = '#E0E0E0')}
                            />
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <input
                                ref={(el) => {
                                  stepFileRefs.current[idx] = el;
                                }}
                                type="file"
                                accept="image/*"
                                style={{ display: 'none' }}
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleStepImageFile(idx, file);
                                }}
                              />
                              <button
                                onClick={() => stepFileRefs.current[idx]?.click()}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 4,
                                  height: 32,
                                  padding: '0 12px',
                                  borderRadius: 6,
                                  border: '1px solid #E0E0E0',
                                  backgroundColor: step.image ? '#E8F5E9' : '#FAFAFA',
                                  color: step.image ? '#43A047' : '#757575',
                                  cursor: 'pointer',
                                  fontSize: 12,
                                }}
                              >
                                <ImageIcon size={14} />
                                {step.image ? '已添加图片' : '添加图片（可选）'}
                              </button>
                              {formSteps.length > 1 && (
                                <button
                                  onClick={() => removeStep(idx)}
                                  style={{
                                    width: 32,
                                    height: 32,
                                    borderRadius: 6,
                                    border: 'none',
                                    backgroundColor: '#FFEBEE',
                                    color: '#E53935',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                  }}
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </div>
                            {step.image && (
                              <img
                                src={step.image}
                                alt={`步骤${idx + 1}预览`}
                                style={{ width: 160, height: 100, objectFit: 'cover', borderRadius: 6 }}
                              />
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  gap: 12,
                  justifyContent: 'flex-end',
                  marginTop: 28,
                  paddingTop: 16,
                  borderTop: '1px solid #F0F0F0',
                }}
              >
                <button
                  onClick={() => {
                    setIsModalOpen(false);
                    resetForm();
                  }}
                  style={{
                    height: 42,
                    padding: '0 24px',
                    borderRadius: 21,
                    border: '1px solid #E0E0E0',
                    backgroundColor: '#FFFFFF',
                    color: '#424242',
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  取消
                </button>
                <button
                  onClick={handleSubmit}
                  style={{
                    height: 42,
                    padding: '0 28px',
                    borderRadius: 21,
                    border: 'none',
                    background: 'linear-gradient(135deg,#FF8A65,#FF7043)',
                    color: '#FFFFFF',
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(255,112,67,.35)',
                    transition: 'filter .2s',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.filter = 'brightness(1.1)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.filter = 'brightness(1)';
                  }}
                >
                  提交保存
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
        @keyframes modalScaleIn {
          from {
            transform: scale(0.9);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes uploadFlash {
          0%, 100% { background-color: #FAFAFA; }
          50% { background-color: rgba(255,112,67,.08); }
        }
        .upload-zone.dragover {
          animation: uploadFlash .6s ease-in-out infinite;
        }
        .recipe-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, 280px);
          gap: 24px;
        }
        @media (max-width: 767px) {
          .recipe-grid {
            grid-template-columns: 1fr;
          }
          .hamburger-btn {
            display: block !important;
          }
          .sidebar-panel {
            width: 80vw !important;
            min-width: 0 !important;
          }
        }
      `}</style>
    </>
  );
};

export default HomePage;
