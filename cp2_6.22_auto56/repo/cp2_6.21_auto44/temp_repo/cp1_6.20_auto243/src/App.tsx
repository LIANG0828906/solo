import { useCallback, useRef, useState } from 'react';
import Scene3D from './components/Scene3D';
import ControlPanel from './components/ControlPanel';
import PerformanceBar from './components/PerformanceBar';
import { CITIES, getCityById } from './utils/cityData';
import type { CityData, Scene3DHandle, WindParams, WindPreset } from './types';

function App(): JSX.Element {
  const sceneRef = useRef<Scene3DHandle | null>(null);

  const initialCity = CITIES[0];
  const [city, setCity] = useState<CityData>(initialCity);
  const [wind, setWind] = useState<WindParams>({ ...initialCity.defaultWind });
  const [particleCount, setParticleCountState] = useState<number>(500);
  const [presets, setPresets] = useState<WindPreset[]>([]);
  const [fps, setFps] = useState<number>(60);

  const handleCityChange = useCallback(
    (id: string): void => {
      const next = getCityById(id);
      setCity(next);
      setWind({ ...next.defaultWind });
      sceneRef.current?.loadCity(next);
      sceneRef.current?.updateWindParams(next.defaultWind);
    },
    []
  );

  const handleWindChange = useCallback((next: WindParams): void => {
    setWind(next);
    sceneRef.current?.updateWindParams(next);
  }, []);

  const handleParticleCountChange = useCallback((n: number): void => {
    setParticleCountState(n);
    sceneRef.current?.setParticleCount(n);
  }, []);

  const handleSavePreset = useCallback(
    (name: string): void => {
      const newPreset: WindPreset = {
        id: `preset-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        name,
        cityId: city.id,
        wind: { ...wind },
        particleCount,
        createdAt: Date.now(),
      };
      setPresets((prev): WindPreset[] => [...prev, newPreset]);
    },
    [city.id, wind, particleCount]
  );

  const handleLoadPreset = useCallback(
    (preset: WindPreset): void => {
      if (preset.cityId !== city.id) {
        const targetCity = getCityById(preset.cityId);
        setCity(targetCity);
        sceneRef.current?.loadCity(targetCity);
      }
      setWind({ ...preset.wind });
      sceneRef.current?.updateWindParams(preset.wind);
      if (preset.particleCount !== particleCount) {
        setParticleCountState(preset.particleCount);
        sceneRef.current?.setParticleCount(preset.particleCount);
      }
    },
    [city.id, particleCount]
  );

  const handleDeletePreset = useCallback((id: string): void => {
    setPresets((prev): WindPreset[] => prev.filter((p) => p.id !== id));
  }, []);

  const handleResetCamera = useCallback((): void => {
    sceneRef.current?.resetCamera();
  }, []);

  const handleFPSUpdate = useCallback((value: number): void => {
    setFps(value);
  }, []);

  return (
    <div
      style={{
        position: 'relative',
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        background: '#1a1a2e',
      }}
    >
      <Scene3D
        ref={sceneRef}
        initialCity={initialCity}
        initialWind={initialCity.defaultWind}
        initialParticleCount={500}
        onFPSUpdate={handleFPSUpdate}
      />
      <ControlPanel
        city={city}
        wind={wind}
        particleCount={particleCount}
        presets={presets}
        onCityChange={handleCityChange}
        onWindChange={handleWindChange}
        onParticleCountChange={handleParticleCountChange}
        onSavePreset={handleSavePreset}
        onLoadPreset={handleLoadPreset}
        onDeletePreset={handleDeletePreset}
        onResetCamera={handleResetCamera}
      />
      <PerformanceBar fps={fps} particleCount={particleCount} />
    </div>
  );
}

export default App;
