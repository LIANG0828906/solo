import { useRef, useEffect, useMemo } from 'react';
import { useSimulatorStore } from './store';
import type { PowerDataPoint, PowerLevel, TurbineState } from './types';
import { POWER_LEVEL_CONFIG } from './types';

interface UIPanelProps {
  className?: string;
}

export function UIPanel({ className = '' }: UIPanelProps) {
  const {
    windParams,
    powerLevel,
    totalPower,
    powerHistory,
    selectedTurbineId,
    turbineStates,
    turbines,
    setWindDirection,
    setWindSpeed,
    setPowerLevel,
    removeTurbine,
    clearTurbines,
  } = useSimulatorStore();

  const selectedTurbineState = useMemo(() => {
    if (!selectedTurbineId) return null;
    return turbineStates.find((s) => s.turbine.id === selectedTurbineId) || null;
  }, [selectedTurbineId, turbineStates]);

  return (
    <div className={`ui-panel ${className}`} style={panelStyle}>
      <div style={headerStyle}>
        <h2 style={titleStyle}>风力涡轮机模拟器</h2>
        <p style={subtitleStyle}>Wind Turbine Layout Simulator</p>
      </div>

      <div style={sectionStyle}>
        <h3 style={sectionTitleStyle}>风场参数</h3>

        <div style={controlGroupStyle}>
          <div style={labelRowStyle}>
            <label style={labelStyle}>风向角度</label>
            <span style={valueStyle}>{windParams.direction.toFixed(0)}°</span>
          </div>
          <Compass direction={windParams.direction} />
          <input
            type="range"
            min="0"
            max="360"
            step="1"
            value={windParams.direction}
            onChange={(e) => setWindDirection(Number(e.target.value))}
            style={sliderStyle}
          />
          <div style={tickMarksStyle}>
            <span>0°</span>
            <span>90°</span>
            <span>180°</span>
            <span>270°</span>
            <span>360°</span>
          </div>
        </div>

        <div style={controlGroupStyle}>
          <div style={labelRowStyle}>
            <label style={labelStyle}>风速</label>
            <span style={valueStyle}>{windParams.speed.toFixed(1)} m/s</span>
          </div>
          <input
            type="range"
            min="3"
            max="20"
            step="0.5"
            value={windParams.speed}
            onChange={(e) => setWindSpeed(Number(e.target.value))}
            style={sliderStyle}
          />
          <div style={tickMarksStyle}>
            <span>3</span>
            <span>8</span>
            <span>12</span>
            <span>16</span>
            <span>20</span>
          </div>
        </div>

        <div style={controlGroupStyle}>
          <div style={labelRowStyle}>
            <label style={labelStyle}>涡轮机功率等级</label>
            <span style={valueStyle}>
              Level {powerLevel} ({POWER_LEVEL_CONFIG[powerLevel].ratedPower} MW)
            </span>
          </div>
          <PowerLevelSelector
            currentLevel={powerLevel}
            onChange={setPowerLevel}
          />
        </div>
      </div>

      <div style={sectionStyle}>
        <h3 style={sectionTitleStyle}>发电功率</h3>
        <PowerChart data={powerHistory} maxPower={calculateMaxPower(turbines)} />
        <div style={totalPowerStyle}>
          <span style={totalPowerLabelStyle}>总功率</span>
          <span style={totalPowerValueStyle}>
            {totalPower.toFixed(2)} <span style={totalPowerUnitStyle}>MW</span>
          </span>
        </div>
        <div style={statsRowStyle}>
          <div style={statItemStyle}>
            <span style={statLabelStyle}>涡轮机数量</span>
            <span style={statValueStyle}>{turbines.length}</span>
          </div>
          <div style={statItemStyle}>
            <span style={statLabelStyle}>理论最大功率</span>
            <span style={statValueStyle}>{calculateMaxPower(turbines).toFixed(2)} MW</span>
          </div>
        </div>
      </div>

      {selectedTurbineState && (
        <TurbineInfoCard
          state={selectedTurbineState}
          onDelete={() => removeTurbine(selectedTurbineState.turbine.id)}
        />
      )}

      <div style={sectionStyle}>
        <button style={clearButtonStyle} onClick={clearTurbines}>
          清空所有涡轮机
        </button>
      </div>

      <div style={helpStyle}>
        <p style={helpTextStyle}>💡 点击地形添加涡轮机</p>
        <p style={helpTextStyle}>🖱️ 左键拖拽旋转 · 滚轮缩放 · 右键平移</p>
        <p style={helpTextStyle}>⌫ Delete/Backspace 删除选中涡轮机</p>
      </div>
    </div>
  );
}

