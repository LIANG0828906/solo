import { useCallback, useMemo } from 'react';
import { MapContainer as LeafletMap, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import L from 'leaflet';
import { worldGeoJSON, CountryFeature } from '@/data/world-geojson';
import { getAvailableCountries } from '@/data/quiz-questions';
import type { CountryInfo } from '@/types';
import './MapContainer.css';

interface MapControllerProps {
  onCountryClick?: (country: CountryInfo) => void;
}

const MapController = ({ onCountryClick }: MapControllerProps) => {
  const map = useMap();

  const onEachFeature = useCallback(
    (feature: CountryFeature, layer: L.Layer) => {
      if (feature.properties && feature.properties.name) {
        layer.bindTooltip(feature.properties.name, {
          permanent: false,
          direction: 'center',
          className: 'country-tooltip',
        });

        layer.on('click', () => {
          if (onCountryClick) {
            const polygon = layer as L.Polygon;
            const latLngBounds = polygon.getBounds
              ? polygon.getBounds()
              : map.getBounds();
            const center = latLngBounds.getCenter();

            onCountryClick({
              name: feature.properties.name,
              code: feature.properties.code,
              lat: center.lat,
              lng: center.lng,
            });
          }
        });
      }
    },
    [onCountryClick, map]
  );

  const style = useCallback(
    (feature?: any) => {
      const availableCountries = getAvailableCountries();
      const isAvailable =
        feature?.properties?.name &&
        availableCountries.includes(feature.properties.name);

      return {
        fillColor: isAvailable ? '#d4a574' : '#8b7355',
        weight: 1,
        opacity: 0.5,
        color: '#cccccc',
        fillOpacity: isAvailable ? 0.8 : 0.4,
        className: isAvailable ? 'country-interactive' : 'country-disabled',
      };
    },
    []
  );

  const highlightFeature = useCallback((e: L.LeafletMouseEvent) => {
    const layer = e.target;
    if (
      layer.feature?.properties?.name &&
      getAvailableCountries().includes(layer.feature.properties.name)
    ) {
      layer.setStyle({
        weight: 2,
        fillOpacity: 0.7,
        opacity: 0.8,
      });

      if (!L.Browser.ie && !L.Browser.edge) {
        layer.bringToFront();
      }
    }
  }, []);

  const resetHighlight = useCallback((e: L.LeafletMouseEvent) => {
    const layer = e.target;
    if (
      layer.feature?.properties?.name &&
      getAvailableCountries().includes(layer.feature.properties.name)
    ) {
      layer.setStyle({
        weight: 1,
        fillOpacity: 0.8,
        opacity: 0.5,
      });
    }
  }, []);

  const geoJsonStyle = useMemo(() => {
    return { style, onEachFeature, highlightFeature, resetHighlight };
  }, [style, onEachFeature, highlightFeature, resetHighlight]);

  return (
    <GeoJSON
      data={worldGeoJSON}
      style={geoJsonStyle.style}
      onEachFeature={(feature, layer) => {
        geoJsonStyle.onEachFeature(feature as CountryFeature, layer);
        layer.on('mouseover', (e) => geoJsonStyle.highlightFeature(e));
        layer.on('mouseout', (e) => geoJsonStyle.resetHighlight(e));
      }}
    />
  );
};

interface MapContainerProps {
  onCountryClick?: (country: CountryInfo) => void;
}

const MapContainerComponent = ({ onCountryClick }: MapContainerProps) => {
  return (
    <div className="map-wrapper">
      <LeafletMap
        center={[20, 0]}
        zoom={2}
        minZoom={2}
        maxZoom={6}
        worldCopyJump={true}
        zoomControl={true}
        className="world-map"
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution=''
          url=''
          className='ocean-tile'
        />
        <div className="map-ocean-bg" />
        <MapController onCountryClick={onCountryClick} />
      </LeafletMap>

      <div className="map-instructions">
        <span className="instruction-icon">🗺️</span>
        <span>点击有题库的国家开始答题</span>
      </div>
    </div>
  );
};

export default MapContainerComponent;
