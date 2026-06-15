import { useState, useEffect, useCallback, useMemo } from 'react';
import { MapContainer as LeafletMap, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import L from 'leaflet';
import { getAvailableCountries } from '@/data/quiz-questions';
import type { CountryInfo } from '@/types';
import type { FeatureCollection, Feature, Geometry } from 'geojson';
import './MapContainer.css';

const GEOJSON_URL = 'https://d2ad6b4ur7yvpq.cloudfront.net/naturalearth-3.3.0/ne_110m_admin_0_countries.geojson';

const COUNTRY_NAME_MAP: Record<string, string> = {
  'China': '中国',
  'United States of America': '美国',
  'Japan': '日本',
  'France': '法国',
  'United Kingdom': '英国',
  'Germany': '德国',
  'Italy': '意大利',
  'Brazil': '巴西',
  'Russia': '俄罗斯',
  'India': '印度',
  'Egypt': '埃及',
  'Australia': '澳大利亚',
  'Canada': '加拿大',
  'Spain': '西班牙',
  'Mexico': '墨西哥',
  'South Korea': '韩国',
  'Republic of Korea': '韩国',
  'Greece': '希腊',
  'Thailand': '泰国',
};

interface MapControllerProps {
  geoJsonData: FeatureCollection | null;
  onCountryClick?: (country: CountryInfo) => void;
}

const MapController = ({ geoJsonData, onCountryClick }: MapControllerProps) => {
  const map = useMap();

  const getChineseName = useCallback((englishName: string): string => {
    return COUNTRY_NAME_MAP[englishName] || englishName;
  }, []);

  const hasQuiz = useCallback((countryName: string): boolean => {
    const availableCountries = getAvailableCountries();
    const chineseName = getChineseName(countryName);
    return availableCountries.includes(chineseName);
  }, [getChineseName]);

  const onEachFeature = useCallback(
    (feature: Feature<Geometry>, layer: L.Layer) => {
      const countryName = feature.properties?.name || feature.properties?.NAME || 'Unknown';
      const chineseName = getChineseName(countryName);
      const hasQuizData = hasQuiz(countryName);

      if (hasQuizData) {
        layer.bindTooltip(chineseName, {
          permanent: false,
          direction: 'center',
          className: 'country-tooltip',
        });
      }

      layer.on('click', () => {
        if (hasQuizData && onCountryClick) {
          const polygon = layer as L.Polygon;
          const latLngBounds = polygon.getBounds
            ? polygon.getBounds()
            : map.getBounds();
          const center = latLngBounds.getCenter();

          onCountryClick({
            name: chineseName,
            code: feature.properties?.iso_a3 || feature.properties?.ISO_A3 || '',
            lat: center.lat,
            lng: center.lng,
          });
        }
      });
    },
    [onCountryClick, map, getChineseName, hasQuiz]
  );

  const style = useCallback(
    (feature?: Feature<Geometry>): L.PathOptions => {
      const countryName = feature?.properties?.name || feature?.properties?.NAME || '';
      const isAvailable = hasQuiz(countryName);

      return {
        fillColor: isAvailable ? '#d4a574' : '#8b7355',
        weight: 1,
        opacity: 0.6,
        color: '#aaaaaa',
        fillOpacity: isAvailable ? 0.8 : 0.4,
        className: isAvailable ? 'country-interactive' : 'country-disabled',
      };
    },
    [hasQuiz]
  );

  const highlightFeature = useCallback((e: L.LeafletMouseEvent) => {
    const layer = e.target as L.GeoJSON;
    const feature = (layer as any).feature as Feature<Geometry> | undefined;
    const countryName = feature?.properties?.name || feature?.properties?.NAME || '';

    if (hasQuiz(countryName)) {
      layer.setStyle({
        weight: 2,
        fillOpacity: 0.7,
        opacity: 0.9,
      });

      if (!L.Browser.ie && !L.Browser.edge) {
        layer.bringToFront();
      }
    }
  }, [hasQuiz]);

  const resetHighlight = useCallback((e: L.LeafletMouseEvent) => {
    const layer = e.target as L.GeoJSON;
    const feature = (layer as any).feature as Feature<Geometry> | undefined;
    const countryName = feature?.properties?.name || feature?.properties?.NAME || '';

    if (hasQuiz(countryName)) {
      layer.setStyle({
        weight: 1,
        fillOpacity: 0.8,
        opacity: 0.6,
      });
    }
  }, [hasQuiz]);

  if (!geoJsonData) {
    return null;
  }

  return (
    <GeoJSON
      data={geoJsonData}
      style={style}
      onEachFeature={(feature, layer) => {
        onEachFeature(feature as Feature<Geometry>, layer);
        layer.on('mouseover', (e) => highlightFeature(e));
        layer.on('mouseout', (e) => resetHighlight(e));
      }}
    />
  );
};

interface MapContainerProps {
  onCountryClick?: (country: CountryInfo) => void;
}

const MapContainerComponent = ({ onCountryClick }: MapContainerProps) => {
  const [geoJsonData, setGeoJsonData] = useState<FeatureCollection | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchGeoJSON = async () => {
      try {
        const response = await fetch(GEOJSON_URL);
        const data = await response.json();
        setGeoJsonData(data);
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to load GeoJSON data:', error);
        setIsLoading(false);
      }
    };

    fetchGeoJSON();
  }, []);

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
        <div className="map-ocean-bg" />
        <TileLayer
          attribution=''
          url=''
          className='ocean-tile'
        />
        {geoJsonData && (
          <MapController
            geoJsonData={geoJsonData}
            onCountryClick={onCountryClick}
          />
        )}
      </LeafletMap>

      {isLoading && (
        <div className="map-loading">
          <div className="loading-spinner">🌍</div>
          <p>正在加载世界地图...</p>
        </div>
      )}

      {!isLoading && (
        <div className="map-instructions">
          <span className="instruction-icon">🗺️</span>
          <span>点击有题库的国家开始答题</span>
        </div>
      )}
    </div>
  );
};

export default MapContainerComponent;
