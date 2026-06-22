import { useEffect, useState } from 'react';
import { Browser } from './components/Browser';
import { FusionLab } from './components/FusionLab';
import { LoadingScreen } from './components/LoadingScreen';

export default function App() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isLoading) {
      document.title = '神话生物基因融合模拟器';
    }
  }, [isLoading]);

  return (
    <>
      {isLoading && <LoadingScreen duration={2000} onFinish={() => setIsLoading(false)} />}
      <div className="app-container">
        <Browser />
        <FusionLab />
      </div>
    </>
  );
}
