import React, { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { useIdeaStore } from '@/store';
import IdeaList from '@/components/IdeaList';
import IdeaDetail from '@/components/IdeaDetail';
import GanttChart from '@/components/GanttChart';
import Dashboard from '@/components/Dashboard';

const CelebrationModal: React.FC = () => {
  const { isCelebrating } = useIdeaStore();

  if (!isCelebrating.show) return null;

  return (
    <div
      className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[60] pointer-events-none"
    >
      <div
        className="glass animate-celebrate flex items-center gap-3 px-5 py-4 rounded-2xl"
        style={{
          background:
            'linear-gradient(135deg, rgba(34, 197, 94, 0.2) 0%, rgba(16, 185, 129, 0.2) 100%)',
          borderColor: 'rgba(34, 197, 94, 0.3)',
          boxShadow: '0 20px 50px rgba(34, 197, 94, 0.25)',
        }}
      >
        <div className="w-12 h-12 rounded-2xl bg-emerald-500/30 flex items-center justify-center flex-shrink-0">
          <svg
            className="w-7 h-7 text-emerald-400 animate-checkmark"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={3}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <div>
          <div className="font-semibold text-emerald-300">🎉 太棒了！</div>
          <div className="text-sm text-slate-300 mt-0.5">
            里程碑「<span className="font-medium text-white">{isCelebrating.milestoneName}</span>」已完成
          </div>
        </div>
      </div>
      {Array.from({ length: 12 }).map((_, i) => {
        const angle = (i / 12) * Math.PI * 2;
        const distance = 60 + Math.random() * 30;
        const colors = ['#fbbf24', '#f472b6', '#34d399', '#60a5fa', '#a78bfa'];
        const color = colors[i % colors.length];
        const size = 4 + Math.random() * 4;
        return (
          <span
            key={i}
            className="absolute left-1/2 top-1/2 animate-particle rounded-full"
            style={
              {
                width: size,
                height: size,
                background: color,
                boxShadow: `0 0 12px ${color}`,
                '--tx': `${Math.cos(angle) * distance}px`,
                '--ty': `${Math.sin(angle) * distance}px`,
              } as React.CSSProperties
            }
          />
        );
      })}
    </div>
  );
};

const App: React.FC = () => {
  const loadIdeas = useIdeaStore((s) => s.loadIdeas);

  useEffect(() => {
    loadIdeas();
  }, [loadIdeas]);

  return (
    <BrowserRouter>
      <div className="h-screen w-screen overflow-hidden flex">
        <div className="h-full w-full flex flex-col md:flex-row">
          <div className="w-full md:w-[380px] lg:w-[420px] h-full flex-shrink-0 md:border-r border-white/10">
            <IdeaList />
          </div>
          <div className="flex-1 h-full">
            <IdeaDetail />
          </div>
        </div>

        <Dashboard />
        <GanttChart />
        <CelebrationModal />
      </div>
    </BrowserRouter>
  );
};

export default App;
