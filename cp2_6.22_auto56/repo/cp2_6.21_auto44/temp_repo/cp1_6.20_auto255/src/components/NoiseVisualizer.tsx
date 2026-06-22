import { useEffect, useRef, useState, useCallback } from 'react';
import { initNoiseCity } from '../core/NoiseCity';
import { districts, defaultDistrictId, getNoiseRating } from '../data/noiseData';
import type { NoiseDataPoint, PerformanceMode } from '../data/noiseData';
import type { NoiseCityResult } from '../core/NoiseCity';

const heights = [
  { key: 'groundDb', label: '地面层' },
  { key: 'height10Db', label: '10m高度' },
  { key: 'height20Db', label: '20m高度' },
  { key: 'height30Db', label: '30m高度' }
];

export default function NoiseVisualizer() {
  const containerRef = useRef<HTMLDivElement>(null);
  const noiseCityRef = useRef<NoiseCityResult | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  const [selectedDistrictId, setSelectedDistrictId] = useState<string>(defaultDistrictId);
  const [selectedBarData, setSelectedBarData] = useState<NoiseDataPoint | null>(null);
  const [performanceMode, setPerformanceMode] = useState<PerformanceMode>('quality');
  const [isDragging, setIsDragging] = useState(false);
  const [maxDbInfo, setMaxDbInfo] = useState<{ point: NoiseDataPoint; maxDb: number } | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const noiseCity = initNoiseCity(
      containerRef.current,
      districts,
      defaultDistrictId,
      performanceMode
    );
    noiseCityRef.current = noiseCity;

    noiseCity.onBarClick((data) => {
      setSelectedBarData(data);
    });

    noiseCity.onDragStateChange((dragging) => {
      setIsDragging(dragging);
    });

    const animate = (time: number) => {
      const delta = Math.min((time - lastTimeRef.current) / 1000, 0.1);
      lastTimeRef.current = time;

      noiseCity.update(delta);
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    lastTimeRef.current = performance.now();
    animationFrameRef.current = requestAnimationFrame(animate);

    const updateMaxDbInterval = setInterval(() => {
      const maxInfo = noiseCity.getMaxDbPoint();
      setMaxDbInfo(maxInfo);
    }, 500);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      clearInterval(updateMaxDbInterval);
      noiseCity.dispose();
    };
  }, []);

  const handleDistrictChange = useCallback((event: React.ChangeEvent<HTMLSelectElement>) => {
    const newDistrictId = event.target.value;
    setSelectedDistrictId(newDistrictId);
    setSelectedBarData(null);

    if (noiseCityRef.current) {
      noiseCityRef.current.setDistrict(newDistrictId);
    }
  }, []);

  const handlePerformanceToggle = useCallback(() => {
    const newMode: PerformanceMode = performanceMode === 'quality' ? 'performance' : 'quality';
    setPerformanceMode(newMode);

    if (noiseCityRef.current) {
      noiseCityRef.current.setPerformanceMode(newMode);
    }
  }, [performanceMode]);

  const handleCloseDetail = useCallback(() => {
    setSelectedBarData(null);
    if (noiseCityRef.current) {
      noiseCityRef.current.onBarClick(() => {});
      noiseCityRef.current.onBarClick((data) => {
        setSelectedBarData(data);
      });
    }
  }, []);

  const currentDistrict = districts.find(d => d.id === selectedDistrictId);
  const cursorStyle = isDragging ? 'grabbing' : 'grab';

  return (
    <div style={styles.container}>
      <div
        ref={containerRef}
        style={{
          ...styles.canvasContainer,
          cursor: cursorStyle
        }}
      />

      <div style={styles.topGlow} />

      <div style={styles.header}>
        <h1 style={styles.title}>城市噪音频谱3D可视化分析</h1>
      </div>

      <div style={styles.districtSelector}>
        <select
          value={selectedDistrictId}
          onChange={handleDistrictChange}
          style={styles.select}
        >
          {districts.map(district => (
            <option key={district.id} value={district.id}>
              {district.name}
            </option>
          ))}
        </select>
      </div>

      {maxDbInfo && (
        <div style={styles.infoBar}>
          <span style={styles.infoBarText}>
            🔊 最高分贝：
            <span style={{ color: getNoiseRating(maxDbInfo.maxDb).color, fontWeight: 600 }}>
              {maxDbInfo.maxDb.toFixed(1)} dB
            </span>
            {' | 位置：('}{maxDbInfo.point.x.toFixed(1)}, {maxDbInfo.point.z.toFixed(1)})
            {' | '}
            <span style={{ color: getNoiseRating(maxDbInfo.maxDb).color }}>
              [{getNoiseRating(maxDbInfo.maxDb).level}]
            </span>
          </span>
        </div>
      )}

      {selectedBarData && (
        <div style={styles.detailCard} onClick={handleCloseDetail}>
          <div style={styles.detailCardHeader}>
            <h2 style={styles.detailTitle}>噪音详情</h2>
            <button style={styles.closeButton} onClick={handleCloseDetail}>
              ✕
            </button>
          </div>

          <div style={styles.detailContent}>
            <div style={styles.coordinateRow}>
              <span style={styles.label}>坐标位置：</span>
              <span style={styles.value}>
                ({selectedBarData.x.toFixed(1)}, {selectedBarData.z.toFixed(1)})
              </span>
            </div>

            <div style={styles.divider} />

            {heights.map(({ key, label }) => {
              const db = selectedBarData[key as keyof NoiseDataPoint] as number;
              const rating = getNoiseRating(db);
              return (
                <div key={key} style={styles.heightRow}>
                  <span style={styles.heightLabel}>{label}：</span>
                  <span style={{ ...styles.heightValue, color: rating.color }}>
                    {db.toFixed(1)} dB
                  </span>
                  <span style={{ ...styles.ratingBadge, backgroundColor: rating.color + '33', color: rating.color }}>
                    {rating.level}
                  </span>
                </div>
              );
            })}

            <div style={styles.divider} />

            <div style={styles.districtInfo}>
              <span style={styles.label}>所属街区：</span>
              <span style={styles.value}>{currentDistrict?.name}</span>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={handlePerformanceToggle}
        style={styles.performanceButton}
        title={performanceMode === 'quality' ? '切换到性能模式' : '切换到画质模式'}
      >
        {performanceMode === 'quality' ? '💎' : '⚡'}
      </button>

      <div style={styles.legend}>
        <div style={styles.legendTitle}>噪音等级</div>
        <div style={styles.legendItems}>
          <div style={styles.legendItem}>
            <div style={{ ...styles.legendColor, backgroundColor: '#4caf50 }} />
            <span>安静 (40-55dB)</span>
          </div>
          <div style={styles.legendItem}>
            <div style={{ ...styles.legendColor, backgroundColor: '#ffeb3b' }} />
            <span>中等 (55-70dB)</span>
          </div>
          <div style={styles.legendItem}>
            <div style={{ ...styles.legendColor, backgroundColor: '#ff9800' }} />
            <span>吵闹 (70-85dB)</span>
          </div>
          <div style={styles.legendItem}>
            <div style={{ ...styles.legendColor, backgroundColor: '#f44336 }} />
            <span>极吵 (85dB+)</span>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'relative',
    width: '100%',
    height: '100vh',
    minWidth: '1024px',
    background: 'linear-gradient(135deg, #1a2332 0%, #0f1419 100%)',
    overflow: 'hidden'
  },
  canvasContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%'
  },
  topGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '2px',
    background: 'linear-gradient(90deg, transparent 0%, rgba(74, 144, 217, 0.15) 50%, transparent 100%)',
    pointerEvents: 'none',
    zIndex: 10
  },
  header: {
    position: 'absolute',
    top: '20px',
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 20,
    textAlign: 'center'
  },
  title: {
    margin: 0,
    fontSize: '24px',
    fontWeight: 600,
    color: '#ffffff',
    letterSpacing: '2px',
    textShadow: '0 2px 10px rgba(0, 0, 0, 0.5)'
  },
  districtSelector: {
    position: 'absolute',
    top: '20px',
    right: '20px',
    zIndex: 20
  },
  select: {
    padding: '10px 16px',
    fontSize: '16px',
    color: '#ffffff',
    backgroundColor: '#333333',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    outline: 'none',
    minWidth: '160px',
    appearance: 'none',
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 12px center',
    paddingRight: '40px'
  },
  infoBar: {
    position: 'absolute',
    top: '80px',
    left: '50%',
    transform: 'translateX(-50%)',
    padding: '10px 24px',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: '8px',
    backdropFilter: 'blur(10px)',
    zIndex: 20,
    minWidth: '400px',
    textAlign: 'center'
  },
  infoBarText: {
    fontSize: '14px',
    color: '#ffffff'
  },
  detailCard: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '380px',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(20px)',
    borderRadius: '12px',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
    zIndex: 30,
    color: '#ffffff',
    overflow: 'hidden'
  },
  detailCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
  },
  detailTitle: {
    margin: 0,
    fontSize: '18px',
    fontWeight: 600
  },
  closeButton: {
    background: 'none',
    border: 'none',
    color: '#ffffff',
    fontSize: '18px',
    cursor: 'pointer',
    padding: '4px 8px',
    borderRadius: '4px',
    transition: 'background-color 0.2s'
  },
  detailContent: {
    padding: '20px'
  },
  coordinateRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px'
  },
  label: {
    fontSize: '14px',
    color: 'rgba(255, 255, 255, 0.7)'
  },
  value: {
    fontSize: '16px',
    fontWeight: 500
  },
  divider: {
    height: '1px',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    margin: '12px 0'
  },
  heightRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 0'
  },
  heightLabel: {
    fontSize: '14px',
    color: 'rgba(255, 255, 255, 0.8)',
    flex: 1
  },
  heightValue: {
    fontSize: '16px',
    fontWeight: 600,
    marginRight: '12px',
    minWidth: '80px',
    textAlign: 'right'
  },
  ratingBadge: {
    padding: '4px 10px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 500
  },
  districtInfo: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '12px'
  },
  performanceButton: {
    position: 'absolute',
    bottom: '20px',
    right: '20px',
    width: '50px',
    height: '50px',
    borderRadius: '50%',
    backgroundColor: 'rgba(51, 51, 51, 0.8)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    color: '#ffffff',
    fontSize: '24px',
    cursor: 'pointer',
    backdropFilter: 'blur(10px)',
    transition: 'all 0.3s ease',
    zIndex: 20,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  legend: {
    position: 'absolute',
    bottom: '20px',
    left: '20px',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    backdropFilter: 'blur(10px)',
    borderRadius: '8px',
    padding: '12px 16px',
    zIndex: 20
  },
  legendTitle: {
    fontSize: '12px',
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: '8px'
  },
  legendItems: {
    display: 'flex',
    gap: '16px'
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '12px',
    color: '#ffffff'
  },
  legendColor: {
    width: '12px',
    height: '12px',
    borderRadius: '2px'
  }
};
