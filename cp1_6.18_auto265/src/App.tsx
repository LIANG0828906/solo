import { useEffect } from 'react';
import Cityscape from './components/Cityscape';
import Timeline from './components/Timeline';
import Legend from './components/Legend';
import { useCityStore } from './store/useCityStore';

export default function App() {
  const tick = useCityStore((s) => s.tick);

  useEffect(() => {
    const id = window.setInterval(() => {
      tick(1);
    }, 1000);
    return () => window.clearInterval(id);
  }, [tick]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: '0',
        width: '100vw',
        height: '100vh',
        background: 'linear-gradient(180deg, #0B0D17 0%, #1A1D2E 100%)',
        overflow: 'hidden',
      }}
    >
      <Starfield />
      <Cityscape />
      <Legend />
      <Timeline />
      <style>{`
        .legend-root {
        }
        @media (max-width: 768px) {
          .legend-root > div {
            top: auto !important;
            right: auto !important;
            bottom: 120px !important;
            left: 50% !important;
            transform: translateX(-50%);
            flex-direction: row !important;
            gap: 16px !important;
            padding: 10px 14px !important;
            min-width: 0 !important;
          }
          .legend-root > div > div:first-child {
            display: none !important;
          }
          .cityscape-root {
            transform: translateX(-50%) scale(0.7) !important;
            transform-origin: bottom center;
          }
        }
        @media (min-width: 1200px) {
          .cityscape-root {
            height: calc(100vh - 180px);
            align-items: flex-end;
          }
        }
      `}</style>
    </div>
  );
}

function Starfield() {
  const stars = Array.from({ length: 80 }, (_, i) => {
    const seed = (i * 2654435761) >>> 0;
    const s = (n: number) => (((seed >>> n) & 0xff) / 255);
    return {
      left: `${s(0) * 100}%`,
      top: `${s(8) * 65}%`,
      size: s(16) > 0.85 ? 2 : 1,
      delay: `${(s(24) * 4).toFixed(2)}s`,
      dur: `${(2 + s(4) * 4).toFixed(2)}s`,
      op: 0.3 + s(12) * 0.6,
    };
  });
  return (
    <div
      aria-hidden
      style={{
        position: 'absolute',
        inset: '0',
        pointerEvents: 'none',
      }}
    >
      {stars.map((st, i) => (
        <span
          key={i}
          style={{
            position: 'absolute',
            left: st.left,
            top: st.top,
            width: `${st.size}px`,
            height: `${st.size}px`,
            borderRadius: '50%',
            background: '#ffffff',
            opacity: st.op,
            animation: `star-twinkle ${st.dur} ease-in-out ${st.delay} infinite`,
            boxShadow: st.size > 1 ? '0 0 4px rgba(255,255,255,0.8)' : 'none',
          }}
        />
      ))}
      <style>{`
        @keyframes star-twinkle {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
