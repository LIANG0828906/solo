import { PlanetData } from '@/data/planets';

interface ControlPanelProps {
  planets: PlanetData[];
  selectedPlanetId: string | null;
  speedMultiplier: number;
  onPlanetSelect: (id: string) => void;
  onSpeedChange: (speed: number) => void;
}

export function ControlPanel({
  planets,
  selectedPlanetId,
  speedMultiplier,
  onPlanetSelect,
  onSpeedChange,
}: ControlPanelProps) {
  return (
    <div style={styles.container}>
      <h2 style={styles.title}>太阳系探索</h2>
      <div style={styles.divider} />

      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>行星列表</h3>
        <div style={styles.planetList}>
          {planets.map((planet) => (
            <button
              key={planet.id}
              style={{
                ...styles.planetCard,
                border:
                  selectedPlanetId === planet.id
                    ? '2px solid #4FC3F7'
                    : '2px solid rgba(255,255,255,0.08)',
                background:
                  selectedPlanetId === planet.id
                    ? 'rgba(79, 195, 247, 0.1)'
                    : 'rgba(255,255,255,0.03)',
              }}
              onClick={() => onPlanetSelect(planet.id)}
              onMouseEnter={(e) => {
                if (selectedPlanetId !== planet.id) {
                  e.currentTarget.style.background = 'rgba(79, 195, 247, 0.06)';
                  e.currentTarget.style.borderColor = 'rgba(79, 195, 247, 0.4)';
                }
              }}
              onMouseLeave={(e) => {
                if (selectedPlanetId !== planet.id) {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                }
              }}
            >
              <div
                style={{
                  ...styles.colorDot,
                  backgroundColor: planet.surfaceColor,
                  boxShadow: `0 0 6px ${planet.surfaceColor}40`,
                }}
              />
              <span style={styles.planetName}>{planet.nameCN}</span>
              <span style={styles.planetNameEn}>{planet.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div style={styles.divider} />

      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>速度控制</h3>
        <div style={styles.speedControl}>
          <span style={styles.speedLabel}>0x</span>
          <div style={styles.sliderTrack}>
            <div
              style={{
                ...styles.sliderFill,
                width: `${(speedMultiplier / 5) * 100}%`,
                transition: 'width 0.3s ease',
              }}
            />
            <input
              type="range"
              min="0"
              max="5"
              step="0.1"
              value={speedMultiplier}
              onChange={(e) => onSpeedChange(parseFloat(e.target.value))}
              style={styles.sliderInput}
            />
            <div
              style={{
                ...styles.sliderThumb,
                left: `${(speedMultiplier / 5) * 100}%`,
                transition: 'left 0.3s ease',
              }}
            />
          </div>
          <span style={styles.speedLabel}>5x</span>
        </div>
        <div style={styles.speedValue}>
          当前速度：<span style={styles.speedNumber}>{speedMultiplier.toFixed(1)}x</span>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: 260,
    height: 'fit-content',
    maxHeight: 'calc(100vh - 40px)',
    overflowY: 'auto',
    background: 'rgba(10, 14, 26, 0.75)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    borderRadius: 12,
    border: '1px solid rgba(255,255,255,0.1)',
    padding: '20px 16px',
    color: '#ffffff',
    fontFamily: "'Source Sans 3', sans-serif",
    position: 'relative',
    zIndex: 10,
  },
  title: {
    fontFamily: "'Orbitron', sans-serif",
    fontSize: 18,
    fontWeight: 700,
    color: '#4FC3F7',
    margin: '0 0 12px 0',
    textAlign: 'center' as const,
    letterSpacing: 2,
  },
  divider: {
    height: 1,
    background: 'linear-gradient(90deg, transparent, rgba(79,195,247,0.3), transparent)',
    margin: '12px 0',
  },
  section: {
    marginBottom: 8,
  },
  sectionTitle: {
    fontFamily: "'Orbitron', sans-serif",
    fontSize: 11,
    fontWeight: 600,
    color: 'rgba(255,255,255,0.5)',
    textTransform: 'uppercase' as const,
    letterSpacing: 1.5,
    margin: '0 0 10px 0',
  },
  planetList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 6,
  },
  planetCard: {
    display: 'flex',
    alignItems: 'center',
    height: 50,
    padding: '0 12px',
    borderRadius: 8,
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    outline: 'none',
    fontFamily: "'Source Sans 3', sans-serif",
  },
  colorDot: {
    width: 10,
    height: 10,
    borderRadius: '50%',
    flexShrink: 0,
  },
  planetName: {
    fontSize: 14,
    fontWeight: 600,
    marginLeft: 10,
    color: '#ffffff',
  },
  planetNameEn: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.4)',
    marginLeft: 'auto',
    fontFamily: "'Orbitron', sans-serif",
  },
  speedControl: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '4px 0',
  },
  speedLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.4)',
    fontFamily: "'Orbitron', sans-serif",
    minWidth: 24,
  },
  sliderTrack: {
    flex: 1,
    height: 4,
    background: '#2C3E50',
    borderRadius: 2,
    position: 'relative' as const,
  },
  sliderFill: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    height: '100%',
    background: 'linear-gradient(90deg, #4FC3F7, #81D4FA)',
    borderRadius: 2,
  },
  sliderInput: {
    position: 'absolute' as const,
    top: -8,
    left: 0,
    width: '100%',
    height: 20,
    opacity: 0,
    cursor: 'pointer',
    margin: 0,
  },
  sliderThumb: {
    position: 'absolute' as const,
    top: '50%',
    width: 16,
    height: 16,
    borderRadius: '50%',
    background: '#4FC3F7',
    transform: 'translate(-50%, -50%)',
    boxShadow: '0 0 8px rgba(79,195,247,0.5)',
    pointerEvents: 'none',
  },
  speedValue: {
    textAlign: 'center' as const,
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 8,
  },
  speedNumber: {
    fontFamily: "'Orbitron', sans-serif",
    fontWeight: 700,
    color: '#4FC3F7',
    fontSize: 14,
  },
};
