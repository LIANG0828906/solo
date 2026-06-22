import { useEffect, useRef } from 'react';
import { useStore } from './store';
import type { PlanetData } from './types';

interface PanelProps {
  planet: PlanetData;
  onClose: () => void;
}

function PlanetPanel({ planet, onClose }: PanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        pointerEvents: 'none'
      }}
    >
      <div
        ref={panelRef}
        style={{
          background: 'rgba(10, 10, 30, 0.85)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '12px',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          padding: '28px 32px',
          minWidth: '340px',
          maxWidth: '420px',
          color: '#C0C0C0',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
          pointerEvents: 'auto',
          animation: 'panelFadeIn 0.3s ease-out forwards',
          transformOrigin: 'center center'
        }}
      >
        <style>{`
          @keyframes panelFadeIn {
            0% {
              opacity: 0;
              transform: scale(0.85);
            }
            100% {
              opacity: 1;
              transform: scale(1);
            }
          }
        `}</style>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                background: planet.color,
                boxShadow: `0 0 12px ${planet.color}`,
                flexShrink: 0
              }}
            />
            <h2 style={{
              margin: 0,
              color: '#FFFFFF',
              fontSize: '24px',
              fontWeight: 600,
              letterSpacing: '1px'
            }}>
              {planet.name}
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#C0C0C0',
              fontSize: '20px',
              cursor: 'pointer',
              padding: '4px 8px',
              borderRadius: '4px',
              transition: 'background 0.2s',
              lineHeight: 1
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
              e.currentTarget.style.color = '#FFFFFF';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = '#C0C0C0';
            }}
          >
            ×
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <InfoRow label="直径" value={planet.diameter} />
          <InfoRow label="距太阳距离" value={planet.distanceFromSun} />
          <InfoRow label="公转周期" value={planet.orbitalPeriod} />

          <div style={{
            borderTop: '1px solid rgba(255,255,255,0.1)',
            paddingTop: '14px',
            marginTop: '4px'
          }}>
            <div style={{
              fontSize: '13px',
              color: '#00BFFF',
              marginBottom: '10px',
              textTransform: 'uppercase',
              letterSpacing: '1.5px',
              fontWeight: 500
            }}>
              大气成分
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {planet.atmosphere.map((gas) => (
                <span
                  key={gas}
                  style={{
                    background: 'rgba(0, 191, 255, 0.1)',
                    border: '1px solid rgba(0, 191, 255, 0.3)',
                    color: '#00BFFF',
                    padding: '4px 12px',
                    borderRadius: '16px',
                    fontSize: '13px',
                    fontFamily: 'monospace'
                  }}
                >
                  {gas}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '4px 0'
    }}>
      <span style={{
        fontSize: '13px',
        color: '#808090',
        textTransform: 'uppercase',
        letterSpacing: '1px'
      }}>
        {label}
      </span>
      <span style={{
        fontSize: '15px',
        color: '#FFFFFF',
        fontFamily: 'monospace',
        fontWeight: 500
      }}>
        {value}
      </span>
    </div>
  );
}

export default function PlanetInfoPanel() {
  const selectedPlanetId = useStore(s => s.selectedPlanetId);
  const isPanelVisible = useStore(s => s.isPanelVisible);
  const getPlanetById = useStore(s => s.getPlanetById);
  const setPanelVisible = useStore(s => s.setPanelVisible);
  const selectPlanet = useStore(s => s.selectPlanet);

  const planet = getPlanetById(selectedPlanetId);

  if (!isPanelVisible || !planet) return null;

  const handleClose = () => {
    setPanelVisible(false);
    selectPlanet(null);
  };

  return <PlanetPanel planet={planet} onClose={handleClose} />;
}
