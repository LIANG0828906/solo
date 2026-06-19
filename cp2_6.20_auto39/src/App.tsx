import React, { useCallback } from 'react';
import Timeline from '@/components/Timeline';
import AddEventButton from '@/components/AddEventButton';
import { useTimelineStore } from '@/store/useTimelineStore';

const App: React.FC = function App() {
  const { events } = useTimelineStore();

  const handleScrollToBottom = useCallback(() => {
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: 'smooth',
    });
  }, []);

  React.useEffect(() => {
    if (events.length > 0) {
      const timer = setTimeout(() => {
        handleScrollToBottom();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [events.length, handleScrollToBottom]);

  return (
    <div className="min-h-screen bg-[#faf6f0]">
      <header className="py-12 px-4 text-center border-b border-gray-200/50">
        <h1 className="text-4xl font-bold text-gray-800 mb-3">
          我的人生时间线
        </h1>
        <p className="text-gray-500 max-w-xl mx-auto">
          记录每一个重要时刻，打造专属的人生纪念册
        </p>
        <div className="mt-4 text-sm text-gray-400">
          共 {events.length} 个珍贵回忆
        </div>
      </header>

      <main>
        <Timeline events={events} />
      </main>

      <AddEventButton />
    </div>
  );
};

export default App;
