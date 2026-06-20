import React, { useReducer, useCallback, useEffect } from 'react';
import { MapContainer } from 'react-leaflet';
import type { LatLngTuple } from 'leaflet';
import MapView from './components/MapView';
import InputPanel from './components/InputPanel';
import ShareCard from './components/ShareCard';
import Sidebar from './components/Sidebar';
import type { AppState, AppAction, Location, MoodType, Photo } from './types';
import { HiOutlineShare } from 'react-icons/hi';
import { HiMenu } from 'react-icons/hi';
import { AnimatePresence, motion } from 'framer-motion';

const initialState: AppState = {
  locations: [],
  selectedLocationId: null,
  expandedLocationId: null,
  isInputPanelOpen: false,
  inputPanelPosition: null,
  isShareCardOpen: false,
  isSidebarOpen: true,
};

function reducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'ADD_LOCATION':
      return {
        ...state,
        locations: [...state.locations, action.payload],
        selectedLocationId: action.payload.id,
        isInputPanelOpen: false,
        inputPanelPosition: null,
      };
    case 'DELETE_LOCATION':
      return {
        ...state,
        locations: state.locations.filter(l => l.id !== action.payload),
        selectedLocationId: state.selectedLocationId === action.payload ? null : state.selectedLocationId,
        expandedLocationId: state.expandedLocationId === action.payload ? null : state.expandedLocationId,
      };
    case 'SELECT_LOCATION':
      return {
        ...state,
        selectedLocationId: action.payload,
      };
    case 'EXPAND_LOCATION':
      return { ...state, expandedLocationId: action.payload };
    case 'OPEN_INPUT_PANEL':
      return {
        ...state,
        isInputPanelOpen: true,
        inputPanelPosition: action.payload,
        selectedLocationId: null,
        expandedLocationId: null,
      };
    case 'CLOSE_INPUT_PANEL':
      return {
        ...state,
        isInputPanelOpen: false,
        inputPanelPosition: null,
      };
    case 'OPEN_SHARE_CARD':
      return { ...state, isShareCardOpen: true };
    case 'CLOSE_SHARE_CARD':
      return { ...state, isShareCardOpen: false };
    case 'TOGGLE_SIDEBAR':
      return { ...state, isSidebarOpen: !state.isSidebarOpen };
    default:
      return state;
  }
}

const DEFAULT_CENTER: LatLngTuple = [34.0522, -118.2437];

const SAMPLE_LOCATIONS: Location[] = [
  {
    id: 'sample-1',
    lat: 34.0522,
    lng: -118.2437,
    title: '洛杉矶市中心',
    photos: [
      {
        id: 'p1',
        url: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=400&q=70',
      },
    ],
    note: '阳光正好的午后，漫步在洛杉矶的街道上，感受这座城市的活力与梦想。',
    mood: 'happy' as MoodType,
    createdAt: Date.now() - 86400000 * 3,
  },
  {
    id: 'sample-2',
    lat: 36.0685,
    lng: -112.1379,
    title: '大峡谷国家公园',
    photos: [
      {
        id: 'p2',
        url: 'https://images.unsplash.com/photo-1575408264798-b50b252663e6?w=400&q=70',
      },
      {
        id: 'p3',
        url: 'https://images.unsplash.com/photo-1527333656061-ca7adfd057f1?w=400&q=70',
      },
    ],
    note: '站在悬崖边，被大自然的壮丽震撼到说不出话，内心满是感动与敬畏。',
    mood: 'touched' as MoodType,
    createdAt: Date.now() - 86400000 * 2,
  },
  {
    id: 'sample-3',
    lat: 37.8199,
    lng: -122.4783,
    title: '金门大桥',
    photos: [
      {
        id: 'p4',
        url: 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=400&q=70',
      },
    ],
    note: '雾中的金门大桥像一幅画，海风拂面带来意外的惊喜与宁静。',
    mood: 'surprised' as MoodType,
    createdAt: Date.now() - 86400000,
  },
];

