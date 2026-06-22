import { useState, useMemo, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import EarthScene from './scene/EarthScene';
import ControlBar from './components/ControlBar';
import LegendPanel from './components/LegendPanel';
import CityInfoCard from './components/CityInfoCard';
import TimeSlider from './components/TimeSlider';
import { getAllCities, CityClimateData } from './services/climateDataService';

export default function App() {
  const cities = useMemo(() => getAllCities(), []);
  const [selectedMonth, setSelectedMonth] = useState(5);
  const [selectedCityIds, setSelectedCityIds] = useState<string[]>([]);
  const [compareMode, setCompareMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const selectedCities = useMemo(() => {
    return selectedCityIds
      .map(id => cities.find(c => c.id === id))
      .filter(Boolean) as CityClimateData[];
  }, [selectedCityIds, cities]);

  const handleCityClick = (cityId: string) => {
    if (compareMode) {
      setSelectedCityIds(prev => {
        if (prev.includes(cityId)) {
          return prev.filter(id => id !== cityId);
        }
        if (prev.length >= 2) {
          return [prev[1], cityId];
        }
        return [...prev, cityId];
      });
    } else {
      setSelectedCityIds(prev => {
        if (prev.includes(cityId)) {
          return prev.filter(id => id !== cityId);
        }
        return [cityId];
      });
    }
  };

  const handleCloseCity = (cityId: string) => {
    setSelectedCityIds(prev => prev.filter(id => id !== cityId));
  };

  const handleToggleCompareMode = () => {
    setCompareMode(prev => {
      const next = !prev;
      if (!next) {
        if (selectedCityIds.length > 1) {
          setSelectedCityIds([selectedCityIds[0]]);
        }
      }
      return next;
    });
  };

  const handleReset = () => {
    setSelectedMonth(5);
    setSelectedCityIds([]);
    setCompareMode(false);
  };

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      position: 'relative',
      background: '#000814',
      overflow: 'hidden',
    }}>
      {isLoading && (
        <div style={{
          position: 'absolute',
          inset: 0,
          background: '#000814',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000,
          transition: 'opacity 0.5s ease-out',
        }}>
          <div style={{
            width: 48,
            height: 48,
            border: '3px solid rgba(59, 130, 246, 0.3)',
            borderTopColor: '#3B82F6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
          }} />
          <p style={{
            color: '#94A3B8',
            marginTop: 16,
            fontFamily: 'Arial',
            fontSize: 14,
          }}>
            正在加载地球场景...
          </p>
        </div>
      )}
      <Canvas
        camera={{ position: [0, 0, 6], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <color attach="background" args={['#000814']} />
        <fog attach="fog" args={['#000814', 20, 80]} />
        <EarthScene
          cities={cities}
          selectedMonth={selectedMonth}
          selectedCityIds={selectedCityIds}
          compareMode={compareMode}
          onCityClick={handleCityClick}
        />
      </Canvas>
      <ControlBar
        compareMode={compareMode}
        onToggleCompareMode={handleToggleCompareMode}
        onReset={handleReset}
      />
      <LegendPanel cities={cities} />
      <CityInfoCard
        cities={selectedCities}
        compareMode={compareMode}
        onClose={handleCloseCity}
      />
      <TimeSlider
        selectedMonth={selectedMonth}
        onMonthChange={setSelectedMonth}
      />
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes cardPop {
          0% {
            opacity: 0;
            transform: scale(0.85);
          }
          50% {
            transform: scale(1.02);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
}
