import { useStore, MONTHS, OCEAN_CURRENTS, DEPTH_LAYERS } from '../store';

const styles = {
  panel: {
    position: 'absolute' as const,
    top: 16,
    left: 16,
    background: '#1A1A2E',
    borderRadius: 16,
    border: '1px solid #2D2D44',
    padding: 16,
    minWidth: 200,
    color: '#FFFFFF',
    fontSize: 14,
    zIndex: 10,
    animation: 'fadeIn 0.2s ease',
  },
  label: {
    color: '#B0B0D0',
    fontSize: 11,
    marginBottom: 2,
    textTransform: 'uppercase' as const,
    letterSpacing: 1,
  },
  value: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 700 as const,
    marginBottom: 12,
  },
  divider: {
    height: 1,
    background: '#2D2D44',
    margin: '8px 0',
  },
  flowPanel: {
    position: 'absolute' as const,
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 200,
    background: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
    color: '#1A1A2E',
    fontSize: 13,
    zIndex: 20,
    animation: 'fadeIn 0.2s ease',
  },
  flowName: {
    fontSize: 16,
    fontWeight: 700 as const,
    marginBottom: 4,
  },
  flowNameEn: {
    fontSize: 11,
    color: '#666',
    marginBottom: 10,
  },
  flowRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  flowLabel: {
    color: '#888',
  },
  flowValue: {
    fontWeight: 600 as const,
  },
  warmBadge: {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: 4,
    background: '#FF6B35',
    color: '#fff',
    fontSize: 11,
    fontWeight: 600 as const,
  },
  coldBadge: {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: 4,
    background: '#118AB2',
    color: '#fff',
    fontSize: 11,
    fontWeight: 600 as const,
  },
  closeBtn: {
    position: 'absolute' as const,
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    border: 'none',
    background: '#eee',
    borderRadius: '50%',
    cursor: 'pointer',
    fontSize: 12,
    lineHeight: '20px',
    textAlign: 'center' as const,
    color: '#666',
  },
  depthStatsPanel: {
    position: 'absolute' as const,
    bottom: 60,
    right: 16,
    background: '#1A1A2E',
    borderRadius: 16,
    border: '1px solid #2D2D44',
    padding: 16,
    width: 240,
    color: '#FFFFFF',
    fontSize: 13,
    zIndex: 15,
    animation: 'fadeIn 0.2s ease',
  },
  barContainer: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: 8,
    height: 100,
    marginTop: 8,
    padding: '0 4px',
  },
  bar: {
    width: 20,
    background: '#FFE66D',
    borderRadius: '4px 4px 0 0',
    transition: 'height 0.3s ease',
    cursor: 'pointer',
  },
  barLabel: {
    fontSize: 9,
    color: '#B0B0D0',
    textAlign: 'center' as const,
    marginTop: 4,
  },
};

