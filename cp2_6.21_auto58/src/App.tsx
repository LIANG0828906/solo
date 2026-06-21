import React, { useState, useEffect, useMemo } from 'react';
import { Routes, Route, Link, useParams, useNavigate, useLocation } from 'react-router-dom';
import { useStore } from './store';
import type { Recipe, Ingredient, InventoryItem, ShoppingItem } from './store';

const COLORS = {
  bg: '#F5E6CC',
  text: '#4A2F1A',
  primary: '#4A2F1A',
  primaryDark: '#3A2010',
  white: '#FFFFFF',
  cardBg: '#FFF8EC',
  border: '#D4B896',
};

const buttonStyle: React.CSSProperties = {
  backgroundColor: COLORS.primary,
  color: COLORS.white,
  border: 'none',
  padding: '10px 20px',
  borderRadius: '8px',
  cursor: 'pointer',
  fontFamily: "'Quicksand', sans-serif",
  fontSize: '14px',
  fontWeight: 600,
  transition: 'background-color 0.2s',
};

const inputStyle: React.CSSProperties = {
  padding: '10px 14px',
  border: `2px solid ${COLORS.border}`,
  borderRadius: '8px',
  fontFamily: "'Quicksand', sans-serif",
  fontSize: '14px',
  backgroundColor: COLORS.white,
  color: COLORS.text,
  outline: 'none',
};

const cardStyle: React.CSSProperties = {
  backgroundColor: COLORS.cardBg,
  borderRadius: '12px',
  padding: '20px',
  boxShadow: '0 2px 8px rgba(74, 47, 26, 0.1)',
};

function IngredientInput({
  ingredients,
  onChange,
  ingredientNames,
}: {
  ingredients: Ingredient[];
  onChange: (ings: Ingredient[]) => void;
  ingredientNames: string[];
}) {
  const updateIng = (idx: number, field: keyof Ingredient, value: any) => {
    const newIngs = [...ingredients];
    newIngs[idx] = { ...newIngs[idx], [field]: value };
    onChange(newIngs);
  };
  const removeIng = (idx: number) => onChange(ingredients.filter((_, i) => i !== idx));
  const addIng = () => onChange([...ingredients, { name: '', quantity: 1, unit: '个', category: '其他' }]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <label style={{ fontWeight: 600, color: COLORS.text }}>食材列表</label>
      {ingredients.map((ing, idx) => (
        <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <input list="ing-names" placeholder="名称" value={ing.name} onChange={e => updateIng(idx, 'name', e.target.value)}
            style={{ ...inputStyle, flex: '1 1 120px', minWidth: '100px' }} />
          <datalist id="ing-names">{ingredientNames.map(n => <option key={n} value={n} />)}</datalist>
          <input type="number" placeholder="数量" value={ing.quantity} onChange={e => updateIng(idx, 'quantity', Number(e.target.value))}
            style={{ ...inputStyle, width: '80px' }} min="0" step="0.1" />
          <input placeholder="单位" value={ing.unit} onChange={e => updateIng(idx, 'unit', e.target.value)}
            style={{ ...inputStyle, width: '70px' }} />
          <select value={ing.category || '其他'} onChange={e => updateIng(idx, 'category', e.target.value)}
            style={{ ...inputStyle, width: '90px' }}>
            <option value="蔬菜">蔬菜</option><option value="肉类">肉类</option>
            <option value="调味料">调味料</option><option value="其他">其他</option>
          </select>
          <button onClick={() => removeIng(idx)} style={{ ...buttonStyle, backgroundColor: '#8B0000', padding: '10px 14px' }}>×</button>
        </div>
      ))}
      <button onClick={addIng} style={{ ...buttonStyle, alignSelf: 'flex-start' }}>+ 添加食材</button>
    </div>
  );
}

