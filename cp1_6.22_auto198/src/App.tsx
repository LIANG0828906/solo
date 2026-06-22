import { useState, useMemo, useCallback } from 'react';
import EarthScene from '@/modules/EarthScene';
import ControlPanel from '@/components/ControlPanel';
import Timeline from '@/components/Timeline';
import StatsPanel from '@/components/StatsPanel';
import EarthquakeCard from '@/components/EarthquakeCard';
import { useEarthquakeData, useFilteredData, getLast7Days } from '@/modules/DataProcessor';
import type { FilterParams } from '@/types';

export default function App() {
  const { data, loading } = useEarthquakeData();
  const days = useMemo(() => getLast7Days(), []);

  const [filters, setFilters] = useState<FilterParams>({
    timeRange: '7d',
    magnitudeMin: 4.5,
    magnitudeMax: 10,
    showPlateBoundaries: true,
  });

  const [dayIndex, setDayIndex] = useState(days.length - 1);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filteredData = useFilteredData(data, filters, days[dayIndex]);

  const selectedQuake = useMemo(() => {
    if (!selectedId) return null;
    return filteredData.find((e) => e.id === selectedId) || null;
  }, [filteredData, selectedId]);

  const handleSelect = useCallback((id: string | null) => {
    setSelectedId(id);
  }, []);

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#0A0A23', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0 }}>
        {loading ? (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#E94560',
              fontFamily: "'Space Grotesk', system-ui, sans-serif",
              fontSize: 18,
              letterSpacing: 2,
            }}
          >
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: 40, height: 40, border: '3px solid rgba(233,69,96,0.2)', borderTopColor: '#E94560', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
              <div>加载地震数据...</div>
            </div>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : (
          <EarthScene
            earthquakes={filteredData}
            showPlateBoundaries={filters.showPlateBoundaries}
            selectedId={selectedId}
            onSelect={handleSelect}
          />
        )}
      </div>

      <div
        style={{
          position: 'fixed',
          top: 20,
          right: 20,
          zIndex: 30,
          textAlign: 'right',
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            fontFamily: "'Space Grotesk', system-ui, sans-serif",
            fontSize: 22,
            fontWeight: 800,
            color: '#fff',
            letterSpacing: 1.5,
            textShadow: '0 0 20px rgba(233,69,96,0.6)',
          }}
        >
          EARTHQUAKE
        </div>
        <div
          style={{
            fontFamily: "'Space Grotesk', system-ui, sans-serif",
            fontSize: 13,
            fontWeight: 400,
            color: 'rgba(224,224,224,0.6)',
            letterSpacing: 3,
            marginTop: 2,
          }}
        >
          3 D &nbsp; E X P L O R E R
        </div>
        <div
          style={{
            width: 80,
            height: 2,
            marginLeft: 'auto',
            marginTop: 8,
            background: 'linear-gradient(90deg, transparent, #E94560)',
          }}
        />
      </div>

      {!loading && (
        <>
          <ControlPanel filters={filters} onChange={setFilters} />
          <StatsPanel earthquakes={filteredData} />
          <Timeline days={days} currentIndex={dayIndex} onChange={setDayIndex} />
          <EarthquakeCard earthquake={selectedQuake} onClose={() => setSelectedId(null)} />
        </>
      )}
    </div>
  );
}
