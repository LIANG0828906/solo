import { useState, useEffect } from 'react';
import LogPanel from './components/LogPanel';
import CalendarHeatmap from './components/CalendarHeatmap';

function App() {
  const [appLoaded, setAppLoaded] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setAppLoaded(true), 10);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className={`app-container ${appLoaded ? 'app-enter' : ''}`}>
      <LogPanel />
      <CalendarHeatmap />
    </div>
  );
}

export default App;
