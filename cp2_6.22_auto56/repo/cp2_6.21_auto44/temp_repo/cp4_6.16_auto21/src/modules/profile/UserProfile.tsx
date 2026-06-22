import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { useRecipeStore } from '../../stores/recipeStore';
import type { FlavorProfile } from '../../types';

export default function UserProfile() {
  const navigate = useNavigate();
  const { userProfile, registerUser, updateFlavorProfile, addRecipe } = useRecipeStore();
  const [isEditing, setIsEditing] = useState(false);
  const [userName, setUserName] = useState('');
  const [flavorProfile, setFlavorProfile] = useState<FlavorProfile>({
    sweet: 3,
    spicy: 3,
    sour: 3,
  });
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newRecipe, setNewRecipe] = useState({
    name: '',
    cuisine: '中式',
    difficulty: '简单' as '简单' | '中等' | '困难',
    cookTime: 30,
    story: '',
    ingredients: [''],
    steps: [''],
    coverImage: '',
    flavorProfile: { sweet: 3, spicy: 3, sour: 3 } as FlavorProfile,
  });

  useEffect(() => {
    if (userProfile) {
      setUserName(userProfile.userName);
      setFlavorProfile(userProfile.flavorProfile);
    }
  }, [userProfile]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName.trim()) return;

    if (userProfile) {
      updateFlavorProfile(flavorProfile);
      setIsEditing(false);
    } else {
      registerUser(userName.trim(), flavorProfile);
    }
  };

  const handleFlavorChange = (key: keyof FlavorProfile, value: number) => {
    setFlavorProfile((prev) => ({ ...prev, [key]: value }));
  };

  const getFlavorEmoji = (key: string, value: number) => {
    if (key === 'sweet') {
      return ['🍬', '🍭', '🍩', '🍰', '🧁'][value - 1] || '🍬';
    }
    if (key === 'spicy') {
      return ['🌶️', '🌶️', '🌶️🔥', '🔥', '🔥💀'][value - 1] || '🌶️';
    }
    if (key === 'sour') {
      return ['🍋', '🍊', '🍅', '🥝', '🍈'][value - 1] || '🍋';
    }
    return '🍴';
  };

  const handleAddIngredient = () => {
    setNewRecipe((prev) => ({
      ...prev,
      ingredients: [...prev.ingredients, ''],
    }));
  };

  const handleIngredientChange = (index: number, value: string) => {
    setNewRecipe((prev) => {
      const ingredients = [...prev.ingredients];
      ingredients[index] = value;
      return { ...prev, ingredients };
    });
  };

  const handleRemoveIngredient = (index: number) => {
    if (newRecipe.ingredients.length <= 1) return;
    setNewRecipe((prev) => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index),
    }));
  };

  const handleAddStep = () => {
    setNewRecipe((prev) => ({
      ...prev,
      steps: [...prev.steps, ''],
    }));
  };

  const handleStepChange = (index: number, value: string) => {
    setNewRecipe((prev) => {
      const steps = [...prev.steps];
      steps[index] = value;
      return { ...prev, steps };
    });
  };

  const handleRemoveStep = (index: number) => {
    if (newRecipe.steps.length <= 1) return;
    setNewRecipe((prev) => ({
      ...prev,
      steps: prev.steps.filter((_, i) => i !== index),
    }));
  };

  const handleCreateRecipe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRecipe.name.trim()) return;

    const validIngredients = newRecipe.ingredients.filter((i) => i.trim());
    const validSteps = newRecipe.steps.filter((s) => s.trim());

    if (validIngredients.length === 0 || validSteps.length === 0) return;

    addRecipe({
      name: newRecipe.name,
      cuisine: newRecipe.cuisine,
      difficulty: newRecipe.difficulty,
      cookTime: newRecipe.cookTime,
      ingredients: validIngredients,
      steps: validSteps,
      coverImage: newRecipe.coverImage || 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=600&h=400&fit=crop',
      story: newRecipe.story,
      flavorProfile: newRecipe.flavorProfile,
    });

    setShowCreateForm(false);
    setNewRecipe({
      name: '',
      cuisine: '中式',
      difficulty: '简单',
      cookTime: 30,
      story: '',
      ingredients: [''],
      steps: [''],
      coverImage: '',
      flavorProfile: { sweet: 3, spicy: 3, sour: 3 },
    });
  };

  const cuisines = ['中式', '法式', '意式', '日式', '韩式', '泰式', '其他'];
  const difficulties = ['简单', '中等', '困难'] as const;

  return (
    <div className="profile-page">
      <div className="profile-card">
        <h1 className="profile-title">
          {userProfile ? '我的口味档案' : '加入味蕾社区'}
        </h1>
        <p className="profile-subtitle">
          {userProfile ? '调整你的口味偏好，发现更多美味' : '设置你的口味偏好，让美食来找你'}
        </p>

        {userProfile && !isEditing ? (
          <div>
            <div className="profile-info">
              <div className="profile-info-name">{userProfile.userName}</div>
              <div className="profile-info-date">
                加入于 {format(new Date(userProfile.registeredAt), 'yyyy年M月d日', { locale: zhCN })}
              </div>
              <div className="flavor-preview">
                <div className="flavor-preview-item">
                  <span className="flavor-preview-icon">
                    {getFlavorEmoji('sweet', userProfile.flavorProfile.sweet)}
                  </span>
                  <span>甜度</span>
                  <span className="flavor-preview-value">{userProfile.flavorProfile.sweet}/5</span>
                </div>
                <div className="flavor-preview-item">
                  <span className="flavor-preview-icon">
                    {getFlavorEmoji('spicy', userProfile.flavorProfile.spicy)}
                  </span>
                  <span>辣度</span>
                  <span className="flavor-preview-value">{userProfile.flavorProfile.spicy}/5</span>
                </div>
                <div className="flavor-preview-item">
                  <span className="flavor-preview-icon">
                    {getFlavorEmoji('sour', userProfile.flavorProfile.sour)}
                  </span>
                  <span>酸度</span>
                  <span className="flavor-preview-value">{userProfile.flavorProfile.sour}/5</span>
                </div>
              </div>
            </div>

            <button
              className="submit-btn"
              onClick={() => setIsEditing(true)}
              style={{ marginBottom: 16 }}
            >
              编辑口味偏好
            </button>

            <button
              className="submit-btn"
              onClick={() => setShowCreateForm(!showCreateForm)}
              style={{
                background: '#8B0000',
                boxShadow: '0 4px 12px rgba(139, 0, 0, 0.3)',
              }}
            >
              {showCreateForm ? '取消创建' : '📝 创建新食谱'}
            </button>

            {showCreateForm && (
              <form onSubmit={handleCreateRecipe} style={{ marginTop: 24 }}>
                <h2 className="detail-section-title" style={{ marginBottom: 20 }}>
                  ✏️ 新食谱卡
                </h2>

                <div className="form-group">
                  <label className="form-label">菜名</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newRecipe.name}
                    onChange={(e) => setNewRecipe((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="给你的食谱起个名字"
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 24 }}>
                  <div>
                    <label className="form-label">菜系</label>
                    <select
                      className="form-input"
                      value={newRecipe.cuisine}
                      onChange={(e) => setNewRecipe((prev) => ({ ...prev, cuisine: e.target.value }))}
                    >
                      {cuisines.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="form-label">难度</label>
                    <select
                      className="form-input"
                      value={newRecipe.difficulty}
                      onChange={(e) => setNewRecipe((prev) => ({ ...prev, difficulty: e.target.value as '简单' | '中等' | '困难' }))}
                    >
                      {difficulties.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="form-label">烹饪时间(分钟)</label>
                    <input
                      type="number"
                      className="form-input"
                      value={newRecipe.cookTime}
                      onChange={(e) => setNewRecipe((prev) => ({ ...prev, cookTime: parseInt(e.target.value) || 0 }))}
                      min={1}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">封面图片URL</label>
                  <input
                    type="url"
                    className="form-input"
                    value={newRecipe.coverImage}
                    onChange={(e) => setNewRecipe((prev) => ({ ...prev, coverImage: e.target.value }))}
                    placeholder="可选，留空使用默认图片"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">🥘 食材列表</label>
                  {newRecipe.ingredients.map((ingredient, index) => (
                    <div key={index} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                      <input
                        type="text"
                        className="form-input"
                        value={ingredient}
                        onChange={(e) => handleIngredientChange(index, e.target.value)}
                        placeholder={`食材 ${index + 1}`}
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveIngredient(index)}
                        style={{
                          padding: '0 12px',
                          border: '2px solid #D4C5A9',
                          background: '#FFF8E7',
                          borderRadius: 8,
                          cursor: 'pointer',
                          color: '#8B0000',
                          fontWeight: 'bold',
                        }}
                      >
                        -
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={handleAddIngredient}
                    style={{
                      marginTop: 8,
                      padding: '8px 16px',
                      border: '2px dashed #D4C5A9',
                      background: 'transparent',
                      borderRadius: 8,
                      cursor: 'pointer',
                      color: '#6B7F99',
                      width: '100%',
                      fontFamily: 'inherit',
                    }}
                  >
                    + 添加食材
                  </button>
                </div>

                <div className="form-group">
                  <label className="form-label">👩‍🍳 烹饪步骤</label>
                  {newRecipe.steps.map((step, index) => (
                    <div key={index} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                      <div style={{
                        flexShrink: 0,
                        width: 32,
                        height: 32,
                        background: '#2C4A6E',
                        color: '#FFF8E7',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 'bold',
                        marginTop: 6,
                      }}>
                        {index + 1}
                      </div>
                      <textarea
                        className="form-input"
                        value={step}
                        onChange={(e) => handleStepChange(index, e.target.value)}
                        placeholder={`步骤 ${index + 1}`}
                        rows={2}
                        style={{ resize: 'vertical' }}
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveStep(index)}
                        style={{
                          padding: '0 12px',
                          border: '2px solid #D4C5A9',
                          background: '#FFF8E7',
                          borderRadius: 8,
                          cursor: 'pointer',
                          color: '#8B0000',
                          fontWeight: 'bold',
                          alignSelf: 'flex-start',
                          marginTop: 6,
                        }}
                      >
                        -
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={handleAddStep}
                    style={{
                      marginTop: 8,
                      padding: '8px 16px',
                      border: '2px dashed #D4C5A9',
                      background: 'transparent',
                      borderRadius: 8,
                      cursor: 'pointer',
                      color: '#6B7F99',
                      width: '100%',
                      fontFamily: 'inherit',
                    }}
                  >
                    + 添加步骤
                  </button>
                </div>

                <div className="form-group">
                  <label className="form-label">📖 背后的故事</label>
                  <textarea
                    className="form-input"
                    value={newRecipe.story}
                    onChange={(e) => setNewRecipe((prev) => ({ ...prev, story: e.target.value }))}
                    placeholder="讲讲这道菜背后的故事..."
                    rows={3}
                    style={{ resize: 'vertical' }}
                  />
                </div>

                <div style={{ marginBottom: 24 }}>
                  <label className="form-label">🎨 口味特征</label>
                  <div style={{ display: 'flex', gap: 24 }}>
                    {(['sweet', 'spicy', 'sour'] as const).map((key) => (
                      <div key={key} style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, marginBottom: 6, color: '#6B7F99' }}>
                          {key === 'sweet' ? '甜度' : key === 'spicy' ? '辣度' : '酸度'}
                        </div>
                        <input
                          type="range"
                          min={1}
                          max={5}
                          value={newRecipe.flavorProfile[key]}
                          onChange={(e) => setNewRecipe((prev) => ({
                            ...prev,
                            flavorProfile: {
                              ...prev.flavorProfile,
                              [key]: parseInt(e.target.value),
                            },
                          }))}
                          className="slider"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <button type="submit" className="submit-btn">
                  📜 创建食谱卡片
                </button>
              </form>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {!userProfile && (
              <div className="form-group">
                <label className="form-label">你的昵称</label>
                <input
                  type="text"
                  className="form-input"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="给美食之旅起个名字吧~"
                  required
                />
              </div>
            )}

            <div style={{ marginBottom: 24 }}>
              <h3 style={{
                fontFamily: "'Caveat', cursive",
                fontSize: 24,
                color: '#8B0000',
                marginBottom: 20,
                textAlign: 'center',
              }}>
                🎨 调整你的口味偏好
              </h3>

              <div className="slider-group">
                <div className="slider-header">
                  <span className="slider-label">
                    {getFlavorEmoji('sweet', flavorProfile.sweet)} 甜度
                  </span>
                  <span className="slider-value">{flavorProfile.sweet}/5</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={5}
                  value={flavorProfile.sweet}
                  onChange={(e) => handleFlavorChange('sweet', parseInt(e.target.value))}
                  className="slider"
                />
                <div className="slider-labels">
                  <span>清淡</span>
                  <span>超甜</span>
                </div>
              </div>

              <div className="slider-group">
                <div className="slider-header">
                  <span className="slider-label">
                    {getFlavorEmoji('spicy', flavorProfile.spicy)} 辣度
                  </span>
                  <span className="slider-value">{flavorProfile.spicy}/5</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={5}
                  value={flavorProfile.spicy}
                  onChange={(e) => handleFlavorChange('spicy', parseInt(e.target.value))}
                  className="slider"
                />
                <div className="slider-labels">
                  <span>完全不辣</span>
                  <span>爆辣</span>
                </div>
              </div>

              <div className="slider-group">
                <div className="slider-header">
                  <span className="slider-label">
                    {getFlavorEmoji('sour', flavorProfile.sour)} 酸度
                  </span>
                  <span className="slider-value">{flavorProfile.sour}/5</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={5}
                  value={flavorProfile.sour}
                  onChange={(e) => handleFlavorChange('sour', parseInt(e.target.value))}
                  className="slider"
                />
                <div className="slider-labels">
                  <span>不酸</span>
                  <span>超酸</span>
                </div>
              </div>
            </div>

            <button type="submit" className="submit-btn">
              {userProfile ? '保存修改' : '🎉 开启美食之旅'}
            </button>

            {isEditing && (
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  if (userProfile) {
                    setFlavorProfile(userProfile.flavorProfile);
                  }
                }}
                style={{
                  width: '100%',
                  marginTop: 12,
                  padding: '12px',
                  background: 'transparent',
                  color: '#6B7F99',
                  border: '2px solid #D4C5A9',
                  borderRadius: 28,
                  fontSize: 16,
                  fontFamily: 'inherit',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                }}
              >
                取消
              </button>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
