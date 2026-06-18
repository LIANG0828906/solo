import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useAcousticStore } from './store/useAcousticStore';
import {
  MATERIAL_PROPS,
  MaterialType,
  RT60DataPoint,
  FREQUENCIES,
} from './types/acoustic';
import {
  Volume2,
  User,
  Box,
  Trash2,
  RefreshCw,
  X,
  ZoomIn,
  Ruler,
  Palette,
} from 'lucide-react';

interface ControlPanelProps {
  width?: number;
}

const formatFrequency = (freq: number): string => {
  if (freq >= 1000) {
    return `${freq / 1000}kHz`;
  }
  return `${freq}Hz`;
};

interface RT60ChartProps {
  data: RT60DataPoint[];
  onPointClick: (frequency: number) => void;
  selectedFrequency: number | null;
}

const RT60Chart: React.FC<RT60ChartProps> = ({ data, onPointClick, selectedFrequency }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 260, height: 160 });

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({
          width: Math.max(200, rect.width - 4),
          height: 160,
        });
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || data.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = dimensions;
    const padding = { top: 20, right: 20, bottom: 30, left: 40 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    ctx.clearRect(0, 0, width, height);

    ctx.fillStyle = 'rgba(30, 30, 50, 0.5)';
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;

    for (let i = 0; i <= 5; i++) {
      const y = padding.top + (i / 5) * chartHeight;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();

      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.font = '10px "Fira Code", monospace';
      ctx.textAlign = 'right';
      ctx.fillText(`${5 - i}s`, padding.left - 4, y + 3);
    }

    const freqLabels = FREQUENCIES;
    freqLabels.forEach((freq, i) => {
      const x = padding.left + (i / (freqLabels.length - 1)) * chartWidth;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.font = '10px "Fira Code", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(formatFrequency(freq), x, height - 8);
    });

    if (data.length > 0) {
      const gradient = ctx.createLinearGradient(0, padding.top, 0, height - padding.bottom);
      gradient.addColorStop(0, 'rgba(155, 89, 182, 0.4)');
      gradient.addColorStop(1, 'rgba(155, 89, 182, 0)');

      ctx.beginPath();
      data.forEach((point, i) => {
        const x = padding.left + (i / (data.length - 1)) * chartWidth;
        const y = padding.top + chartHeight - (point.rt60 / 5) * chartHeight;
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          const prevX = padding.left + ((i - 1) / (data.length - 1)) * chartWidth;
          const prevY = padding.top + chartHeight - (data[i - 1].rt60 / 5) * chartHeight;
          const cpX = (prevX + x) / 2;
          ctx.bezierCurveTo(cpX, prevY, cpX, y, x, y);
        }
      });
      ctx.lineTo(padding.left + chartWidth, height - padding.bottom);
      ctx.lineTo(padding.left, height - padding.bottom);
      ctx.closePath();
      ctx.fillStyle = gradient;
      ctx.fill();

      ctx.beginPath();
      data.forEach((point, i) => {
        const x = padding.left + (i / (data.length - 1)) * chartWidth;
        const y = padding.top + chartHeight - (point.rt60 / 5) * chartHeight;
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          const prevX = padding.left + ((i - 1) / (data.length - 1)) * chartWidth;
          const prevY = padding.top + chartHeight - (data[i - 1].rt60 / 5) * chartHeight;
          const cpX = (prevX + x) / 2;
          ctx.bezierCurveTo(cpX, prevY, cpX, y, x, y);
        }
      });
      ctx.strokeStyle = '#9B59B6';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      data.forEach((point, i) => {
        const x = padding.left + (i / (data.length - 1)) * chartWidth;
        const y = padding.top + chartHeight - (point.rt60 / 5) * chartHeight;
        const isSelected = selectedFrequency === point.frequency;

        ctx.beginPath();
        ctx.arc(x, y, isSelected ? 7 : 5, 0, Math.PI * 2);
        ctx.fillStyle = isSelected ? '#E74C3C' : '#9B59B6';
        ctx.fill();
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.stroke();
      });
    }

    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.font = '11px "Fira Code", monospace';
    ctx.textAlign = 'left';
    ctx.fillText('RT60 (s)', 4, 14);

  }, [data, dimensions, selectedFrequency]);

  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || data.length === 0) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const padding = { left: 40, right: 20 };
    const chartWidth = dimensions.width - padding.left - padding.right;

    const relativeX = (x - padding.left) / chartWidth;
    const index = Math.round(relativeX * (data.length - 1));
    const clampedIndex = Math.max(0, Math.min(data.length - 1, index));

    if (data[clampedIndex]) {
      onPointClick(data[clampedIndex].frequency);
    }
  }, [data, dimensions, onPointClick]);

  return (
    <div ref={containerRef} style={{ width: '100%' }}>
      <canvas
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        onClick={handleClick}
        style={{
          borderRadius: '8px',
          cursor: 'pointer',
          display: 'block',
        }}
      />
    </div>
  );
};

