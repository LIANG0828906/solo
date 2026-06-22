import { useState, useCallback } from 'react';
import Calendar from './components/Calendar';
import Panel from './components/Panel';
import Stats from './components/Stats';

export default function App() {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [refreshSignal, setRefreshSignal] = useState(0);

  const handleCellClick = useCallback((date: Date) => {
    setSelectedDate(date);
  }, []);

  const handleClosePanel = useCallback(() => {
    setSelectedDate(null);
  }, []);

  const handleRecordSaved = useCallback(() => {
    setRefreshSignal((s) => s + 1);
  }, []);

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>☀️ 情绪天气日志 🌧️</h1>
        <p>像记录天气一样，记录每日的心情波动</p>
      </header>

      <div className="app-main">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <Calendar
            refreshSignal={refreshSignal}
            onCellClick={handleCellClick}
          />
        </div>
        <Stats refreshSignal={refreshSignal} />
      </div>

      {selectedDate && (
        <Panel
          date={selectedDate}
          onClose={handleClosePanel}
          onSaved={handleRecordSaved}
        />
      )}
    </div>
  );
}
