import { useState, useRef, useEffect, useCallback } from 'react';
import type { MoleculeInfo } from '../api';
import type { EnergyPoint } from '../App';

interface UIOverlayProps {
  moleculeList: MoleculeInfo[];
  selectedMoleculeId: string;
  onMoleculeChange: (id: string) => void;
  energyHistory: EnergyPoint[];
  currentEnergy: number;
  reactionStep: number;
  reactionMessage: string;
  onReset: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

const getEnergyColor = (energy: number): string => {
  const t = Math.min(energy / 100, 1);
  const r = Math.round(34 + t * 186);
  const g = Math.round(197 - t * 165);
  const b = Math.round(94 - t * 94);
  return `rgb(${r}, ${g}, ${b})`;
};

function EnergyChart({ data, currentEnergy }: { data: EnergyPoint[]; currentEnergy: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const displayDataRef = useRef<EnergyPoint[]>([]);

  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const targetData = data.length > 0 ? data : displayDataRef.current;

    if (displayDataRef.current.length !== targetData.length) {
      displayDataRef.current = targetData.map((point, i) => {
        if (i < displayDataRef.current.length) {
          return {
            ...point,
            energy:
              displayDataRef.current[i].energy +
              (point.energy - displayDataRef.current[i].energy) * 0.2,
          };
        }
        return { ...point };
      });
    } else {
      displayDataRef.current = displayDataRef.current.map((point, i) => ({
        ...point,
        energy: point.energy + (targetData[i].energy - point.energy) * 0.2,
      }));
    }

    const displayData = displayDataRef.current;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#2a2a4e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = (canvas.height / 4) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    if (displayData.length < 2) {
      animationRef.current = requestAnimationFrame(animate);
      return;
    }

    const padding = 10;
    const chartWidth = canvas.width - padding * 2;
    const chartHeight = canvas.height - padding * 2;
    const maxSteps = Math.max(displayData.length, 10);

    ctx.beginPath();
    displayData.forEach((point, index) => {
      const x = padding + (index / (maxSteps - 1)) * chartWidth;
      const y = padding + chartHeight - (point.energy / 100) * chartHeight;

      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        const prevPoint = displayData[index - 1];
        const prevX = padding + ((index - 1) / (maxSteps - 1)) * chartWidth;
        const prevY = padding + chartHeight - (prevPoint.energy / 100) * chartHeight;

        const cpX = (prevX + x) / 2;
        ctx.bezierCurveTo(cpX, prevY, cpX, y, x, y);
      }
    });

    const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
    for (let i = 0; i < displayData.length; i++) {
      const t = i / Math.max(displayData.length - 1, 1);
      gradient.addColorStop(t, getEnergyColor(displayData[i].energy));
    }

    ctx.strokeStyle = gradient;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();

    if (displayData.length > 0) {
      const lastPoint = displayData[displayData.length - 1];
      const x = padding + ((displayData.length - 1) / (maxSteps - 1)) * chartWidth;
      const y = padding + chartHeight - (lastPoint.energy / 100) * chartHeight;

      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fillStyle = getEnergyColor(lastPoint.energy);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    animationRef.current = requestAnimationFrame(animate);
  }, [data]);

  useEffect(() => {
    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [animate]);

  return (
    <div style={styles.chartContainer}>
      <canvas
        ref={canvasRef}
        width={260}
        height={100}
        className="energy-chart-canvas"
        style={styles.canvas}
      />
      <div style={styles.energyLabel}>
        <span style={{ color: getEnergyColor(currentEnergy) }}>
          {currentEnergy.toFixed(1)}
        </span>
        <span style={{ color: '#ffffff', fontSize: '11px', marginLeft: '4px' }}>
          kJ/mol
        </span>
      </div>
    </div>
  );
}

