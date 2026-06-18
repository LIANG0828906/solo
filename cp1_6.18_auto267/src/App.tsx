import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OceanScene } from './modules/ocean/OceanScene';
import { CurrentSystem } from './modules/current/CurrentSystem';
import { BuoyManager } from './modules/buoy/BuoyManager';
import { useOceanStore } from './shared/store';
import { BuoyListPanel } from './components/BuoyListPanel';
import { TemperatureChart } from './components/TemperatureChart';
import './styles.css';

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const oceanSceneRef = useRef<OceanScene | null>(null);
  const currentSystemRef = useRef<CurrentSystem | null>(null);
  const buoyManagerRef = useRef<BuoyManager | null>(null);
  const fetchIntervalRef = useRef<number | null>(null);

  const {
    buoys,
    selectedBuoyId,
    temperatureHistory,
    addBuoy,
    removeBuoy,
    selectBuoy,
    setTemperatureHistory,
    setCurrentData,
    updateBuoyTemp
  } = useOceanStore();

  useEffect(() => {
    if (!containerRef.current) return;

    const oceanScene = new OceanScene(containerRef.current);
    oceanSceneRef.current = oceanScene;
    oceanScene.start();

    const currentSystem = new CurrentSystem(oceanScene.getScene());
    currentSystemRef.current = currentSystem;
    currentSystem.setOnDataUpdate((data) => setCurrentData(data));
    currentSystem.start();

    const buoyManager = new BuoyManager(
      oceanScene.getScene(),
      oceanScene.getCamera(),
      oceanScene.getRenderer().domElement
    );
    buoyManagerRef.current = buoyManager;

    oceanScene.onRightClick(async (point: THREE.Vector3) => {
      const store = useOceanStore.getState();
      if (store.buoys.length >= 5) return;

      const id = `buoy_${Date.now()}`;
      const name = `浮标 ${store.buoys.length + 1}`;

      const newBuoy = {
        id,
        name,
        position: { x: point.x, y: 0, z: point.z },
        currentTemp: 0
      };

      buoyManager.addBuoy(newBuoy);
      addBuoy(newBuoy);
      selectBuoy(id);

      const data = await BuoyManager.fetchTemperature(id, point.x, point.z);
      if (data.length > 0) {
        updateBuoyTemp(id, data[data.length - 1].temperature);
        setTemperatureHistory(data);
      }
    });

    buoyManager.setOnBuoyClick((id) => {
      selectBuoy(id);
    });

    buoyManager.setOnBuoyRemoved((id) => {
      removeBuoy(id);
    });

    return () => {
      if (fetchIntervalRef.current) {
        clearInterval(fetchIntervalRef.current);
      }
      buoyManager.dispose();
      currentSystem.stop();
      oceanScene.stop();
    };
  }, [addBuoy, removeBuoy, selectBuoy, setCurrentData, setTemperatureHistory, updateBuoyTemp]);

  useEffect(() => {
    if (buoyManagerRef.current) {
      buoyManagerRef.current.selectBuoy(selectedBuoyId);
    }

    if (!selectedBuoyId) {
      setTemperatureHistory([]);
      if (fetchIntervalRef.current) {
        clearInterval(fetchIntervalRef.current);
        fetchIntervalRef.current = null;
      }
      return;
    }

    const buoy = buoys.find((b) => b.id === selectedBuoyId);
    if (!buoy) return;

    const fetchData = async () => {
      const data = await BuoyManager.fetchTemperature(
        buoy.id,
        buoy.position.x,
        buoy.position.z
      );
      if (data.length > 0) {
        setTemperatureHistory(data);
        updateBuoyTemp(buoy.id, data[data.length - 1].temperature);
      }
    };

    fetchData();
    fetchIntervalRef.current = window.setInterval(fetchData, 2000);

    return () => {
      if (fetchIntervalRef.current) {
        clearInterval(fetchIntervalRef.current);
        fetchIntervalRef.current = null;
      }
    };
  }, [selectedBuoyId, buoys, setTemperatureHistory, updateBuoyTemp]);

  const selectedBuoy = buoys.find((b) => b.id === selectedBuoyId);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
      <BuoyListPanel />
      {selectedBuoy && (
        <TemperatureChart
          data={temperatureHistory}
          buoyName={selectedBuoy.name}
        />
      )}
      <div className="glass-panel hint-bottom">
        左键拖拽旋转视角 · 滚轮缩放 · 右键海面放置浮标 · 双击浮标移除
      </div>
    </div>
  );
}
