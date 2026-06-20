import { useEffect } from 'react';
import CitySelector from './CitySelector';
import ParticleCanvas from './ParticleCanvas';
import { useAppStore } from '../store';

const MOBILE_BREAKPOINT = 768;

const App: React.FC = () => {
  const { setIsMobile } = useAppStore();

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [setIsMobile]);

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        margin: 0,
        padding: 0,
        overflow: 'hidden',
        background: 'linear-gradient(135deg, #1A1A2E 0%, #16213E 100%)',
        position: 'fixed',
        inset: 0,
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif',
        WebkitFontSmoothing: 'antialiased',
        MozOsxFontSmoothing: 'grayscale',
      }}
    >
      <CitySelector />
      <ParticleCanvas />
    </div>
  );
};

export default App;
