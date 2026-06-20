import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import PlantScene from './components/PlantScene';
import EnvironmentPanel from './components/EnvironmentPanel';
import GrowthLog from './components/GrowthLog';
import {
  PlantType,
  EnvironmentParams,
  GrowthLogEntry,
  plantTypes,
  getRandomPlantType,
  clamp,
} from './data/plantTypes';
import { FaSeedling } from 'react-icons/fa';

const App: React.FC = () => {
  const [plantType] = useState<PlantType>(() => getRandomPlantType());
  const initialParams = useMemo(() => ({ ...plantTypes[plantType].initialParams }), [plantType]);
  const [params, setParams] = useState<EnvironmentParams>(initialParams);
  const [displayParams, setDisplayParams] = useState<EnvironmentParams>(initialParams);
  const [growthLog, setGrowthLog] = useState<GrowthLogEntry[]>(() => [
    {
      timestamp: Date.now(),
      params: initialParams,
    },
  ]);
  const animationRef = useRef<number>();
  const lastLogTime = useRef<number>(0);

  useEffect(() => {
    const animate = () => {
      setDisplayParams((prev) => ({
        light: prev.light + (params.light - prev.light) * 0.02,
        water: prev.water + (params.water - prev.water) * 0.02,
        temperature: prev.temperature + (params.temperature - prev.temperature) * 0.02,
      }));
      animationRef.current = requestAnimationFrame(animate);
    };
    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [params]);

  const logParamChange = useCallback((newParams: EnvironmentParams) => {
    const now = Date.now();
    if (now - lastLogTime.current >= 1000) {
      setGrowthLog((prev) => {
        const maxEntries = 24 * 60 * 60;
        const newEntry: GrowthLogEntry = {
          timestamp: now,
          params: { ...newParams },
        };
        const updated = [...prev, newEntry];
        if (updated.length > maxEntries) {
          return updated.slice(-maxEntries);
        }
        return updated;
      });
      lastLogTime.current = now;
    }
  }, []);

  const handleParamChange = useCallback(
    (key: keyof EnvironmentParams, value: number) => {
      setParams((prev) => {
        const newParams = { ...prev, [key]: clamp(value, 0, 100) };
        logParamChange(newParams);
        return newParams;
      });
    },
    [logParamChange]
  );

  const handleWater = useCallback(() => {
    const newParams = { ...params, water: clamp(params.water + 20, 0, 100) };
    setParams(newParams);
    logParamChange(newParams);
    toast.success('浇水成功！水分 +20', {
      duration: 1500,
      style: {
        background: '#4FC3F7',
        color: '#ffffff',
      },
    });
  }, [params, logParamChange]);

  const handleFertilize = useCallback(() => {
    const newParams = {
      ...params,
      light: clamp(params.light + 10, 0, 100),
      temperature: clamp(params.temperature + 5, 0, 100),
    };
    setParams(newParams);
    logParamChange(newParams);
    toast.success('施肥成功！光照 +10，温度 +5', {
      duration: 1500,
      style: {
        background: '#81C784',
        color: '#ffffff',
      },
    });
  }, [params, logParamChange]);

  const plantName = plantTypes[plantType].name;

  return (
    <div style={styles.app}>
      <Toaster position="top-center" />
      
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <FaSeedling size={28} color="#8D6E63" />
          <h1 style={styles.title}>虚拟植物养成</h1>
          <span style={styles.plantName}>当前植物：{plantName}</span>
        </div>
      </header>

      <main style={styles.main}>
        <div className="top-row" style={styles.topRow}>
          <div style={styles.sceneCard}>
            <PlantScene plantType={plantType} params={displayParams} />
          </div>
          <div style={styles.panelCard}>
            <EnvironmentPanel
              params={params}
              onParamChange={handleParamChange}
              onWater={handleWater}
              onFertilize={handleFertilize}
            />
          </div>
        </div>
        
        <div style={styles.logCard}>
          <GrowthLog data={growthLog} />
        </div>
      </main>

      <footer style={styles.footer}>
        <p style={styles.footerText}>拖动滑块或点击按钮来照料你的植物 ☘️</p>
      </footer>

      <style>{`
        * {
          box-sizing: border-box;
        }
        
        body {
          margin: 0;
          padding: 0;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
          background: #F5F0EB;
        }
        
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #ffffff;
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(0,0,0,0.2);
          border: 2px solid #8D6E63;
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }
        
        input[type="range"]::-webkit-slider-thumb:hover {
          transform: scale(1.15);
          box-shadow: 0 3px 8px rgba(0,0,0,0.25);
        }
        
        input[type="range"]::-moz-range-thumb {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #ffffff;
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(0,0,0,0.2);
          border: 2px solid #8D6E63;
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }
        
        input[type="range"]::-moz-range-thumb:hover {
          transform: scale(1.15);
          box-shadow: 0 3px 8px rgba(0,0,0,0.25);
        }
        
        button:hover {
          transform: translateY(-2px) scale(1.02) !important;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15) !important;
        }
        
        button:active {
          transform: translateY(0) scale(0.98) !important;
        }
        
        @media (max-width: 768px) {
          .top-row {
            flex-direction: column !important;
          }
        }
      `}</style>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  app: {
    minHeight: '100vh',
    background: '#F5F0EB',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    background: '#ffffff',
    padding: '16px 24px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    borderBottom: '1px solid #ECEFF1',
  },
  headerContent: {
    maxWidth: '1400px',
    margin: '0 auto',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap',
  },
  title: {
    margin: 0,
    fontSize: '22px',
    fontWeight: 700,
    color: '#546E7A',
  },
  plantName: {
    marginLeft: 'auto',
    fontSize: '14px',
    color: '#8D6E63',
    fontWeight: 500,
    background: '#F5F0EB',
    padding: '6px 12px',
    borderRadius: '16px',
  },
  main: {
    flex: 1,
    maxWidth: '1400px',
    width: '100%',
    margin: '0 auto',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    boxSizing: 'border-box',
  },
  topRow: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
  },
  sceneCard: {
    flex: '1 1 500px',
    minHeight: '500px',
    background: '#ffffff',
    borderRadius: '8px',
    overflow: 'hidden',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    display: 'flex',
    flexDirection: 'column',
  },
  panelCard: {
    flex: '0 0 320px',
    minWidth: '300px',
  },
  logCard: {
    width: '100%',
  },
  footer: {
    background: '#ffffff',
    padding: '12px 24px',
    textAlign: 'center',
    borderTop: '1px solid #ECEFF1',
  },
  footerText: {
    margin: 0,
    fontSize: '13px',
    color: '#90A4AE',
  },
};

export default App;
