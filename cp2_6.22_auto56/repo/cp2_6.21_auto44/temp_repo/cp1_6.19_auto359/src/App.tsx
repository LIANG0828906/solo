import { useEffect, useState, type FC } from 'react';
import KitchenBoard from './components/KitchenBoard';
import StationPanel from './components/StationPanel';
import { useOrderStore } from './store/orderStore';

function formatClock(date: Date): string {
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  const s = String(date.getSeconds()).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

const App: FC = () => {
  const { initSocket, orders } = useOrderStore();
  const [clock, setClock] = useState(new Date());

  useEffect(() => {
    const cleanup = initSocket();
    const timer = setInterval(() => setClock(new Date()), 1000);
    return () => {
      clearInterval(timer);
      cleanup();
    };
  }, [initSocket]);

  const inTransitCount = orders.filter((o) => o.status !== 'completed').length;

  return (
    <div className="app">
      <header className="app__header">
        <div className="app__clock">{formatClock(clock)}</div>
        <h1 className="app__title">后厨订单看板</h1>
        <div className="app__stats">
          <span className="app__stats-label">在途订单</span>
          <span className="app__stats-value">{inTransitCount}</span>
        </div>
      </header>

      <StationPanel />

      <main className="app__main">
        <KitchenBoard />
      </main>
    </div>
  );
};

export default App;
