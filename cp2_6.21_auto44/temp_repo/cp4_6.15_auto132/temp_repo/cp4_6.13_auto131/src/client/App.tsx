import React, { useState, useCallback, useEffect } from 'react';
import IngredientInput from './components/IngredientInput';
import RecipeCard, { Recipe } from './components/RecipeCard';
import MealPlanView, { DayPlan, LoadingSpinner } from './components/MealPlanView';

interface Preferences {
  vegetarian: boolean;
  lowFat: boolean;
  highProtein: boolean;
  glutenFree: boolean;
}

interface Allergens {
  peanut: boolean;
  seafood: boolean;
  dairy: boolean;
}

const App: React.FC = () => {
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [selectedRecipes, setSelectedRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [recipesFading, setRecipesFading] = useState(false);
  const [mealPlan, setMealPlan] = useState<DayPlan[] | null>(null);
  const [generatingPlan, setGeneratingPlan] = useState(false);
  const [replacingMeal, setReplacingMeal] = useState<{ day: number; meal: number } | null>(null);

  const [preferences, setPreferences] = useState<Preferences>({
    vegetarian: false,
    lowFat: false,
    highProtein: false,
    glutenFree: false
  });

  const [allergens, setAllergens] = useState<Allergens>({
    peanut: false,
    seafood: false,
    dairy: false
  });

  const fetchRecommendations = useCallback(async () => {
    if (ingredients.length < 3) {
      alert('请至少添加 3 种食材');
      return;
    }
    setLoading(true);
    setRecipesFading(true);
    try {
      await new Promise(r => setTimeout(r, 250));
      const res = await fetch('/api/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ingredients, preferences, allergens })
      });
      const data = await res.json();
      setRecipes(data || []);
    } finally {
      setRecipesFading(false);
      setLoading(false);
    }
  }, [ingredients, preferences, allergens]);

  useEffect(() => {
    if (recipes.length === 0) return;
    let active = true;
    (async () => {
      setRecipesFading(true);
      await new Promise(r => setTimeout(r, 200));
      if (!active) return;
      const res = await fetch('/api/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ingredients, preferences, allergens })
      });
      const data = await res.json();
      setRecipes(data || []);
      setRecipesFading(false);
    })();
    return () => { active = false; };
  }, [preferences, allergens]);

  const addIngredient = (ing: string) => setIngredients(prev => [...prev, ing]);
  const removeIngredient = (ing: string) => setIngredients(prev => prev.filter(i => i !== ing));

  const toggleSelected = (recipe: Recipe) => {
    setSelectedRecipes(prev => {
      const exists = prev.find(r => r.id === recipe.id);
      if (exists) return prev.filter(r => r.id !== recipe.id);
      return [...prev, recipe];
    });
  };

  const generatePlan = async () => {
    setGeneratingPlan(true);
    try {
      const res = await fetch('/api/generate-meal-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selectedRecipes: selectedRecipes.map(r => r.id),
          minCalories: 500,
          maxCalories: 800
        })
      });
      const data = await res.json();
      setMealPlan(data.plan || null);
    } finally {
      setGeneratingPlan(false);
    }
  };

  const replaceMeal = async (dayIndex: number, mealIndex: number) => {
    if (!mealPlan) return;
    setReplacingMeal({ day: dayIndex, meal: mealIndex });
    try {
      const res = await fetch('/api/replace-meal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dayIndex, mealIndex, currentPlan: mealPlan, minCalories: 500, maxCalories: 800 })
      });
      const data = await res.json();
      if (data.recipe) {
        const newPlan = mealPlan.map((day, d) => {
          if (d !== dayIndex) return day;
          return {
            ...day,
            meals: day.meals.map((m, i) => i === mealIndex ? { ...m, recipe: data.recipe } : m)
          };
        });
        setMealPlan(newPlan);
      }
    } finally {
      setTimeout(() => setReplacingMeal(null), 400);
    }
  };

  const sharePlan = () => {
    if (!mealPlan) return;
    const text = mealPlan.map(day => {
      const meals = day.meals.map(m => `  ${m.meal}：${m.recipe.name}（${m.recipe.calories}千卡）`).join('\n');
      return `【${day.day}】\n${meals}`;
    }).join('\n\n');
    if (navigator.share) {
      navigator.share({ title: '我的一周餐单', text }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text);
      alert('餐单已复制到剪贴板！');
    }
  };

  const prefItems: Array<{ key: keyof Preferences; label: string; dot: string }> = [
    { key: 'vegetarian', label: '素食', dot: '#8b7ec8' },
    { key: 'lowFat', label: '低脂', dot: '#7e93c8' },
    { key: 'highProtein', label: '高蛋白', dot: '#9d7ec8' },
    { key: 'glutenFree', label: '无麸质', dot: '#c87ea8' }
  ];

  const allerItems: Array<{ key: keyof Allergens; label: string; dot: string }> = [
    { key: 'peanut', label: '花生', dot: '#c87e7e' },
    { key: 'seafood', label: '海鲜', dot: '#c89d7e' },
    { key: 'dairy', label: '乳制品', dot: '#d4947a' }
  ];

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #faf6f2 0%, #f5efe8 100%)',
      color: '#2a1a0a'
    }}>
      <header style={{
        background: 'linear-gradient(135deg, #b08968 0%, #8b6b4f 100%)',
        color: 'white',
        padding: '28px 20px 24px',
        boxShadow: '0 4px 20px rgba(139,107,79,0.2)'
      }}>
        <div style={{ maxWidth: 1180, margin: '0 auto' }}>
          <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: 1, marginBottom: 6 }}>
            🍳 智能食谱推荐 · 一周餐单助手
          </div>
          <div style={{ fontSize: 14, opacity: 0.92 }}>
            输入家中食材 · 匹配美味食谱 · 生成营养均衡的七天餐单
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 1180, margin: '0 auto', padding: '28px 20px 60px' }}>
        <section style={sectionStyle}>
          <h2 style={h2Style}>🥬 选择您的食材</h2>
          <p style={{ fontSize: 13, color: '#8a7a6a', marginTop: -4, marginBottom: 16 }}>
            至少添加 3 种食材，可从下拉列表选择或手动输入
          </p>
          <IngredientInput ingredients={ingredients} onAdd={addIngredient} onRemove={removeIngredient} />

          <div style={{ marginTop: 22 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#5a4a3a', marginBottom: 10 }}>
              💜 饮食偏好
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {prefItems.map(p => {
                const on = preferences[p.key];
                return (
                  <button
                    key={p.key}
                    onClick={() => setPreferences(prev => ({ ...prev, [p.key]: !prev[p.key] }))}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '8px 14px',
                      borderRadius: 999,
                      border: '1.5px solid ' + (on ? '#c3b4f0' : '#e0d8f0'),
                      background: on ? '#efe9fb' : '#faf8ff',
                      color: '#5a4888',
                      fontSize: 13,
                      fontWeight: on ? 600 : 500,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      transform: on ? 'scale(1)' : 'scale(0.98)',
                      boxShadow: on ? '0 2px 8px rgba(143,122,200,0.25)' : 'none'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.04)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = on ? 'scale(1)' : 'scale(0.98)'}
                  >
                    <span style={{
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      background: on ? p.dot : 'transparent',
                      border: on ? 'none' : `2px solid ${p.dot}80`,
                      boxShadow: on ? `0 0 6px ${p.dot}80` : 'none',
                      transition: 'all 0.2s'
                    }} />
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ marginTop: 18 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#5a4a3a', marginBottom: 10 }}>
              ❤️ 过敏原（避免）
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {allerItems.map(a => {
                const on = allergens[a.key];
                return (
                  <button
                    key={a.key}
                    onClick={() => setAllergens(prev => ({ ...prev, [a.key]: !prev[a.key] }))}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '8px 14px',
                      borderRadius: 999,
                      border: '1.5px solid ' + (on ? '#f0b4b4' : '#f0d8d8'),
                      background: on ? '#fbe9e9' : '#fff8f8',
                      color: '#884848',
                      fontSize: 13,
                      fontWeight: on ? 600 : 500,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      transform: on ? 'scale(1)' : 'scale(0.98)',
                      boxShadow: on ? '0 2px 8px rgba(200,126,126,0.25)' : 'none'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.04)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = on ? 'scale(1)' : 'scale(0.98)'}
                  >
                    <span style={{
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      background: on ? a.dot : 'transparent',
                      border: on ? 'none' : `2px solid ${a.dot}80`,
                      boxShadow: on ? `0 0 6px ${a.dot}80` : 'none',
                      transition: 'all 0.2s'
                    }} />
                    {a.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ marginTop: 24, textAlign: 'center' }}>
            <button
              onClick={fetchRecommendations}
              disabled={loading}
              style={{
                padding: '14px 40px',
                fontSize: 16,
                fontWeight: 700,
                color: 'white',
                background: 'linear-gradient(135deg, #e27d60, #c15a3c)',
                border: 'none',
                borderRadius: 14,
                cursor: loading ? 'wait' : 'pointer',
                transition: 'all 0.2s',
                boxShadow: '0 4px 16px rgba(226,125,96,0.35)'
              }}
              onMouseEnter={(e) => { if (!loading) { e.currentTarget.style.transform = 'scale(1.06)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(226,125,96,0.45)'; } }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(226,125,96,0.35)'; }}
            >
              {loading ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}><LoadingSpinner size={18} color="#fff" /> 正在匹配美味...</span> : '🔎 搜索推荐食谱'}
            </button>
          </div>
        </section>

        <section style={sectionStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
            <h2 style={{ ...h2Style, margin: 0 }}>
              🍽️ 推荐食谱 {recipes.length > 0 && <span style={{ fontSize: 14, color: '#8a7a6a', fontWeight: 500, marginLeft: 8 }}>共 {recipes.length} 道</span>}
            </h2>
            {selectedRecipes.length > 0 && (
              <div style={{ fontSize: 13, color: '#5a4a3a', background: '#f0f8f2', padding: '6px 14px', borderRadius: 999, border: '1px solid #c8e6d5' }}>
                ✓ 已选 {selectedRecipes.length} 道加入餐单
              </div>
            )}
          </div>

          {!loading && recipes.length === 0 && (
            <div style={{ textAlign: 'center', padding: '48px 20px', color: '#8a7a6a' }}>
              <div style={{ fontSize: 44, marginBottom: 10 }}>🧑‍🍳</div>
              <div style={{ fontSize: 14 }}>添加食材后点击搜索，为您匹配最合适的食谱</div>
            </div>
          )}

          <div style={{
            opacity: recipesFading ? 0 : 1,
            transform: recipesFading ? 'translateY(4px)' : 'translateY(0)',
            transition: 'opacity 0.3s ease, transform 0.3s ease'
          }}>
            {recipes.length > 0 && (
              <div className="recipe-grid">
                {recipes.map((r, i) => (
                  <RecipeCard
                    key={r.id}
                    recipe={r}
                    index={i}
                    onAddToPlan={toggleSelected}
                    isInPlan={!!selectedRecipes.find(s => s.id === r.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>📅 一周餐单</h2>
          <MealPlanView
            plan={mealPlan}
            generating={generatingPlan}
            selectedRecipesCount={selectedRecipes.length}
            onGenerate={generatePlan}
            onReplace={replaceMeal}
            onShare={sharePlan}
            replacingMeal={replacingMeal}
          />
        </section>
      </main>

      <footer style={{ textAlign: 'center', padding: '20px', color: '#a09080', fontSize: 12 }}>
        🌿 Smart Recipe Planner · 为您搭配每一顿美味
      </footer>
    </div>
  );
};

const sectionStyle: React.CSSProperties = {
  background: '#fffcfa',
  borderRadius: 20,
  padding: '24px 26px',
  marginBottom: 24,
  boxShadow: '0 2px 16px rgba(139,107,79,0.06)',
  border: '1px solid #f0e8de'
};

const h2Style: React.CSSProperties = {
  fontSize: 20,
  fontWeight: 700,
  color: '#3a2a1a',
  marginBottom: 18
};

export default App;

(() => {
  const style = document.createElement('style');
  style.textContent = `
    .recipe-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
    }
    @media (max-width: 960px) {
      .recipe-grid { grid-template-columns: repeat(2, 1fr); }
    }
    @media (max-width: 640px) {
      .recipe-grid { grid-template-columns: 1fr; }
    }
  `;
  document.head.appendChild(style);
})();