function calculateMaxPower(turbines: { ratedPower: number }[]): number {
  return turbines.reduce((sum, t) => sum + t.ratedPower, 0);
}

function Compass({ direction }: { direction: number }) {
  const size = 80;
  const center = size / 2;
  const radius = 30;

  const arrowRad = ((direction - 90) * Math.PI) / 180;
  const arrowX = center + Math.cos(arrowRad) * radius;
  const arrowY = center + Math.sin(arrowRad) * radius;

  return (
    <div style={{ display: 'flex', justifyContent: 'center', margin: '8px 0' }}>
      <svg width={size} height={size} style={compassStyle}>
        <circle cx={center} cy={center} r={radius + 5} fill="rgba(30, 30, 50, 0.8)" stroke="rgba(100, 150, 200, 0.3)" strokeWidth="1" />
        <text x={center} y={center - radius - 2} textAnchor="middle" fill="#888" fontSize="10">N</text>
        <text x={center + radius + 8} y={center + 3} textAnchor="middle" fill="#888" fontSize="10">E</text>
        <text x={center} y={center + radius + 10} textAnchor="middle" fill="#888" fontSize="10">S</text>
        <text x={center - radius - 8} y={center + 3} textAnchor="middle" fill="#888" fontSize="10">W</text>
        <line
          x1={center}
          y1={center}
          x2={arrowX}
          y2={arrowY}
          stroke="#ffdd44"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <polygon
          points={`${arrowX},${arrowY} ${arrowX - 6},${arrowY - 3} ${arrowX - 3},${arrowY - 6}`}
          fill="#ffdd44"
          transform={`rotate(${direction}, ${arrowX}, ${arrowY})`}
        />
        <circle cx={center} cy={center} r="4" fill="#4488ff" />
      </svg>
    </div>
  );
}

function PowerLevelSelector({
  currentLevel,
  onChange,
}: {
  currentLevel: PowerLevel;
  onChange: (level: PowerLevel) => void;
}) {
  const levels: PowerLevel[] = [1, 2, 3];

  return (
    <div style={levelSelectorStyle}>
      {levels.map((level) => {
        const config = POWER_LEVEL_CONFIG[level];
        const isSelected = currentLevel === level;
        return (
          <button
            key={level}
            onClick={() => onChange(level)}
            style={{
              ...levelButtonStyle,
              ...(isSelected ? levelButtonActiveStyle : {}),
            }}
          >
            <div style={levelButtonTopStyle}>Lv.{level}</div>
            <div style={levelButtonBottomStyle}>{config.ratedPower} MW</div>
            <div style={levelButtonDiameterStyle}>Ø{config.rotorDiameter}m</div>
          </button>
        );
      })}
    </div>
  );
}

