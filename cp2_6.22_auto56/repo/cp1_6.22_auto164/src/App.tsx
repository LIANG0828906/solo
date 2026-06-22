import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from './store';
import { fetchRecipes, fetchWeekPlan, resetAllData, setSelectedDay } from './store/appSlice';
import WeekGrid from './components/WeekGrid';
import DailySummary from './components/DailySummary';
import WeeklyBarChart from './components/WeeklyBarChart';
import NutritionPieChart from './components/NutritionPieChart';
import RecipeManager from './components/RecipeManager';
import ConfirmModal from './components/ConfirmModal';
import './styles.css';

export default function App() {
  const dispatch = useDispatch<AppDispatch>();
  const selectedDay = useSelector((state: RootState) => state.app.selectedDay);
  const [showRecipeManager, setShowRecipeManager] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [mobilePanelOpen, setMobilePanelOpen] = useState(false);

  useEffect(() => {
    dispatch(fetchRecipes());
    dispatch(fetchWeekPlan());
  }, [dispatch]);

  const handleReset = () => {
    dispatch(resetAllData());
    setShowResetConfirm(false);
  };

  const dayNames = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-content">
          <h1 className="app-title">🍽️ 菜单规划与营养追踪</h1>
          <div className="header-actions">
            <button className="btn btn-outline" onClick={() => setShowRecipeManager(true)}>
              食谱管理
            </button>
            <button className="btn btn-danger" onClick={() => setShowResetConfirm(true)}>
              重置所有数据
            </button>
          </div>
        </div>
      </header>

      <main className="app-main">
        <div className="main-content">
          <div className="main-left">
            <div className="section-header">
              <h2>本周菜单计划</h2>
              <div className="day-tabs">
                {dayNames.map((name, idx) => (
                  <button
                    key={idx}
                    className={`day-tab ${selectedDay === idx ? 'active' : ''}`}
                    onClick={() => dispatch(setSelectedDay(idx))}
                  >
                    {name}
                  </button>
                ))}
              </div>
            </div>
            <WeekGrid />
          </div>

          <aside className="main-right desktop-only">
            <DailySummary />
            <NutritionPieChart />
          </aside>
        </div>

        <section className="bottom-chart">
          <WeeklyBarChart />
        </section>

        <div
          className={`mobile-panel ${mobilePanelOpen ? 'open' : ''}`}
          onClick={() => setMobilePanelOpen(!mobilePanelOpen)}
        >
          <div className="mobile-panel-handle">
            <div className="handle-bar"></div>
            <span>{mobilePanelOpen ? '收起营养面板' : '查看营养分析'}</span>
          </div>
          {mobilePanelOpen && (
            <div className="mobile-panel-content" onClick={(e) => e.stopPropagation()}>
              <DailySummary />
              <NutritionPieChart />
            </div>
          )}
        </div>
      </main>

      {showRecipeManager && (
        <RecipeManager onClose={() => setShowRecipeManager(false)} />
      )}

      {showResetConfirm && (
        <ConfirmModal
          title="重置所有数据"
          description="确定要重置所有数据吗？所有用户添加的食谱和周计划将被清空，恢复到初始状态。"
          confirmText="确认重置"
          isDanger
          onConfirm={handleReset}
          onCancel={() => setShowResetConfirm(false)}
        />
      )}
    </div>
  );
}
