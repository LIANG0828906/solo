import { useEffect } from 'react';
import StoryCanvas from '@/components/StoryCanvas';
import SidePanel from '@/components/SidePanel';
import BottomPanel from '@/components/BottomPanel';
import { useStoryStore } from '@/store/storyStore';

function App() {
  const loadFromDB = useStoryStore((state) => state.loadFromDB);
  const isLoading = useStoryStore((state) => state.isLoading);

  useEffect(() => {
    loadFromDB();
  }, [loadFromDB]);

  if (isLoading) {
    return (
      <div className="app-loading">
        <div className="loading-spinner"></div>
        <p>加载中...</p>
      </div>
    );
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <h1 className="app-title">StoryboardForge</h1>
        <p className="app-subtitle">可视化故事板创作工具</p>
      </header>
      <main className="app-main">
        <StoryCanvas />
        <SidePanel />
      </main>
      <BottomPanel />
    </div>
  );
}

export default App;
