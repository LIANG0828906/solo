import { useEffect } from 'react';
import { ParticleScene } from './ParticleScene';
import { ParticleControls } from './ParticleControls';
import { StarBackground } from './components/StarBackground';
import { ShareButton } from './components/ShareButton';
import { useParticleStore } from './particleStore';
import './styles/global.css';

function App() {
  const initFromURL = useParticleStore((state) => state.initFromURL);

  useEffect(() => {
    initFromURL();
  }, [initFromURL]);

  useEffect(() => {
    const handleHashChange = () => {
      initFromURL();
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [initFromURL]);

  return (
    <div className="app-container">
      <StarBackground />
      <ParticleScene />
      <ParticleControls />
      <ShareButton />
    </div>
  );
}

export default App;
