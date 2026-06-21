import { useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Calendar, Settings, ClipboardList, Plus, RefreshCw } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { mealTypeLabels } from '@/utils/nutrition';
import type { MealPlanItem, MealPlanDay } from '@/types';

const dayNames = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack1', 'snack2'] as const;

function getTodayDate(): string {
  const today = new Date();
  return today.toISOString().split('T')[0];
}

function getCurrentTime(): string {
  const now = new Date();
  return now.toTimeString().slice(0, 5);
}

export default function MealPlan() {
  const navigate = useNavigate();
  const { mealPlan, isLoading, fetchMealPlan, addRecord, fetchRecords, fetchGoals } = useStore();

  useEffect(() => {
    fetchMealPlan();
  }, [fetchMealPlan]);

  const handleAddToToday = async (item: MealPlanItem, mealType: string, dayOffset: number) => {
    const date = new Date();
    date.setDate(date.getDate() + dayOffset);
    const dateStr = date.toISOString().split('T')[0];

    const today = getTodayDate();
    if (dateStr === today) {
      await addRecord({
        foodId: item.foodId,
        foodName: item.foodName,
        amount: item.amount,
        mealType: mealType as 'breakfast' | 'lunch' | 'dinner' | 'snack1' | 'snack2',
        date: getTodayDate(),
        time: getCurrentTime(),
        protein: 0,
        carbs: 0,
        fat: 0,
        calories: 0,
      });
      fetchRecords(getTodayDate());
      fetchGoals();
      navigate('/');
    } else {
      alert('只能添加到今天的记录');
    }
  };

  const handleRefresh = () => {
    fetchMealPlan();
  };

  if (isLoading) {
    return (
      <div className="app-container">
        <div className="left-panel">
          <nav className="nav">
            <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <Calendar size={16} style={{ display: 'inline', marginRight: '6px' }} />
              首页
            </NavLink>
            <NavLink to="/settings" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <Settings size={16} style={{ display: 'inline', marginRight: '6px' }} />
              设置
            </NavLink>
            <NavLink to="/plan" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <ClipboardList size={16} style={{ display: 'inline', marginRight: '6px' }} />
              食谱
            </NavLink>
          </nav>
          <h1 className="page-title">周食谱计划</h1>
        </div>
        <div className="center-panel">
          <div className="loading">正在生成食谱...</div>
        </div>
        <div className="right-panel" />
      </div>
    );
  }

  if (!mealPlan) {
    return (
      <div className="app-container">
        <div className="left-panel">
          <nav className="nav">
            <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <Calendar size={16} style={{ display: 'inline', marginRight: '6px' }} />
              首页
            </NavLink>
            <NavLink to="/settings" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <Settings size={16} style={{ display: 'inline', marginRight: '6px' }} />
              设置
            </NavLink>
            <NavLink to="/plan" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <ClipboardList size={16} style={{ display: 'inline', marginRight: '6px' }} />
              食谱
            </NavLink>
          </nav>
          <h1 className="page-title">周食谱计划</h1>
        </div>
        <div className="center-panel">
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <p>暂无食谱计划</p>
            <button className="btn btn-primary" style={{ marginTop: '16px' }} onClick={handleRefresh}>
              生成食谱
            </button>
          </div>
        </div>
        <div className="right-panel" />
      </div>
    );
  }

  return (
    <div className="app-container">
      <div className="left-panel">
        <nav className="nav">
          <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <Calendar size={16} style={{ display: 'inline', marginRight: '6px' }} />
            首页
          </NavLink>
          <NavLink to="/settings" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <Settings size={16} style={{ display: 'inline', marginRight: '6px' }} />
            设置
          </NavLink>
          <NavLink to="/plan" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <ClipboardList size={16} style={{ display: 'inline', marginRight: '6px' }} />
            食谱
          </NavLink>
        </nav>

        <h1 className="page-title">周食谱计划</h1>

        <button className="btn btn-small" onClick={handleRefresh} style={{ width: '100%' }}>
          <RefreshCw size={14} style={{ display: 'inline', marginRight: '6px' }} />
          重新生成
        </button>

        <div style={{ marginTop: '24px', fontSize: '13px', color: '#666', lineHeight: '1.6' }}>
          <p style={{ marginBottom: '8px' }}><strong>使用说明：</strong></p>
          <p>• 点击食物旁的 ➕ 按钮可添加到今日对应餐段</p>
          <p>• 食谱基于您过去7天的摄入情况和营养目标生成</p>
          <p>• 每日包含早餐、午餐、晚餐和两顿加餐</p>
        </div>
      </div>

      <div className="center-panel" style={{ overflowX: 'auto' }}>
        <table className="table">
          <thead>
            <tr>
              <th style={{ width: '100px' }}>餐段</th>
              {dayNames.map((day) => (
                <th key={day} className="plan-day-header">
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {mealTypes.map((mealType) => (
              <tr key={mealType}>
                <td style={{ fontWeight: '600', backgroundColor: '#f8f9fa' }}>
                  {mealTypeLabels[mealType]}
                </td>
                {mealPlan.map((day: MealPlanDay, dayIndex: number) => (
                  <td key={dayIndex} className="plan-cell">
                    {day[mealType].length === 0 ? (
                      <span style={{ color: '#ccc', fontSize: '12px' }}>-</span>
                    ) : (
                      day[mealType].map((item: MealPlanItem, itemIndex: number) => (
                        <div key={itemIndex} className="plan-cell-item">
                          <div>
                            <div className="plan-cell-food">
                              {item.foodName} ({item.amount}g)
                            </div>
                            <div className="plan-cell-calories">
                              {item.calories} kcal
                            </div>
                          </div>
                          <button
                            className="plan-add-btn"
                            onClick={() => handleAddToToday(item, mealType, dayIndex)}
                            title="添加到今日"
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                      ))
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="right-panel">
        <h2 className="section-title">营养目标</h2>
        <div style={{ fontSize: '14px', lineHeight: '2' }}>
          <p>🍽️ 每日 5 餐：早、中、晚 + 2次加餐</p>
          <p>⚖️ 热量分配：早餐25%、午餐35%、晚餐30%、加餐各5%</p>
          <p>💪 蛋白质：25% 总热量</p>
          <p>🍞 碳水：50% 总热量</p>
          <p>🥑 脂肪：25% 总热量</p>
        </div>
        <div style={{ marginTop: '24px', padding: '16px', backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          <p style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>今日提示</p>
          <p style={{ fontSize: '13px', lineHeight: '1.6' }}>
            点击表格中的 ➕ 按钮，可快速将食谱中的食物添加到您今日的饮食记录中。
            记得根据实际情况调整摄入量哦！
          </p>
        </div>
      </div>
    </div>
  );
}
