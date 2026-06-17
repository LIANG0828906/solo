import { useState, useEffect, useCallback } from 'react';
import DataPanel from './components/DataPanel';
import Globe from './components/Globe';
import { useGeoFlowStore } from './store';
import { parseCSV, parseCSVString, processDataPoints, presetsData } from './utils/parseData';
import type { RawDataPoint } from './store';

const styles = {
  app: {
    width: '100%',
    height: '100%',
    display: 'flex',
    backgroundColor: '#0D1117',
    color: '#ffffff',
    position: 'relative' as const,
    overflow: 'hidden'
  },
  loadingBar: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    height: '6px',
    background: 'linear-gradient(90deg, #6C63FF 0%, #FF6584 100%)',
    transition: 'width 0.1s linear',
    zIndex: 1000,
    boxShadow: '0 0 10px rgba(108, 99, 255, 0.6)'
  },
  sceneContainer: {
    flex: 1,
    position: 'relative' as const,
    overflow: 'hidden',
    background: 'linear-gradient(180deg, #0B0014 0%, #1A0A2E 100%)',
    transition: 'opacity 0.5s ease'
  },
  detailCard: {
    position: 'absolute' as const,
    top: '20px',
    right: '20px',
    width: '280px',
    backgroundColor: '#1E1E2E',
    borderRadius: '12px',
    padding: '20px',
    border: '1px solid #30363D',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5), 0 0 15px rgba(88, 166, 255, 0.1)',
    zIndex: 100,
    transition: 'all 0.3s ease'
  },
  detailHeader: {
    display: 'flex',
    justifyContent: 'space-between' as const,
    alignItems: 'center',
    marginBottom: '16px',
    paddingBottom: '12px',
    borderBottom: '1px solid #30363D'
  },
  detailTitle: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#58A6FF',
    margin: 0
  },
  closeButton: {
    background: 'none',
    border: 'none',
    color: '#B0B0C3',
    cursor: 'pointer',
    fontSize: '20px',
    padding: '0 4px',
    transition: 'color 0.3s ease'
  },
  detailRow: {
    display: 'flex',
    justifyContent: 'space-between' as const,
    padding: '10px 0',
    borderBottom: '1px solid #2A2A3E'
  },
  detailLabel: {
    color: '#8B949E',
    fontSize: '13px'
  },
  detailValue: {
    color: '#FFFFFF',
    fontSize: '13px',
    fontWeight: 500
  },
  intensityBar: {
    width: '100%',
    height: '8px',
    background: '#2A2A3E',
    borderRadius: '4px',
    overflow: 'hidden',
    marginTop: '8px'
  }
};

function App() {
  const {
    processedData,
    selectedPoint,
    isLoading,
    loadingProgress,
    isTransitioning,
    setRawData,
    setProcessedData,
    setSelectedPoint,
    setLoading,
    setLoadingProgress,
    setTransitioning
  } = useGeoFlowStore();

  const [sceneOpacity, setSceneOpacity] = useState(1);

  const simulateLoading = useCallback(() => {
    setLoading(true);
    setLoadingProgress(0);
    const startTime = Date.now();
    const duration = 2000;

    const animateProgress = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min((elapsed / duration) * 100, 100);
      setLoadingProgress(progress);

      if (progress < 100) {
        requestAnimationFrame(animateProgress);
      } else {
        setTimeout(() => {
          setLoading(false);
        }, 300);
      }
    };

    requestAnimationFrame(animateProgress);
  }, [setLoading, setLoadingProgress]);

  const loadData = useCallback((rawData: RawDataPoint[], sourceName: string) => {
    setTransitioning(true);
    setSceneOpacity(0);

    simulateLoading();

    setTimeout(() => {
      setRawData(rawData, sourceName);
      const processed = processDataPoints(rawData);
      setProcessedData(processed);
      setSelectedPoint(null);

      setTimeout(() => {
        setSceneOpacity(1);
        setTransitioning(false);
      }, 100);
    }, 500);
  }, [setRawData, setProcessedData, setSelectedPoint, setTransitioning, simulateLoading]);

  const handleFileUpload = useCallback(async (file: File) => {
    try {
      const rawData = await parseCSV(file);
      if (rawData.length > 0) {
        loadData(rawData, file.name);
      }
    } catch (error) {
      console.error('CSV解析错误:', error);
    }
  }, [loadData]);

  const handlePresetSelect = useCallback((presetKey: string) => {
    const csvData = presetsData[presetKey as keyof typeof presetsData];
    if (csvData) {
      const rawData = parseCSVString(csvData);
      const presetNames: Record<string, string> = {
        earthquake: '全球地震活动数据',
        population: '城市人口密度数据',
        temperature: '全球气温变化数据'
      };
      loadData(rawData, presetNames[presetKey] || presetKey);
    }
  }, [loadData]);

  const handleCloseDetail = useCallback(() => {
    setSelectedPoint(null);
  }, [setSelectedPoint]);

  useEffect(() => {
    handlePresetSelect('earthquake');
  }, []);

  const getIntensityPercentage = () => {
    if (!selectedPoint || processedData.length === 0) return 0;
    const intensities = processedData.map(d => d.intensity);
    const min = Math.min(...intensities);
    const max = Math.max(...intensities);
    const range = max - min || 1;
    return ((selectedPoint.intensity - min) / range) * 100;
  };

  return (
    <div style={styles.app}>
      {isLoading && (
        <div style={{ ...styles.loadingBar, width: `${loadingProgress}%` }} />
      )}

      <DataPanel
        onFileUpload={handleFileUpload}
        onPresetSelect={handlePresetSelect}
      />

      <div style={{ ...styles.sceneContainer, opacity: isTransitioning ? sceneOpacity : 1 }}>
        <Globe />

        {selectedPoint && (
          <div style={styles.detailCard}>
            <div style={styles.detailHeader}>
              <h3 style={styles.detailTitle}>📊 数据详情</h3>
              <button style={styles.closeButton} onClick={handleCloseDetail}>×</button>
            </div>
            <div style={styles.detailRow}>
              <span style={styles.detailLabel}>数据源</span>
              <span style={styles.detailValue}>{useGeoFlowStore.getState().dataSourceName}</span>
            </div>
            <div style={styles.detailRow}>
              <span style={styles.detailLabel}>经度 (°)</span>
              <span style={styles.detailValue}>{selectedPoint.longitude.toFixed(4)}</span>
            </div>
            <div style={styles.detailRow}>
              <span style={styles.detailLabel}>纬度 (°)</span>
              <span style={styles.detailValue}>{selectedPoint.latitude.toFixed(4)}</span>
            </div>
            <div style={{ ...styles.detailRow, borderBottom: 'none' }}>
              <span style={styles.detailLabel}>强度值</span>
              <span style={{ ...styles.detailValue, color: selectedPoint.color }}>
                {selectedPoint.intensity.toFixed(2)}
              </span>
            </div>
            <div style={{ padding: '12px 0', marginTop: '8px', borderTop: '1px solid #2A2A3E' }}>
              <div style={styles.detailLabel as React.CSSProperties}>强度等级</div>
              <div style={styles.intensityBar}>
                <div style={{
                  width: `${getIntensityPercentage()}%`,
                  height: '100%',
                  background: `linear-gradient(90deg, #1E90FF 0%, ${selectedPoint.color} 100%)`,
                  transition: 'width 0.5s ease',
                  borderRadius: '4px'
                }} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
