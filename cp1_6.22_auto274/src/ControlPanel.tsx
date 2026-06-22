import { useSimStore } from './store';

export default function ControlPanel() {
  const planets = useSimStore((s) => s.planets);
  const selectedPlanetId = useSimStore((s) => s.selectedPlanetId);
  const shipAngle = useSimStore((s) => s.shipAngle);
  const shipSpeed = useSimStore((s) => s.shipSpeed);
  const isRunning = useSimStore((s) => s.isRunning);
  const showTrajectory = useSimStore((s) => s.showTrajectory);
  const updatePlanetMass = useSimStore((s) => s.updatePlanetMass);
  const selectPlanet = useSimStore((s) => s.selectPlanet);
  const setShipAngle = useSimStore((s) => s.setShipAngle);
  const setShipSpeed = useSimStore((s) => s.setShipSpeed);
  const setRunning = useSimStore((s) => s.setRunning);
  const setShowTrajectory = useSimStore((s) => s.setShowTrajectory);
  const resetAll = useSimStore((s) => s.resetAll);

  const selectedPlanet = planets.find((p) => p.id === selectedPlanetId);

  const angleDeg = ((shipAngle * 180) / Math.PI + 360) % 360;

  const handleStart = () => {
    if (planets.length < 3) return;
    setRunning(true);
  };

  const handleReset = () => {
    setRunning(false);
    resetAll();
  };

  const handleArrowDrag = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    const target = e.currentTarget;
    const rect = target.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    const onMouseMove = (ev: MouseEvent) => {
      const dx = ev.clientX - cx;
      const dy = ev.clientY - cy;
      const angle = Math.atan2(dy, dx);
      setShipAngle(angle);
      const dist = Math.sqrt(dx * dx + dy * dy);
      const speed = Math.min(Math.max(dist * 3, 20), 400);
      setShipSpeed(speed);
    };

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  return (
    <div style={styles.container}>
      <div style={styles.title}>控制面板</div>

      <div style={styles.section}>
        <div style={styles.label}>选择行星</div>
        <select
          value={selectedPlanetId ?? ''}
          onChange={(e) =>
            selectPlanet(e.target.value ? Number(e.target.value) : null)
          }
          style={styles.select}
          disabled={isRunning}
        >
          <option value="">-- 选择行星 --</option>
          {planets.map((p) => (
            <option key={p.id} value={p.id}>
              行星 {p.id}
            </option>
          ))}
        </select>
      </div>

      {selectedPlanet && (
        <div style={styles.section}>
          <div style={styles.label}>
            行星 {selectedPlanet.id} 质量: {selectedPlanet.mass}
          </div>
          <input
            type="range"
            min={1}
            max={50}
            step={1}
            value={selectedPlanet.mass}
            onChange={(e) => updatePlanetMass(selectedPlanet.id, Number(e.target.value))}
            style={styles.slider}
            disabled={isRunning}
          />
        </div>
      )}

      <div style={styles.section}>
        <div style={styles.label}>
          速度方向 ({angleDeg.toFixed(0)}°) | 速度: {shipSpeed.toFixed(0)}
        </div>
        <div
          style={styles.arrowContainer}
          onMouseDown={handleArrowDrag}
        >
          <svg width={80} height={80} viewBox="0 0 80 80">
            <circle
              cx={40}
              cy={40}
              r={38}
              fill="none"
              stroke="#4B5563"
              strokeWidth={2}
            />
            <circle cx={40} cy={40} r={3} fill="#FFD700" />
            <line
              x1={40}
              y1={40}
              x2={40 + Math.cos(shipAngle) * 35}
              y2={40 + Math.sin(shipAngle) * 35}
              stroke="#FFD700"
              strokeWidth={3}
              strokeLinecap="round"
            />
            <polygon
              points={(() => {
                const tipX = 40 + Math.cos(shipAngle) * 35;
                const tipY = 40 + Math.sin(shipAngle) * 35;
                const baseX = 40 + Math.cos(shipAngle) * 25;
                const baseY = 40 + Math.sin(shipAngle) * 25;
                const perpX = Math.cos(shipAngle + Math.PI / 2) * 5;
                const perpY = Math.sin(shipAngle + Math.PI / 2) * 5;
                return `${tipX},${tipY} ${baseX + perpX},${baseY + perpY} ${baseX - perpX},${baseY - perpY}`;
              })()}
              fill="#FFD700"
            />
          </svg>
        </div>
      </div>

      <div style={styles.section}>
        <label style={{ ...styles.label, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
          <input
            type="checkbox"
            checked={showTrajectory}
            onChange={(e) => setShowTrajectory(e.target.checked)}
            style={{ accentColor: '#FFD700' }}
          />
          显示轨迹
        </label>
      </div>

      <div style={styles.buttonRow}>
        <button
          onClick={handleStart}
          disabled={isRunning || planets.length < 3}
          style={{
            ...styles.startBtn,
            opacity: isRunning || planets.length < 3 ? 0.5 : 1,
          }}
        >
          启动
        </button>
        <button onClick={handleReset} style={styles.resetBtn}>
          重置
        </button>
      </div>

      {planets.length < 3 && (
        <div style={styles.hint}>请放置至少3颗行星</div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'fixed',
    left: 16,
    bottom: 16,
    width: 280,
    background: 'rgba(26, 26, 46, 0.8)',
    borderRadius: 12,
    padding: 16,
    color: '#E0E0E0',
    fontFamily: "'Segoe UI', sans-serif",
    fontSize: 13,
    zIndex: 10,
    backdropFilter: 'blur(8px)',
  },
  title: {
    fontSize: 16,
    fontWeight: 700,
    marginBottom: 12,
    color: '#FFD700',
  },
  section: {
    marginBottom: 12,
  },
  label: {
    marginBottom: 4,
    fontSize: 12,
    color: '#B0B0C0',
  },
  select: {
    width: '100%',
    padding: '6px 8px',
    borderRadius: 6,
    border: '1px solid #4B5563',
    background: '#1A1A2E',
    color: '#E0E0E0',
    fontSize: 13,
    outline: 'none',
    transition: 'border-color 0.2s ease-out',
  },
  slider: {
    width: '100%',
    accentColor: '#FFD700',
    cursor: 'pointer',
  },
  arrowContainer: {
    width: 80,
    height: 80,
    margin: '0 auto',
    cursor: 'grab',
    userSelect: 'none',
  },
  buttonRow: {
    display: 'flex',
    gap: 8,
    marginTop: 8,
  },
  startBtn: {
    flex: 1,
    padding: '8px 0',
    borderRadius: 8,
    border: 'none',
    background: '#00FF88',
    color: '#0D0D2B',
    fontWeight: 700,
    fontSize: 14,
    cursor: 'pointer',
    transition: 'filter 0.2s ease-out',
  },
  resetBtn: {
    flex: 1,
    padding: '8px 0',
    borderRadius: 8,
    border: 'none',
    background: '#FF4D4D',
    color: '#FFFFFF',
    fontWeight: 700,
    fontSize: 14,
    cursor: 'pointer',
    transition: 'filter 0.2s ease-out',
  },
  hint: {
    marginTop: 8,
    fontSize: 11,
    color: '#FF8888',
    textAlign: 'center',
  },
};
