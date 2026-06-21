import { useState, useCallback } from 'react';
import type { POICategory, SearchResult } from './types';
import MapView from './mapView';
import ControlPanel from './controlPanel';

const INITIAL_LAYERS: POICategory[] = [];
const INITIAL_RADIUS = 300;
const INITIAL_ANGLE_RANGE = 90;
const INITIAL_AZIMUTH = 0;
const INITIAL_CENTER: [number, number] = [39.9042, 116.4074];

export default function App() {
  const [selectedLayers, setSelectedLayers] = useState<POICategory[]>(INITIAL_LAYERS);
  const [searchRadius, setSearchRadius] = useState(INITIAL_RADIUS);
  const [angleRange, setAngleRange] = useState(INITIAL_ANGLE_RANGE);
  const [azimuth, setAzimuth] = useState(INITIAL_AZIMUTH);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [mapCenter, setMapCenter] = useState<[number, number]>(INITIAL_CENTER);
  const [categoryCounts, setCategoryCounts] = useState<Record<POICategory, number>>({
    toilet: 0,
    convenience: 0,
    cafe: 0,
    charging: 0,
    pharmacy: 0,
  });
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);

  const handleSearchResults = useCallback((results: SearchResult[]) => {
    setSearchResults(results);
  }, []);

  const handleMapCenterChange = useCallback((center: [number, number]) => {
    setMapCenter(center);
  }, []);

  const handleCategoryCountsChange = useCallback((counts: Record<POICategory, number>) => {
    setCategoryCounts(counts);
  }, []);

  const handleReset = useCallback(() => {
    setSelectedLayers(INITIAL_LAYERS);
    setSearchRadius(INITIAL_RADIUS);
    setAngleRange(INITIAL_ANGLE_RANGE);
    setAzimuth(INITIAL_AZIMUTH);
    setSearchResults([]);
    setMapCenter(INITIAL_CENTER);
    setIsPanelCollapsed(false);

    const resetEvent = new CustomEvent('poi-map:reset');
    window.dispatchEvent(resetEvent);
  }, []);

  const handleResultClick = useCallback((poiId: string) => {
    const result = searchResults.find(r => r.poi.id === poiId);
    if (result) {
      const centerEvent = new CustomEvent('poi-map:center-poi', {
        detail: {
          lat: result.poi.lat,
          lng: result.poi.lng,
          name: result.poi.name,
          address: result.poi.address,
        },
      });
      window.dispatchEvent(centerEvent);
    }
  }, [searchResults]);

  const togglePanel = useCallback(() => {
    setIsPanelCollapsed(prev => !prev);
  }, []);

  return (
    <div style={appContainerStyle}>
      <div style={{
        ...mapContainerStyle,
        width: isPanelCollapsed ? '100%' : '70%',
        transition: 'width 0.3s ease',
      }}>
        <MapView
          selectedLayers={selectedLayers}
          searchRadius={searchRadius}
          angleRange={angleRange}
          azimuth={azimuth}
          onSearchResults={handleSearchResults}
          onMapCenterChange={handleMapCenterChange}
          onCategoryCountsChange={handleCategoryCountsChange}
        />
      </div>
      <div style={{
        ...panelContainerStyle,
        width: isPanelCollapsed ? '48px' : '30%',
        minWidth: isPanelCollapsed ? '48px' : '320px',
        overflow: isPanelCollapsed ? 'visible' : 'hidden',
        transition: 'width 0.3s ease, min-width 0.3s ease',
        position: 'relative',
      }}>
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          opacity: isPanelCollapsed ? 0 : 1,
          visibility: isPanelCollapsed ? 'hidden' : 'visible',
          transition: 'opacity 0.2s ease, visibility 0.2s ease',
          transitionDelay: isPanelCollapsed ? '0s' : '0.1s',
        }}>
          <ControlPanel
            selectedLayers={selectedLayers}
            searchRadius={searchRadius}
            angleRange={angleRange}
            azimuth={azimuth}
            searchResults={searchResults}
            categoryCounts={categoryCounts}
            onLayersChange={setSelectedLayers}
            onRadiusChange={setSearchRadius}
            onAngleRangeChange={setAngleRange}
            onAzimuthChange={setAzimuth}
            onResultClick={handleResultClick}
            onReset={handleReset}
          />
        </div>
        <button
          onClick={togglePanel}
          style={{
            position: 'absolute',
            top: '16px',
            left: '50%',
            transform: `translateX(-50%) ${isPanelCollapsed ? 'rotate(180deg)' : 'rotate(0deg)'}`,
            zIndex: 1000,
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            backgroundColor: '#ffffff',
            border: '1px solid #e9ecef',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px',
            color: '#4a90d9',
            transition: 'all 0.25s ease',
            fontWeight: 700,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#4a90d9';
            e.currentTarget.style.color = '#ffffff';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#ffffff';
            e.currentTarget.style.color = '#4a90d9';
          }}
          title={isPanelCollapsed ? '展开面板' : '收起面板'}
        >
          {isPanelCollapsed ? '◀' : '▶'}
        </button>
        {isPanelCollapsed && (
          <div style={{
            position: 'absolute',
            top: '60px',
            left: '50%',
            transform: 'translateX(-50%)',
            writingMode: 'vertical-rl',
            textOrientation: 'mixed',
            fontSize: '13px',
            fontWeight: 600,
            color: '#495057',
            letterSpacing: '4px',
            userSelect: 'none',
          }}>
            兴趣点筛选
          </div>
        )}
      </div>
    </div>
  );
}

const appContainerStyle: React.CSSProperties = {
  display: 'flex',
  width: '100vw',
  height: '100vh',
  backgroundColor: '#f8f9fa',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  overflow: 'hidden',
};

const mapContainerStyle: React.CSSProperties = {
  height: '100%',
  position: 'relative',
};

const panelContainerStyle: React.CSSProperties = {
  height: '100%',
};