interface DecayDetailModalProps {
  data: RT60DataPoint | null;
  onClose: () => void;
}

const DecayDetailModal: React.FC<DecayDetailModalProps> = ({ data, onClose }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !data) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = 400;
    const height = 300;
    const padding = { top: 40, right: 30, bottom: 50, left: 60 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    ctx.clearRect(0, 0, width, height);

    ctx.fillStyle = '#1A1A2E';
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1;

    for (let i = 0; i <= 6; i++) {
      const y = padding.top + (i / 6) * chartHeight;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();

      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.font = '11px "Fira Code", monospace';
      ctx.textAlign = 'right';
      const db = 60 - i * 10;
      ctx.fillText(`${db}dB`, padding.left - 8, y + 4);
    }

    const maxTime = data.rt60 * 1.2;
    const timeSteps = 6;
    for (let i = 0; i <= timeSteps; i++) {
      const x = padding.left + (i / timeSteps) * chartWidth;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.font = '11px "Fira Code", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`${(i / timeSteps * maxTime).toFixed(1)}s`, x, height - 20);
    }

    const drawCurve = (curveData: number[], color: string, lineWidth: number = 2) => {
      ctx.beginPath();
      curveData.forEach((db, i) => {
        const t = (i / (curveData.length - 1)) * maxTime;
        const x = padding.left + (t / maxTime) * chartWidth;
        const y = padding.top + chartHeight - ((db + 60) / 120) * chartHeight;
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.stroke();
    };

    const upperCurve = data.decayCurve.map(db => Math.min(0, db + 3));
    const lowerCurve = data.decayCurve.map(db => Math.max(-60, db - 3));

    ctx.beginPath();
    upperCurve.forEach((db, i) => {
      const t = (i / (upperCurve.length - 1)) * maxTime;
      const x = padding.left + (t / maxTime) * chartWidth;
      const y = padding.top + chartHeight - ((db + 60) / 120) * chartHeight;
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    for (let i = lowerCurve.length - 1; i >= 0; i--) {
      const t = (i / (lowerCurve.length - 1)) * maxTime;
      const x = padding.left + (t / maxTime) * chartWidth;
      const y = padding.top + chartHeight - ((lowerCurve[i] + 60) / 120) * chartHeight;
      ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fillStyle = 'rgba(155, 89, 182, 0.2)';
    ctx.fill();

    drawCurve(lowerCurve, 'rgba(155, 89, 182, 0.5)', 1);
    drawCurve(upperCurve, 'rgba(155, 89, 182, 0.5)', 1);
    drawCurve(data.decayCurve, '#9B59B6', 3);

    const rt60Time = data.rt60;
    const rt60X = padding.left + (rt60Time / maxTime) * chartWidth;
    const rt60Y = padding.top + chartHeight - ((-60 + 60) / 120) * chartHeight;

    ctx.setLineDash([5, 5]);
    ctx.strokeStyle = '#E74C3C';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(rt60X, padding.top);
    ctx.lineTo(rt60X, rt60Y);
    ctx.lineTo(padding.left, rt60Y);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#E74C3C';
    ctx.beginPath();
    ctx.arc(rt60X, rt60Y, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 14px "Fira Code", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`RT60 @ ${formatFrequency(data.frequency)}: ${data.rt60.toFixed(2)}s`, width / 2, 24);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.font = '12px "Fira Code", monospace';
    ctx.textAlign = 'left';
    ctx.fillText('声压级 (dB)', 8, 30);
    ctx.textAlign = 'center';
    ctx.fillText('时间 (s)', width / 2, height - 8);

  }, [data]);

  if (!data) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        backdropFilter: 'blur(4px)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'rgba(30, 30, 60, 0.95)',
          borderRadius: '16px',
          padding: '20px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'rgba(255, 255, 255, 0.6)',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '4px',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#FFFFFF';
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)';
              e.currentTarget.style.background = 'none';
            }}
          >
            <X size={20} />
          </button>
        </div>
        <canvas
          ref={canvasRef}
          width={400}
          height={300}
          style={{ borderRadius: '8px' }}
        />
        <div style={{ marginTop: '12px', textAlign: 'center' }}>
          <div style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '12px', fontFamily: "'Fira Code', monospace" }}>
            二阶指数拟合曲线 · 置信区间 ±3dB
          </div>
        </div>
      </div>
    </div>
  );
};

