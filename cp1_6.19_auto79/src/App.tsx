import { useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ViewType, TimeBlock } from '@/types/types';
import { useTimeStore, getCurrentDate } from '@/data/store';
import Timeline from '@/components/Timeline';
import Statistics from '@/components/Statistics';
import GoalProgress from '@/components/GoalProgress';
import TabBar from '@/components/TabBar';

export default function App() {
  const [currentView, setCurrentView] = useState<ViewType>('day');
  const blocks = useTimeStore((state) => state.blocks);
  const createBlock = useTimeStore((state) => state.createBlock);
  const updateBlock = useTimeStore((state) => state.updateBlock);
  const deleteBlock = useTimeStore((state) => state.deleteBlock);
  const getWeeklyStats = useTimeStore((state) => state.getWeeklyStats);
  const getDailyProgress = useTimeStore((state) => state.getDailyProgress);

  const today = getCurrentDate();
  const dailyProgress = getDailyProgress(today);
  const weeklyStats = getWeeklyStats();

  const handleBlockCreate = useCallback((block: Omit<TimeBlock, 'id'>) => {
    createBlock(block);
  }, [createBlock]);

  const handleBlockEdit = useCallback((id: string, updates: Partial<TimeBlock>) => {
    updateBlock(id, updates);
  }, [updateBlock]);

  const handleBlockDelete = useCallback((id: string) => {
    deleteBlock(id);
  }, [deleteBlock]);

  return (
    <div className="h-screen flex flex-col bg-[#0F0F23] overflow-hidden">
      <header className="flex-shrink-0 bg-[#1E1E3F] border-b border-[#3A3A5C] px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="text-[#6C63FF]">⏱</span>
            时间规划
          </h1>
          <div className="text-sm text-gray-400 font-mono">
            {today}
          </div>
        </div>
      </header>

      <GoalProgress progress={dailyProgress} />

      <main className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {currentView !== 'statistics' ? (
            <motion.div
              key="timeline"
              className="h-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Timeline
                viewType={currentView}
                blocks={blocks}
                onBlockCreate={handleBlockCreate}
                onBlockEdit={handleBlockEdit}
                onBlockDelete={handleBlockDelete}
              />
            </motion.div>
          ) : (
            <motion.div
              key="statistics"
              className="h-full overflow-hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Statistics stats={weeklyStats} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <TabBar currentView={currentView} onViewChange={setCurrentView} />
    </div>
  );
}
