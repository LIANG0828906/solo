import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Settings } from 'lucide-react';
import RouteCard from './components/RouteCard';
import MapCanvas from './components/MapCanvas';
import ScoreSettings from './components/ScoreSettings';
import {
  RouteData,
  Waypoint,
  SegmentData,
  CommentData,
  ScoreWeights,
  DEFAULT_WEIGHTS,
  calculateScores,
  generateId,
} from './utils/scoreEngine';

const STORAGE_KEY = 'cycle-route-scorer-data';
const WEIGHTS_KEY = 'cycle-route-scorer-weights';

function haversineDistance(a: Waypoint, b: Waypoint): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
}

function generateSegmentData(count: number): SegmentData[] {
  return Array.from({ length: count }, () => ({
    slope: Math.round(Math.random() * 60 + 5),
    treeCoverage: Math.round(Math.random() * 80 + 10),
    surfaceQuality: Math.round(Math.random() * 70 + 20),
    trafficVolume: Math.round(Math.random() * 80 + 10),
  }));
}

function createDemoRoutes(): RouteData[] {
  const route1Waypoints: Waypoint[] = [
    { lat: 31.23, lng: 121.47 },
    { lat: 31.235, lng: 121.475 },
    { lat: 31.238, lng: 121.482 },
    { lat: 31.24, lng: 121.49 },
    { lat: 31.237, lng: 121.497 },
    { lat: 31.233, lng: 121.502 },
    { lat: 31.228, lng: 121.508 },
    { lat: 31.224, lng: 121.515 },
  ];
  const route1Segments: SegmentData[] = [
    { slope: 8, treeCoverage: 85, surfaceQuality: 90, trafficVolume: 30 },
    { slope: 12, treeCoverage: 78, surfaceQuality: 88, trafficVolume: 25 },
    { slope: 5, treeCoverage: 92, surfaceQuality: 95, trafficVolume: 20 },
    { slope: 15, treeCoverage: 70, surfaceQuality: 85, trafficVolume: 40 },
    { slope: 6, treeCoverage: 88, surfaceQuality: 92, trafficVolume: 22 },
    { slope: 10, treeCoverage: 75, surfaceQuality: 87, trafficVolume: 35 },
    { slope: 3, treeCoverage: 90, surfaceQuality: 93, trafficVolume: 18 },
  ];

  const route2Waypoints: Waypoint[] = [
    { lat: 31.25, lng: 121.4 },
    { lat: 31.26, lng: 121.41 },
    { lat: 31.275, lng: 121.418 },
    { lat: 31.29, lng: 121.425 },
    { lat: 31.3, lng: 121.435 },
    { lat: 31.31, lng: 121.448 },
  ];
  const route2Segments: SegmentData[] = [
    { slope: 45, treeCoverage: 30, surfaceQuality: 65, trafficVolume: 15 },
    { slope: 60, treeCoverage: 25, surfaceQuality: 55, trafficVolume: 12 },
    { slope: 35, treeCoverage: 40, surfaceQuality: 70, trafficVolume: 20 },
    { slope: 55, treeCoverage: 20, surfaceQuality: 60, trafficVolume: 10 },
    { slope: 40, treeCoverage: 35, surfaceQuality: 68, trafficVolume: 18 },
  ];

  const route3Waypoints: Waypoint[] = [
    { lat: 31.22, lng: 121.44 },
    { lat: 31.222, lng: 121.445 },
    { lat: 31.225, lng: 121.448 },
    { lat: 31.228, lng: 121.452 },
    { lat: 31.23, lng: 121.455 },
    { lat: 31.232, lng: 121.458 },
    { lat: 31.235, lng: 121.46 },
    { lat: 31.238, lng: 121.463 },
    { lat: 31.24, lng: 121.466 },
    { lat: 31.242, lng: 121.47 },
  ];
  const route3Segments: SegmentData[] = [
    { slope: 5, treeCoverage: 20, surfaceQuality: 85, trafficVolume: 75 },
    { slope: 8, treeCoverage: 15, surfaceQuality: 80, trafficVolume: 80 },
    { slope: 3, treeCoverage: 25, surfaceQuality: 88, trafficVolume: 70 },
    { slope: 10, treeCoverage: 18, surfaceQuality: 82, trafficVolume: 85 },
    { slope: 4, treeCoverage: 22, surfaceQuality: 90, trafficVolume: 72 },
    { slope: 6, treeCoverage: 12, surfaceQuality: 78, trafficVolume: 78 },
    { slope: 7, treeCoverage: 28, surfaceQuality: 86, trafficVolume: 68 },
    { slope: 2, treeCoverage: 20, surfaceQuality: 92, trafficVolume: 65 },
    { slope: 5, treeCoverage: 15, surfaceQuality: 84, trafficVolume: 74 },
  ];

  const now = new Date().toISOString();
  const dayAgo = new Date(Date.now() - 86400000).toISOString();
  const twoDaysAgo = new Date(Date.now() - 172800000).toISOString();

  return [
    {
      id: 'demo-1',
      name: '滨江绿道骑行',
      waypoints: route1Waypoints,
      segments: route1Segments,
      distance: 15.2,
      elevationGain: 85,
      likes: 42,
      liked: false,
      comments: [
        { id: 'c1', text: '树荫很多，夏天骑行很舒服！', createdAt: dayAgo },
        { id: 'c2', text: '路面平整，适合新手', createdAt: twoDaysAgo },
      ],
      scores: calculateScores(route1Segments, DEFAULT_WEIGHTS),
      createdAt: twoDaysAgo,
    },
    {
      id: 'demo-2',
      name: '山间公路挑战',
      waypoints: route2Waypoints,
      segments: route2Segments,
      distance: 23.8,
      elevationGain: 520,
      likes: 28,
      liked: false,
      comments: [
        { id: 'c3', text: '坡度很大，需要一定体力', createdAt: dayAgo },
      ],
      scores: calculateScores(route2Segments, DEFAULT_WEIGHTS),
      createdAt: twoDaysAgo,
    },
    {
      id: 'demo-3',
      name: '城市通勤路线',
      waypoints: route3Waypoints,
      segments: route3Segments,
      distance: 8.6,
      elevationGain: 35,
      likes: 15,
      liked: false,
      comments: [],
      scores: calculateScores(route3Segments, DEFAULT_WEIGHTS),
      createdAt: now,
    },
  ];
}

