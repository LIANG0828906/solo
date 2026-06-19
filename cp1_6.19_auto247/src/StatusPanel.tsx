import React from 'react';
import { SystemStatus, Fault, Worker, SpareParts } from './GameEngine';

interface StatusPanelProps {
  status: SystemStatus;
  statusTrend: { waterLevel: number; oxygen: number; temperature: number; ph: number };
  faults: Fault[];
  spares: SpareParts;
  workers: Worker[];
  cooldown: number;
  emergencyProtocol: boolean;
  emergencyDuration: number;
  onDispatchWorker: (faultId: string) => void;
  onUseSparePart: (faultId: string) => void;
  onActivateEmergency: () => void;
}

const StatusPanel: React.FC<StatusPanelProps> = ({
  status,
  statusTrend,
  faults,
  spares,
  workers,
  cooldown,
  emergencyProtocol,
  emergencyDuration,
  onDispatchWorker,
  onUseSparePart,
  onActivateEmergency
}) => {
  const getBarColor = (value: number, min: number, max: number, reverse = false) => {
    const ratio = (value - min) / (max - min);
    const adjusted = reverse ? 1 - ratio : ratio;
    if (adjusted > 0.6) return 'linear-gradient(to top, #4CAF50, #8BC34A)';
    if (adjusted > 0.3) return 'linear-gradient(to top, #FF9800, #FFC107)';
    return 'linear-gradient(to top, #F44336, #FF5722)';
  };

  const getTrendArrow = (trend: number) => {
    if (trend > 0.01) return <span style={{ color: '#4CAF50' }}>▲</span>;
    if (trend < -0.01) return <span style={{ color: '#F44336' }}>▼</span>;
    return <span style={{ color: '#9E9E9E' }}>─</span>;
  };

  const hasFault = (type: string) => faults.some(f => f.affected.includes(type));

  const barStyles = `
    @keyframes faultBlink {
      0%, 100% { box-shadow: 0 0 8px rgba(0,200,255,0.3), inset 0 0 0 2px transparent; }
      50% { box-shadow: 0 0 8px rgba(0,200,255,0.3), inset 0 0 0 2px #FF0000; }
    }
    .fault-blink {
      animation: faultBlink 0.3s ease-in-out infinite;
    }
  `;

  return (
    <div style={styles.container}>
      <style>{barStyles}</style>

      <div style={styles.leftPanel}>
        <h2 style={styles.panelTitle}>系统状态面板</h2>

        <div style={styles.barsContainer}>
          <div style={styles.barWrapper}>
            <div style={styles.barLabel}>
              <span>水箱水位</span>
              <div style={styles.valueRow}>
                <span style={styles.valueText}>{status.waterLevel.toFixed(1)}%</span>
                {getTrendArrow(statusTrend.waterLevel)}
              </div>
            </div>
            <div
              className={hasFault('waterLevel') ? 'fault-blink' : ''}
              style={{
                ...styles.barContainer,
                animation: hasFault('waterLevel') ? 'faultBlink 0.3s ease-in-out infinite' : undefined
              }}
            >
              <div
                style={{
                  ...styles.barFill,
                  height: `${status.waterLevel}%`,
                  background: getBarColor(status.waterLevel, 0, 100)
                }}
              />
            </div>
          </div>

          <div style={styles.barWrapper}>
            <div style={styles.barLabel}>
              <span>氧气浓度</span>
              <div style={styles.valueRow}>
                <span style={styles.valueText}>{status.oxygen.toFixed(2)}%</span>
                {getTrendArrow(statusTrend.oxygen)}
              </div>
            </div>
            <div
              className={hasFault('oxygen') ? 'fault-blink' : ''}
              style={{
                ...styles.barContainer,
                animation: hasFault('oxygen') ? 'faultBlink 0.3s ease-in-out infinite' : undefined
              }}
            >
              <div
                style={{
                  ...styles.barFill,
                  height: `${(status.oxygen / 21) * 100}%`,
                  background: getBarColor(status.oxygen, 0, 21)
                }}
              />
            </div>
          </div>

          <div style={styles.barWrapper}>
            <div style={styles.barLabel}>
              <span>温度</span>
              <div style={styles.valueRow}>
                <span style={styles.valueText}>{status.temperature.toFixed(1)}°C</span>
                {getTrendArrow(statusTrend.temperature)}
              </div>
            </div>
            <div
              className={hasFault('temperature') ? 'fault-blink' : ''}
              style={{
                ...styles.barContainer,
                animation: hasFault('temperature') ? 'faultBlink 0.3s ease-in-out infinite' : undefined
              }}
            >
              <div
                style={{
                  ...styles.barFill,
                  height: `${((status.temperature + 10) / 50) * 100}%`,
                  background: getBarColor(
                    Math.abs(status.temperature - 22),
                    0,
                    18,
                    true
                  )
                }}
              />
            </div>
          </div>

          <div style={styles.barWrapper}>
            <div style={styles.barLabel}>
              <span>pH值</span>
              <div style={styles.valueRow}>
                <span style={styles.valueText}>{status.ph.toFixed(2)}</span>
                {getTrendArrow(statusTrend.ph)}
              </div>
            </div>
            <div style={styles.barContainer}>
              <div
                style={{
                  ...styles.barFill,
                  height: `${((status.ph - 6) / 3) * 100}%`,
                  background: getBarColor(
                    1 - Math.abs(status.ph - 7.2) / 1.2,
                    0,
                    1
                  )
                }}
              />
            </div>
          </div>

          <div style={styles.barWrapper}>
            <div style={styles.barLabel}>
              <span>能源</span>
              <div style={styles.valueRow}>
                <span style={styles.valueText}>{status.energy.toFixed(1)}%</span>
              </div>
            </div>
            <div style={styles.barContainer}>
              <div
                style={{
                  ...styles.barFill,
                  height: `${status.energy}%`,
                  background: 'linear-gradient(to top, #2196F3, #03A9F4)'
                }}
              />
            </div>
          </div>
        </div>
      </div>

      <div style={styles.rightPanel}>
        <h2 style={styles.panelTitle}>资源状态</h2>

        <div style={styles.resourceSection}>
          <h3 style={styles.sectionTitle}>备品备件</h3>
          <div style={styles.sparePartsGrid}>
            <div style={styles.spareItem}>
              <span style={styles.spareIcon}>🔧</span>
              <span style={styles.spareName}>阀门</span>
              <span style={styles.spareCount}>{spares.valve}</span>
            </div>
            <div style={styles.spareItem}>
              <span style={styles.spareIcon}>💍</span>
              <span style={styles.spareName}>密封环</span>
              <span style={styles.spareCount}>{spares.seal}</span>
            </div>
            <div style={styles.spareItem}>
              <span style={styles.spareIcon}>🧹</span>
              <span style={styles.spareName}>过滤芯</span>
              <span style={styles.spareCount}>{spares.filter}</span>
            </div>
          </div>
        </div>

        <div style={styles.resourceSection}>
          <h3 style={styles.sectionTitle}>工作人员</h3>
          {workers.map(worker => (
            <div key={worker.id} style={styles.workerItem}>
              <div style={styles.workerInfo}>
                <span style={styles.workerName}>{worker.name}</span>
                <span style={{
                  ...styles.workerFatigue,
                  color: worker.fatigue > 70 ? '#F44336' : worker.fatigue > 40 ? '#FF9800' : '#4CAF50'
                }}>
                  疲劳 {worker.fatigue.toFixed(0)}%
                </span>
              </div>
              <div style={styles.fatigueBar}>
                <div
                  style={{
                    ...styles.fatigueFill,
                    width: `${worker.fatigue}%`,
                    background: worker.fatigue > 70 ? '#F44336' : worker.fatigue > 40 ? '#FF9800' : '#4CAF50'
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        <div style={styles.resourceSection}>
          <h3 style={styles.sectionTitle}>当前故障</h3>
          {faults.length === 0 ? (
            <p style={styles.noFaults}>系统运行正常 ✓</p>
          ) : (
            <div style={styles.faultList}>
              {faults.map(fault => (
                <div key={fault.id} style={styles.faultCard}>
                  <div style={styles.faultHeader}>
                    <span style={styles.faultName}>⚠ {fault.name}</span>
                    <span style={styles.faultDuration}>
                      {fault.remainingDuration.toFixed(1)}s
                    </span>
                  </div>
                  <p style={styles.faultDesc}>{fault.description}</p>
                  <div style={styles.faultActions}>
                    <button
                      style={{
                        ...styles.actionBtn,
                        opacity: cooldown > 0 ? 0.5 : 1,
                        cursor: cooldown > 0 ? 'not-allowed' : 'pointer'
                      }}
                      onClick={() => onDispatchWorker(fault.id)}
                      disabled={cooldown > 0}
                    >
                      派遣工人
                    </button>
                    <button
                      style={{
                        ...styles.actionBtn,
                        ...styles.primaryBtn,
                        opacity: cooldown > 0 ? 0.5 : 1,
                        cursor: cooldown > 0 ? 'not-allowed' : 'pointer'
                      }}
                      onClick={() => onUseSparePart(fault.id)}
                      disabled={cooldown > 0}
                    >
                      更换备件
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={styles.emergencySection}>
          <button
            style={{
              ...styles.emergencyBtn,
              ...(emergencyProtocol ? styles.emergencyActive : {}),
              opacity: cooldown > 0 || emergencyProtocol ? 0.6 : 1,
              cursor: cooldown > 0 || emergencyProtocol ? 'not-allowed' : 'pointer'
            }}
            onClick={onActivateEmergency}
            disabled={cooldown > 0 || emergencyProtocol}
          >
            {emergencyProtocol
              ? `紧急协议运行中 (${emergencyDuration.toFixed(1)}s)`
              : '启动紧急协议'}
          </button>
          {cooldown > 0 && (
            <p style={styles.cooldownText}>操作冷却中: {cooldown.toFixed(1)}s</p>
          )}
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    gap: '24px',
    flexWrap: 'wrap'
  },
  leftPanel: {
    flex: '1',
    minWidth: '300px',
    background: 'rgba(255,255,255,0.05)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    border: '1px solid #3D3D5C',
    borderRadius: '16px',
    padding: '24px',
    boxSizing: 'border-box'
  },
  rightPanel: {
    flex: '1',
    minWidth: '300px',
    background: 'rgba(255,255,255,0.05)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    border: '1px solid #3D3D5C',
    borderRadius: '16px',
    padding: '24px',
    boxSizing: 'border-box'
  },
  panelTitle: {
    margin: '0 0 20px 0',
    color: '#E0E0E0',
    fontSize: '20px',
    fontWeight: 600
  },
  barsContainer: {
    display: 'flex',
    gap: '16px',
    justifyContent: 'space-around',
    flexWrap: 'wrap'
  },
  barWrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
    flex: '1',
    minWidth: '60px'
  },
  barLabel: {
    color: '#9E9E9E',
    fontSize: '13px',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  valueRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '4px',
    fontSize: '14px'
  },
  valueText: {
    color: '#E0E0E0',
    fontWeight: 600
  },
  barContainer: {
    width: '40px',
    height: '200px',
    background: 'rgba(0,0,0,0.3)',
    borderRadius: '8px',
    overflow: 'hidden',
    position: 'relative',
    boxShadow: '0 0 8px rgba(0,200,255,0.3)',
    display: 'flex',
    alignItems: 'flex-end',
    transition: 'all 0.2s ease'
  },
  barFill: {
    width: '100%',
    transition: 'height 0.3s ease',
    borderRadius: '0 0 8px 8px'
  },
  resourceSection: {
    marginBottom: '20px'
  },
  sectionTitle: {
    margin: '0 0 12px 0',
    color: '#B0B0B0',
    fontSize: '14px',
    fontWeight: 500,
    borderBottom: '1px solid #3D3D5C',
    paddingBottom: '8px'
  },
  sparePartsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '12px'
  },
  spareItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
    background: 'rgba(255,255,255,0.05)',
    padding: '12px',
    borderRadius: '8px',
    transition: 'all 0.2s ease'
  },
  spareIcon: {
    fontSize: '24px'
  },
  spareName: {
    color: '#9E9E9E',
    fontSize: '12px'
  },
  spareCount: {
    color: '#E0E0E0',
    fontSize: '18px',
    fontWeight: 600
  },
  workerItem: {
    marginBottom: '12px'
  },
  workerInfo: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '6px'
  },
  workerName: {
    color: '#E0E0E0',
    fontSize: '13px'
  },
  workerFatigue: {
    fontSize: '12px',
    fontWeight: 500
  },
  fatigueBar: {
    height: '6px',
    background: 'rgba(0,0,0,0.3)',
    borderRadius: '3px',
    overflow: 'hidden'
  },
  fatigueFill: {
    height: '100%',
    transition: 'width 0.2s ease'
  },
  noFaults: {
    color: '#4CAF50',
    fontSize: '14px',
    margin: 0
  },
  faultList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  faultCard: {
    background: 'rgba(244, 67, 54, 0.1)',
    border: '1px solid #F44336',
    borderRadius: '8px',
    padding: '12px'
  },
  faultHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '6px'
  },
  faultName: {
    color: '#F44336',
    fontWeight: 600,
    fontSize: '14px'
  },
  faultDuration: {
    color: '#FF9800',
    fontSize: '12px',
    fontFamily: 'monospace'
  },
  faultDesc: {
    color: '#9E9E9E',
    fontSize: '12px',
    margin: '0 0 10px 0'
  },
  faultActions: {
    display: 'flex',
    gap: '8px'
  },
  actionBtn: {
    flex: '1',
    padding: '6px 12px',
    border: 'none',
    borderRadius: '8px',
    background: '#2D2D44',
    color: '#E0E0E0',
    fontSize: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    transitionProperty: 'background-color, box-shadow'
  },
  primaryBtn: {
    background: '#1565C0'
  },
  emergencySection: {
    marginTop: '20px'
  },
  emergencyBtn: {
    width: '100%',
    padding: '12px',
    border: 'none',
    borderRadius: '16px',
    background: '#2D2D44',
    color: '#FF5722',
    fontWeight: 600,
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    transitionProperty: 'background-color, box-shadow'
  },
  emergencyActive: {
    background: '#F44336',
    color: '#fff',
    animation: 'pulse 1s ease-in-out infinite'
  },
  cooldownText: {
    color: '#FF9800',
    fontSize: '12px',
    textAlign: 'center',
    marginTop: '8px'
  }
};

export default StatusPanel;