function PowerChart({ data, maxPower }: { data: PowerDataPoint[]; maxPower: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const smoothedPowerRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      const width = canvas.width;
      const height = canvas.height;
      const padding = { top: 10, right: 10, bottom: 20, left: 40 };
      const chartWidth = width - padding.left - padding.right;
      const chartHeight = height - padding.top - padding.bottom;

      ctx.clearRect(0, 0, width, height);

      ctx.fillStyle = 'rgba(20, 20, 35, 0.8)';
      ctx.fillRect(0, 0, width, height);

      ctx.strokeStyle = 'rgba(100, 150, 200, 0.1)';
      ctx.lineWidth = 1;
      for (let i = 0; i <= 4; i++) {
        const y = padding.top + (chartHeight * i) / 4;
        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(width - padding.right, y);
        ctx.stroke();
      }

      const currentPower = data.length > 0 ? data[data.length - 1].power : 0;
      if (Math.abs(smoothedPowerRef.current - currentPower) > 0.01) {
        smoothedPowerRef.current += (currentPower - smoothedPowerRef.current) * 0.1;
      }

      const displayMaxPower = Math.max(maxPower, smoothedPowerRef.current * 1.2, 1);

      ctx.fillStyle = 'rgba(150, 180, 220, 0.6)';
      ctx.font = '10px Inter, sans-serif';
      ctx.textAlign = 'right';
      for (let i = 0; i <= 4; i++) {
        const y = padding.top + (chartHeight * i) / 4;
        const value = displayMaxPower * (1 - i / 4);
        ctx.fillText(value.toFixed(1), padding.left - 5, y + 3);
      }

      if (data.length > 1) {
        const gradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartHeight);
        gradient.addColorStop(0, 'rgba(68, 200, 255, 0.3)');
        gradient.addColorStop(1, 'rgba(68, 200, 255, 0.0)');

        ctx.beginPath();
        ctx.moveTo(padding.left, padding.top + chartHeight);

        const points: [number, number][] = [];
        const maxPoints = 100;
        const startIdx = Math.max(0, data.length - maxPoints);
        const visibleData = data.slice(startIdx);

        visibleData.forEach((point, i) => {
          const x = padding.left + (chartWidth * i) / (visibleData.length - 1);
          const normalizedPower = point.power / displayMaxPower;
          const y = padding.top + chartHeight * (1 - normalizedPower);
          points.push([x, y]);
        });

        if (points.length > 2) {
          ctx.moveTo(points[0][0], padding.top + chartHeight);
          ctx.lineTo(points[0][0], points[0][1]);

          for (let i = 1; i < points.length; i++) {
            const xc = (points[i][0] + points[i - 1][0]) / 2;
            const yc = (points[i][1] + points[i - 1][1]) / 2;
            ctx.quadraticCurveTo(points[i - 1][0], points[i - 1][1], xc, yc);
          }

          ctx.lineTo(points[points.length - 1][0], points[points.length - 1][1]);
          ctx.lineTo(points[points.length - 1][0], padding.top + chartHeight);
          ctx.closePath();
          ctx.fillStyle = gradient;
          ctx.fill();

          ctx.beginPath();
          ctx.moveTo(points[0][0], points[0][1]);
          for (let i = 1; i < points.length; i++) {
            const xc = (points[i][0] + points[i - 1][0]) / 2;
            const yc = (points[i][1] + points[i - 1][1]) / 2;
            ctx.quadraticCurveTo(points[i - 1][0], points[i - 1][1], xc, yc);
          }
          ctx.lineTo(points[points.length - 1][0], points[points.length - 1][1]);

          ctx.strokeStyle = '#44c8ff';
          ctx.lineWidth = 2;
          ctx.stroke();

          const lastPoint = points[points.length - 1];
          ctx.beginPath();
          ctx.arc(lastPoint[0], lastPoint[1], 4, 0, Math.PI * 2);
          ctx.fillStyle = '#44c8ff';
          ctx.fill();
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [data, maxPower]);

  return (
    <canvas
      ref={canvasRef}
      width={300}
      height={140}
      style={{ width: '100%', height: '140px', borderRadius: '8px' }}
    />
  );
}

function TurbineInfoCard({
  state,
  onDelete,
}: {
  state: TurbineState;
  onDelete: () => void;
}) {
  const turbineIndex = state.index + 1;

  return (
    <div style={infoCardStyle}>
      <div style={infoCardHeaderStyle}>
        <h4 style={infoCardTitleStyle}>涡轮机 #{turbineIndex}</h4>
        <button onClick={onDelete} style={deleteButtonStyle}>
          删除
        </button>
      </div>

      <div style={infoRowStyle}>
        <span style={infoLabelStyle}>功率等级</span>
        <span style={infoValueStyle}>Level {state.turbine.powerLevel}</span>
      </div>

      <div style={infoRowStyle}>
        <span style={infoLabelStyle}>额定功率</span>
        <span style={infoValueStyle}>{state.turbine.ratedPower} MW</span>
      </div>

      <div style={infoRowStyle}>
        <span style={infoLabelStyle}>有效风速</span>
        <span style={infoValueStyle}>{state.effectiveWindSpeed.toFixed(1)} m/s</span>
      </div>

      <div style={infoBarContainerStyle}>
        <div style={infoBarLabelStyle}>
          <span>功率占比</span>
          <span style={infoBarValueStyle}>{state.powerPercentage.toFixed(1)}%</span>
        </div>
        <div style={infoBarBgStyle}>
          <div
            style={{
              ...infoBarFillStyle,
              width: `${state.powerPercentage}%`,
              background: 'linear-gradient(90deg, #44c8ff, #88ddff)',
            }}
          />
        </div>
      </div>

      <div style={infoBarContainerStyle}>
        <div style={infoBarLabelStyle}>
          <span>尾流影响</span>
          <span style={{ ...infoBarValueStyle, color: state.wakeInfluence > 20 ? '#ff6b6b' : '#6bff88' }}>
            {state.wakeInfluence.toFixed(1)}%
          </span>
        </div>
        <div style={infoBarBgStyle}>
          <div
            style={{
              ...infoBarFillStyle,
              width: `${state.wakeInfluence}%`,
              background: state.wakeInfluence > 20
                ? 'linear-gradient(90deg, #ff6b6b, #ff8888)'
                : 'linear-gradient(90deg, #6bff88, #88ffaa)',
            }}
          />
        </div>
      </div>

      <div style={infoRowStyle}>
        <span style={infoLabelStyle}>当前输出</span>
        <span style={{ ...infoValueStyle, color: '#44c8ff', fontWeight: 600 }}>
          {state.powerOutput.toFixed(2)} MW
        </span>
      </div>
    </div>
  );
}

const panelStyle: React.CSSProperties = {
  position: 'fixed',
  top: '16px',
  right: '16px',
  width: '360px',
  maxHeight: 'calc(100vh - 32px)',
  overflowY: 'auto',
  padding: '20px',
  background: 'rgba(30, 30, 50, 0.85)',
  backdropFilter: 'blur(12px)',
  borderRadius: '12px',
  border: '1px solid rgba(100, 150, 200, 0.2)',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
  zIndex: 1000,
};

const headerStyle: React.CSSProperties = {
  marginBottom: '20px',
  paddingBottom: '16px',
  borderBottom: '1px solid rgba(100, 150, 200, 0.2)',
};

const titleStyle: React.CSSProperties = {
  fontSize: '20px',
  fontWeight: 600,
  color: '#e0e8f0',
  margin: 0,
  fontFamily: "'Inter', sans-serif",
};

const subtitleStyle: React.CSSProperties = {
  fontSize: '11px',
  color: 'rgba(150, 180, 220, 0.6)',
  margin: '4px 0 0 0',
  letterSpacing: '0.5px',
};

const sectionStyle: React.CSSProperties = {
  marginBottom: '20px',
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: '13px',
  fontWeight: 600,
  color: 'rgba(150, 180, 220, 0.9)',
  margin: '0 0 12px 0',
  textTransform: 'uppercase',
  letterSpacing: '1px',
};

const controlGroupStyle: React.CSSProperties = {
  marginBottom: '16px',
};

const labelRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '8px',
};