function loadRoutes(): RouteData[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return createDemoRoutes();
}

function saveRoutes(routes: RouteData[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(routes));
}

function loadWeights(): ScoreWeights {
  try {
    const raw = localStorage.getItem(WEIGHTS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { ...DEFAULT_WEIGHTS };
}

function saveWeights(weights: ScoreWeights) {
  localStorage.setItem(WEIGHTS_KEY, JSON.stringify(weights));
}

export default function App() {
  const [routes, setRoutes] = useState<RouteData[]>(loadRoutes);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [weights, setWeights] = useState<ScoreWeights>(loadWeights);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadText, setUploadText] = useState('');
  const [previewWaypoints, setPreviewWaypoints] = useState<Waypoint[] | null>(null);
  const [mapOpacity, setMapOpacity] = useState(1);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [loading, setLoading] = useState(false);
  const newCardRef = useRef<string | null>(null);

  const selectedRoute = routes.find((r) => r.id === selectedRouteId) ?? null;

  const sortedRoutes = [...routes].sort((a, b) => b.likes - a.likes);

  const handleSelectRoute = useCallback(
    (id: string) => {
      if (id === selectedRouteId || isTransitioning) return;
      setIsTransitioning(true);
      setMapOpacity(0);
      setTimeout(() => {
        setSelectedRouteId(id);
        setMapOpacity(1);
        setIsTransitioning(false);
      }, 250);
    },
    [selectedRouteId, isTransitioning]
  );

  const handleLike = useCallback(
    (id: string) => {
      setRoutes((prev) =>
        prev.map((r) =>
          r.id === id
            ? { ...r, liked: !r.liked, likes: r.liked ? r.likes - 1 : r.likes + 1 }
            : r
        )
      );
    },
    []
  );

  const handleComment = useCallback(
    (id: string, comment: CommentData) => {
      setRoutes((prev) =>
        prev.map((r) =>
          r.id === id ? { ...r, comments: [...r.comments, comment] } : r
        )
      );
    },
    []
  );

  const handleSaveWeights = useCallback(
    (newWeights: ScoreWeights) => {
      setWeights(newWeights);
      saveWeights(newWeights);
      setRoutes((prev) =>
        prev.map((r) => ({
          ...r,
          scores: calculateScores(r.segments, newWeights),
        }))
      );
    },
    []
  );

  const parseWaypoints = useCallback((text: string): Waypoint[] | null => {
    const lines = text
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    if (lines.length < 2) return null;
    const wps: Waypoint[] = [];
    for (const line of lines) {
      const parts = line.split(',').map((s) => s.trim());
      if (parts.length < 2) return null;
      const lat = parseFloat(parts[0]);
      const lng = parseFloat(parts[1]);
      if (isNaN(lat) || isNaN(lng)) return null;
      wps.push({ lat, lng });
    }
    return wps;
  }, []);

  const handlePreview = useCallback(() => {
    const wps = parseWaypoints(uploadText);
    setPreviewWaypoints(wps);
  }, [uploadText, parseWaypoints]);

  const handleSubmit = useCallback(() => {
    const wps = parseWaypoints(uploadText);
    if (!wps || wps.length < 2) return;

    setLoading(true);
    setTimeout(() => {
      const segments = generateSegmentData(wps.length - 1);
      let totalDist = 0;
      for (let i = 0; i < wps.length - 1; i++) {
        totalDist += haversineDistance(wps[i], wps[i + 1]);
      }
      const elevationGain = Math.round(
        segments.reduce((acc, s) => acc + s.slope * 2, 0)
      );
      const newRoute: RouteData = {
        id: generateId(),
        name: `自定义路线 ${routes.length + 1}`,
        waypoints: wps,
        segments,
        distance: Math.round(totalDist * 10) / 10,
        elevationGain,
        likes: 0,
        liked: false,
        comments: [],
        scores: calculateScores(segments, weights),
        createdAt: new Date().toISOString(),
      };

      setRoutes((prev) => {
        const updated = [...prev, newRoute];
        saveRoutes(updated);
        return updated;
      });
      newCardRef.current = newRoute.id;
      setUploadOpen(false);
      setUploadText('');
      setPreviewWaypoints(null);
      setLoading(false);

      setTimeout(() => {
        handleSelectRoute(newRoute.id);
        newCardRef.current = null;
      }, 100);
    }, 300);
  }, [uploadText, routes.length, weights, parseWaypoints, handleSelectRoute]);

  useEffect(() => {
    saveRoutes(routes);
  }, [routes]);

  return (
    <div style={{ minHeight: '100vh', background: '#F0F7E6' }}>
      <nav
        style={{
          height: 50,
          background: '#2E7D32',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setUploadOpen((p) => !p)}
            style={{
              background: 'rgba(255,255,255,0.15)',
              border: 'none',
              borderRadius: 8,
              width: 36,
              height: 36,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'white',
              transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                'rgba(255,255,255,0.25)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                'rgba(255,255,255,0.15)';
            }}
          >
            <Plus size={20} />
          </motion.button>
          <span style={{ color: 'white', fontSize: 18, fontWeight: 700, letterSpacing: 1 }}>
            城市骑行路线评分系统
          </span>
        </div>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setSettingsOpen(true)}
          style={{
            background: 'rgba(255,255,255,0.15)',
            border: 'none',
            borderRadius: 8,
            width: 36,
            height: 36,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: 'white',
            transition: 'background 0.2s',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background =
              'rgba(255,255,255,0.25)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background =
              'rgba(255,255,255,0.15)';
          }}
        >
          <Settings size={20} />
        </motion.button>
      </nav>

      <div
        style={{
          maxWidth: 1100,
          margin: '0 auto',
          padding: '24px 0',
          display: 'flex',
          gap: 20,
          position: 'relative',
        }}
      >
        <div
          style={{
            width: 280,
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            maxHeight: 'calc(100vh - 98px)',
            overflowY: 'auto',
            paddingRight: 4,
          }}
        >
          {sortedRoutes.map((route, index) => (
            <RouteCard
              key={route.id}
              route={route}
              isSelected={route.id === selectedRouteId}
              isTopRanked={index === 0}
              onLike={handleLike}
              onSelect={handleSelectRoute}
              onComment={handleComment}
            />
          ))}
        </div>

        <div style={{ flex: 1 }}>
          <MapCanvas
            route={selectedRoute}
            previewWaypoints={previewWaypoints}
            opacity={mapOpacity}
          />
          {selectedRoute && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              style={{
                marginTop: 16,
                padding: 16,
                background: '#FFFFFF',
                borderRadius: 12,
                border: '2px solid #C8E6C9',
              }}
            >
              <div style={{ fontSize: 16, fontWeight: 700, color: '#333', marginBottom: 8 }}>
                {selectedRoute.name}
              </div>
              <div style={{ display: 'flex', gap: 24, fontSize: 13, color: '#666' }}>
                <span>距离: {selectedRoute.distance}km</span>
                <span>爬升: {selectedRoute.elevationGain}m</span>
                <span>
                  平均评分:{' '}
                  {(
                    selectedRoute.scores.reduce((a, b) => a + b, 0) /
                    selectedRoute.scores.length
                  ).toFixed(1)}
                </span>
                <span>
                  路段数: {selectedRoute.segments.length}
                </span>
              </div>
            </motion.div>
          )}
          {!selectedRoute && (
            <div
              style={{
                width: 800,
                height: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#999',
                fontSize: 16,
                background: '#FFFFFF',
                borderRadius: 12,
                border: '2px dashed #C8E6C9',
              }}
            >
              点击左侧路线卡片查看地图
            </div>
          )}
        </div>

        <AnimatePresence>
          {uploadOpen && (
            <motion.div
              initial={{ x: -320, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -320, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              style={{
                position: 'fixed',
                left: 0,
                top: 50,
                width: 320,
                background: '#F5F5F5',
                borderRadius: '0 12px 12px 0',
                padding: 20,
                zIndex: 50,
                maxHeight: 'calc(100vh - 70px)',
                overflowY: 'auto',
                boxShadow: '2px 0 12px rgba(0,0,0,0.1)',
              }}
            >
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: '#333',
                  marginBottom: 12,
                }}
              >
                上传骑行路线
              </div>
              <div style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>
                每行输入一对经纬度，格式：纬度,经度
              </div>
              <textarea
                value={uploadText}
                onChange={(e) => setUploadText(e.target.value)}
                placeholder={'31.230, 121.470\n31.235, 121.475\n31.240, 121.490'}
                style={{
                  width: 280,
                  height: 120,
                  background: '#FFFFFF',
                  borderRadius: 8,
                  border: '2px dashed #A5D6A7',
                  padding: 10,
                  fontSize: 13,
                  resize: 'none',
                  fontFamily: 'monospace',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <button
                  onClick={handlePreview}
                  style={{
                    background: '#2E7D32',
                    color: 'white',
                    borderRadius: 20,
                    border: 'none',
                    padding: '12px 24px',
                    cursor: 'pointer',
                    fontSize: 14,
                    flex: 1,
                  }}
                >
                  预览
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  style={{
                    background: '#1B5E20',
                    color: 'white',
                    borderRadius: 20,
                    border: 'none',
                    padding: '12px 24px',
                    cursor: loading ? 'wait' : 'pointer',
                    fontSize: 14,
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    opacity: loading ? 0.7 : 1,
                  }}
                >
                  {loading && (
                    <motion.span
                      animate={{ rotate: 360 }}
                      transition={{ duration: 0.6, repeat: Infinity, ease: 'linear' }}
                      style={{ display: 'inline-block' }}
                    >
                      ↻
                    </motion.span>
                  )}
                  提交
                </button>
              </div>
              {previewWaypoints && (
                <div
                  style={{
                    marginTop: 12,
                    padding: 10,
                    background: '#E8F5E9',
                    borderRadius: 8,
                    fontSize: 12,
                    color: '#2E7D32',
                  }}
                >
                  ✓ 已解析 {previewWaypoints.length} 个途经点，
                  共 {previewWaypoints.length - 1} 个路段
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <ScoreSettings
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        weights={weights}
        onSave={handleSaveWeights}
      />
    </div>
  );
}
