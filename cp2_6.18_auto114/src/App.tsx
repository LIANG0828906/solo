import { useState, useCallback } from 'react';
import { ControlPanel } from './ControlPanel';
import { GradientCanvas, generateCSS } from './GradientCanvas';
import { useGradientStore } from './GradientStore';

function App() {
  const [showToast, setShowToast] = useState(false);

  const type = useGradientStore((state) => state.type);
  const angle = useGradientStore((state) => state.angle);
  const centerX = useGradientStore((state) => state.centerX);
  const centerY = useGradientStore((state) => state.centerY);
  const colorStops = useGradientStore((state) => state.colorStops);

  const handleExport = useCallback(async () => {
    const css = generateCSS(type, angle, centerX, centerY, colorStops);
    const fullCSS = `background: ${css};`;

    try {
      await navigator.clipboard.writeText(fullCSS);
      setShowToast(true);
      setTimeout(() => {
        setShowToast(false);
      }, 2000);
    } catch (err) {
      console.error('复制失败:', err);
    }
  }, [type, angle, centerX, centerY, colorStops]);

  return (
    <div className="app">
      <ControlPanel />
      <GradientCanvas onExport={handleExport} />

      <div className={`copy-toast ${showToast ? 'show' : ''}`}>
        已复制到剪贴板
      </div>
    </div>
  );
}

export default App;
