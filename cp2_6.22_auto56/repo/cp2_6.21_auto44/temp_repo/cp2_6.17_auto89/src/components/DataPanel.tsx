import { useState, useCallback } from 'react';
import { useGeoFlowStore } from '../store';

const styles = {
  panel: {
    width: '320px',
    height: '100%',
    backgroundColor: '#161B22',
    borderRight: '1px solid #30363D',
    display: 'flex',
    flexDirection: 'column' as const,
    overflow: 'hidden',
    flexShrink: 0
  },
  header: {
    padding: '20px',
    borderBottom: '1px solid #30363D',
    background: 'linear-gradient(135deg, #161B22 0%, #1A0A2E 100%)'
  },
  title: {
    fontSize: '22px',
    fontWeight: 700,
    background: 'linear-gradient(90deg, #58A6FF 0%, #FF7B72 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    margin: 0,
    marginBottom: '4px'
  },
  subtitle: {
    fontSize: '12px',
    color: '#8B949E',
    margin: 0
  },
  content: {
    flex: 1,
    padding: '16px',
    overflowY: 'auto' as const,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '20px'
  },
  section: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '10px'
  },
  sectionTitle: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#8B949E',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
    margin: 0,
    paddingBottom: '4px',
    borderBottom: '1px solid #21262D'
  },
  uploadArea: {
    border: '2px dashed #30363D',
    borderRadius: '10px',
    padding: '24px 16px',
    textAlign: 'center' as const,
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    backgroundColor: '#0D1117'
  },
  uploadAreaHover: {
    borderColor: '#58A6FF',
    backgroundColor: 'rgba(88, 166, 255, 0.05)',
    boxShadow: '0 0 15px rgba(88, 166, 255, 0.2)'
  },
  uploadIcon: {
    fontSize: '36px',
    marginBottom: '10px'
  },
  uploadText: {
    fontSize: '13px',
    color: '#B0B0C3',
    margin: 0
  },
  uploadHint: {
    fontSize: '11px',
    color: '#6E7681',
    marginTop: '6px',
    margin: 0
  },
  select: {
    width: '100%',
    padding: '12px 14px',
    backgroundColor: '#0D1117',
    border: '1px solid #30363D',
    borderRadius: '8px',
    color: '#FFFFFF',
    fontSize: '13px',
    cursor: 'pointer',
    outline: 'none',
    transition: 'all 0.3s ease',
    appearance: 'none' as const,
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%238B949E' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 14px center'
  },
  button: {
    width: '100%',
    padding: '12px',
    background: 'linear-gradient(135deg, #58A6FF 0%, #6C63FF 100%)',
    border: 'none',
    borderRadius: '8px',
    color: '#FFFFFF',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.3s ease'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    backgroundColor: '#0D1117',
    borderRadius: '8px',
    overflow: 'hidden'
  },
  tableCell: {
    padding: '0 12px',
    height: '32px',
    fontSize: '13px',
    color: '#B0B0C3',
    borderBottom: '1px solid #21262D'
  },
  dataSourceBadge: {
    display: 'inline-block',
    padding: '4px 10px',
    backgroundColor: 'rgba(88, 166, 255, 0.1)',
    border: '1px solid rgba(88, 166, 255, 0.3)',
    borderRadius: '4px',
    fontSize: '11px',
    color: '#58A6FF',
    marginTop: '8px'
  },
  legend: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px',
    backgroundColor: '#0D1117',
    borderRadius: '8px',
    border: '1px solid #21262D'
  },
  legendBar: {
    flex: 1,
    height: '10px',
    borderRadius: '5px',
    background: 'linear-gradient(90deg, #1E90FF 0%, #FF4500 100%)'
  },
  legendLabel: {
    fontSize: '11px',
    color: '#8B949E',
    minWidth: '30px'
  },
  performanceCard: {
    padding: '12px',
    backgroundColor: '#0D1117',
    borderRadius: '8px',
    border: '1px solid #21262D'
  },
  performanceGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '10px'
  },
  performanceItem: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '2px'
  },
  performanceValue: {
    fontSize: '18px',
    fontWeight: 700,
    color: '#58A6FF'
  },
  performanceLabel: {
    fontSize: '10px',
    color: '#8B949E',
    textTransform: 'uppercase' as const
  },
  lodBadge: {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '10px',
    fontWeight: 600,
    marginTop: '8px'
  },
  footer: {
    padding: '12px 16px',
    borderTop: '1px solid #30363D',
    fontSize: '11px',
    color: '#6E7681',
    textAlign: 'center' as const
  }
};

interface DataPanelProps {
  onFileUpload: (file: File) => void;
  onPresetSelect: (presetKey: string) => void;
}

