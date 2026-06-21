import React, { useEffect, useRef } from 'react';

const L = (window as any).L;

interface Route {
  id: string;
  name: string;
  color: string;
  distance: number;
  duration: number;
  congestionIndex: number;
  isRecommended: boolean;
  path: [number, number][];
}

interface WeatherAlert {
  id: string;
  type: string;
  level: string;
  areaName: string;
  coordinates: {
    sw: { lat: number; lng: number };
    ne: { lat: number; lng: number };
  };
  description: string;
}

interface MapViewProps {
  routes: Route[];
  selectedRouteId: string | null;
  alerts: WeatherAlert[];
  onStartSelect: (lat: number, lng: number) => void;
  onEndSelect: (lat: number, lng: number) => void;
}

let blinkStyleInjected = false;

function injectBlinkStyle() {
  if (blinkStyleInjected) return;
  const style = document.createElement('style');
  style.textContent = `
    @keyframes blink {
      0%, 100% { opacity: 1; }
      50% { opacity: 0; }
    }
  `;
  document.head.appendChild(style);
  blinkStyleInjected = true;
}

const MapView: React.FC<MapViewProps> = ({ routes, selectedRouteId, alerts, onStartSelect, onEndSelect }) => {
  const mapRef = useRef<any>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const routeLayerRef = useRef<any>(null);
  const markerLayerRef = useRef<any>(null);
  const alertLayerRef = useRef<any>(null);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    L.Icon.Default.mergeOptions({
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });

    const center = routes.length > 0 && routes[0].path.length > 0
      ? routes[0].path[0]
      : [39.9042, 116.4074];

    const map = L.map(mapContainerRef.current).setView(center, 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    routeLayerRef.current = L.layerGroup().addTo(map);
    markerLayerRef.current = L.layerGroup().addTo(map);
    alertLayerRef.current = L.layerGroup().addTo(map);

    map.on('click', (e: any) => {
      const { lat, lng } = e.latlng;
      onStartSelect(lat, lng);
      onEndSelect(lat, lng);
    });

    mapRef.current = map;
    injectBlinkStyle();

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    routeLayerRef.current.clearLayers();

    routes.forEach((route) => {
      const isSelected = route.id === selectedRouteId;
      const polylineOptions: any = {
        color: route.color,
        weight: 4,
      };
      if (isSelected) {
        polylineOptions.dashArray = '10, 10';
        polylineOptions.dashOffset = '0';
      }
      const polyline = L.polyline(route.path, polylineOptions);
      routeLayerRef.current.addLayer(polyline);

      if (isSelected) {
        let offset = 0;
        const animate = () => {
          offset -= 1;
          polyline.setStyle({ dashOffset: String(offset) });
          (polyline as any)._animationFrame = requestAnimationFrame(animate);
        };
        animate();
      }
    });
  }, [routes, selectedRouteId]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    markerLayerRef.current.clearLayers();

    if (routes.length > 0) {
      const firstRoute = routes[0];
      if (firstRoute.path.length > 0) {
        const start = firstRoute.path[0];
        L.circleMarker(start, {
          radius: 8,
          fillColor: '#00FF00',
          fillOpacity: 1,
          color: '#000',
          weight: 2,
        }).addTo(markerLayerRef.current);

        const end = firstRoute.path[firstRoute.path.length - 1];
        L.circleMarker(end, {
          radius: 8,
          fillColor: '#FF0000',
          fillOpacity: 1,
          color: '#000',
          weight: 2,
        }).addTo(markerLayerRef.current);
      }
    }

    const selectedRoute = routes.find((r) => r.id === selectedRouteId);
    if (selectedRoute && selectedRoute.path.length > 0) {
      const start = selectedRoute.path[0];
      L.circleMarker(start, {
        radius: 10,
        fillColor: '#00FF00',
        fillOpacity: 1,
        color: '#000',
        weight: 2,
      }).addTo(markerLayerRef.current);

      const end = selectedRoute.path[selectedRoute.path.length - 1];
      L.circleMarker(end, {
        radius: 10,
        fillColor: '#FF0000',
        fillOpacity: 1,
        color: '#000',
        weight: 2,
      }).addTo(markerLayerRef.current);
    }
  }, [routes, selectedRouteId]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (selectedRouteId) {
      const selectedRoute = routes.find((r) => r.id === selectedRouteId);
      if (selectedRoute && selectedRoute.path.length > 0) {
        const bounds = L.latLngBounds(selectedRoute.path);
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    }
  }, [selectedRouteId]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    alertLayerRef.current.clearLayers();

    alerts.forEach((alert) => {
      const { sw, ne } = alert.coordinates;
      L.rectangle(
        [
          [sw.lat, sw.lng],
          [ne.lat, ne.lng],
        ],
        {
          fillColor: '#FF0000',
          fillOpacity: 0.2,
          color: '#FF0000',
          weight: 2,
        }
      ).addTo(alertLayerRef.current);

      const centerLat = (sw.lat + ne.lat) / 2;
      const centerLng = (sw.lng + ne.lng) / 2;
      const icon = L.divIcon({
        className: '',
        html: `<div style="width:32px;height:32px;display:flex;align-items:center;justify-content:center;animation:blink 0.5s infinite;">☁️</div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });
      L.marker([centerLat, centerLng], { icon }).addTo(alertLayerRef.current);
    });
  }, [alerts]);

  return <div id="map" ref={mapContainerRef} style={{ width: '100%', minHeight: '500px', borderRadius: '12px' }} />;
};

export default MapView;