function RecipeCard({ recipe, selected, onToggle }: { recipe: Recipe; selected: boolean; onToggle: (id: number) => void }) {
  const nav = useNavigate();
  return (
    <div
      style={{
        ...cardStyle,
        cursor: 'pointer',
        border: selected ? `3px solid ${COLORS.primary}` : '3px solid transparent',
        transform: selected ? 'translateY(-4px)' : 'none',
        transition: 'all 0.2s',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}
      onClick={() => nav(`/recipes/${recipe.id}`)}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '10px' }}>
        <h3 style={{ margin: 0, color: COLORS.text, fontSize: '18px', flex: 1 }}>{recipe.name}</h3>
        <input
          type="checkbox"
          checked={selected}
          onChange={e => { e.stopPropagation(); onToggle(recipe.id); }}
          style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: COLORS.primary }}
          onClick={e => e.stopPropagation()}
        />
      </div>
      {recipe.image && (
        <img src={recipe.image} alt={recipe.name}
          style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: '8px', marginBottom: '10px' }} />
      )}
      <div style={{ color: '#6B4423', fontSize: '14px', marginTop: 'auto' }}>
        <div>⏱ 烹饪时间: {recipe.cookingTime} 分钟</div>
        <div>🍽 份量: {recipe.servings} 人份</div>
        <div>🥗 食材: {recipe.ingredients.length} 种</div>
      </div>
    </div>
  );
}

function HomePage() {
  const { recipes, selectedRecipeIds, fetchRecipes, toggleRecipeSelection, clearRecipeSelection, generateShoppingListAction, loading } = useStore();
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'asc' | 'desc'>('asc');
  const nav = useNavigate();

  useEffect(() => { fetchRecipes({ search, sortBy: 'cookingTime', order: sortBy }); }, [search, sortBy]);

  const displayRecipes = useMemo(() => recipes, [recipes]);

  const handleGen = async () => {
    if (selectedRecipeIds.length === 0) return;
    await generateShoppingListAction(selectedRecipeIds);
    clearRecipeSelection();
    nav('/shopping');
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', marginBottom: '24px', ...cardStyle }}>
        <button onClick={handleGen} disabled={selectedRecipeIds.length === 0 || loading}
          style={{
            ...buttonStyle,
            backgroundColor: selectedRecipeIds.length > 0 ? '#2E7D32' : '#999',
            cursor: selectedRecipeIds.length > 0 ? 'pointer' : 'not-allowed',
            fontSize: '16px',
            padding: '12px 24px',
          }}
          onMouseEnter={e => { if (selectedRecipeIds.length > 0) e.currentTarget.style.backgroundColor = '#1B5E20'; }}
          onMouseLeave={e => { if (selectedRecipeIds.length > 0) e.currentTarget.style.backgroundColor = '#2E7D32'; }}
        >
          🛒 生成购物清单 {selectedRecipeIds.length > 0 && `(${selectedRecipeIds.length})`}
        </button>
        <input placeholder="🔍 搜索菜名..." value={search} onChange={e => setSearch(e.target.value)}
          style={{ ...inputStyle, flex: '1 1 200px' }} />
        <select value={sortBy} onChange={e => setSortBy(e.target.value as 'asc' | 'desc')} style={{ ...inputStyle, minWidth: '160px' }}>
          <option value="asc">⏱ 烹饪时间 ↑ 升序</option>
          <option value="desc">⏱ 烹饪时间 ↓ 降序</option>
        </select>
      </div>
      {loading && <div style={{ textAlign: 'center', padding: '40px', color: COLORS.text }}>加载中...</div>}
      {!loading && displayRecipes.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px', color: COLORS.text, ...cardStyle }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🍳</div>
          <div style={{ fontSize: '18px' }}>暂无菜谱，快去添加一些吧！</div>
          <Link to="/recipes" style={{ ...buttonStyle, display: 'inline-block', marginTop: '16px', textDecoration: 'none' }}>
            去添加菜谱
          </Link>
        </div>
      )}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '20px',
      }}>
        {displayRecipes.map(r => (
          <RecipeCard key={r.id} recipe={r} selected={selectedRecipeIds.includes(r.id)} onToggle={toggleRecipeSelection} />
        ))}
      </div>
    </div>
  );
}

