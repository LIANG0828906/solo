import React, { useEffect, useState, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.markercluster';
import StationMarker from '../components/StationMarker';
import { stationApi, recordApi } from '../api';
import type { Station, DriftRecord } from '../types';

const CITY_CENTER: [number, number] = [31.2304, 121.4737];

const MapController: React.FC<{ center: [number, number]; zoom: number }> = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
};

const ClusterManager: React.FC<{ children: React.ReactNode; threshold?: number }> = ({
  children,
  threshold = 20,
}) => {
  const map = useMap();
  const clusterRef = useRef<L.MarkerClusterGroup | null>(null);
  const childCount = React.Children.count(children);

  useEffect(() => {
    if (childCount < threshold) {
      if (clusterRef.current) {
        clusterRef.current.clearLayers();
        clusterRef.current = null;
      }
      return;
    }

    const clusterGroup = L.markerClusterGroup({
      chunkedLoading: true,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      maxClusterRadius: 60,
    });

    clusterRef.current = clusterGroup;

    const handleLayerAdd = (e: L.LeafletEvent) => {
      const layer = (e as any).layer;
      if (layer instanceof L.Marker && clusterRef.current && !clusterRef.current.hasLayer(layer)) {
        map.removeLayer(layer);
        clusterRef.current.addLayer(layer);
      }
    };

    map.on('layeradd', handleLayerAdd);

    if (!map.hasLayer(clusterGroup)) {
      map.addLayer(clusterGroup);
    }

    return () => {
      map.off('layeradd', handleLayerAdd);
      if (clusterRef.current && map.hasLayer(clusterRef.current)) {
        const layers = clusterRef.current.getLayers();
        clusterRef.current.clearLayers();
        map.removeLayer(clusterRef.current);
        for (const layer of layers) {
          if (!map.hasLayer(layer)) {
            map.addLayer(layer);
          }
        }
        clusterRef.current = null;
      }
    };
  }, [map, childCount, threshold]);

  return <>{children}</>;
};

const HomeMap: React.FC = () => {
  const [stations, setStations] = useState<Station[]>([]);
  const [records, setRecords] = useState<DriftRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [zoom, setZoom] = useState(12);
  const loadedRef = useRef(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [s, r] = await Promise.all([stationApi.getAll(), recordApi.get()]);
        setStations(s);
        setRecords(r);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
        loadedRef.current = true;
      }
    };
    load();
  }, []);

  const recentRecordsByStation = useMemo(() => {
    const map: Record<string, DriftRecord[]> = {};
    const safeRecords = Array.isArray(records) ? records : [];
    for (const r of safeRecords) {
      if (r.stationId) {
        if (!map[r.stationId]) map[r.stationId] = [];
        map[r.stationId].push(r);
      }
    }
    return map;
  }, [records]);

  const stats = useMemo(() => {
    const safeStations = Array.isArray(stations) ? stations : [];
    const safeRecords = Array.isArray(records) ? records : [];
    const totalBooks = safeStations.reduce((s, st) => s + st.bookCount, 0);
    const stationCount = safeStations.length;
    const driftCount = safeRecords.filter((r) => r.type === 'check_out').length;
    return { totalBooks, stationCount, driftCount };
  }, [stations, records]);

  return (
    <div style={{ position: 'relative', height: '100%', width: '100%' }}>
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, right: 0 }}>
        {loading ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: '#888',
            }}
          >
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>🗺️</div>
              <div>地图加载中...</div>
            </div>
          </div>
        ) : (
          <MapContainer
            center={CITY_CENTER}
            zoom={zoom}
            zoomControl={true}
            style={{ height: '100%', width: '100%' }}
            onZoomend={(e) => setZoom(e.target.getZoom())}
          >
            <MapController center={CITY_CENTER} zoom={zoom} />
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <ClusterManager threshold={20}>
              {(Array.isArray(stations) ? stations : []).map((s) => (
                <StationMarker
                  key={s.id}
                  station={s}
                  recentRecords={recentRecordsByStation[s.id] || []}
                />
              ))}
            </ClusterManager>
          </MapContainer>
        )}
      </div>

      <div
        style={{
          position: 'absolute',
          top: '16px',
          left: '16px',
          zIndex: 500,
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          maxWidth: '280px',
        }}
      >
        <div
          style={{
            background: '#fff',
            borderRadius: '12px',
            padding: '16px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
          }}
        >
          <h2 style={{ fontSize: '15px', fontWeight: 600, color: '#1565C0', marginBottom: '12px' }}>
            📊 概览数据
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px 12px',
                background: '#E3F2FD',
                borderRadius: '8px',
              }}
            >
              <span style={{ fontSize: '13px', color: '#555' }}>站点数量</span>
              <span style={{ fontSize: '18px', fontWeight: 700, color: '#1565C0' }}>
                {stats.stationCount}
              </span>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px 12px',
                background: '#E8F5E9',
                borderRadius: '8px',
              }}
            >
              <span style={{ fontSize: '13px', color: '#555' }}>在架图书</span>
              <span style={{ fontSize: '18px', fontWeight: 700, color: '#4CAF50' }}>
                {stats.totalBooks}
              </span>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px 12px',
                background: '#FFF3E0',
                borderRadius: '8px',
              }}
            >
              <span style={{ fontSize: '13px', color: '#555' }}>漂流总数</span>
              <span style={{ fontSize: '18px', fontWeight: 700, color: '#FF9800' }}>
                {stats.driftCount}
              </span>
            </div>
          </div>
        </div>

        <div
          style={{
            background: '#fff',
            borderRadius: '12px',
            padding: '12px 16px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
          }}
        >
          <div style={{ fontSize: '12px', color: '#888', marginBottom: '8px' }}>库存颜色参考</div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '11px',
              color: '#666',
            }}
          >
            <div
              style={{
                height: '12px',
                flex: 1,
                borderRadius: '6px',
                background: 'linear-gradient(to right, #4CAF50, #FF5252)',
              }}
            />
            <span>充足 → 紧张</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeMap;
