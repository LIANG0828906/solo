import { useEffect, useRef } from 'react';
import { useAppStore } from './store';
import { CityScene } from './scene/CityScene';
import { TimeSlider } from './ui/TimeSlider';
import { InfoPanel } from './ui/InfoPanel';
import { DataPanel } from './ui/DataPanel';
import { ZoneTooltip } from './ui/ZoneTooltip';
import './App.css';

function App() {
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const citySceneRef = useRef<CityScene | null>(null);
  const { year, selectBuilding, setHoveredZone } = useAppStore();

  useEffect(() => {
    if (!canvasContainerRef.current) return;

    const scene = new CityScene(canvasContainerRef.current);
    citySceneRef.current = scene;

    scene.setOnBuildingClick((buildingId) => {
      selectBuilding(buildingId);
    });

    scene.setOnZoneHover((zone) => {
      setHoveredZone(zone);
    });

    return () => {
      scene.dispose();
    };
  }, [selectBuilding, setHoveredZone]);

  useEffect(() => {
    if (citySceneRef.current) {
      citySceneRef.current.setYear(year);
    }
  }, [year]);

  return (
    <div className="app-container">
      <div ref={canvasContainerRef} className="canvas-container" />
      <TimeSlider />
      <InfoPanel />
      <DataPanel />
      <ZoneTooltip />
    </div>
  );
}

export default App;
