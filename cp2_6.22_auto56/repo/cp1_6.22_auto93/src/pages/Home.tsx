import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { Calendar, Settings, ClipboardList } from 'lucide-react';
import FoodSearch from '@/components/FoodSearch';
import AddFoodModal from '@/components/AddFoodModal';
import Timeline from '@/components/Timeline';
import Dashboard from '@/components/Dashboard';
import { useStore } from '@/store/useStore';
import type { Food, FoodRecord } from '@/types';

function getTodayDate(): string {
  const today = new Date();
  return today.toISOString().split('T')[0];
}

function getCurrentTime(): string {
  const now = new Date();
  return now.toTimeString().slice(0, 5);
}

export default function Home() {
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const { foods, records, goals, fetchFoods, fetchRecords, fetchGoals, addRecord, deleteRecord } = useStore();
  const today = getTodayDate();
  const todayRecords = records.filter((r: FoodRecord) => r.date === today);

  useEffect(() => {
    fetchFoods();
    fetchRecords(today);
    fetchGoals();
  }, [fetchFoods, fetchRecords, fetchGoals, today]);

  const handleSearch = (query: string) => {
    fetchFoods(query);
  };

  const handleAddFood = async (amount: number, mealType: string) => {
    if (!selectedFood) return;

    const date = getTodayDate();
    const time = getCurrentTime();

    await addRecord({
      foodId: selectedFood.id,
      foodName: selectedFood.name,
      amount,
      mealType: mealType as 'breakfast' | 'lunch' | 'dinner' | 'snack1' | 'snack2',
      date,
      time,
      protein: 0,
      carbs: 0,
      fat: 0,
      calories: 0,
    });

    fetchRecords(today);
    fetchGoals();
  };

  const handleDeleteRecord = async (id: string) => {
    await deleteRecord(id);
    fetchGoals();
  };

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

        <h1 className="page-title">营养追踪</h1>

        <FoodSearch
          foods={foods}
          onSelectFood={setSelectedFood}
          onSearch={handleSearch}
        />
      </div>

      <div className="center-panel">
        <h2 className="section-title">
          {new Date().toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'long',
          })}
        </h2>
        <Timeline records={todayRecords} onDelete={handleDeleteRecord} />
      </div>

      <div className="right-panel">
        <Dashboard records={todayRecords} goals={goals} />
      </div>

      <AddFoodModal
        food={selectedFood}
        onClose={() => setSelectedFood(null)}
        onAdd={handleAddFood}
      />
    </div>
  );
}
