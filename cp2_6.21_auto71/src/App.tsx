import { useState, useCallback, useEffect } from 'react';
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

  const handleSearchResults = useCallback((results: SearchResult[]) => {
    setSearchResults(results);
  }, []);

  const handleMapCenterChange = useCallback((center: [number, number]) => {
    setMapCenter(center);
  }, []);

  const handleReset = useCallback(() => {
    setSelectedLayers(INITIAL_LAYERS);
    setSearchRadius(INITIAL_RADIUS);
    setAngleRange(INITIAL_ANGLE_RANGE);
    setAzimuth(INITIAL_AZIMUTH);
    setSearchResults([]);
    setMapCenter(INITIAL_CENTER);

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



  return (
    <div style={appContainerStyle}>
      <div style={mapContainerStyle}>
        <MapView
          selectedLayers={selectedLayers}
          searchRadius={searchRadius}
          angleRange={angleRange}
          azimuth={azimuth}
          onSearchResults={handleSearchResults}
          onMapCenterChange={handleMapCenterChange}
        />
      </div>
      <div style={panelContainerStyle}>
        <ControlPanel
          selectedLayers={selectedLayers}
          searchRadius={searchRadius}
          angleRange={angleRange}
          azimuth={azimuth}
          searchResults={searchResults}
          onLayersChange={setSelectedLayers}
          onRadiusChange={setSearchRadius}
          onAngleRangeChange={setAngleRange}
          onAzimuthChange={setAzimuth}
          onResultClick={handleResultClick}
          onReset={handleReset}
        />
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
  width: '70%',
  height: '100%',
  position: 'relative',
};

const panelContainerStyle: React.CSSProperties = {
  width: '30%',
  height: '100%',
  minWidth: '320px',
};
