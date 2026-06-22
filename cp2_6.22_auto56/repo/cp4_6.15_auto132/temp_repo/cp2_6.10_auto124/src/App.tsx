import { useEffect } from 'react';
import Scene from './components/Scene';
import UIOverlay from './components/UIOverlay';
import { useStore } from './store/useStore';

function App() {
  const { setGridSize } = useStore();

  useEffect(() => {
    const handleResize = () => {
      const newSize = window.innerWidth < 768 ? 60 : 80;
      setGridSize(newSize);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [setGridSize]);

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#f5e6d3]">
      <Scene />
      <UIOverlay />
    </div>
  );
}

export default App;
