import { useMapStore } from './stores/useMapStore';
import { MapContainer } from './modules/map/MapContainer';
import { MarkerForm } from './modules/map/MarkerForm';
import { Toolbar } from './components/Toolbar';
import { Sidebar } from './components/Sidebar';
import './App.css';

function App() {
  const showMarkerForm = useMapStore((state) => state.showMarkerForm);
  const pendingMarkerPosition = useMapStore((state) => state.pendingMarkerPosition);
  const openMarkerForm = useMapStore((state) => state.openMarkerForm);
  const closeMarkerForm = useMapStore((state) => state.closeMarkerForm);

  const handleMapClick = (lat: number, lng: number) => {
    openMarkerForm(lat, lng);
  };

  return (
    <div className="app">
      <Toolbar />

      <div className="main-content">
        <MapContainer onMapClick={handleMapClick} />
      </div>

      <MarkerForm
        isOpen={showMarkerForm}
        position={pendingMarkerPosition}
        onClose={closeMarkerForm}
      />

      <Sidebar />

      <div className="hint-overlay">
        <p>点击地图任意位置添加标记点</p>
      </div>
    </div>
  );
}

export default App;
