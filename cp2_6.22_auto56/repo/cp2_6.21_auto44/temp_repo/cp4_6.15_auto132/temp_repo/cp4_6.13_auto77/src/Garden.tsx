import { useEffect, useRef } from 'react';
import { useGardenStore } from './GardenStore';
import EnvironmentPanel from './components/EnvironmentPanel';
import GardenGrid from './components/GardenGrid';
import SeedSelector from './components/SeedSelector';
import PlantDetail from './components/PlantDetail';
import CareLog from './components/CareLog';
import './Garden.css';

const GROWTH_TICK_INTERVAL = 1000;

const Garden = () => {
  const advanceAllPlants = useGardenStore((state) => state.advanceAllPlants);
  const lastTickRef = useRef<number>(Date.now());

  useEffect(() => {
    const intervalId = setInterval(() => {
      const now = Date.now();
      const deltaSeconds = (now - lastTickRef.current) / 1000;
      lastTickRef.current = now;

      advanceAllPlants(deltaSeconds);
    }, GROWTH_TICK_INTERVAL);

    return () => clearInterval(intervalId);
  }, [advanceAllPlants]);

  return (
    <div className="garden-app">
      <header className="garden-header">
        <h1 className="app-title">🌻 虚拟花园</h1>
        <p className="app-subtitle">种植、养护、观察植物的生长之旅</p>
      </header>

      <div className="environment-section">
        <EnvironmentPanel />
      </div>

      <main className="garden-main">
        <GardenGrid />
      </main>

      <SeedSelector />
      <PlantDetail />
      <CareLog />

      <footer className="garden-footer">
        <p>🌱 每一株植物都值得被温柔对待</p>
      </footer>
    </div>
  );
};

export default Garden;
