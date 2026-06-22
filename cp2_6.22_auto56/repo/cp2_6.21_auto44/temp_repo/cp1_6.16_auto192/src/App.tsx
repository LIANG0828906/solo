import { useEffect } from 'react';
import PoemDisplay from './components/PoemDisplay';
import ControlPanel from './components/ControlPanel';
import { usePoemStore, themeConfig } from './store/poemStore';
import './App.css';

function App() {
  const { theme, isPlaying, setIsPlaying, currentPoemIndex, printPosition } = usePoemStore();
  const currentTheme = themeConfig[theme];

  useEffect(() => {
    if (printPosition === 0 && !isPlaying) {
      setIsPlaying(true);
    }
  }, [currentPoemIndex]);

  const appStyle: React.CSSProperties = {
    backgroundColor: currentTheme.backgroundColor,
    transition: 'background-color 0.3s ease-in-out',
  };

  return (
    <div className="app" style={appStyle}>
      <div className="app-content">
        <PoemDisplay />
        <ControlPanel />
      </div>
    </div>
  );
}

export default App;
