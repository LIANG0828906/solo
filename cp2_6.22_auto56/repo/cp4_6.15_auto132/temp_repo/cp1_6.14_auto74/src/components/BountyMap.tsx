import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
// import 'leaflet/dist/leaflet.css';
import { useNavigate, useLocation } from 'react-router-dom';
import { taskApi } from '../services/api';
import { Task, UserInfo } from '../types';

interface BountyMapProps {
  user: UserInfo;
  refreshUser: () => void;
}

const PLAYER_LOCATION: [number, number] = [31.2304, 121.4737];

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function truncateText(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen) + '...';
}

export default function BountyMap({ user, refreshUser }: BountyMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const popupRef = useRef<HTMLDivElement>(null);

  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [popupPosition, setPopupPosition] = useState<{ x: number; y: number } | null>(null);
  const [accepting, setAccepting] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: PLAYER_LOCATION,
      zoom: 14,
      zoomControl: true,
      attributionControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    mapRef.current = map;

    const state = location.state as { lat?: number; lng?: number; taskId?: string } | null;
    if (state && state.lat !== undefined && state.lng !== undefined) {
      map.flyTo([state.lat, state.lng], 16, { duration: 1 });
    }

    const handleMapClick = (e: L.LeafletMouseEvent) => {
      if (popupRef.current) {
        const rect = popupRef.current.getBoundingClientRect();
        const containerRect = mapContainerRef.current?.getBoundingClientRect();
        if (containerRect) {
          const clickX = e.originalEvent.clientX - containerRect.left;
          const clickY = e.originalEvent.clientY - containerRect.top;
          const popupLeft = rect.left - containerRect.left;
          const popupTop = rect.top - containerRect.top;
          if (
            clickX < popupLeft ||
            clickX > popupLeft + rect.width ||
            clickY < popupTop ||
            clickY > popupTop + rect.height
          ) {
            setSelectedTask(null);
            setPopupPosition(null);
          }
        }
      } else {
        setSelectedTask(null);
        setPopupPosition(null);
      }
    };

    map.on('click', handleMapClick);

    return () => {
      map.off('click', handleMapClick);
      map.remove();
      mapRef.current = null;
    };
  }, [location.state]);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const res = await taskApi.getAll();
        setTasks(res.data);
      } catch (err) {
        console.error('Failed to fetch tasks:', err);
      }
    };
    fetchTasks();
  }, []);

  useEffect(() => {
    if (!mapRef.current || tasks.length === 0) return;

    const map = mapRef.current;

    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current.clear();

    tasks.forEach((task) => {
      const distance = haversineDistance(
        PLAYER_LOCATION[0],
        PLAYER_LOCATION[1],
        task.lat,
        task.lng
      );

      let opacity = 1;
      let pulseDuration = '2s';
      let color = '#e94560';
      let pulse = true;
      let halo = false;

      if (task.userStatus === 'completed') {
        color = '#ffd700';
        opacity = 1;
        pulse = false;
        halo = true;
      } else if (task.userStatus === 'failed') {
        color = '#666666';
        opacity = 0.4;
        pulse = false;
      } else {
        if (distance <= 500) {
          opacity = 1;
          pulseDuration = '0.6s';
        } else if (distance <= 1000) {
          opacity = 0.75;
          pulseDuration = '1.2s';
        } else {
          opacity = 0.5;
          pulseDuration = '2s';
        }
      }

      const animationStyle = pulse
        ? `animation: pulseMarker ${pulseDuration} ease-in-out infinite;`
        : '';
      const haloClass = halo ? 'gold-halo' : '';

      const iconHtml = `
        <div
          class="marker-icon ${haloClass}"
          style="
            position: relative;
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: ${opacity};
            ${animationStyle}
          "
        >
          <span
            style="
              font-size: 32px;
              filter: drop-shadow(0 0 8px ${color});
              ${task.userStatus === 'failed' ? 'grayscale(100%);' : ''}
            "
          >💎</span>
        </div>
      `;

      const icon = L.divIcon({
        className: 'custom-treasure-marker',
        html: iconHtml,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
      });

      const marker = L.marker([task.lat, task.lng], { icon }).addTo(map);

      marker.on('click', (e: L.LeafletMouseEvent) => {
        L.DomEvent.stopPropagation(e);
        const containerRect = mapContainerRef.current?.getBoundingClientRect();
        if (containerRect) {
          const x = e.originalEvent.clientX - containerRect.left;
          const y = e.originalEvent.clientY - containerRect.top;
          setSelectedTask(task);
          setPopupPosition({ x, y });
        }
      });

      markersRef.current.set(task.id, marker);
    });

    const state = location.state as { lat?: number; lng?: number; taskId?: string } | null;
    if (state && state.taskId) {
      const targetTask = tasks.find((t) => t.id === state.taskId);
      if (targetTask) {
        setTimeout(() => {
          const targetMarker = markersRef.current.get(state.taskId!);
          if (targetMarker && mapContainerRef.current) {
            const latLng = targetMarker.getLatLng();
            const point = map.latLngToContainerPoint(latLng);
            setSelectedTask(targetTask);
            setPopupPosition({ x: point.x, y: point.y });
          }
        }, 1100);
      }
    }
  }, [tasks, location.state]);

  const handleAccept = async () => {
    if (!selectedTask || accepting) return;
    setAccepting(true);
    try {
      const res = await taskApi.accept(selectedTask.id);
      const { user: newUser } = res.data;
      localStorage.setItem('user', JSON.stringify(newUser));
      refreshUser();
      navigate('/tasks');
    } catch (err) {
      console.error('Failed to accept task:', err);
    } finally {
      setAccepting(false);
    }
  };

  const renderStars = (difficulty: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span
        key={i}
        style={{
          fontSize: 18,
          color: i < difficulty ? '#ffd700' : '#444',
          textShadow: i < difficulty ? '0 0 4px rgba(255,215,0,0.5)' : 'none',
        }}
      >
        ★
      </span>
    ));
  };

  const getDistanceBadgeClass = (distance: number): string => {
    if (distance <= 500) return 'near';
    if (distance <= 1000) return 'medium';
    return 'far';
  };

  const formatDistance = (meters: number): string => {
    if (meters < 1000) return `${Math.round(meters)}m`;
    return `${(meters / 1000).toFixed(1)}km`;
  };

  const currentDistance = selectedTask
    ? haversineDistance(PLAYER_LOCATION[0], PLAYER_LOCATION[1], selectedTask.lat, selectedTask.lng)
    : 0;

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: 'calc(100vh - 128px)',
        background: '#1a1a2e',
      }}
    >
      <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />

      {selectedTask && popupPosition && (
        <div
          ref={popupRef}
          className="task-detail-popup"
          style={{
            position: 'absolute',
            left: popupPosition.x,
            top: popupPosition.y,
            transform: 'translate(-50%, -100%)',
            marginBottom: 0,
            width: 320,
            background: 'rgba(22, 33, 62, 0.9)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            borderRadius: 16,
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow:
              '0 8px 32px rgba(0, 0, 0, 0.5), 0 2px 8px rgba(233, 69, 96, 0.15)',
            padding: 20,
            zIndex: 800,
          }}
        >
          <div
            style={{
              position: 'absolute',
              bottom: -8,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 0,
              height: 0,
              borderLeft: '8px solid transparent',
              borderRight: '8px solid transparent',
              borderTop: '8px solid rgba(22, 33, 62, 0.9)',
            }}
          />

          <h3
            style={{
              margin: '0 0 10px',
              fontSize: 18,
              fontWeight: 700,
              color: '#fff',
              letterSpacing: 0.5,
            }}
          >
            {selectedTask.name}
          </h3>

          <p
            style={{
              margin: '0 0 14px',
              fontSize: 13,
              color: '#a0a0b8',
              lineHeight: 1.6,
              minHeight: 40,
            }}
          >
            {truncateText(selectedTask.clue, 60)}
          </p>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 14,
              gap: 10,
              flexWrap: 'wrap',
            }}
          >
            <span
              className={`distance-badge ${getDistanceBadgeClass(currentDistance)}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '4px 12px',
                borderRadius: 20,
                fontSize: 12,
                fontWeight: 600,
                background:
                  currentDistance <= 500
                    ? 'rgba(46, 204, 113, 0.15)'
                    : currentDistance <= 1000
                    ? 'rgba(243, 156, 18, 0.15)'
                    : 'rgba(233, 69, 96, 0.15)',
                border: `1px solid ${
                  currentDistance <= 500
                    ? 'rgba(46, 204, 113, 0.3)'
                    : currentDistance <= 1000
                    ? 'rgba(243, 156, 18, 0.3)'
                    : 'rgba(233, 69, 96, 0.3)'
                }`,
                color:
                  currentDistance <= 500
                    ? '#2ecc71'
                    : currentDistance <= 1000
                    ? '#f39c12'
                    : '#e94560',
              }}
            >
              📍 {formatDistance(currentDistance)}
            </span>

            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                fontSize: 14,
                fontWeight: 700,
                color: '#ffd700',
                textShadow: '0 0 8px rgba(255, 215, 0, 0.3)',
              }}
            >
              ⭐ {selectedTask.points}
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              marginBottom: 18,
            }}
          >
            <span style={{ fontSize: 12, color: '#888', marginRight: 4 }}>难度:</span>
            {renderStars(selectedTask.difficulty)}
          </div>

          <button
            onClick={handleAccept}
            disabled={
              accepting ||
              selectedTask.userStatus === 'completed' ||
              selectedTask.userStatus === 'failed'
            }
            style={{
              width: '100%',
              padding: '12px 0',
              background:
                accepting ||
                selectedTask.userStatus === 'completed' ||
                selectedTask.userStatus === 'failed'
                  ? '#555'
                  : 'linear-gradient(135deg, #e94560, #0f3460)',
              border: 'none',
              borderRadius: 10,
              color: '#fff',
              fontSize: 14,
              fontWeight: 600,
              cursor:
                accepting ||
                selectedTask.userStatus === 'completed' ||
                selectedTask.userStatus === 'failed'
                  ? 'not-allowed'
                  : 'pointer',
              letterSpacing: 2,
              transition: 'opacity 0.3s, transform 0.15s',
            }}
          >
            {accepting
              ? '处理中...'
              : selectedTask.userStatus === 'completed'
              ? '已完成'
              : selectedTask.userStatus === 'failed'
              ? '已失败'
              : '接受任务'}
          </button>
        </div>
      )}
    </div>
  );
}
