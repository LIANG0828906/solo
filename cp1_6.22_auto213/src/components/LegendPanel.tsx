import { CityClimateData, MIN_TEMPERATURE, MAX_TEMPERATURE } from '../services/climateDataService';

interface LegendPanelProps {
  cities: CityClimateData[];
}

export default function LegendPanel({ cities }: LegendPanelProps) {
  return (
    <div style={{
      position: 'fixed',
      left: 24,
      top: 92,
      width: 200,
      background: 'rgba(26, 26, 46, 0.9)',
      backdropFilter: 'blur(10px)',
      borderRadius: 12,
      padding: 16,
      zIndex: 1000,
      border: '1px solid rgba(255, 255, 255, 0.1)',
      transition: 'all 0.3s ease-in-out',
    }}>
      <h3 style={{
        color: '#FFFFFF',
        fontSize: 14,
        margin: 0,
        marginBottom: 12,
        fontFamily: 'Arial, sans-serif',
        fontWeight: 600,
      }}>
        温度图例
      </h3>
      <div style={{ marginBottom: 16 }}>
        <div style={{
          height: 12,
          borderRadius: 6,
          background: 'linear-gradient(to right, #00BFFF, #FF4500)',
          marginBottom: 6,
        }} />
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          color: '#94A3B8',
          fontSize: 11,
          fontFamily: 'Arial, sans-serif',
        }}>
          <span>{MIN_TEMPERATURE}°C</span>
          <span>{Math.round((MIN_TEMPERATURE + MAX_TEMPERATURE) / 2)}°C</span>
          <span>{MAX_TEMPERATURE}°C</span>
        </div>
      </div>
      <h3 style={{
        color: '#FFFFFF',
        fontSize: 14,
        margin: 0,
        marginBottom: 12,
        fontFamily: 'Arial, sans-serif',
        fontWeight: 600,
      }}>
        城市列表
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {cities.map(city => (
          <div
            key={city.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              transition: 'all 0.3s ease-in-out',
            }}
          >
            <div style={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              background: city.color,
              boxShadow: `0 0 8px ${city.color}`,
              flexShrink: 0,
            }} />
            <span style={{
              color: '#E2E8F0',
              fontSize: 13,
              fontFamily: 'Arial, sans-serif',
            }}>
              {city.nameCN}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