function DataPanel({ onFileUpload, onPresetSelect }: DataPanelProps) {
  const { dataSourceName, statistics, performance } = useGeoFlowStore();
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState('earthquake');

  const stats = statistics;

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.name.toLowerCase().endsWith('.csv')) {
      onFileUpload(file);
    }
  }, [onFileUpload]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileUpload(file);
    }
    e.target.value = '';
  }, [onFileUpload]);

  const handlePresetChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedPreset(value);
    onPresetSelect(value);
  }, [onPresetSelect]);

  const formatNumber = (num: number): string => {
    if (!isFinite(num) || isNaN(num)) return '0.00';
    return num.toFixed(2);
  };

  const tableRows = [
    { label: '数据点数', value: stats.count.toLocaleString() },
    { label: '最大强度', value: formatNumber(stats.maxIntensity) },
    { label: '最小强度', value: formatNumber(stats.minIntensity) },
    { label: '平均强度', value: formatNumber(stats.avgIntensity) }
  ];

  return (
    <div style={styles.panel}>
      <div style={styles.header}>
        <h1 style={styles.title}>🌍 GeoFlow</h1>
        <p style={styles.subtitle}>3D地理数据流动态可视化平台</p>
      </div>

      <div style={styles.content}>
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>数据上传</h3>
          <div
            style={{ ...styles.uploadArea, ...(isDragOver ? styles.uploadAreaHover : {}) }}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => document.getElementById('file-input')?.click()}
          >
            <div style={styles.uploadIcon}>📁</div>
            <p style={styles.uploadText}>拖拽CSV文件到此处</p>
            <p style={styles.uploadHint}>或点击选择文件 (仅支持CSV格式)</p>
            <input
              id="file-input"
              type="file"
              accept=".csv"
              style={{ display: 'none' }}
              onChange={handleFileInput}
            />
          </div>
        </div>

        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>预设数据</h3>
          <select
            style={styles.select}
            value={selectedPreset}
            onChange={handlePresetChange}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#58A6FF';
              e.currentTarget.style.boxShadow = '0 0 8px rgba(88,166,255,0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#30363D';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <option value="earthquake">🌋 全球地震活动数据</option>
            <option value="population">🏙️ 城市人口密度数据</option>
            <option value="temperature">🌡️ 全球气温变化数据</option>
          </select>
        </div>

        {dataSourceName && (
          <div style={{ textAlign: 'center' }}>
            <span style={styles.dataSourceBadge}>📌 当前: {dataSourceName}</span>
          </div>
        )}

        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>数据统计</h3>
          <table style={styles.table}>
            <tbody>
              {tableRows.map((row, index) => (
                <tr
                  key={row.label}
                  style={{
                    backgroundColor: index % 2 === 0 ? '#0D1117' : '#2A2A3E'
                  }}
                >
                  <td style={{ ...styles.tableCell, fontWeight: 500 }}>{row.label}</td>
                  <td style={{ ...styles.tableCell, textAlign: 'right', color: '#FFFFFF', fontWeight: 600 }}>
                    {row.value}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>颜色图例</h3>
          <div style={styles.legend}>
            <span style={{ ...styles.legendLabel, textAlign: 'left' }}>低</span>
            <div style={styles.legendBar} />
            <span style={{ ...styles.legendLabel, textAlign: 'right' }}>高</span>
          </div>
        </div>

        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>性能监控</h3>
          <div style={styles.performanceCard}>
            <div style={styles.performanceGrid}>
              <div style={styles.performanceItem}>
                <span style={{
                  ...styles.performanceValue,
                  color: performance.fps >= 55 ? '#3FB950' : performance.fps >= 30 ? '#D29922' : '#F85149'
                }}>
                  {performance.fps.toFixed(1)}
                </span>
                <span style={styles.performanceLabel}>FPS</span>
              </div>
              <div style={styles.performanceItem}>
                <span style={styles.performanceValue}>
                  {performance.frameTime.toFixed(1)}ms
                </span>
                <span style={styles.performanceLabel}>帧时间</span>
              </div>
              <div style={styles.performanceItem}>
                <span style={styles.performanceValue}>
                  {performance.drawCalls}
                </span>
                <span style={styles.performanceLabel}>Draw Calls</span>
              </div>
              <div style={styles.performanceItem}>
                <span style={{
                  ...styles.performanceValue,
                  color: performance.isLODActive ? '#F85149' : '#3FB950'
                }}>
                  {performance.isLODActive ? 'ON' : 'OFF'}
                </span>
                <span style={styles.performanceLabel}>LOD模式</span>
              </div>
            </div>
            <div style={{
              ...styles.lodBadge,
              backgroundColor: performance.fps >= 55 ? 'rgba(63, 185, 80, 0.15)' : performance.fps >= 30 ? 'rgba(210, 153, 34, 0.15)' : 'rgba(248, 81, 73, 0.15)',
              color: performance.fps >= 55 ? '#3FB950' : performance.fps >= 30 ? '#D29922' : '#F85149',
              border: `1px solid ${performance.fps >= 55 ? 'rgba(63, 185, 80, 0.3)' : performance.fps >= 30 ? 'rgba(210, 153, 34, 0.3)' : 'rgba(248, 81, 73, 0.3)'}`
            }}>
              {performance.fps >= 55 ? '✅ 运行流畅 (≥60FPS目标)' : performance.fps >= 30 ? '⚠️ 性能一般' : '❌ 性能不足'}
            </div>
          </div>
        </div>
      </div>

      <div style={styles.footer}>
        💡 提示: 拖拽旋转地球 · 滚轮缩放 · 点击柱体查看详情
      </div>
    </div>
  );
}

export default DataPanel;
