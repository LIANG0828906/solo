import { useState, useEffect, useRef, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import Earth from './components/Earth';
import EarthquakeMarkers from './components/EarthquakeMarkers';
import ControlPanel from './components/ControlPanel';
import { fetchEarthquakes } from './utils/api';
import { filterByEndTime, sortByTimeDesc } from './utils/filterData';
import { Earthquake } from './types/earthquake';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

function App() {
  const [earthquakes, setEarthquakes] = useState<Earthquake[]>([]);
  const [filteredEarthquakes, setFilteredEarthquakes] = useState<Earthquake[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEarthquake, setSelectedEarthquake] = useState<Earthquake | null>(null);
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });
  const [currentTime, setCurrentTime] = useState<string>('');
  const [minTime, setMinTime] = useState<string>('');
  const [maxTime, setMaxTime] = useState<string>('');
  const [panelCollapsed, setPanelCollapsed] = useState(false);
  const [flashId, setFlashId] = useState<string | null>(null);
  const earthRef = useRef<{ focusOnLocation: (lat: number, lng: number) => void } | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const data = await fetchEarthquakes();
        setEarthquakes(data);
        
        if (data.length > 0) {
          const sorted = sortByTimeDesc(data);
          const latest = new Date(sorted[0].time);
          const earliest = new Date(sorted[sorted.length - 1].time);
          
          setMaxTime(latest.toISOString());
          setMinTime(earliest.toISOString());
          setCurrentTime(latest.toISOString());
          setFilteredEarthquakes(sorted);
        }
      } catch (error) {
        console.error('Failed to fetch earthquake data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    if (earthquakes.length > 0 && currentTime) {
      const filtered = filterByEndTime(earthquakes, currentTime);
      setFilteredEarthquakes(sortByTimeDesc(filtered));
    }
  }, [currentTime, earthquakes]);

  const handleTimeChange = useCallback((time: string) => {
    setCurrentTime(time);
  }, []);

  const handleMarkerClick = useCallback((earthquake: Earthquake, screenPos: { x: number; y: number }) => {
    setSelectedEarthquake(earthquake);
    setPopupPosition(screenPos);
  }, []);

  const handleClosePopup = useCallback(() => {
    setSelectedEarthquake(null);
  }, []);

  const handleListClick = useCallback((earthquake: Earthquake) => {
    setFlashId(earthquake.id);
    
    if (earthRef.current) {
      earthRef.current.focusOnLocation(earthquake.lat, earthquake.lng);
    }
    
    setTimeout(() => {
      setFlashId(null);
    }, 1800);
  }, []);

  const togglePanel = useCallback(() => {
    setPanelCollapsed(prev => !prev);
  }, []);

  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return '';
    return format(new Date(dateStr), 'MM月dd日 HH:mm', { locale: zhCN });
  };

  return (
    <div className="app-container">
      <div className="canvas-container">
        <Canvas
          camera={{ position: [0, 0, 12], fov: 45 }}
          gl={{ antialias: true, alpha: false }}
          dpr={[1, 2]}
        >
          <ambientLight intensity={0.3} />
          <directionalLight position={[5, 3, 5]} intensity={1} />
          
          <Stars
            radius={100}
            depth={50}
            count={3000}
            factor={4}
            saturation={0}
            fade
            speed={0.5}
          />
          
          <Earth ref={earthRef}>
            <EarthquakeMarkers
              earthquakes={filteredEarthquakes}
              onMarkerClick={handleMarkerClick}
              flashId={flashId}
            />
          </Earth>
          
          <OrbitControls
            enablePan={false}
            minDistance={6}
            maxDistance={25}
            enableDamping
            dampingFactor={0.05}
          />
        </Canvas>
      </div>

      <button 
        className={`hamburger-btn ${panelCollapsed ? '' : 'visible'}`}
        onClick={togglePanel}
        aria-label="Toggle panel"
      >
        <span></span>
      </button>

      <ControlPanel
        earthquakes={filteredEarthquakes}
        currentTime={currentTime}
        minTime={minTime}
        maxTime={maxTime}
        onTimeChange={handleTimeChange}
        onListClick={handleListClick}
        loading={loading}
        collapsed={panelCollapsed}
        onToggleCollapse={togglePanel}
      />

      {selectedEarthquake && (
        <div 
          className="popup-card"
          style={{
            left: `${Math.min(popupPosition.x + 15, window.innerWidth - 290)}px`,
            top: `${Math.min(popupPosition.y + 15, window.innerHeight - 250)}px`,
          }}
        >
          <button className="popup-close" onClick={handleClosePopup}>
            ×
          </button>
          <div className="popup-header">
            <div 
              className="popup-mag-badge"
              style={{ 
                background: `linear-gradient(135deg, 
                  ${selectedEarthquake.mag >= 6 ? '#ff4444' : 
                    selectedEarthquake.mag >= 5 ? '#ff6b6b' : 
                    selectedEarthquake.mag >= 4 ? '#ffa94d' : '#51cf66'}, 
                  ${selectedEarthquake.mag >= 6 ? '#cc0000' : 
                    selectedEarthquake.mag >= 5 ? '#d63031' : 
                    selectedEarthquake.mag >= 4 ? '#e67e22' : '#37b24d'})` 
              }}
            >
              {selectedEarthquake.mag.toFixed(1)}
            </div>
            <div className="popup-title">
              <div className="popup-place">{selectedEarthquake.place}</div>
              <div className="popup-time">
                {format(new Date(selectedEarthquake.time), 'yyyy年MM月dd日 HH:mm:ss', { locale: zhCN })}
              </div>
            </div>
          </div>
          <div className="popup-info-grid">
            <div className="popup-info-item">
              <span className="popup-info-label">震级</span>
              <span className="popup-info-value">{selectedEarthquake.mag.toFixed(1)} Mw</span>
            </div>
            <div className="popup-info-item">
              <span className="popup-info-label">深度</span>
              <span className="popup-info-value">{selectedEarthquake.depth.toFixed(0)} km</span>
            </div>
            <div className="popup-info-item">
              <span className="popup-info-label">纬度</span>
              <span className="popup-info-value">{selectedEarthquake.lat.toFixed(2)}°</span>
            </div>
            <div className="popup-info-item">
              <span className="popup-info-label">经度</span>
              <span className="popup-info-value">{selectedEarthquake.lng.toFixed(2)}°</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
