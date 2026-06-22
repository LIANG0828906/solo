import { useEffect, useMemo, useRef } from 'react';
import {
  MapContainer,
  TileLayer,
  Polyline,
  Marker,
  useMap,
  useMapEvents,
  Popup,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useRouteStore } from '../store/useRouteStore';
import { RoutePoint } from '../types';

import './MapView.css';

const SLOPE_THRESHOLD = 20;

const MapClickHandler = () => {
  const addPoint = useRouteStore((state) => state.addPoint);
  const isDrawing = useRouteStore((state) => state.isDrawing);
  const points = useRouteStore((state) => state.points);
  const finishDrawing = useRouteStore((state) => state.finishDrawing);
  const lastClickRef = useRef<number>(0);

  useMapEvents({
    click: (e) => {
      const now = Date.now();
      const timeDiff = now - lastClickRef.current;
      lastClickRef.current = now;

      if (timeDiff < 300 && points.length > 0) {
        return;
      }

      const newPoint: RoutePoint = {
        lat: e.latlng.lat,
        lng: e.latlng.lng,
      };
      addPoint(newPoint);
    },
  });

  return null;
};

const MapController = () => {
  const map = useMap();
  const points = useRouteStore((state) => state.points);

  useEffect(() => {
    if (points.length >= 2) {
      const bounds = L.latLngBounds(points.map((p) => [p.lat, p.lng]));
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [points, map]);

  return null;
};

const DraggableMarker = ({
  position,
  index,
}: {
  position: [number, number];
  index: number;
}) => {
  const updatePoint = useRouteStore((state) => state.updatePoint);
  const removePoint = useRouteStore((state) => state.removePoint);
  const isDrawing = useRouteStore((state) => state.isDrawing);
  const points = useRouteStore((state) => state.points);
  const finishDrawing = useRouteStore((state) => state.finishDrawing);
  const markerRef = useRef<L.Marker>(null);

  const pathNodeIcon = useMemo(() => {
    return L.divIcon({
      className: 'path-node-icon',
      html: '<div class="path-node"></div>',
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });
  }, []);

  const handleDragEnd = () => {
    const marker = markerRef.current;
    if (marker) {
      const latLng = marker.getLatLng();
      updatePoint(index, { lat: latLng.lat, lng: latLng.lng });
    }
  };

  const handleDoubleClick = (e: L.LeafletMouseEvent) => {
    L.DomEvent.stopPropagation(e);
    if (isDrawing && index === points.length - 1 && points.length > 1) {
      finishDrawing();
    }
  };

  const handleContextMenu = (e: L.LeafletMouseEvent) => {
    L.DomEvent.stopPropagation(e);
    removePoint(index);
  };

  return (
    <Marker
      ref={markerRef}
      position={position}
      icon={pathNodeIcon}
      draggable={true}
      eventHandlers={{
        dragend: handleDragEnd,
        dblclick: handleDoubleClick,
        contextmenu: handleContextMenu,
      }}
    >
      <Popup>
        点 {index + 1}
        <br />
        {position[0].toFixed(4)}, {position[1].toFixed(4)}
      </Popup>
    </Marker>
  );
};

const TeammateMarker = ({ teammate }: { teammate: any }) => {
  const teammateIcon = useMemo(() => {
    return L.divIcon({
      className: 'teammate-icon',
      html: `
        <div class="teammate-marker">
          <img src="${teammate.avatar}" alt="${teammate.name}" />
          ${teammate.isOnline ? '<div class="pulse"></div><div class="online-dot"></div>' : '<div class="offline-dot"></div>'}
        </div>
      `,
      iconSize: [48, 48],
      iconAnchor: [24, 24],
      popupAnchor: [0, -20],
    });
  }, [teammate]);

  return (
    <Marker position={[teammate.lat, teammate.lng]} icon={teammateIcon}>
      <Popup>
        <strong>{teammate.name}</strong>
        <br />
        {teammate.isOnline ? '🟢 在线' : '⚪ 离线'}
      </Popup>
    </Marker>
  );
};

const MapView = () => {
  const points = useRouteStore((state) => state.points);
  const teammates = useRouteStore((state) => state.teammates);
  const elevationProfile = useRouteStore((state) => state.elevationProfile);

  const polylinePositions = useMemo(() => {
    return points.map((p) => [p.lat, p.lng] as [number, number]);
  }, [points]);

  const difficultSegments = useMemo(() => {
    const segments: [number, number][][] = [];
    if (points.length < 2 || elevationProfile.length < 2) return segments;

    for (let i = 0; i < elevationProfile.length - 1; i++) {
      if (elevationProfile[i].slope > SLOPE_THRESHOLD && i < points.length - 1) {
        segments.push([
          [points[i].lat, points[i].lng],
          [points[i + 1].lat, points[i + 1].lng],
        ]);
      }
    }

    return segments;
  }, [points, elevationProfile]);

  return (
    <MapContainer
      center={[30.27, 120.158]}
      zoom={12}
      scrollWheelZoom={true}
      className="leaflet-container"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <MapClickHandler />
      <MapController />

      {polylinePositions.length >= 2 && (
        <Polyline
          positions={polylinePositions}
          color="#FF9800"
          weight={4}
          opacity={0.9}
        />
      )}

      {difficultSegments.map((segment, index) => (
        <Polyline
          key={`difficult-${index}`}
          positions={segment}
          color="#F44336"
          weight={5}
          opacity={0.8}
          dashArray="10, 10"
        />
      ))}

      {points.map((point, index) => (
        <DraggableMarker
          key={`point-${index}`}
          position={[point.lat, point.lng]}
          index={index}
        />
      ))}

      {teammates.map((teammate) => (
        <TeammateMarker key={teammate.id} teammate={teammate} />
      ))}
    </MapContainer>
  );
};

export default MapView;
