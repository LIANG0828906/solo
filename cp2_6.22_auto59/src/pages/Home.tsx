import { useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Dashboard from '@/components/Dashboard';
import ReminderBanner from '@/components/ReminderBanner';
import { useNutritionStore } from '@/store/useNutritionStore';

export default function Home() {
  const { selectedDate, fetchTodayLogs, fetchGoals, fetchRecentLogs, checkAndShowNotification } =
    useNutritionStore();

  useEffect(() => {
    const refresh = async () => {
      await Promise.all([fetchTodayLogs(), fetchGoals(), fetchRecentLogs()]);
      checkAndShowNotification();
    };
    refresh();
  }, [selectedDate, fetchTodayLogs, fetchGoals, fetchRecentLogs, checkAndShowNotification]);

  return (
    <div className="min-h-screen bg-surface-bg">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-24 pb-12">
        <ReminderBanner />
        <Dashboard />
      </main>
    </div>
  );
}
