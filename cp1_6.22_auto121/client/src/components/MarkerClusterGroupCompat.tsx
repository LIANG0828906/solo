import React, { useEffect, useRef, useState } from 'react';
import { useMap, useLeafletContext } from '@react-leaflet/core';
import L from 'leaflet';
import 'leaflet.markercluster';

interface Props {
  children: React.ReactNode;
}

const MarkerClusterGroupCompat: React.FC<Props> = ({ children }) => {
  const map = useMap();
  const context = useLeafletContext();
  const clusterRef = useRef<L.MarkerClusterGroup | null>(null);
  const layerRefs = useRef<Map<L.Layer, L.Layer>>(new Map());
  const [contextReady, setContextReady] = useState(false);

  useEffect(() => {
    if (context) {
      setContextReady(true);
    }
  }, [context]);

  useEffect(() => {
    if (!map || !contextReady) return;

    const clusterGroup = L.markerClusterGroup({
      chunkedLoading: true,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      maxClusterRadius: 50,
    });

    clusterRef.current = clusterGroup;
    map.addLayer(clusterGroup);

    return () => {
      if (clusterRef.current) {
        map.removeLayer(clusterRef.current);
        clusterRef.current.clearLayers();
        layerRefs.current.clear();
        clusterRef.current = null;
      }
    };
  }, [map, contextReady]);

  useEffect(() => {
    if (!clusterRef.current || !contextReady) return;

    React.Children.forEach(children, (child) => {
      if (!React.isValidElement(child)) return;
    });
  }, [children, contextReady]);

  if (!contextReady) {
    return <>{children}</>;
  }

  return (
    <InnerClusterAdder clusterRef={clusterRef} map={map}>
      {children}
    </InnerClusterAdder>
  );
};

const InnerClusterAdder: React.FC<{
  clusterRef: React.MutableRefObject<L.MarkerClusterGroup | null>;
  map: L.Map;
  children: React.ReactNode;
}> = ({ clusterRef, map, children }) => {
  const portalContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!map) return;

    const handleLayerAdd = (e: any) => {
      const layer: L.Layer = e.layer;
      if (
        clusterRef.current &&
        layer &&
        (layer instanceof L.Marker) &&
        !clusterRef.current.hasLayer(layer)
      ) {
        clusterRef.current.addLayer(layer);
      }
    };

    map.on('layeradd', handleLayerAdd);
    return () => {
      map.off('layeradd', handleLayerAdd);
    };
  }, [map, clusterRef]);

  return <>{children}</>;
};

export default MarkerClusterGroupCompat;
