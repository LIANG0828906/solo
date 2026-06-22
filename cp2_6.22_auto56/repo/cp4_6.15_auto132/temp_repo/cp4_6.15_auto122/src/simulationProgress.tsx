import { useEffect, useRef, useCallback } from 'react';
import { useOceanStore } from './store';

const glassPanel: React.CSSProperties = {
  background: 'rgba(10, 22, 40, 0.6)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  border: '1px solid rgba(0, 229, 255, 0.15)',
  boxShadow: '0 0 20px rgba(0, 229, 255, 0.08)',
  borderRadius: '8px',
};

export default function SimulationProgress() {
  const isSimulating = useOceanStore((s) => s.isSimulating);
  const simulationMonth = useOceanStore((s) => s.simulationMonth);
  const setSimulationMonth = useOceanStore((s) => s.setSimulationMonth);
  const endSimulation = useOceanStore((s) => s.endSimulation);
  const forecastData = useOceanStore((s) => s.forecastData);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const advanceMonth = useCallback(() => {
    const { simulationMonth: currentMonth } = useOceanStore.getState();
    if (currentMonth >= 12) {
      if (timerRef.current) clearInterval(timerRef.current);
      endSimulation();
    } else {
      setSimulationMonth(currentMonth + 1);
    }
  }, [setSimulationMonth, endSimulation]);

  useEffect(() => {
    if (isSimulating) {
      timerRef.current = setInterval(advanceMonth, 1500);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isSimulating, advanceMonth]);

  if (!isSimulating) return null;

  const currentForecast = forecastData?.[simulationMonth - 1];
  const progress = (simulationMonth / 12) * 100;

  return (
    <div
      style={{
        ...glassPanel,
        position: 'absolute',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '600px',
        maxWidth: 'calc(100vw - 360px)',
        padding: '16px 24px',
        zIndex: 100,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <span style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '11px', color: '#00e5ff', letterSpacing: '1px', textTransform: 'uppercase' }}>
          模拟进度
        </span>
        <span style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '13px', color: '#ff9a3c', fontWeight: 600 }}>
          {simulationMonth} / 12 月
        </span>
      </div>

      <div style={{ width: '100%', height: '4px', background: 'rgba(0, 229, 255, 0.1)', borderRadius: '2px', overflow: 'hidden', marginBottom: '10px' }}>
        <div
          style={{
            width: `${progress}%`,
            height: '100%',
            background: 'linear-gradient(90deg, #00e5ff, #ff9a3c)',
            borderRadius: '2px',
            boxShadow: '0 0 10px rgba(0, 229, 255, 0.5)',
            transition: 'width 0.5s ease-in-out',
          }}
        />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
        {Array.from({ length: 12 }, (_, i) => (
          <div
            key={i}
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: i < simulationMonth ? '#00e5ff' : 'rgba(0, 229, 255, 0.15)',
              boxShadow: i < simulationMonth ? '0 0 6px rgba(0, 229, 255, 0.6)' : 'none',
              transition: 'all 0.3s ease',
            }}
          />
        ))}
      </div>

      {currentForecast && (
        <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>
          {currentForecast.summary}
        </p>
      )}
    </div>
  );
}
