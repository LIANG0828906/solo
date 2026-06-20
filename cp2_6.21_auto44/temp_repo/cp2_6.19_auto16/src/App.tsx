import { useEffect, useState, memo } from 'react';
import { BarrageWall } from './modules/barrage/BarrageWall';
import { BarrageInput } from './modules/barrage/BarrageInput';
import { useBarrageStore } from './stores/useBarrageStore';

const AnimatedNumber = memo(function AnimatedNumber({ value }: { value: number }) {
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    if (display === value) return;
    const diff = value - display;
    const duration = 600;
    const start = performance.now();
    const startValue = display;

    let frame = 0;
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(startValue + diff * eased));
      if (progress < 1) {
        frame = requestAnimationFrame(animate);
      }
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [value, display]);

  return <span className="animated-number">{display.toLocaleString()}</span>;
});

const StatCard = memo(function StatCard({
  icon,
  label,
  value
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="stat-card">
      <div className="stat-icon">{icon}</div>
      <div className="stat-info">
        <AnimatedNumber value={value} />
        <div className="stat-label">{label}</div>
      </div>
    </div>
  );
});

function App() {
  const generateInitialBarrages = useBarrageStore((s) => s.generateInitialBarrages);
  const updateOnlineUsers = useBarrageStore((s) => s.updateOnlineUsers);
  const statistics = useBarrageStore((s) => s.statistics);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!initialized) {
      generateInitialBarrages();
      setInitialized(true);
    }
  }, [initialized, generateInitialBarrages]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      updateOnlineUsers();
    }, 3000);
    return () => window.clearInterval(interval);
  }, [updateOnlineUsers]);

  useEffect(() => {
    const samples = [
      'Welcome! Hello world',
      'こんにちは、素晴らしい！',
      '今天的直播真精彩',
      '대박! 멋져요!',
      'Incroyable spectacle!',
      'Amazing performance!',
      '加油加油！冲鸭！',
      'すごい技術だ！',
      '화이팅! 최고예요!',
      'Merci pour ce stream'
    ];
    let idx = 0;
    const interval = window.setInterval(() => {
      const store = useBarrageStore.getState();
      if (store.barrages.length < 80) {
        const text = samples[idx % samples.length];
        void store.addBarrage(text);
        idx++;
      }
    }, 2500);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <div className="app-container">
      <div className="app-header">
        <div className="app-title">
          <span className="title-glow">🌐</span>
          <h1>跨语言弹幕翻译互动墙</h1>
        </div>
      </div>

      <BarrageWall />

      <div className="stats-bar">
        <StatCard
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 00-3-3.87" />
              <path d="M16 3.13a4 4 0 010 7.75" />
            </svg>
          }
          label="在线观众"
          value={statistics.onlineUsers}
        />
        <StatCard
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
            </svg>
          }
          label="总弹幕数"
          value={statistics.totalBarrages}
        />
        <StatCard
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 8l6 6L19 6" />
              <path d="M12 2a10 10 0 1010 10" />
            </svg>
          }
          label="翻译请求"
          value={statistics.translationRequests}
        />
      </div>

      <BarrageInput />
    </div>
  );
}

export default App;
