import { useMoodStore } from './store';

function App() {
  const { currentView, setCurrentView } = useMoodStore();

  return (
    <div className="app-container">
      <main className="main-content">
        <h1>心情记录应用</h1>
        <p>当前视图: {currentView}</p>
        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
          <button className="btn-primary" onClick={() => setCurrentView('record')}>
            记录心情
          </button>
          <button className="btn-secondary" onClick={() => setCurrentView('calendar')}>
            日历
          </button>
          <button className="btn-secondary" onClick={() => setCurrentView('analysis')}>
            分析
          </button>
          <button className="btn-secondary" onClick={() => setCurrentView('report')}>
            周报
          </button>
        </div>
      </main>
    </div>
  );
}

export default App;