function RecipesPage() {
  const { recipes, fetchRecipes, addRecipe, removeRecipe, fetchIngredientNames, ingredientNames, loading } = useStore();
  const [name, setName] = useState('');
  const [cookingTime, setCookingTime] = useState(30);
  const [servings, setServings] = useState(2);
  const [steps, setSteps] = useState<string[]>(['', '', '']);
  const [ingredients, setIngredients] = useState<Ingredient[]>([{ name: '', quantity: 1, unit: '个', category: '其他' }]);
  const [image, setImage] = useState<string>('');
  const nav = useNavigate();

  useEffect(() => { fetchRecipes(); fetchIngredientNames(); }, []);

  const handleImg = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = ev => setImage(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return alert('请输入菜名');
    const validSteps = steps.filter(s => s.trim());
    if (validSteps.length < 3) return alert('请至少填写3个步骤');
    const validIngs = ingredients.filter(i => i.name.trim());
    if (validIngs.length === 0) return alert('请至少添加一种食材');
    await addRecipe({ name: name.trim(), cookingTime, servings, steps: validSteps, ingredients: validIngs, image });
    setName(''); setCookingTime(30); setServings(2); setSteps(['', '', '']);
    setIngredients([{ name: '', quantity: 1, unit: '个', category: '其他' }]); setImage('');
  };

  const updateStep = (idx: number, v: string) => {
    const ns = [...steps]; ns[idx] = v; setSteps(ns);
  };
  const addStep = () => setSteps([...steps, '']);
  const removeStep = (idx: number) => { if (steps.length > 3) setSteps(steps.filter((_, i) => i !== idx)); };

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ ...cardStyle, marginBottom: '32px' }}>
        <h2 style={{ marginTop: 0, color: COLORS.text }}>✨ 创建新菜谱</h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '6px', color: COLORS.text }}>菜名 *</label>
              <input value={name} onChange={e => setName(e.target.value)} style={{ ...inputStyle, width: '100%' }} placeholder="例如：红烧肉" />
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '6px', color: COLORS.text }}>烹饪时间(分钟) *</label>
              <input type="number" value={cookingTime} onChange={e => setCookingTime(Number(e.target.value))} style={{ ...inputStyle, width: '100%' }} min="1" />
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '6px', color: COLORS.text }}>份量(人)</label>
              <input type="number" value={servings} onChange={e => setServings(Number(e.target.value))} style={{ ...inputStyle, width: '100%' }} min="1" max="20" />
            </div>
          </div>
          <div>
            <label style={{ fontWeight: 600, color: COLORS.text, marginBottom: '8px', display: 'block' }}>步骤列表 (至少3步) *</label>
            {steps.map((s, idx) => (
              <div key={idx} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                <span style={{ alignSelf: 'center', fontWeight: 700, color: COLORS.primary, minWidth: '30px' }}>{idx + 1}.</span>
                <input value={s} onChange={e => updateStep(idx, e.target.value)} placeholder={`步骤 ${idx + 1}`}
                  style={{ ...inputStyle, flex: 1 }} />
                {steps.length > 3 && (
                  <button type="button" onClick={() => removeStep(idx)} style={{ ...buttonStyle, backgroundColor: '#8B0000', padding: '10px 14px' }}>×</button>
                )}
              </div>
            ))}
            <button type="button" onClick={addStep} style={{ ...buttonStyle }}>+ 添加步骤</button>
          </div>
          <IngredientInput ingredients={ingredients} onChange={setIngredients} ingredientNames={ingredientNames} />
          <div>
            <label style={{ fontWeight: 600, color: COLORS.text, marginBottom: '8px', display: 'block' }}>菜谱图片</label>
            <input type="file" accept="image/*" onChange={handleImg} style={{ marginBottom: '12px', fontFamily: "'Quicksand', sans-serif" }} />
            {image && <img src={image} alt="预览" style={{ width: '200px', height: '150px', objectFit: 'cover', borderRadius: '8px', border: `2px solid ${COLORS.border}` }} />}
          </div>
          <button type="submit" disabled={loading}
            style={{ ...buttonStyle, alignSelf: 'flex-start', fontSize: '16px', padding: '14px 32px' }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = COLORS.primaryDark; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = COLORS.primary; }}
          >
            💾 保存菜谱
          </button>
        </form>
      </div>
      <h2 style={{ color: COLORS.text }}>📋 菜谱列表 ({recipes.length})</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
        {recipes.map(r => (
          <div key={r.id} style={cardStyle}>
            <h3 style={{ marginTop: 0, color: COLORS.text, cursor: 'pointer' }} onClick={() => nav(`/recipes/${r.id}`)}>{r.name}</h3>
            {r.image && <img src={r.image} alt={r.name} style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: '8px', marginBottom: '10px' }} />}
            <div style={{ color: '#6B4423', fontSize: '14px', marginBottom: '12px' }}>
              ⏱ {r.cookingTime}分钟 | 🍽 {r.servings}人份 | 🥗 {r.ingredients.length}种食材
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <Link to={`/recipes/${r.id}`} style={{ ...buttonStyle, textDecoration: 'none', flex: 1, textAlign: 'center', padding: '8px 12px' }}>查看</Link>
              <button onClick={async () => { if (confirm('删除此菜谱？')) await removeRecipe(r.id); }}
                style={{ ...buttonStyle, backgroundColor: '#8B0000', padding: '8px 16px' }}>删除</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RecipeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { currentRecipe, fetchRecipe, toggleRecipeSelection, selectedRecipeIds, generateShoppingListAction, clearRecipeSelection, loading } = useStore();
  const [servings, setServings] = useState(2);
  const nav = useNavigate();

  useEffect(() => { if (id) fetchRecipe(Number(id)); }, [id]);

  useEffect(() => { if (currentRecipe) setServings(currentRecipe.servings || 2); }, [currentRecipe]);

  if (loading && !currentRecipe) return <div style={{ padding: '40px', textAlign: 'center', color: COLORS.text }}>加载中...</div>;
  if (!currentRecipe) return <div style={{ padding: '40px', textAlign: 'center', color: COLORS.text }}>未找到菜谱</div>;

  const ratio = servings / (currentRecipe.servings || 2);
  const isSelected = selectedRecipeIds.includes(currentRecipe.id);

  const handleAddToList = async () => {
    if (!isSelected) toggleRecipeSelection(currentRecipe.id);
    await generateShoppingListAction(selectedRecipeIds.includes(currentRecipe.id) ? selectedRecipeIds : [...selectedRecipeIds, currentRecipe.id]);
    clearRecipeSelection();
    nav('/shopping');
  };

  const adjustServings = (delta: number) => {
    setServings(s => Math.min(20, Math.max(1, s + delta)));
  };

  return (
    <div style={{ padding: '24px', maxWidth: '900px', margin: '0 auto' }}>
      <button onClick={() => nav(-1)} style={{ ...buttonStyle, marginBottom: '16px', backgroundColor: '#666' }}>← 返回</button>
      <div style={cardStyle}>
        <h1 style={{ marginTop: 0, color: COLORS.text }}>{currentRecipe.name}</h1>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ color: '#6B4423', fontSize: '16px' }}>⏱ 烹饪时间: <strong>{currentRecipe.cookingTime}</strong> 分钟</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: COLORS.text, fontWeight: 600 }}>🍽 就餐人数:</span>
            <button onClick={() => adjustServings(-1)} style={{ ...buttonStyle, padding: '6px 14px', fontSize: '18px' }}>−</button>
            <input type="number" value={servings} onChange={e => setServings(Math.min(20, Math.max(1, Number(e.target.value) || 1)))}
              style={{ ...inputStyle, width: '70px', textAlign: 'center', fontSize: '18px', fontWeight: 700 }} min="1" max="20" />
            <button onClick={() => adjustServings(1)} style={{ ...buttonStyle, padding: '6px 14px', fontSize: '18px' }}>+</button>
            <span style={{ color: '#666', fontSize: '13px' }}>（原 {currentRecipe.servings} 人份，比例 x{ratio.toFixed(2)}）</span>
          </div>
        </div>
        {currentRecipe.image && <img src={currentRecipe.image} alt={currentRecipe.name}
          style={{ width: '100%', maxHeight: '300px', objectFit: 'cover', borderRadius: '12px', marginBottom: '24px' }} />}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ color: COLORS.text, borderBottom: `2px solid ${COLORS.border}`, paddingBottom: '8px' }}>🥗 食材清单</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px' }}>
            {currentRecipe.ingredients.map((ing, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: COLORS.bg, borderRadius: '8px' }}>
                <span style={{ color: COLORS.text, fontWeight: 500 }}>{ing.name}</span>
                <span style={{ color: COLORS.primary, fontWeight: 700 }}>
                  {(ing.quantity * ratio).toFixed(ing.quantity % 1 === 0 && ratio % 1 === 0 ? 0 : 1)} {ing.unit}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ color: COLORS.text, borderBottom: `2px solid ${COLORS.border}`, paddingBottom: '8px' }}>📝 烹饪步骤</h3>
          <ol style={{ paddingLeft: '24px', color: COLORS.text }}>
            {currentRecipe.steps.map((s, idx) => (
              <li key={idx} style={{ marginBottom: '12px', lineHeight: 1.7, fontSize: '15px' }}>{s}</li>
            ))}
          </ol>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
          <button
            onClick={handleAddToList}
            style={{
              ...buttonStyle,
              backgroundColor: isSelected ? '#2E7D32' : COLORS.primary,
              fontSize: '16px',
              padding: '14px 28px',
            }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = isSelected ? '#1B5E20' : COLORS.primaryDark; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = isSelected ? '#2E7D32' : COLORS.primary; }}
          >
            {isSelected ? '✅ 已选中 - 生成购物清单' : '🛒 加入购物清单并生成'}
          </button>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: COLORS.text, fontWeight: 600 }}>
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => toggleRecipeSelection(currentRecipe.id)}
              style={{ width: '20px', height: '20px', accentColor: COLORS.primary }}
            />
            标记为选中
          </label>
        </div>
      </div>
    </div>
  );
}