export const ControlPanel: React.FC<ControlPanelProps> = ({ width = 280 }) => {
  const {
    soundSources,
    listeners,
    obstacles,
    rt60Data,
    selectedObjectId,
    selectedObjectType,
    addMode,
    showDecayDetail,
    selectedFrequency,
    setAddMode,
    setSelectedObject,
    updateObstacle,
    setShowDecayDetail,
    resetScene,
  } = useAcousticStore();

  const selectedObstacle = obstacles.find((o) => o.id === selectedObjectId);
  const selectedRt60Point = rt60Data.find((d) => d.frequency === selectedFrequency);

  const handleSliderChange = (dimension: 'x' | 'y' | 'z', value: number) => {
    if (!selectedObstacle) return;
    const newSize = { ...selectedObstacle.size, [dimension]: value };
    updateObstacle(selectedObstacle.id, { size: newSize });
  };

  const handleMaterialChange = (material: MaterialType) => {
    if (!selectedObstacle) return;
    updateObstacle(selectedObstacle.id, { material });
  };

  const cardStyle: React.CSSProperties = {
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '12px',
    padding: '12px',
    marginBottom: '12px',
    transition: 'background 0.2s ease',
  };

  const cardHoverStyle: React.CSSProperties = {
    ...cardStyle,
  };

  const buttonStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 12px',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '13px',
    fontWeight: 500,
    transition: 'all 0.2s ease',
    marginBottom: '8px',
  };

  const activeButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    background: 'rgba(0, 255, 136, 0.2)',
    color: '#00FF88',
    boxShadow: '0 0 0 2px rgba(0, 255, 136, 0.3)',
  };

  const inactiveButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    background: 'rgba(255, 255, 255, 0.05)',
    color: 'rgba(255, 255, 255, 0.8)',
  };

  return (
    <div
      style={{
        width: `${width}px`,
        height: '100vh',
        background: 'rgba(30, 30, 60, 0.85)',
        backdropFilter: 'blur(12px)',
        borderLeft: '1px solid rgba(255, 255, 255, 0.1)',
        padding: '16px',
        overflowY: 'auto',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ marginBottom: '20px' }}>
        <h1
          style={{
            color: '#FFFFFF',
            fontSize: '18px',
            fontWeight: 600,
            margin: 0,
            marginBottom: '4px',
          }}
        >
          室内声学模拟器
        </h1>
        <p
          style={{
            color: 'rgba(255, 255, 255, 0.5)',
            fontSize: '12px',
            margin: 0,
          }}
        >
          声波传播与混响分析
        </p>
      </div>

      <div style={cardHoverStyle}>
        <h3
          style={{
            color: '#FFFFFF',
            fontSize: '13px',
            fontWeight: 600,
            margin: 0,
            marginBottom: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <span>➕</span> 添加物体
        </h3>

        <button
          style={addMode === 'source' ? activeButtonStyle : inactiveButtonStyle}
          onClick={() => setAddMode(addMode === 'source' ? null : 'source')}
          onMouseEnter={(e) => {
            if (addMode !== 'source') {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
            }
          }}
          onMouseLeave={(e) => {
            if (addMode !== 'source') {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
            }
          }}
        >
          <Volume2 size={16} style={{ color: '#FFD700' }} />
          <span>声源</span>
          <span style={{ marginLeft: 'auto', color: 'rgba(255, 255, 255, 0.4)', fontSize: '11px' }}>
            {soundSources.length}
          </span>
        </button>

        <button
          style={addMode === 'listener' ? activeButtonStyle : inactiveButtonStyle}
          onClick={() => setAddMode(addMode === 'listener' ? null : 'listener')}
          onMouseEnter={(e) => {
            if (addMode !== 'listener') {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
            }
          }}
          onMouseLeave={(e) => {
            if (addMode !== 'listener') {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
            }
          }}
        >
          <User size={16} style={{ color: '#4A9EFF' }} />
          <span>收听者</span>
          <span style={{ marginLeft: 'auto', color: 'rgba(255, 255, 255, 0.4)', fontSize: '11px' }}>
            {listeners.length}
          </span>
        </button>

        <button
          style={addMode === 'obstacle' ? activeButtonStyle : inactiveButtonStyle}
          onClick={() => setAddMode(addMode === 'obstacle' ? null : 'obstacle')}
          disabled={obstacles.length >= 6}
          onMouseEnter={(e) => {
            if (addMode !== 'obstacle' && obstacles.length < 6) {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
            }
          }}
          onMouseLeave={(e) => {
            if (addMode !== 'obstacle') {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
            }
          }}
        >
          <Box size={16} style={{ color: '#808080' }} />
          <span>障碍物</span>
          <span style={{ marginLeft: 'auto', color: 'rgba(255, 255, 255, 0.4)', fontSize: '11px' }}>
            {obstacles.length}/6
          </span>
        </button>
      </div>

      {selectedObstacle && selectedObjectType === 'obstacle' && (
        <div style={cardHoverStyle}>
          <h3
            style={{
              color: '#FFFFFF',
              fontSize: '13px',
              fontWeight: 600,
              margin: 0,
              marginBottom: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Ruler size={14} />
            障碍物尺寸
          </h3>

          {(['x', 'y', 'z'] as const).map((dim) => (
            <div key={dim} style={{ marginBottom: '10px' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '4px',
                }}
              >
                <span style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '12px' }}>
                  {dim === 'x' ? '宽度' : dim === 'y' ? '高度' : '深度'}
                </span>
                <span
                  style={{
                    color: '#00FF88',
                    fontSize: '12px',
                    fontFamily: "'Fira Code', monospace",
                  }}
                >
                  {selectedObstacle.size[dim].toFixed(1)}m
                </span>
              </div>
              <input
                type="range"
                min="0.3"
                max="5"
                step="0.1"
                value={selectedObstacle.size[dim]}
                onChange={(e) => handleSliderChange(dim, parseFloat(e.target.value))}
                style={{
                  width: '100%',
                  height: '6px',
                  borderRadius: '3px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  appearance: 'none',
                  cursor: 'pointer',
                }}
              />
            </div>
          ))}

          <h3
            style={{
              color: '#FFFFFF',
              fontSize: '13px',
              fontWeight: 600,
              margin: '16px 0 12px 0',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Palette size={14} />
            材质选择
          </h3>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}
          >
            {(Object.keys(MATERIAL_PROPS) as MaterialType[]).map((mat) => {
              const props = MATERIAL_PROPS[mat];
              const isSelected = selectedObstacle.material === mat;
              return (
                <button
                  key={mat}
                  onClick={() => handleMaterialChange(mat)}
                  style={{
                    padding: '8px 12px',
                    border: isSelected ? '2px solid #00FF88' : '2px solid transparent',
                    borderRadius: '8px',
                    background: isSelected
                      ? 'rgba(0, 255, 136, 0.1)'
                      : 'rgba(255, 255, 255, 0.05)',
                    color: '#FFFFFF',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '12px',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                    }
                  }}
                >
                  <div
                    style={{
                      width: '16px',
                      height: '16px',
                      borderRadius: '4px',
                      background: props.color,
                      opacity: props.opacity,
                      border: props.transparent ? '1px solid rgba(255,255,255,0.3)' : 'none',
                    }}
                  />
                  <span>{props.label}</span>
                  <span
                    style={{
                      marginLeft: 'auto',
                      color: 'rgba(255, 255, 255, 0.4)',
                      fontSize: '10px',
                      fontFamily: "'Fira Code', monospace",
                    }}
                  >
                    α={props.absorption}
                  </span>
                </button>
              );
            })}
          </div>

          <button
            onClick={() => {
              useAcousticStore.getState().removeObstacle(selectedObstacle.id);
            }}
            style={{
              width: '100%',
              padding: '10px',
              marginTop: '12px',
              border: 'none',
              borderRadius: '8px',
              background: 'rgba(231, 76, 60, 0.2)',
              color: '#E74C3C',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              fontSize: '12px',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(231, 76, 60, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(231, 76, 60, 0.2)';
            }}
          >
            <Trash2 size={14} />
            删除障碍物
          </button>
        </div>
      )}

      <div style={cardHoverStyle}>
        <h3
          style={{
            color: '#FFFFFF',
            fontSize: '13px',
            fontWeight: 600,
            margin: 0,
            marginBottom: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <ZoomIn size={14} />
          RT60 混响时间
          <span style={{ marginLeft: 'auto', color: 'rgba(255, 255, 255, 0.4)', fontSize: '10px' }}>
            15Hz
          </span>
        </h3>

        <RT60Chart
          data={rt60Data}
          onPointClick={(freq) => {
            setShowDecayDetail(true, freq);
          }}
          selectedFrequency={showDecayDetail ? selectedFrequency : null}
        />

        <p
          style={{
            color: 'rgba(255, 255, 255, 0.4)',
            fontSize: '11px',
            margin: '8px 0 0 0',
            textAlign: 'center',
          }}
        >
          点击曲线查看详细衰减数据
        </p>
      </div>

      <button
        onClick={resetScene}
        style={{
          width: '100%',
          padding: '12px',
          border: 'none',
          borderRadius: '8px',
          background: 'rgba(255, 255, 255, 0.05)',
          color: 'rgba(255, 255, 255, 0.7)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          fontSize: '13px',
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
          e.currentTarget.style.color = '#FFFFFF';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
          e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)';
        }}
      >
        <RefreshCw size={16} />
        重置场景
      </button>

      <div
        style={{
          marginTop: '20px',
          paddingTop: '16px',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <h4
          style={{
            color: 'rgba(255, 255, 255, 0.5)',
            fontSize: '11px',
            fontWeight: 600,
            margin: 0,
            marginBottom: '8px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        >
          操作提示
        </h4>
        <ul
          style={{
            listStyle: 'none',
            padding: 0,
            margin: 0,
            fontSize: '11px',
            color: 'rgba(255, 255, 255, 0.4)',
            lineHeight: '1.6',
          }}
        >
          <li>• 左键拖拽：旋转视角</li>
          <li>• 右键拖拽：平移视角</li>
          <li>• 滚轮：缩放 (0.3-10倍)</li>
          <li>• 拖拽物体：移动位置</li>
          <li>• 右键物体：删除</li>
          <li>• ESC：取消添加模式</li>
        </ul>
      </div>

      <DecayDetailModal
        data={selectedRt60Point || null}
        onClose={() => setShowDecayDetail(false)}
      />
    </div>
  );
};

export default ControlPanel;