const labelStyle: React.CSSProperties = {
  fontSize: '13px',
  color: 'rgba(200, 220, 240, 0.8)',
  fontFamily: "'Inter', sans-serif",
};

const valueStyle: React.CSSProperties = {
  fontSize: '13px',
  fontWeight: 600,
  color: '#44c8ff',
  fontFamily: "'JetBrains Mono', monospace",
};

const sliderStyle: React.CSSProperties = {
  width: '100%',
  height: '6px',
  borderRadius: '3px',
  background: 'rgba(60, 60, 90, 0.8)',
  outline: 'none',
  WebkitAppearance: 'none',
  cursor: 'pointer',
};

const tickMarksStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  fontSize: '10px',
  color: 'rgba(150, 180, 220, 0.5)',
  marginTop: '4px',
  fontFamily: "'JetBrains Mono', monospace",
};

const compassStyle: React.CSSProperties = {
  display: 'block',
};

const levelSelectorStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr 1fr',
  gap: '8px',
};

const levelButtonStyle: React.CSSProperties = {
  padding: '10px 6px',
  background: 'rgba(40, 40, 65, 0.8)',
  border: '1px solid rgba(100, 150, 200, 0.2)',
  borderRadius: '8px',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  color: 'rgba(200, 220, 240, 0.8)',
  fontFamily: "'Inter', sans-serif",
};

const levelButtonActiveStyle: React.CSSProperties = {
  background: 'rgba(68, 136, 255, 0.3)',
  borderColor: '#4488ff',
  color: '#fff',
  boxShadow: '0 0 16px rgba(68, 136, 255, 0.3)',
};

const levelButtonTopStyle: React.CSSProperties = {
  fontSize: '14px',
  fontWeight: 700,
};

const levelButtonBottomStyle: React.CSSProperties = {
  fontSize: '11px',
  color: '#44c8ff',
  fontFamily: "'JetBrains Mono', monospace",
  marginTop: '2px',
};

const levelButtonDiameterStyle: React.CSSProperties = {
  fontSize: '9px',
  color: 'rgba(150, 180, 220, 0.6)',
  marginTop: '2px',
};

const totalPowerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '16px',
  background: 'rgba(40, 40, 65, 0.6)',
  borderRadius: '8px',
  marginTop: '12px',
};

const totalPowerLabelStyle: React.CSSProperties = {
  fontSize: '13px',
  color: 'rgba(200, 220, 240, 0.8)',
};

const totalPowerValueStyle: React.CSSProperties = {
  fontSize: '28px',
  fontWeight: 700,
  color: '#44c8ff',
  fontFamily: "'JetBrains Mono', monospace",
};

