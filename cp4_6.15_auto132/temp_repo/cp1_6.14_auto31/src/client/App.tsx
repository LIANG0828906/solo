import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate, useLocation, Navigate } from 'react-router-dom';
import axios from 'axios';
import Feed from './pages/Feed';
import Detail from './pages/Detail';
import Plan from './pages/Plan';

export interface User {
  id: string; username: string; password: string; avatar: string;
  healthGoal: 'lose_fat' | 'build_muscle' | 'maintain' | '';
  allergies: string[]; calorieLimit: number; favorites: string[]; createdAt: string;
}
export interface Ingredient {
  name: string; amount: string; calories: number; protein: number; carbs: number; fat: number;
}
export interface Recipe {
  id: string; authorId: string; authorName: string; authorAvatar: string;
  name: string; category: string; cookTime: number;
  ingredients: Ingredient[]; steps: string[]; image: string;
  tags: string[]; likes: string[]; createdAt: string;
}
export interface Comment {
  id: string; recipeId: string; userId: string; username: string;
  userAvatar: string; content: string; createdAt: string;
}
export interface MealEntry {
  type: 'breakfast' | 'lunch' | 'dinner' | 'snack1' | 'snack2';
  recipeId: string; recipeName: string; recipeImage: string; calories: number;
}
export interface DayPlan { date: string; meals: MealEntry[]; }
export interface MealPlan { id: string; userId: string; weekStart: string; days: DayPlan[]; }

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
}

const AuthContext = createContext<AuthContextType>(null!);
export const useAuth = () => useContext(AuthContext);

const globalCSS = `
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@300;400;500;700&display=swap');
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: 'Noto Sans SC', sans-serif; background: #FFF8F0; color: #3D2C1E; }
a { text-decoration: none; color: inherit; }
button { cursor: pointer; border: none; font-family: 'Noto Sans SC', sans-serif; }
input, select, textarea { font-family: 'Noto Sans SC', sans-serif; }
::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-thumb { background: #F0E6D8; border-radius: 3px; }
@keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
@keyframes slideDown { from { opacity: 0; max-height: 0; } to { opacity: 1; max-height: 800px; } }
.fade-in-up { animation: fadeInUp 0.5s ease forwards; }
.fade-in { animation: fadeIn 0.3s ease forwards; }
`;

function GlobalStyles() {
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = globalCSS;
    document.head.appendChild(style);
    return () => { document.head.removeChild(style); };
  }, []);
  return null;
}

