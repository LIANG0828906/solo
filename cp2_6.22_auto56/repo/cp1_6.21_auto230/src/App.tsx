import { useState, useEffect, useRef, useCallback } from 'react';
import Scene3D from './components/Scene3D';
import UIPanel from './components/UIPanel';
import { Dataset, Marker, ProfileData } from './types';
import { loadDataset } from './utils/dataLoader';

type EventName = 'addMarker' | 'removeMarker' | 'clearMarkers' | 'drawProfile' | 'clearProfile';

class EventEmitter {
  private listeners: Map<string, Set<(...args: any[]) => void>> = new Map();

  on(event: EventName, callback: (...args: any[]) => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
    return () => this.off(event, callback);
  }

  off(event: EventName, callback: (...args: any[]) => void) {
    this.listeners.get(event)?.delete(callback);
  }

  emit(event: EventName, ...args: any[]) {
    this.listeners.get(event)?.forEach((cb) => cb(...args));
  }
}

const globalEventEmitter = new EventEmitter();

export default function App() {
  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [loading, setLoading] = useState(false);
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [selectedDatasetId, setSelectedDatasetId] = useState<string>('');
  const sceneRef = useRef<any>(null);

  const handleSelectDataset = useCallback(async (datasetId: string) => {
    if (selectedDatasetId === datasetId && dataset) return;
    setLoading(true);
    setSelectedDatasetId(datasetId);
    setMarkers([]);
    setProfile(null);
    const data = await loadDataset(datasetId);
    setDataset(data);
    globalEventEmitter.emit('clearMarkers');
    globalEventEmitter.emit('clearProfile');
    setLoading(false);
  }, [selectedDatasetId, dataset]);

  const handleAddMarker = useCallback((marker: Marker) => {
    setMarkers((prev) => [...prev, marker]);
  }, []);

  const handleRemoveMarker = useCallback((markerId: string) => {
    setMarkers((prev) => prev.filter((m) => m.id !== markerId));
    globalEventEmitter.emit('removeMarker', markerId);
  }, []);

  const handleClearMarkers = useCallback(() => {
    setMarkers([]);
    globalEventEmitter.emit('clearMarkers');
  }, []);

  const handleProfileUpdate = useCallback((profileData: ProfileData | null) => {
    setProfile(profileData);
  }, []);

  const handleClearProfile = useCallback(() => {
    setProfile(null);
    globalEventEmitter.emit('clearProfile');
  }, []);

  useEffect(() => {
    handleSelectDataset('global-temperature');
  }, []);

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        width: '100%',
        height: '100%',
        background: '#0A0A1A',
        color: '#E2E8F0',
        padding: '12px',
        gap: '12px',
      }}
    >
      <div
        style={{
          flex: 1,
          minHeight: isMobile ? '50vh' : '0',
          borderRadius: '12px',
          overflow: 'hidden',
          position: 'relative',
          background: '#0F172A',
        }}
      >
        <Scene3D
          ref={sceneRef}
          dataset={dataset}
          loading={loading}
          eventEmitter={globalEventEmitter}
          onAddMarker={handleAddMarker}
          onProfileUpdate={handleProfileUpdate}
        />
        {loading && (
          <div
            style={{
              position: 'absolute',
              top: 20,
              left: 20,
              padding: '8px 16px',
              background: 'rgba(30, 41, 59, 0.9)',
              borderRadius: '8px',
              fontSize: 14,
              zIndex: 10,
            }}
          >
            正在加载数据...
          </div>
        )}
      </div>

      <UIPanel
        dataset={dataset}
        markers={markers}
        profile={profile}
        selectedDatasetId={selectedDatasetId}
        onSelectDataset={handleSelectDataset}
        onRemoveMarker={handleRemoveMarker}
        onClearMarkers={handleClearMarkers}
        onClearProfile={handleClearProfile}
        isMobile={isMobile}
      />
    </div>
  );
}
