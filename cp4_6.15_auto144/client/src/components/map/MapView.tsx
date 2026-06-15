import { memo, useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Search, Plus, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useJournalStore } from '../../store/useJournalStore';
import { createJournalMarker } from './JournalMarker';
import JournalModal from '../journal/JournalModal';
import JournalDetail from '../journal/JournalDetail';
import './MapView.css';

const MapView = memo(function MapView() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const {
    entries,
    isModalOpen,
    isDetailOpen,
    selectedEntry,
    openModal,
    setSelectedLocation,
    selectEntry,
    openDetail,
    fetchAll,
    isLoading,
  } = useJournalStore();

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    mapInstanceRef.current = L.map(mapRef.current, {
      center: [39.9042, 116.4074],
      zoom: 13,
      zoomControl: false,
    });

    L.tileLayer(
      'data:image/svg+xml,' +
        encodeURIComponent(`
        <svg xmlns='http://www.w3.org/2000/svg' width='256' height='256'>
          <defs>
            <filter id='paper'>
              <feTurbulence type='fractalNoise' baseFrequency='0.04' numOctaves='5' result='noise'/>
              <feDiffuseLighting in='noise' lighting-color='#f5f0e6' surfaceScale='2'>
                <feDistantLight azimuth='45' elevation='60'/>
              </feDiffuseLighting>
            </filter>
          </defs>
          <rect width='100%' height='100%' filter='url(%23paper)' fill='#f5f0e6'/>
        </svg>
      `)
    ).addTo(mapInstanceRef.current);

    L.control.zoom({ position: 'bottomright' }).addTo(mapInstanceRef.current);

    mapInstanceRef.current.on('click', (e) => {
      setSelectedLocation({ lat: e.latlng.lat, lng: e.latlng.lng });
      openModal();
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [openModal, setSelectedLocation]);

  useEffect(() => {
    if (!mapInstanceRef.current) return;

    const markers: L.Marker[] = [];

    entries.forEach((entry) => {
      const marker = createJournalMarker(
        entry,
        mapInstanceRef.current!,
        () => {
          selectEntry(entry);
          openDetail(entry);
        }
      );
      markers.push(marker);
    });

    return () => {
      markers.forEach((marker) => marker.remove());
    };
  }, [entries, selectEntry, openDetail]);

  const handleAddClick = () => {
    if (mapInstanceRef.current) {
      const center = mapInstanceRef.current.getCenter();
      setSelectedLocation({ lat: center.lat, lng: center.lng });
    }
    openModal();
  };

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return (
    <div className="map-container">
      <div ref={mapRef} className="map-wrapper" />

      <div className="map-overlay">
        <div className="search-bar">
          <Search className="search-icon" size={20} />
          <input
            type="text"
            placeholder="搜索餐厅、美食..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>

        <button className="profile-btn" onClick={() => navigate('/profile')}>
          <User size={20} />
        </button>
      </div>

      <button className="add-btn" onClick={handleAddClick}>
        <Plus size={24} />
        <span>添加食记</span>
      </button>

      {isLoading && (
        <div className="map-loading">
          <div className="loading-spinner" />
        </div>
      )}

      {isModalOpen && <JournalModal />}
      {isDetailOpen && selectedEntry && (
        <JournalDetail entry={selectedEntry} />
      )}
    </div>
  );
});

export default MapView;