const App: React.FC = () => {
  const [state, dispatch] = useReducer(reducer, {
    ...initialState,
    locations: SAMPLE_LOCATIONS,
  });

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 768) {
        if (state.isSidebarOpen) dispatch({ type: 'TOGGLE_SIDEBAR' });
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleMapClick = useCallback((lat: number, lng: number) => {
    dispatch({ type: 'OPEN_INPUT_PANEL', payload: { lat, lng } });
  }, []);

  const handleSaveLocation = useCallback(
    (data: { photos: Photo[]; note: string; mood: MoodType }) => {
      if (!state.inputPanelPosition) return;
      const title = data.note.trim().slice(0, 15) || '未命名地点';
      const newLocation: Location = {
        id: `loc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        lat: state.inputPanelPosition.lat,
        lng: state.inputPanelPosition.lng,
        title,
        photos: data.photos,
        note: data.note,
        mood: data.mood,
        createdAt: Date.now(),
      };
      dispatch({ type: 'ADD_LOCATION', payload: newLocation });
    },
    [state.inputPanelPosition]
  );

  const handleSelectLocation = useCallback((id: string | null) => {
    dispatch({ type: 'SELECT_LOCATION', payload: id });
    dispatch({ type: 'EXPAND_LOCATION', payload: null });
  }, []);

  const handleExpandLocation = useCallback((id: string | null) => {
    dispatch({ type: 'EXPAND_LOCATION', payload: id });
  }, []);

  const selectedLocation = state.locations.find(l => l.id === state.selectedLocationId) || null;
  const expandedLocation = state.locations.find(l => l.id === state.expandedLocationId) || null;

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        position: 'relative',
        backgroundColor: 'var(--bg-main)',
      }}
    >
      <AnimatePresence>
        {state.isSidebarOpen && (
          <Sidebar
            key="sidebar"
            locations={state.locations}
            selectedLocationId={state.selectedLocationId}
            onSelect={handleSelectLocation}
            onDelete={(id) => dispatch({ type: 'DELETE_LOCATION', payload: id })}
            onClose={() => dispatch({ type: 'TOGGLE_SIDEBAR' })}
          />
        )}
      </AnimatePresence>

      <div
        style={{
          flex: 1,
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '16px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: '1200px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '12px',
            zIndex: 400,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={() => dispatch({ type: 'TOGGLE_SIDEBAR' })}
              style={{
                width: '44px',
                height: '44px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--panel-bg)',
                boxShadow: 'var(--shadow-soft)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
                color: 'var(--text-primary)',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = 'var(--shadow-hover)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'var(--shadow-soft)';
              }}
              aria-label="切换侧边栏"
            >
              <HiMenu />
            </button>
            <div>
              <h1
                style={{
                  fontSize: '20px',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  letterSpacing: '-0.02em',
                }}
              >
                🗺️ 旅行纪念地图
              </h1>
              <p
                style={{
                  fontSize: '12px',
                  color: 'var(--text-muted)',
                  marginTop: '2px',
                }}
              >
                已标记 {state.locations.length} 个地点
              </p>
            </div>
          </div>

          <button
            onClick={() => dispatch({ type: 'OPEN_SHARE_CARD' })}
            disabled={state.locations.length === 0}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              borderRadius: 'var(--radius-sm)',
              background: state.locations.length === 0
                ? 'var(--border-soft)'
                : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: state.locations.length === 0 ? 'var(--text-muted)' : '#ffffff',
              fontWeight: 600,
              fontSize: '14px',
              boxShadow: state.locations.length === 0 ? 'none' : 'var(--shadow-soft)',
              transition: 'all 0.2s ease',
              cursor: state.locations.length === 0 ? 'not-allowed' : 'pointer',
            }}
            onMouseEnter={(e) => {
              if (state.locations.length > 0) {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = 'var(--shadow-hover)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = state.locations.length === 0 ? 'none' : 'var(--shadow-soft)';
            }}
          >
            <HiOutlineShare style={{ fontSize: '18px' }} />
            生成分享卡片
          </button>
        </div>

        <div
          id="map-container"
          style={{
            width: '80%',
            maxWidth: '1200px',
            flex: 1,
            minHeight: 0,
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-soft)',
            position: 'relative',
            border: '2px solid transparent',
            backgroundImage: 'linear-gradient(var(--bg-main), var(--bg-main)), var(--gradient-border)',
            backgroundOrigin: 'border-box',
            backgroundClip: 'padding-box, border-box',
          }}
        >
          <MapContainer
            center={DEFAULT_CENTER}
            zoom={5}
            style={{ width: '100%', height: '100%' }}
            scrollWheelZoom
            zoomControl
          >
            <MapView
              locations={state.locations}
              selectedLocationId={state.selectedLocationId}
              expandedLocation={expandedLocation}
              onMapClick={handleMapClick}
              onSelectLocation={handleSelectLocation}
              onExpandLocation={handleExpandLocation}
            />
          </MapContainer>

          <div
            style={{
              position: 'absolute',
              bottom: '16px',
              left: '50%',
              transform: 'translateX(-50%)',
              padding: '8px 16px',
              backgroundColor: 'var(--panel-bg)',
              backdropFilter: 'blur(12px)',
              borderRadius: '999px',
              boxShadow: 'var(--shadow-soft)',
              fontSize: '12px',
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              zIndex: 500,
              pointerEvents: 'none',
            }}
          >
            💡 点击地图任意位置添加旅行记忆
          </div>
        </div>
      </div>

      <AnimatePresence>
        {state.isInputPanelOpen && state.inputPanelPosition && (
          <InputPanel
            key="input-panel"
            position={state.inputPanelPosition}
            onClose={() => dispatch({ type: 'CLOSE_INPUT_PANEL' })}
            onSave={handleSaveLocation}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {state.isShareCardOpen && (
          <ShareCard
            key="share-card"
            locations={state.locations}
            onClose={() => dispatch({ type: 'CLOSE_SHARE_CARD' })}
          />
        )}
      </AnimatePresence>

      {expandedLocation && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(45, 42, 38, 0.5)',
            backdropFilter: 'blur(4px)',
            zIndex: 900,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
          }}
          onClick={() => dispatch({ type: 'EXPAND_LOCATION', payload: null })}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', duration: 0.35, bounce: 0.4 }}
            style={{
              width: '100%',
              maxWidth: '520px',
              maxHeight: '85vh',
              backgroundColor: 'var(--panel-bg)',
              backdropFilter: 'blur(20px)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: 'var(--shadow-hover)',
              overflow: 'hidden',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {expandedLocation.photos.length > 0 && (
              <div style={{ position: 'relative' }}>
                <img
                  src={expandedLocation.photos[0].url}
                  alt={expandedLocation.title}
                  style={{
                    width: '100%',
                    height: '220px',
                    objectFit: 'cover',
                    display: 'block',
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(to bottom, transparent 40%, rgba(45,42,38,0.7) 100%)',
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    bottom: '16px',
                    left: '20px',
                    right: '20px',
                    color: '#ffffff',
                  }}
                >
                  <h2 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '6px' }}>
                    {expandedLocation.title}
                  </h2>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', opacity: 0.9 }}>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '3px 10px',
                        borderRadius: '999px',
                        backgroundColor: 'rgba(255,255,255,0.2)',
                      }}
                    >
                      ● {expandedLocation.mood === 'happy' ? '😄 开心' :
                        expandedLocation.mood === 'touched' ? '🥹 感动' :
                        expandedLocation.mood === 'surprised' ? '🎉 惊喜' :
                        expandedLocation.mood === 'calm' ? '🌿 平静' : '😮‍💨 疲惫'}
                    </span>
                    <span>{new Date(expandedLocation.createdAt).toLocaleDateString('zh-CN')}</span>
                  </div>
                </div>
              </div>
            )}
            <div className="custom-scrollbar" style={{ padding: '20px', overflowY: 'auto', maxHeight: expandedLocation.photos.length > 0 ? 'calc(85vh - 220px)' : '85vh' }}>
              {expandedLocation.note && (
                <p
                  style={{
                    fontSize: '15px',
                    lineHeight: 1.7,
                    color: 'var(--text-secondary)',
                    marginBottom: '16px',
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {expandedLocation.note}
                </p>
              )}
              {expandedLocation.photos.length > 1 && (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: `repeat(${Math.min(expandedLocation.photos.length - 1, 3)}, 1fr)`,
                    gap: '8px',
                    marginTop: '12px',
                  }}
                >
                  {expandedLocation.photos.slice(1).map((photo) => (
                    <img
                      key={photo.id}
                      src={photo.url}
                      alt=""
                      style={{
                        width: '100%',
                        aspectRatio: '1',
                        objectFit: 'cover',
                        borderRadius: 'var(--radius-sm)',
                      }}
                    />
                  ))}
                </div>
              )}
              <button
                onClick={() => {
                  dispatch({ type: 'DELETE_LOCATION', payload: expandedLocation.id });
                  dispatch({ type: 'EXPAND_LOCATION', payload: null });
                }}
                style={{
                  width: '100%',
                  marginTop: '20px',
                  padding: '12px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: '#FFF0F0',
                  color: '#E5484D',
                  fontSize: '14px',
                  fontWeight: 500,
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#FFE0E0'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#FFF0F0'; }}
              >
                删除此地点
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default App;