function NavBar() {
  const { user, logout } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [modalTab, setModalTab] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogin = async () => {
    setError('');
    try {
      if (modalTab === 'login') {
        await authContext.login(username, password);
      } else {
        await authContext.register(username, password);
      }
      setShowModal(false);
      setUsername('');
      setPassword('');
    } catch (e: any) {
      setError(e?.response?.data?.message || '操作失败，请重试');
    }
  };

  const authContext = useAuth();

  const navLinks = [
    { to: '/', label: '社区' },
    { to: '/plan', label: '膳食计划' },
    { to: '/create', label: '发布菜谱' },
    { to: '/profile', label: '个人中心' },
  ];

  return (
    <>
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
        background: '#FFF8F0', borderBottom: '2px solid #F5A623',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 24px', height: 60, boxShadow: '0 2px 8px rgba(245,166,35,0.1)',
      }}>
        <Link to="/" style={{ fontSize: 22, fontWeight: 700, color: '#F5A623', letterSpacing: 2 }}>
          🍳 家的味道
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          {navLinks.map(link => (
            <Link key={link.to} to={link.to} style={{
              fontSize: 15, fontWeight: 500, color: location.pathname === link.to ? '#F5A623' : '#3D2C1E',
              transition: 'color 0.3s', position: 'relative', padding: '4px 0',
              borderBottom: location.pathname === link.to ? '2px solid #F5A623' : '2px solid transparent',
            }}>
              {link.label}
            </Link>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {user ? (
            <>
              <img src={user.avatar || `https://ui-avatars.com/api/?name=${user.username}&background=F5A623&color=fff`}
                alt={user.username} style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} />
              <span style={{ fontSize: 14, fontWeight: 500, color: '#3D2C1E' }}>{user.username}</span>
              <button onClick={async () => { await logout(); navigate('/'); }}
                style={{ fontSize: 13, color: '#8B7355', background: 'none', transition: 'color 0.3s' }}>
                退出
              </button>
            </>
          ) : (
            <>
              <button onClick={() => { setModalTab('login'); setShowModal(true); }}
                style={{ padding: '6px 16px', borderRadius: 8, background: '#F5A623', color: '#fff', fontSize: 14, fontWeight: 500, transition: 'background 0.3s' }}>
                登录
              </button>
              <button onClick={() => { setModalTab('register'); setShowModal(true); }}
                style={{ padding: '6px 16px', borderRadius: 8, background: 'transparent', color: '#F5A623', fontSize: 14, fontWeight: 500, border: '1.5px solid #F5A623', transition: 'all 0.3s' }}>
                注册
              </button>
            </>
          )}
        </div>
      </nav>

      {showModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 2000,
          background: 'rgba(61,44,30,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }} onClick={() => setShowModal(false)}>
          <div style={{
            background: '#FFF8F0', borderRadius: 16, padding: 32, width: 400, maxWidth: '90vw',
            boxShadow: '0 16px 48px rgba(0,0,0,0.2)',
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', marginBottom: 24, borderBottom: '2px solid #F0E6D8' }}>
              {(['login', 'register'] as const).map(tab => (
                <button key={tab} onClick={() => { setModalTab(tab); setError(''); }}
                  style={{
                    flex: 1, padding: '10px 0', fontSize: 16, fontWeight: 600,
                    background: 'none', color: modalTab === tab ? '#F5A623' : '#8B7355',
                    borderBottom: modalTab === tab ? '2px solid #F5A623' : '2px solid transparent',
                    marginBottom: -2, transition: 'all 0.3s',
                  }}>
                  {tab === 'login' ? '登录' : '注册'}
                </button>
              ))}
            </div>
            {error && <div style={{ color: '#E53935', fontSize: 13, marginBottom: 12, textAlign: 'center' }}>{error}</div>}
            <input value={username} onChange={e => setUsername(e.target.value)} placeholder="用户名"
              style={{
                width: '100%', padding: '10px 14px', borderRadius: 8, border: '1.5px solid #F0E6D8',
                fontSize: 15, marginBottom: 12, outline: 'none', background: '#fff',
                transition: 'border-color 0.3s',
              }} onFocus={e => e.currentTarget.style.borderColor = '#F5A623'}
              onBlur={e => e.currentTarget.style.borderColor = '#F0E6D8'} />
            <input value={password} onChange={e => setPassword(e.target.value)} placeholder="密码" type="password"
              style={{
                width: '100%', padding: '10px 14px', borderRadius: 8, border: '1.5px solid #F0E6D8',
                fontSize: 15, marginBottom: 20, outline: 'none', background: '#fff',
                transition: 'border-color 0.3s',
              }} onFocus={e => e.currentTarget.style.borderColor = '#F5A623'}
              onBlur={e => e.currentTarget.style.borderColor = '#F0E6D8'} />
            <button onClick={handleLogin}
              style={{
                width: '100%', padding: '12px 0', borderRadius: 8, background: '#F5A623', color: '#fff',
                fontSize: 16, fontWeight: 600, transition: 'background 0.3s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#E8913A'}
              onMouseLeave={e => e.currentTarget.style.background = '#F5A623'}>
              {modalTab === 'login' ? '登录' : '注册'}
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function CreateRecipe() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [category, setCategory] = useState('早餐');
  const [cookTime, setCookTime] = useState(30);
  const [tags, setTags] = useState<string[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([
    { name: '', amount: '', calories: 0, protein: 0, carbs: 0, fat: 0 }
  ]);
  const [steps, setSteps] = useState<string[]>(['']);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const allTags = ['低脂', '高蛋白', '素食', '低碳水', '无麸质', '辛辣'];
  const categories = ['早餐', '午餐', '晚餐', '加餐', '汤品', '甜点'];

  if (!user) {
    return (
      <div style={{ paddingTop: 80, textAlign: 'center', color: '#8B7355' }}>
        <p style={{ fontSize: 18, marginBottom: 16 }}>请先登录后发布菜谱</p>
        <Link to="/" style={{ color: '#F5A623', fontSize: 16 }}>返回首页</Link>
      </div>
    );
  }

  const toggleTag = (tag: string) => {
    setTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  const updateIngredient = (index: number, field: keyof Ingredient, value: string | number) => {
    setIngredients(prev => prev.map((ing, i) => i === index ? { ...ing, [field]: value } : ing));
  };

  const addIngredient = () => {
    setIngredients(prev => [...prev, { name: '', amount: '', calories: 0, protein: 0, carbs: 0, fat: 0 }]);
  };

  const removeIngredient = (index: number) => {
    if (ingredients.length <= 1) return;
    setIngredients(prev => prev.filter((_, i) => i !== index));
  };

  const updateStep = (index: number, value: string) => {
    setSteps(prev => prev.map((s, i) => i === index ? value : s));
  };

  const addStep = () => {
    setSteps(prev => [...prev, '']);
  };

  const removeStep = (index: number) => {
    if (steps.length <= 1) return;
    setSteps(prev => prev.filter((_, i) => i !== index));
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = canvasRef.current!;
      const size = Math.min(img.width, img.height);
      const sx = (img.width - size) / 2;
      const sy = (img.height - size) / 2;
      const outputSize = 800;
      canvas.width = outputSize;
      canvas.height = outputSize;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, sx, sy, size, size, 0, 0, outputSize, outputSize);
      let quality = 0.9;
      const compress = () => {
        canvas.toBlob(blob => {
          if (!blob) return;
          if (blob.size > 500 * 1024 && quality > 0.1) {
            quality -= 0.1;
            compress();
          } else {
            const compressedFile = new File([blob], 'recipe.jpg', { type: 'image/jpeg' });
            setImageFile(compressedFile);
            setImagePreview(URL.createObjectURL(blob));
          }
        }, 'image/jpeg', quality);
      };
      compress();
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  const handleSubmit = async () => {
    if (!name.trim() || ingredients.every(i => !i.name.trim()) || steps.every(s => !s.trim())) return;
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('name', name);
      fd.append('category', category);
      fd.append('cookTime', String(cookTime));
      fd.append('ingredients', JSON.stringify(ingredients.filter(i => i.name.trim())));
      fd.append('steps', JSON.stringify(steps.filter(s => s.trim())));
      fd.append('tags', JSON.stringify(tags));
      if (imageFile) fd.append('image', imageFile);
      const res = await axios.post('/api/recipes', fd);
      navigate(`/recipe/${res.data.recipe.id}`);
    } catch {
      alert('发布失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ paddingTop: 80, maxWidth: 720, margin: '0 auto', padding: '80px 16px 40px' }}>
      <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24, color: '#3D2C1E' }}>发布新菜谱</h2>
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div>
          <label style={{ fontSize: 14, fontWeight: 500, color: '#8B7355', marginBottom: 6, display: 'block' }}>菜谱名称</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="例：番茄炒蛋"
            style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1.5px solid #F0E6D8', fontSize: 15, outline: 'none', background: '#fff' }} />
        </div>
        <div style={{ display: 'flex', gap: 16 }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 14, fontWeight: 500, color: '#8B7355', marginBottom: 6, display: 'block' }}>分类</label>
            <select value={category} onChange={e => setCategory(e.target.value)}
              style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1.5px solid #F0E6D8', fontSize: 15, outline: 'none', background: '#fff' }}>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 14, fontWeight: 500, color: '#8B7355', marginBottom: 6, display: 'block' }}>烹饪时间（分钟）</label>
            <input type="number" value={cookTime} onChange={e => setCookTime(Number(e.target.value))}
              style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1.5px solid #F0E6D8', fontSize: 15, outline: 'none', background: '#fff' }} />
          </div>
        </div>
        <div>
          <label style={{ fontSize: 14, fontWeight: 500, color: '#8B7355', marginBottom: 6, display: 'block' }}>标签</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {allTags.map(tag => (
              <button key={tag} onClick={() => toggleTag(tag)}
                style={{
                  padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: 500,
                  background: tags.includes(tag) ? '#F5A623' : '#F0E6D8',
                  color: tags.includes(tag) ? '#fff' : '#8B7355',
                  transition: 'all 0.3s',
                }}>
                {tag}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label style={{ fontSize: 14, fontWeight: 500, color: '#8B7355', marginBottom: 6, display: 'block' }}>图片</label>
          <input type="file" accept="image/*" onChange={handleImageSelect}
            style={{ fontSize: 14, color: '#8B7355' }} />
          {imagePreview && (
            <img src={imagePreview} alt="预览" style={{ width: 200, height: 200, objectFit: 'cover', borderRadius: 12, marginTop: 8, border: '2px solid #F0E6D8' }} />
          )}
        </div>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <label style={{ fontSize: 14, fontWeight: 500, color: '#8B7355' }}>食材</label>
            <button onClick={addIngredient}
              style={{ padding: '4px 12px', borderRadius: 6, background: '#F5A623', color: '#fff', fontSize: 13, fontWeight: 500 }}>
              + 添加
            </button>
          </div>
          {ingredients.map((ing, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <input value={ing.name} onChange={e => updateIngredient(i, 'name', e.target.value)} placeholder="名称"
                style={{ width: 100, padding: '8px 10px', borderRadius: 6, border: '1px solid #F0E6D8', fontSize: 13, outline: 'none' }} />
              <input value={ing.amount} onChange={e => updateIngredient(i, 'amount', e.target.value)} placeholder="用量"
                style={{ width: 80, padding: '8px 10px', borderRadius: 6, border: '1px solid #F0E6D8', fontSize: 13, outline: 'none' }} />
              <input type="number" value={ing.calories || ''} onChange={e => updateIngredient(i, 'calories', Number(e.target.value))} placeholder="卡路里"
                style={{ width: 70, padding: '8px 10px', borderRadius: 6, border: '1px solid #F0E6D8', fontSize: 13, outline: 'none' }} />
              <input type="number" value={ing.protein || ''} onChange={e => updateIngredient(i, 'protein', Number(e.target.value))} placeholder="蛋白质g"
                style={{ width: 70, padding: '8px 10px', borderRadius: 6, border: '1px solid #F0E6D8', fontSize: 13, outline: 'none' }} />
              <input type="number" value={ing.carbs || ''} onChange={e => updateIngredient(i, 'carbs', Number(e.target.value))} placeholder="碳水g"
                style={{ width: 70, padding: '8px 10px', borderRadius: 6, border: '1px solid #F0E6D8', fontSize: 13, outline: 'none' }} />
              <input type="number" value={ing.fat || ''} onChange={e => updateIngredient(i, 'fat', Number(e.target.value))} placeholder="脂肪g"
                style={{ width: 70, padding: '8px 10px', borderRadius: 6, border: '1px solid #F0E6D8', fontSize: 13, outline: 'none' }} />
              {ingredients.length > 1 && (
                <button onClick={() => removeIngredient(i)} style={{ background: '#E53935', color: '#fff', borderRadius: 6, padding: '6px 10px', fontSize: 12 }}>✕</button>
              )}
            </div>
          ))}
        </div>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <label style={{ fontSize: 14, fontWeight: 500, color: '#8B7355' }}>步骤</label>
            <button onClick={addStep}
              style={{ padding: '4px 12px', borderRadius: 6, background: '#F5A623', color: '#fff', fontSize: 13, fontWeight: 500 }}>
              + 添加
            </button>
          </div>
          {steps.map((step, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
              <span style={{
                width: 28, height: 28, borderRadius: '50%', background: '#F5A623', color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 600, flexShrink: 0,
              }}>
                {i + 1}
              </span>
              <input value={step} onChange={e => updateStep(i, e.target.value)} placeholder={`步骤 ${i + 1}`}
                style={{ flex: 1, padding: '8px 10px', borderRadius: 6, border: '1px solid #F0E6D8', fontSize: 13, outline: 'none' }} />
              {steps.length > 1 && (
                <button onClick={() => removeStep(i)} style={{ background: '#E53935', color: '#fff', borderRadius: 6, padding: '6px 10px', fontSize: 12 }}>✕</button>
              )}
            </div>
          ))}
        </div>
        <button onClick={handleSubmit} disabled={submitting}
          style={{
            padding: '14px 0', borderRadius: 8, background: submitting ? '#F0E6D8' : '#F5A623',
            color: submitting ? '#8B7355' : '#fff', fontSize: 16, fontWeight: 600,
            transition: 'background 0.3s', marginTop: 8,
          }}>
          {submitting ? '发布中...' : '发布菜谱'}
        </button>
      </div>
    </div>
  );
}

function Profile() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [healthGoal, setHealthGoal] = useState<User['healthGoal']>(user?.healthGoal || '');
  const [allergies, setAllergies] = useState<string[]>(user?.allergies || []);
  const [allergyInput, setAllergyInput] = useState('');
  const [calorieLimit, setCalorieLimit] = useState(user?.calorieLimit || 2000);
  const [myRecipes, setMyRecipes] = useState<Recipe[]>([]);
  const [favRecipes, setFavRecipes] = useState<Recipe[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    setHealthGoal(user.healthGoal);
    setAllergies(user.allergies);
    setCalorieLimit(user.calorieLimit);
    axios.get('/api/recipes?tab=latest&page=1&limit=100').then(res => {
      const mine = res.data.recipes.filter((r: Recipe) => r.authorId === user.id);
      setMyRecipes(mine);
      const favs = res.data.recipes.filter((r: Recipe) => user.favorites.includes(r.id));
      setFavRecipes(favs);
    }).catch(() => {});
  }, [user]);

  if (!user) {
    return (
      <div style={{ paddingTop: 80, textAlign: 'center', color: '#8B7355' }}>
        <p style={{ fontSize: 18, marginBottom: 16 }}>请先登录查看个人中心</p>
        <Link to="/" style={{ color: '#F5A623', fontSize: 16 }}>返回首页</Link>
      </div>
    );
  }

  const addAllergy = () => {
    const trimmed = allergyInput.trim();
    if (trimmed && !allergies.includes(trimmed)) {
      setAllergies(prev => [...prev, trimmed]);
      setAllergyInput('');
    }
  };

  const removeAllergy = (item: string) => {
    setAllergies(prev => prev.filter(a => a !== item));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await axios.put('/api/user/profile', { healthGoal, allergies, calorieLimit });
      setUser(res.data.user);
      alert('保存成功');
    } catch {
      alert('保存失败');
    } finally {
      setSaving(false);
    }
  };

  const goalLabels: Record<string, string> = { lose_fat: '减脂', build_muscle: '增肌', maintain: '维持体重' };

  return (
    <div style={{ paddingTop: 80, maxWidth: 720, margin: '0 auto', padding: '80px 16px 40px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
        <img src={user.avatar || `https://ui-avatars.com/api/?name=${user.username}&background=F5A623&color=fff`}
          alt={user.username} style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', border: '3px solid #F5A623' }} />
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: '#3D2C1E' }}>{user.username}</h2>
          <p style={{ fontSize: 13, color: '#8B7355' }}>加入于 {new Date(user.createdAt).toLocaleDateString('zh-CN')}</p>
        </div>
      </div>

      <div style={{ background: '#fff', borderRadius: 12, padding: 24, marginBottom: 24, boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
        <h3 style={{ fontSize: 17, fontWeight: 600, marginBottom: 16, color: '#3D2C1E' }}>健康目标</h3>
        <div style={{ display: 'flex', gap: 12 }}>
          {(['lose_fat', 'build_muscle', 'maintain'] as const).map(goal => (
            <button key={goal} onClick={() => setHealthGoal(goal)}
              style={{
                padding: '8px 18px', borderRadius: 8, fontSize: 14, fontWeight: 500,
                background: healthGoal === goal ? '#F5A623' : '#F0E6D8',
                color: healthGoal === goal ? '#fff' : '#8B7355',
                transition: 'all 0.3s',
              }}>
              {goalLabels[goal]}
            </button>
          ))}
        </div>
      </div>

      <div style={{ background: '#fff', borderRadius: 12, padding: 24, marginBottom: 24, boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
        <h3 style={{ fontSize: 17, fontWeight: 600, marginBottom: 16, color: '#3D2C1E' }}>过敏源</h3>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
          {allergies.map(a => (
            <span key={a} style={{
              padding: '4px 12px', borderRadius: 16, background: '#E53935', color: '#fff',
              fontSize: 13, display: 'flex', alignItems: 'center', gap: 4,
            }}>
              {a}
              <button onClick={() => removeAllergy(a)} style={{ background: 'none', color: '#fff', fontSize: 14, lineHeight: 1 }}>✕</button>
            </span>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input value={allergyInput} onChange={e => setAllergyInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addAllergy()}
            placeholder="输入过敏源后按回车添加"
            style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1.5px solid #F0E6D8', fontSize: 14, outline: 'none' }} />
          <button onClick={addAllergy}
            style={{ padding: '8px 16px', borderRadius: 8, background: '#F5A623', color: '#fff', fontSize: 14, fontWeight: 500 }}>
            添加
          </button>
        </div>
      </div>

      <div style={{ background: '#fff', borderRadius: 12, padding: 24, marginBottom: 24, boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
        <h3 style={{ fontSize: 17, fontWeight: 600, marginBottom: 16, color: '#3D2C1E' }}>每日卡路里上限</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <input type="range" min={1200} max={4000} step={50} value={calorieLimit}
            onChange={e => setCalorieLimit(Number(e.target.value))}
            style={{ flex: 1, accentColor: '#F5A623' }} />
          <input type="number" value={calorieLimit} onChange={e => setCalorieLimit(Number(e.target.value))}
            style={{ width: 80, padding: '8px 10px', borderRadius: 8, border: '1.5px solid #F0E6D8', fontSize: 14, outline: 'none', textAlign: 'center' }} />
          <span style={{ fontSize: 14, color: '#8B7355' }}>kcal</span>
        </div>
      </div>

      <button onClick={handleSave} disabled={saving}
        style={{
          width: '100%', padding: '14px 0', borderRadius: 8,
          background: saving ? '#F0E6D8' : '#F5A623', color: saving ? '#8B7355' : '#fff',
          fontSize: 16, fontWeight: 600, transition: 'background 0.3s', marginBottom: 40,
        }}>
        {saving ? '保存中...' : '保存设置'}
      </button>

      <div style={{ marginBottom: 32 }}>
        <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16, color: '#3D2C1E' }}>我的菜谱</h3>
        {myRecipes.length === 0 ? (
          <p style={{ color: '#8B7355', fontSize: 14 }}>暂无发布菜谱</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
            {myRecipes.map(r => (
              <div key={r.id} onClick={() => navigate(`/recipe/${r.id}`)}
                style={{
                  background: '#fff', borderRadius: 12, overflow: 'hidden', cursor: 'pointer',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.08)', transition: 'all 0.3s',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px) scale(1.02)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.08)'; }}>
                {r.image ? (
                  <img src={r.image} alt={r.name} style={{ width: '100%', height: 140, objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: 140, background: 'linear-gradient(135deg, #F5A623, #E8913A)' }} />
                )}
                <div style={{ padding: 12 }}>
                  <p style={{ fontSize: 14, fontWeight: 500, color: '#3D2C1E', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16, color: '#3D2C1E' }}>我的收藏</h3>
        {favRecipes.length === 0 ? (
          <p style={{ color: '#8B7355', fontSize: 14 }}>暂无收藏菜谱</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
            {favRecipes.map(r => (
              <div key={r.id} onClick={() => navigate(`/recipe/${r.id}`)}
                style={{
                  background: '#fff', borderRadius: 12, overflow: 'hidden', cursor: 'pointer',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.08)', transition: 'all 0.3s',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px) scale(1.02)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.08)'; }}>
                {r.image ? (
                  <img src={r.image} alt={r.name} style={{ width: '100%', height: 140, objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: 140, background: 'linear-gradient(135deg, #7CB342, #4CAF50)' }} />
                )}
                <div style={{ padding: 12 }}>
                  <p style={{ fontSize: 14, fontWeight: 500, color: '#3D2C1E', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    axios.get('/api/auth/me').then(res => setUser(res.data.user)).catch(() => setUser(null));
  }, []);

  const login = async (username: string, password: string) => {
    const res = await axios.post('/api/auth/login', { username, password });
    setUser(res.data.user);
  };

  const register = async (username: string, password: string) => {
    const res = await axios.post('/api/auth/register', { username, password });
    setUser(res.data.user);
  };

  const logout = async () => {
    await axios.post('/api/auth/logout');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, setUser }}>
      <GlobalStyles />
      <BrowserRouter>
        <NavBar />
        <Routes>
          <Route path="/" element={<Feed />} />
          <Route path="/recipe/:id" element={<Detail />} />
          <Route path="/plan" element={<Plan />} />
          <Route path="/create" element={<CreateRecipe />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </BrowserRouter>
    </AuthContext.Provider>
  );
}
