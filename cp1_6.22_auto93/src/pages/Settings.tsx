import { useState, useEffect } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import { Calendar, Settings as SettingsIcon, ClipboardList, Save } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { calculateBMR, calculateTDEE, calculateNutritionGoals, activityLevelLabels } from '@/utils/nutrition';
import type { UserProfile } from '@/types';

export default function Settings() {
  const navigate = useNavigate();
  const { profile, fetchProfile, updateProfile, fetchGoals } = useStore();
  const [formData, setFormData] = useState<UserProfile>({
    age: 30,
    gender: 'male',
    height: 175,
    weight: 70,
    activityLevel: 1.55,
  });

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    if (profile) {
      setFormData(profile);
    }
  }, [profile]);

  const handleChange = (field: keyof UserProfile, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await updateProfile(formData);
    if (result) {
      await fetchGoals();
      navigate('/');
    }
  };

  const bmr = calculateBMR(formData);
  const tdee = calculateTDEE(formData);
  const goals = calculateNutritionGoals(formData);

  return (
    <div className="app-container">
      <div className="left-panel">
        <nav className="nav">
          <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <Calendar size={16} style={{ display: 'inline', marginRight: '6px' }} />
            首页
          </NavLink>
          <NavLink to="/settings" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <SettingsIcon size={16} style={{ display: 'inline', marginRight: '6px' }} />
            设置
          </NavLink>
          <NavLink to="/plan" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <ClipboardList size={16} style={{ display: 'inline', marginRight: '6px' }} />
            食谱
          </NavLink>
        </nav>

        <h1 className="page-title">个人设置</h1>
      </div>

      <div className="center-panel">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="label">年龄</label>
            <input
              type="number"
              className="input"
              value={formData.age}
              onChange={(e) => handleChange('age', Number(e.target.value))}
              min="1"
              max="120"
              required
            />
          </div>

          <div className="form-group">
            <label className="label">性别</label>
            <select
              className="select"
              value={formData.gender}
              onChange={(e) => handleChange('gender', e.target.value)}
              required
            >
              <option value="male">男</option>
              <option value="female">女</option>
            </select>
          </div>

          <div className="form-group">
            <label className="label">身高 (cm)</label>
            <input
              type="number"
              className="input"
              value={formData.height}
              onChange={(e) => handleChange('height', Number(e.target.value))}
              min="100"
              max="250"
              required
            />
          </div>

          <div className="form-group">
            <label className="label">体重 (kg)</label>
            <input
              type="number"
              className="input"
              value={formData.weight}
              onChange={(e) => handleChange('weight', Number(e.target.value))}
              min="30"
              max="200"
              required
            />
          </div>

          <div className="form-group">
            <label className="label">活动水平</label>
            <select
              className="select"
              value={formData.activityLevel}
              onChange={(e) => handleChange('activityLevel', Number(e.target.value))}
              required
            >
              {Object.entries(activityLevelLabels).map(([value, label]) => (
                <option key={value} value={Number(value)}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginTop: '24px' }}>
            <h3 className="section-title">计算结果预览</h3>
            <table className="table">
              <tbody>
                <tr>
                  <td>基础代谢率 (BMR)</td>
                  <td><strong>{Math.round(bmr)}</strong> kcal/天</td>
                </tr>
                <tr>
                  <td>每日总能量消耗 (TDEE)</td>
                  <td><strong>{Math.round(tdee)}</strong> kcal/天</td>
                </tr>
                <tr>
                  <td>每日热量目标</td>
                  <td><strong>{goals.calories}</strong> kcal</td>
                </tr>
                <tr>
                  <td>蛋白质目标</td>
                  <td><strong>{goals.protein}</strong> g</td>
                </tr>
                <tr>
                  <td>碳水化合物目标</td>
                  <td><strong>{goals.carbs}</strong> g</td>
                </tr>
                <tr>
                  <td>脂肪目标</td>
                  <td><strong>{goals.fat}</strong> g</td>
                </tr>
              </tbody>
            </table>
          </div>

          <button type="submit" className="btn btn-primary" style={{ marginTop: '24px' }}>
            <Save size={16} style={{ display: 'inline', marginRight: '6px' }} />
            保存设置
          </button>
        </form>
      </div>

      <div className="right-panel">
        <h2 className="section-title">计算公式说明</h2>
        <div style={{ fontSize: '14px', lineHeight: '1.8', color: '#666' }}>
          <p style={{ marginBottom: '16px' }}>
            <strong>Mifflin-St Jeor 公式：</strong>
          </p>
          <p style={{ marginBottom: '12px' }}>
            男性: BMR = 10 × 体重 + 6.25 × 身高 - 5 × 年龄 + 5
          </p>
          <p style={{ marginBottom: '16px' }}>
            女性: BMR = 10 × 体重 + 6.25 × 身高 - 5 × 年龄 - 161
          </p>
          <p style={{ marginBottom: '12px' }}>
            <strong>每日总能量消耗：</strong>
          </p>
          <p style={{ marginBottom: '16px' }}>
            TDEE = BMR × 活动系数
          </p>
          <p style={{ marginBottom: '12px' }}>
            <strong>宏量营养素分配：</strong>
          </p>
          <p>• 蛋白质：25% 总热量 (4kcal/g)</p>
          <p>• 碳水化合物：50% 总热量 (4kcal/g)</p>
          <p>• 脂肪：25% 总热量 (9kcal/g)</p>
        </div>
      </div>
    </div>
  );
}