const totalPowerUnitStyle: React.CSSProperties = {
  fontSize: '14px',
  color: 'rgba(150, 180, 220, 0.7)',
  fontWeight: 400,
};

const statsRowStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '8px',
  marginTop: '12px',
};

const statItemStyle: React.CSSProperties = {
  padding: '10px',
  background: 'rgba(40, 40, 65, 0.4)',
  borderRadius: '6px',
  textAlign: 'center',
};

const statLabelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '10px',
  color: 'rgba(150, 180, 220, 0.6)',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  marginBottom: '4px',
};

const statValueStyle: React.CSSProperties = {
  fontSize: '14px',
  fontWeight: 600,
  color: '#e0e8f0',
  fontFamily: "'JetBrains Mono', monospace",
};

const clearButtonStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px',
  background: 'rgba(255, 107, 107, 0.15)',
  border: '1px solid rgba(255, 107, 107, 0.3)',
  borderRadius: '8px',
  color: '#ff8888',
  fontSize: '13px',
  fontWeight: 500,
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  fontFamily: "'Inter', sans-serif",
};

const helpStyle: React.CSSProperties = {
  padding: '12px',
  background: 'rgba(40, 40, 65, 0.4)',
  borderRadius: '8px',
  marginTop: '16px',
};

const helpTextStyle: React.CSSProperties = {
  fontSize: '11px',
  color: 'rgba(150, 180, 220, 0.7)',
  margin: '4px 0',
  lineHeight: 1.5,
};

const infoCardStyle: React.CSSProperties = {
  padding: '16px',
  background: 'rgba(68, 136, 255, 0.1)',
  border: '1px solid rgba(68, 136, 255, 0.4)',
  borderRadius: '8px',
  marginBottom: '16px',
};

const infoCardHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '12px',
};

const infoCardTitleStyle: React.CSSProperties = {
  fontSize: '14px',
  fontWeight: 600,
  color: '#88ccff',
  margin: 0,
};

const deleteButtonStyle: React.CSSProperties = {
  padding: '4px 10px',
  background: 'rgba(255, 107, 107, 0.2)',
  border: '1px solid rgba(255, 107, 107, 0.4)',
  borderRadius: '4px',
  color: '#ff8888',
  fontSize: '11px',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
};

const infoRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '8px',
};

const infoLabelStyle: React.CSSProperties = {
  fontSize: '12px',
  color: 'rgba(200, 220, 240, 0.7)',
};

const infoValueStyle: React.CSSProperties = {
  fontSize: '12px',
  color: '#e0e8f0',
  fontFamily: "'JetBrains Mono', monospace",
};

const infoBarContainerStyle: React.CSSProperties = {
  marginBottom: '10px',
};

const infoBarLabelStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  fontSize: '11px',
  color: 'rgba(200, 220, 240, 0.7)',
  marginBottom: '4px',
};

const infoBarValueStyle: React.CSSProperties = {
  fontFamily: "'JetBrains Mono', monospace",
  fontWeight: 600,
};

const infoBarBgStyle: React.CSSProperties = {
  height: '6px',
  background: 'rgba(60, 60, 90, 0.8)',
  borderRadius: '3px',
  overflow: 'hidden',
};

const infoBarFillStyle: React.CSSProperties = {
  height: '100%',
  borderRadius: '3px',
  transition: 'width 0.3s ease',
};

const sliderGlobalStyle = document.createElement('style');
sliderGlobalStyle.textContent = `
  input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #4488ff;
    cursor: pointer;
    box-shadow: 0 0 8px rgba(68, 136, 255, 0.5);
    transition: all 0.2s ease;
  }
  input[type="range"]::-webkit-slider-thumb:hover {
    background: #66aaff;
    box-shadow: 0 0 12px rgba(68, 136, 255, 0.8);
  }
  input[type="range"]::-moz-range-thumb {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #4488ff;
    cursor: pointer;
    border: none;
    box-shadow: 0 0 8px rgba(68, 136, 255, 0.5);
  }
  .stats-panel {
    position: fixed !important;
    top: 16px !important;
    left: 16px !important;
    z-index: 2000 !important;
  }
  @media (max-width: 1024px) {
    .ui-panel {
      width: 300px !important;
      padding: 16px !important;
    }
  }
  @media (max-width: 768px) {
    .ui-panel {
      width: 280px !important;
      padding: 12px !important;
    }
  }
`;
document.head.appendChild(sliderGlobalStyle);