function UIOverlay({
  moleculeList,
  selectedMoleculeId,
  onMoleculeChange,
  energyHistory,
  currentEnergy,
  reactionStep,
  reactionMessage,
  onReset,
  isCollapsed,
  onToggleCollapse,
}: UIOverlayProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedMolecule = moleculeList.find((m) => m.id === selectedMoleculeId);

  const panelStyle: React.CSSProperties = isMobile
    ? isCollapsed
      ? { ...styles.panel, ...styles.panelMobileCollapsed }
      : { ...styles.panel, ...styles.panelMobileExpanded }
    : { ...styles.panel, ...styles.panelDesktop };

  return (
    <div style={panelStyle}>
      {isMobile && (
        <button className="toggle-button" style={styles.toggleButton} onClick={onToggleCollapse}>
          {isCollapsed ? '展开' : '收起'}
        </button>
      )}

      {(!isMobile || !isCollapsed) && (
        <>
          <h2 style={styles.title}>分子模拟器</h2>

          <div style={styles.section}>
            <label style={styles.label}>选择分子</label>
            <div ref={dropdownRef} style={styles.dropdownContainer}>
              <button
                className="dropdown-button"
                style={styles.dropdownButton}
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              >
                <span style={styles.dropdownText}>
                  {selectedMolecule
                    ? `${selectedMolecule.name} ${selectedMolecule.formula}`
                    : '选择分子'}
                </span>
                <span
                  style={{
                    ...styles.dropdownArrow,
                    transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  }}
                >
                  ▼
                </span>
              </button>
              <div
                style={{
                  ...styles.dropdownMenu,
                  ...(isDropdownOpen ? styles.dropdownMenuOpen : {}),
                }}
              >
                {moleculeList.map((molecule) => (
                  <div
                    key={molecule.id}
                    className="dropdown-item"
                    style={{
                      ...styles.dropdownItem,
                      ...(molecule.id === selectedMoleculeId
                        ? styles.dropdownItemSelected
                        : {}),
                    }}
                    onClick={() => {
                      onMoleculeChange(molecule.id);
                      setIsDropdownOpen(false);
                    }}
                  >
                    <span>{molecule.name}</span>
                    <span style={styles.formula}>{molecule.formula}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={styles.section}>
            <label style={styles.label}>能量曲线</label>
            <EnergyChart data={energyHistory} currentEnergy={currentEnergy} />
            <div style={styles.axisLabels}>
              <span style={styles.axisLabel}>反应步</span>
              <span style={styles.axisLabel}>能量</span>
            </div>
          </div>

          <div style={styles.section}>
            <label style={styles.label}>当前状态</label>
            <div style={styles.statusBox}>
              <div style={styles.statusRow}>
                <span style={styles.statusLabel}>反应步数:</span>
                <span style={styles.statusValue}>{reactionStep}</span>
              </div>
              <div style={styles.statusRow}>
                <span style={styles.statusLabel}>当前能量:</span>
                <span
                  style={{ ...styles.statusValue, color: getEnergyColor(currentEnergy) }}
                >
                  {currentEnergy.toFixed(1)} kJ/mol
                </span>
              </div>
            </div>
          </div>

          <div style={styles.section}>
            <div style={styles.messageBox}>
              <span style={styles.message}>{reactionMessage}</span>
            </div>
          </div>

          <button className="reset-button" style={styles.resetButton} onClick={onReset}>
            重置分子
          </button>

          {selectedMoleculeId === 'c6h6' && (
            <div style={styles.tipBox}>
              <span style={styles.tipTitle}>💡 提示</span>
              <p style={styles.tipText}>
                拖拽苯环上的氢原子可以观察化学键的断裂与重组过程。
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  panel: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(6px)',
    borderRadius: '12px',
    padding: '20px',
    color: '#ffffff',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    zIndex: 100,
    overflow: 'hidden',
    transition: 'all 0.3s ease',
  },
  panelDesktop: {
    top: '20px',
    left: '20px',
    width: '280px',
  },
  panelMobileCollapsed: {
    top: '10px',
    left: '10px',
    right: '10px',
    width: 'auto',
    height: '50px',
    padding: '10px',
  },
  panelMobileExpanded: {
    top: '10px',
    left: '10px',
    right: '10px',
    width: 'auto',
    maxHeight: '80vh',
    overflowY: 'auto',
  },
  toggleButton: {
    width: '100%',
    padding: '8px 16px',
    backgroundColor: 'rgba(21, 101, 192, 0.8)',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'background-color 0.3s ease',
  },
  title: {
    fontSize: '18px',
    fontWeight: 'bold',
    marginBottom: '16px',
    textAlign: 'center',
    background: 'linear-gradient(90deg, #64b5f6, #42a5f5)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  section: {
    marginBottom: '16px',
  },
  label: {
    display: 'block',
    fontSize: '12px',
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: '8px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  dropdownContainer: {
    position: 'relative',
  },
  dropdownButton: {
    width: '100%',
    padding: '10px 14px',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    color: '#ffffff',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '6px',
    cursor: 'pointer',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    transition: 'all 0.2s ease',
  },
  dropdownText: {
    fontSize: '14px',
  },
  dropdownArrow: {
    fontSize: '10px',
    transition: 'transform 0.2s ease',
  },
  dropdownMenu: {
    position: 'absolute',
    top: '100%',
    left: '0',
    right: '0',
    marginTop: '4px',
    backgroundColor: 'rgba(26, 26, 62, 0.95)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '6px',
    overflow: 'hidden',
    opacity: '0',
    transform: 'translateY(-10px)',
    pointerEvents: 'none',
    transition: 'all 0.2s ease',
    zIndex: 10,
  },
  dropdownMenuOpen: {
    opacity: '1',
    transform: 'translateY(0)',
    pointerEvents: 'auto',
  },
  dropdownItem: {
    padding: '10px 14px',
    cursor: 'pointer',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    transition: 'background-color 0.15s ease',
  },
  dropdownItemSelected: {
    backgroundColor: 'rgba(21, 101, 192, 0.5)',
  },
  formula: {
    fontSize: '12px',
    color: 'rgba(255, 255, 255, 0.6)',
  },
  chartContainer: {
    position: 'relative',
    width: '260px',
    height: '100px',
    borderRadius: '6px',
    overflow: 'hidden',
  },
  canvas: {
    display: 'block',
    borderRadius: '6px',
  },
  energyLabel: {
    position: 'absolute',
    top: '8px',
    right: '10px',
    display: 'flex',
    alignItems: 'baseline',
    fontWeight: 'bold',
  },
  axisLabels: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: '4px',
  },
  axisLabel: {
    fontSize: '10px',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  statusBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '6px',
    padding: '12px',
  },
  statusRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '6px',
  },
  statusLabel: {
    fontSize: '12px',
    color: 'rgba(255, 255, 255, 0.6)',
  },
  statusValue: {
    fontSize: '12px',
    fontWeight: 'bold',
  },
  messageBox: {
    backgroundColor: 'rgba(100, 181, 246, 0.2)',
    borderRadius: '6px',
    padding: '10px 12px',
    borderLeft: '3px solid #64b5f6',
  },
  message: {
    fontSize: '12px',
    color: '#ffffff',
  },
  resetButton: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#1565C0',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
    transition: 'background-color 0.3s ease',
    marginTop: '8px',
  },
  tipBox: {
    marginTop: '16px',
    padding: '12px',
    backgroundColor: 'rgba(255, 193, 7, 0.1)',
    border: '1px solid rgba(255, 193, 7, 0.3)',
    borderRadius: '6px',
  },
  tipTitle: {
    display: 'block',
    fontSize: '12px',
    fontWeight: 'bold',
    marginBottom: '4px',
    color: '#ffc107',
  },
  tipText: {
    fontSize: '11px',
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: '1.4',
    margin: 0,
  },
};

export default UIOverlay;
