import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import TimelinePage from './pages/TimelinePage';
import { useTimelineStore } from './store';

const App = () => {
  const initDB = useTimelineStore((state) => state.initDB);
  const timelines = useTimelineStore((state) => state.timelines);
  const events = useTimelineStore((state) => state.events);

  useEffect(() => {
    initDB();
  }, [initDB]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1 }}>
        <Router>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/timeline/:id" element={<TimelinePage />} />
          </Routes>
        </Router>
      </div>
      <div
        style={{
          padding: '16px',
          textAlign: 'center',
          fontSize: '12px',
          color: '#888899',
          borderTop: '1px solid #2A2A3E',
        }}
      >
        已保存 {timelines.length} 条时间线 {events.length} 个事件
      </div>
    </div>
  );
};

export default App;