export default function InfoPanel() {
  const currentTime = useStore((s) => s.currentTime);
  const selectedFlow = useStore((s) => s.selectedFlow);
  const depthMode = useStore((s) => s.depthMode);
  const depthStats = useStore((s) => s.depthStats);
  const depthStatsVisible = useStore((s) => s.depthStatsVisible);
  const setSelectedFlow = useStore((s) => s.setSelectedFlow);
  const setDepthStatsVisible = useStore((s) => s.setDepthStatsVisible);

  const avgSpeed =
    OCEAN_CURRENTS.reduce((sum, c) => sum + c.seasonalSpeedVariation[currentTime - 1], 0) /
    OCEAN_CURRENTS.length;
  const avgTemp =
    OCEAN_CURRENTS.reduce((sum, c) => sum + c.seasonalTempVariation[currentTime - 1], 0) /
    OCEAN_CURRENTS.length;

  const layerDensities = DEPTH_LAYERS.map((layer) => {
    const count = OCEAN_CURRENTS.filter(
      (c) => c.depth >= layer.min && c.depth < layer.max
    ).length;
    return count;
  });
  const maxDensity = Math.max(...layerDensities, 1);

  return (
    <>
      <div style={styles.panel}>
        <div style={styles.label}>当前月份</div>
        <div style={styles.value}>{MONTHS[currentTime - 1]}</div>
        <div style={styles.divider} />
        <div style={styles.label}>平均流速</div>
        <div style={{ ...styles.value, color: '#6BCB77' }}>{avgSpeed.toFixed(2)} m/s</div>
        <div style={styles.divider} />
        <div style={styles.label}>平均温度</div>
        <div style={{ ...styles.value, color: '#FFD166' }}>{avgTemp.toFixed(1)} °C</div>
        {depthMode && (
          <>
            <div style={styles.divider} />
            <div style={styles.label}>深度剖面模式</div>
            <div style={{ ...styles.value, fontSize: 14, color: '#B0B0D0' }}>已启用</div>
          </>
        )}
      </div>

      {selectedFlow && (
        <div style={styles.flowPanel}>
          <button
            style={styles.closeBtn}
            onClick={() => setSelectedFlow(null)}
          >
            ×
          </button>
          <div style={styles.flowName}>{selectedFlow.name}</div>
          <div style={styles.flowNameEn}>{selectedFlow.nameEn}</div>
          <div style={{ marginBottom: 8 }}>
            <span style={selectedFlow.type === 'warm' ? styles.warmBadge : styles.coldBadge}>
              {selectedFlow.type === 'warm' ? '暖流' : '寒流'}
            </span>
          </div>
          <div style={styles.flowRow}>
            <span style={styles.flowLabel}>流速</span>
            <span style={styles.flowValue}>{selectedFlow.speed.toFixed(2)} m/s</span>
          </div>
          <div style={styles.flowRow}>
            <span style={styles.flowLabel}>温度</span>
            <span style={styles.flowValue}>{selectedFlow.temperature.toFixed(1)} °C</span>
          </div>
          <div style={styles.flowRow}>
            <span style={styles.flowLabel}>深度</span>
            <span style={styles.flowValue}>{selectedFlow.depth}m</span>
          </div>
        </div>
      )}

      {depthMode && depthStatsVisible && depthStats && (
        <div style={styles.depthStatsPanel}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>深度层统计</div>
          <div style={styles.flowRow}>
            <span style={{ color: '#B0B0D0' }}>粒子密度</span>
            <span style={{ fontWeight: 600 }}>{depthStats.density} 条洋流</span>
          </div>
          <div style={styles.flowRow}>
            <span style={{ color: '#B0B0D0' }}>平均流速</span>
            <span style={{ fontWeight: 600 }}>{depthStats.avgSpeed.toFixed(2)} m/s</span>
          </div>
          <div style={styles.flowRow}>
            <span style={{ color: '#B0B0D0' }}>主导方向</span>
            <span style={{ fontWeight: 600 }}>{depthStats.dominantDirection}</span>
          </div>
          <div style={{ marginTop: 12, fontSize: 11, color: '#B0B0D0' }}>各层粒子密度</div>
          <div style={styles.barContainer}>
            {DEPTH_LAYERS.map((layer, i) => (
              <div key={i} style={{ textAlign: 'center' }}>
                <div
                  style={{
                    ...styles.bar,
                    height: (layerDensities[i] / maxDensity) * 80,
                  }}
                  title={`${layer.name}: ${layerDensities[i]} 条`}
                />
                <div style={styles.barLabel}>{layer.name}</div>
              </div>
            ))}
          </div>
          <button
            onClick={() => setDepthStatsVisible(false)}
            style={{
              marginTop: 8,
              width: '100%',
              padding: '4px 0',
              background: '#2D2D44',
              border: 'none',
              borderRadius: 6,
              color: '#B0B0D0',
              cursor: 'pointer',
              fontSize: 11,
            }}
          >
            关闭
          </button>
        </div>
      )}
    </>
  );
}
