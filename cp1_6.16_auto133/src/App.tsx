import React, { useMemo } from 'react';
import { useStore } from './store';
import { ZoneId, EnvironmentData, Trend, PredictionDay } from './types';
import ZoneCard from './components/ZoneCard';
import ChartPanel from './components/ChartPanel';
import AdvicePanel from './components/AdvicePanel';
import DataEntryForm from './components/DataEntryForm';

const LeafIcon: React.FC<{ style?: React.CSSProperties }> = ({ style }) => (
  <div style={{ ...styles.leafIcon, ...style }}>
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
      <path
        d="M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66.95-2.3c.48.17.98.3 1.34.3C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75C7 8 17 8 17 8z"
        fill="#66BB6A"
      />
    </svg>
  </div>
);

function calculateTrend(data: EnvironmentData[]): Trend {
  if (data.length < 2) {
    return { temperature: 'stable', humidity: 'stable' };
  }

  const recent = data.slice(-3);
  const temps = recent.map((d) => d.temperature);
  const hums = recent.map((d) => d.humidity);

  const getDirection = (arr: number[]): 'up' | 'down' | 'stable' => {
    const diff = arr[arr.length - 1] - arr[0];
    if (diff > 1) return 'up';
    if (diff < -1) return 'down';
    return 'stable';
  };

  return {
    temperature: getDirection(temps),
    humidity: getDirection(hums)
  };
}

function generatePredictions(data: EnvironmentData[]): PredictionDay[] {
  if (data.length === 0) return [];

  const recent = data.slice(-7);
  const avgTemp = recent.reduce((sum, d) => sum + d.temperature, 0) / recent.length;
  const avgHumidity = recent.reduce((sum, d) => sum + d.humidity, 0) / recent.length;

  const days = ['明天', '后天', '大后天'];
  const advices = [
    '预计天气适宜，可正常浇水施肥',
    '建议保持通风，避免病虫害',
    '注意观察叶片状态，及时调整'
  ];

  return days.map((day, i) => {
    const tempVariation = (Math.random() - 0.5) * 4;
    const humVariation = (Math.random() - 0.5) * 10;

    return {
      day,
      temp: Math.round((avgTemp + tempVariation) * 10) / 10,
      humidity: Math.round(avgHumidity + humVariation),
      advice: advices[i]
    };
  });
}

const App: React.FC = () => {
  const { zones, activeZoneId, setActiveZone } = useStore();

  const zoneIds: ZoneId[] = ['balcony', 'windowsill', 'terrace'];

  const activeZone = zones[activeZoneId];
  const latestData = activeZone.data.length > 0 ? activeZone.data[activeZone.data.length - 1] : null;

  const predictions = useMemo(() => generatePredictions(activeZone.data), [activeZone.data]);

  return (
    <div style={styles.app}>
      <header style={styles.header}>
        <LeafIcon />
        <h1 style={styles.title}>花园微气候日志</h1>
        <LeafIcon />
      </header>

      <main style={styles.main}>
        <section style={styles.zonesSection} className="zones-section">
          {zoneIds.map((zoneId) => {
            const zone = zones[zoneId];
            const zoneLatestData = zone.data.length > 0 ? zone.data[zone.data.length - 1] : null;
            const trend = calculateTrend(zone.data);

            return (
              <ZoneCard
                key={zoneId}
                zoneId={zoneId}
                zoneName={zone.name}
                data={zoneLatestData}
                trend={trend}
                isActive={activeZoneId === zoneId}
                onClick={() => setActiveZone(zoneId)}
              />
            );
          })}
        </section>

        <section style={styles.contentSection} className="content-section">
          <div style={styles.leftColumn}>
            <DataEntryForm zoneId={activeZoneId} />
            <div style={{ marginTop: '20px' }}>
              <ChartPanel data={activeZone.data} predictions={predictions} />
            </div>
          </div>

          <div style={styles.rightColumn}>
            <AdvicePanel data={latestData} plant={activeZone.plant} />
          </div>
        </section>
      </main>

      <style>{`
        @media (max-width: 768px) {
          .zones-section {
            flex-direction: column !important;
            align-items: center !important;
          }
          .content-section {
            flex-direction: column !important;
          }
          .recharts-wrapper {
            height: 300px !important;
          }
        }
      `}</style>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  app: {
    width: '100%',
    minHeight: '100vh',
    paddingBottom: '40px'
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '16px',
    padding: '20px 32px',
    background: 'rgba(255, 255, 255, 0.7)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    boxShadow: '0 2px 20px rgba(0, 0, 0, 0.05)',
    position: 'sticky',
    top: 0,
    zIndex: 100
  },
  leafIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  title: {
    fontFamily: 'Georgia, serif',
    fontSize: '28px',
    fontWeight: 700,
    color: '#2E7D32',
    margin: 0
  },
  main: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '32px 24px'
  },
  zonesSection: {
    display: 'flex',
    justifyContent: 'center',
    gap: '24px',
    marginBottom: '32px',
    flexWrap: 'wrap'
  },
  contentSection: {
    display: 'flex',
    gap: '24px',
    alignItems: 'flex-start'
  },
  leftColumn: {
    flex: 2,
    minWidth: 0
  },
  rightColumn: {
    flex: 1,
    minWidth: '300px'
  }
};

export default App;
