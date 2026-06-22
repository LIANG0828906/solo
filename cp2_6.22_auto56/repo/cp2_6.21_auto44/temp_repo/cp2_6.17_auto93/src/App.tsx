import Scene from './scene';
import PlanetInfoPanel from './panel';
import { useStore } from './store';
import type { PlanetData } from './types';

function ControlBar() {
  const planets = useStore(s => s.planets);
  const focusAndSelect = useStore(s => s.focusAndSelect);
  const selectedPlanetId = useStore(s => s.selectedPlanetId);

  return (
    <div style={{
      position: 'fixed',
      left: '20px',
      top: '50%',
      transform: 'translateY(-50%)',
      width: '260px',
      background: '#0F1025',
      border: '1px solid #3A4A6E',
      borderRadius: '8px',
      padding: '16px',
      zIndex: 100,
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)'
    }}>
      <div style={{
        fontSize: '14px',
        color: '#00BFFF',
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '2px',
        marginBottom: '16px',
        paddingBottom: '12px',
        borderBottom: '1px solid #3A4A6E'
      }}>
        ★ 行星导航
      </div>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '6px'
      }}>
        {planets.map((planet: PlanetData) => {
          const isActive = selectedPlanetId === planet.id;
          return (
            <button
              key={planet.id}
              onClick={() => focusAndSelect(planet.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 14px',
                background: isActive ? '#1A2B4A' : 'transparent',
                border: isActive ? '1px solid #00BFFF' : '1px solid transparent',
                borderRadius: '6px',
                color: isActive ? '#00BFFF' : '#C0C0C0',
                fontSize: '14px',
                cursor: 'pointer',
                textAlign: 'left',
                width: '100%',
                transition: 'background-color 0.2s ease',
                fontFamily: 'inherit',
                fontWeight: isActive ? 600 : 400
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = '#1A2B4A';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'transparent';
                }
              }}
            >
              <div
                style={{
                  width: '14px',
                  height: '14px',
                  borderRadius: '50%',
                  background: planet.color,
                  boxShadow: `0 0 8px ${planet.color}`,
                  flexShrink: 0
                }}
              />
              <span>{planet.name}</span>
            </button>
          );
        })}
      </div>

      <div style={{
        marginTop: '20px',
        paddingTop: '16px',
        borderTop: '1px solid #3A4A6E',
        fontSize: '11px',
        color: '#556680',
        lineHeight: '1.6'
      }}>
        <div style={{ color: '#708090', marginBottom: '6px', fontWeight: 500 }}>操作提示</div>
        <div>🖱 拖拽旋转视角</div>
        <div>🔍 滚轮缩放</div>
        <div>🪐 点击行星查看详情</div>
      </div>
    </div>
  );
}

function TitleBar() {
  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 100,
      textAlign: 'center',
      pointerEvents: 'none'
    }}>
      <h1 style={{
        margin: 0,
        fontSize: '28px',
        fontWeight: 700,
        color: '#FFFFFF',
        letterSpacing: '6px',
        textShadow: '0 0 20px rgba(0, 191, 255, 0.5)'
      }}>
        COSMIC ORRERY
      </h1>
      <p style={{
        margin: '6px 0 0 0',
        fontSize: '13px',
        color: '#00BFFF',
        letterSpacing: '3px',
        textTransform: 'uppercase'
      }}>
        Interactive Solar System
      </p>
    </div>
  );
}

export default function App() {
  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      background: '#0B0C1A',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <Scene />
      <TitleBar />
      <ControlBar />
      <PlanetInfoPanel />
    </div>
  );
}