function InventoryPage() {
  const { inventory, fetchInventory, addInventoryItem, updateInventoryItem, removeInventoryItem, fetchIngredientNames, ingredientNames, loading } = useStore();
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState('个');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editQty, setEditQty] = useState(0);

  useEffect(() => { fetchInventory(); fetchIngredientNames(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    await addInventoryItem({ name: name.trim(), quantity, unit });
    setName(''); setQuantity(1); setUnit('个');
  };

  const startEdit = (item: InventoryItem) => {
    setEditingId(item.id);
    setEditQty(item.quantity);
  };
  const saveEdit = async (id: number, currentUnit: string, currentName: string) => {
    await updateInventoryItem(id, { quantity: editQty, unit: currentUnit, name: currentName });
    setEditingId(null);
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1100px', margin: '0 auto' }}>
      <div style={{ ...cardStyle, marginBottom: '24px' }}>
        <h2 style={{ marginTop: 0, color: COLORS.text }}>📦 添加食材</h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'flex-end' }}>
          <div style={{ flex: '1 1 200px' }}>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: '6px', color: COLORS.text }}>名称 *</label>
            <input list="inv-names" value={name} onChange={e => setName(e.target.value)} placeholder="食材名称" style={{ ...inputStyle, width: '100%' }} />
            <datalist id="inv-names">{ingredientNames.map(n => <option key={n} value={n} />)}</datalist>
          </div>
          <div style={{ width: '100px' }}>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: '6px', color: COLORS.text }}>数量</label>
            <input type="number" value={quantity} onChange={e => setQuantity(Number(e.target.value))} style={{ ...inputStyle, width: '100%' }} min="0" step="0.1" />
          </div>
          <div style={{ width: '100px' }}>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: '6px', color: COLORS.text }}>单位</label>
            <input value={unit} onChange={e => setUnit(e.target.value)} style={{ ...inputStyle, width: '100%' }} />
          </div>
          <button type="submit" disabled={loading} style={{ ...buttonStyle, height: '42px' }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = COLORS.primaryDark; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = COLORS.primary; }}
          >+ 添加</button>
        </form>
      </div>
      <div style={cardStyle}>
        <h2 style={{ marginTop: 0, color: COLORS.text }}>📋 库存列表 ({inventory.length})</h2>
        {inventory.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>暂无库存记录</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', color: COLORS.text }}>
              <thead>
                <tr style={{ background: COLORS.bg }}>
                  <th style={thStyle}>名称</th>
                  <th style={thStyle}>当前数量</th>
                  <th style={thStyle}>单位</th>
                  <th style={thStyle}>最后更新</th>
                  <th style={{ ...thStyle, width: '180px' }}>操作</th>
                </tr>
              </thead>
              <tbody>
                {inventory.map(item => (
                  <tr key={item.id} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                    <td style={tdStyle}><strong>{item.name}</strong></td>
                    <td style={tdStyle}>
                      {editingId === item.id ? (
                        <input type="number" value={editQty} onChange={e => setEditQty(Number(e.target.value))}
                          style={{ ...inputStyle, width: '100px' }} min="0" step="0.1" />
                      ) : (
                        <span style={{ color: COLORS.primary, fontWeight: 700, fontSize: '16px' }}>{item.quantity}</span>
                      )}
                    </td>
                    <td style={tdStyle}>{item.unit}</td>
                    <td style={tdStyle}>{new Date(item.lastUpdated).toLocaleDateString('zh-CN')}</td>
                    <td style={tdStyle}>
                      {editingId === item.id ? (
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button onClick={() => saveEdit(item.id, item.unit, item.name)} style={{ ...buttonStyle, padding: '6px 12px', backgroundColor: '#2E7D32' }}>✓</button>
                          <button onClick={() => setEditingId(null)} style={{ ...buttonStyle, padding: '6px 12px', backgroundColor: '#888' }}>✕</button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button onClick={() => startEdit(item)} style={{ ...buttonStyle, padding: '6px 12px' }}>修改</button>
                          <button onClick={async () => { if (confirm('删除此库存？')) await removeInventoryItem(item.id); }}
                            style={{ ...buttonStyle, padding: '6px 12px', backgroundColor: '#8B0000' }}>删除</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

const thStyle: React.CSSProperties = {
  padding: '12px 16px',
  textAlign: 'left',
  color: COLORS.text,
  fontWeight: 700,
  borderBottom: `2px solid ${COLORS.border}`,
};
const tdStyle: React.CSSProperties = {
  padding: '12px 16px',
};

function ShoppingPage() {
  const { shoppingList, updateShoppingListItem, removeShoppingListItem, loading } = useStore();
  const [fadeOutIds, setFadeOutIds] = useState<Set<number>>(new Set());

  const categories = ['蔬菜', '肉类', '调味料', '其他'];
  const grouped = useMemo(() => {
    const g: Record<string, ShoppingItem[]> = { 蔬菜: [], 肉类: [], 调味料: [], 其他: [] };
    shoppingList.forEach(item => {
      const cat = categories.includes(item.category || '') ? item.category : '其他';
      g[cat].push(item);
    });
    return g;
  }, [shoppingList]);

  const handleRemove = (id: number) => {
    setFadeOutIds(prev => new Set(prev).add(id));
    setTimeout(() => {
      removeShoppingListItem(id);
      setFadeOutIds(prev => { const n = new Set(prev); n.delete(id); return n; });
    }, 300);
  };

  const renderItem = (item: ShoppingItem) => {
    const fading = fadeOutIds.has(item.id);
    return (
      <div key={item.id} style={{
        display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 14px',
        background: item.checked ? '#E8F5E9' : COLORS.bg, borderRadius: '10px', marginBottom: '10px',
        opacity: fading ? 0 : 1, transform: fading ? 'translateX(20px)' : 'none',
        transition: 'opacity 0.3s, transform 0.3s',
      }}>
        <input type="checkbox" checked={item.checked || false}
          onChange={e => updateShoppingListItem(item.id, { checked: e.target.checked })}
          style={{ width: '20px', height: '20px', accentColor: COLORS.primary, cursor: 'pointer' }} />
        <span style={{ flex: 1, color: COLORS.text, fontWeight: 500, textDecoration: item.checked ? 'line-through' : 'none', opacity: item.checked ? 0.6 : 1 }}>
          {item.name}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button onClick={() => updateShoppingListItem(item.id, { quantity: Math.max(0, item.quantity - 1) })}
            style={{ ...buttonStyle, padding: '4px 10px', fontSize: '16px' }}>−</button>
          <input type="number" value={item.quantity} min="0" step="0.1"
            onChange={e => updateShoppingListItem(item.id, { quantity: Number(e.target.value) })}
            style={{ ...inputStyle, width: '60px', textAlign: 'center', padding: '6px' }} />
          <button onClick={() => updateShoppingListItem(item.id, { quantity: item.quantity + 1 })}
            style={{ ...buttonStyle, padding: '4px 10px', fontSize: '16px' }}>+</button>
        </div>
        <span style={{ color: COLORS.primary, fontWeight: 600, minWidth: '40px', textAlign: 'right' }}>{item.unit}</span>
        <button onClick={() => handleRemove(item.id)}
          style={{ ...buttonStyle, backgroundColor: '#8B0000', padding: '8px 12px', borderRadius: '8px' }}>🗑</button>
      </div>
    );
  };

  const icons: Record<string, string> = { 蔬菜: '🥬', 肉类: '🥩', 调味料: '🧂', 其他: '📦' };
  const catColors: Record<string, string> = { 蔬菜: '#2E7D32', 肉类: '#C62828', 调味料: '#F57F17', 其他: '#555' };

  const totalItems = shoppingList.length;
  const checkedItems = shoppingList.filter(i => i.checked).length;

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ ...cardStyle, marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <h2 style={{ margin: 0, color: COLORS.text }}>🛒 购物清单 ({checkedItems}/{totalItems} 已完成)</h2>
        {totalItems > 0 && (
          <div style={{ color: COLORS.text }}>
            <div style={{ fontSize: '13px', marginBottom: '4px' }}>进度:</div>
            <div style={{ width: '200px', height: '12px', background: '#ddd', borderRadius: '6px', overflow: 'hidden' }}>
              <div style={{
                width: `${totalItems > 0 ? (checkedItems / totalItems) * 100 : 0}%`,
                height: '100%', background: '#2E7D32', transition: 'width 0.3s',
              }} />
            </div>
          </div>
        )}
      </div>
      {loading && <div style={{ textAlign: 'center', padding: '20px', color: COLORS.text }}>生成中...</div>}
      {!loading && totalItems === 0 ? (
        <div style={{ ...cardStyle, textAlign: 'center', padding: '60px' }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>🛍️</div>
          <div style={{ fontSize: '18px', color: COLORS.text, marginBottom: '20px' }}>购物清单还是空的～</div>
          <div style={{ color: '#666', marginBottom: '24px' }}>在首页勾选菜谱，点击"生成购物清单"开始吧！</div>
          <Link to="/" style={{ ...buttonStyle, textDecoration: 'none', display: 'inline-block' }}>🏠 去首页选择菜谱</Link>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '20px',
        }}>
          {categories.map(cat => grouped[cat].length > 0 && (
            <div key={cat} style={cardStyle}>
              <h3 style={{
                marginTop: 0, padding: '10px 14px', borderRadius: '8px',
                background: catColors[cat] + '20', color: catColors[cat],
                display: 'flex', alignItems: 'center', gap: '8px',
              }}>
                {icons[cat]} {cat}
                <span style={{ marginLeft: 'auto', fontSize: '14px', background: catColors[cat], color: 'white', padding: '2px 10px', borderRadius: '10px' }}>
                  {grouped[cat].length}
                </span>
              </h3>
              {grouped[cat].map(renderItem)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function NavLink({ to, children }: { to: string; children: React.ReactNode }) {
  const loc = useLocation();
  const active = loc.pathname === to || (to !== '/' && loc.pathname.startsWith(to));
  return (
    <Link to={to} style={{
      color: 'white',
      textDecoration: 'none',
      padding: '12px 20px',
      fontWeight: active ? 700 : 500,
      borderBottom: active ? '3px solid #F5E6CC' : '3px solid transparent',
      transition: 'all 0.2s',
      fontSize: '15px',
    }}
      onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'; }}
      onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
    >
      {children}
    </Link>
  );
}

export default function App() {
  return (
    <div style={{ minHeight: '100vh', background: COLORS.bg }}>
      <nav style={{
        background: COLORS.primary,
        color: 'white',
        padding: '0 24px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '8px',
        }}>
          <span style={{ fontSize: '22px', marginRight: '20px' }}>🍲</span>
          <NavLink to="/">🏠 首页</NavLink>
          <NavLink to="/recipes">📖 菜谱管理</NavLink>
          <NavLink to="/inventory">📦 食材库存</NavLink>
          <NavLink to="/shopping">🛒 购物清单</NavLink>
        </div>
      </nav>
      <div style={{
        background: 'linear-gradient(135deg, #FFE4B5 0%, #F5DEB3 50%, #F5E6CC 100%)',
        padding: '36px 24px 28px',
        textAlign: 'center',
        borderBottom: `3px solid ${COLORS.border}`,
        boxShadow: 'inset 0 -4px 8px rgba(74,47,26,0.08)',
      }}>
        <h1 style={{
          margin: 0,
          fontSize: '44px',
          fontWeight: 800,
          color: COLORS.primary,
          letterSpacing: '4px',
          textShadow: '2px 2px 4px rgba(74,47,26,0.15)',
          fontFamily: "'Quicksand', sans-serif",
        }}>
          🍳 温馨厨房 🍳
        </h1>
        <p style={{ margin: '10px 0 0', color: '#6B4423', fontSize: '16px', fontStyle: 'italic' }}>
          ~ 让每一餐都充满爱与温暖 ~
        </p>
      </div>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/recipes" element={<RecipesPage />} />
        <Route path="/recipes/:id" element={<RecipeDetailPage />} />
        <Route path="/inventory" element={<InventoryPage />} />
        <Route path="/shopping" element={<ShoppingPage />} />
      </Routes>
    </div>
  );
}
