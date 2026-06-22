import React, { useEffect } from 'react';
import { useAQIStore } from './store/aqiStore';
import { generateMockCities } from './utils/mockData';
import { GlobeMap } from './components/GlobeMap';
import { TimeSlider } from './components/TimeSlider';
import { ControlPanel } from './components/ControlPanel';
import { CityInfoPanel } from './components/CityInfoPanel';
import { YearDisplay } from './components/YearDisplay';

const App: React.FC = () => {
  const setCities = useAQIStore((s) => s.setCities);

  useEffect(() => {
    const startTime = performance.now();
    const cities = generateMockCities();
    const elapsed = performance.now() - startTime;
    console.log(`Mock data generated in ${elapsed.toFixed(2)}ms`);
    setCities(cities);
  }, [setCities]);

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: 'linear-gradient(135deg, #0A0E27 0%, #1A237E 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <GlobeMap />
      <YearDisplay />
      <ControlPanel />
      <CityInfoPanel />
      <TimeSlider />
    </div>
  );
};

export default App;
