import React, { useState, useEffect } from 'react';
import {
  useStatistics,
  useGreenDuration,
  useSimulationActions,
  useGridConfig,
  useLodEnabled
} from '../store/useSimulationStore';

interface AnimatedValueProps {
  value: number;
  format?: (v: number) => string;
}

const AnimatedValue: React.FC<AnimatedValueProps> = ({ value, format }) => {
  const [displayValue, setDisplayValue] = useState(value);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (displayValue !== value) {
      setIsAnimating(true);
      setDisplayValue(value);
      const timer = setTimeout(() => setIsAnimating(false), 300);
      return () => clearTimeout(timer);
    }
  }, [value, displayValue]);

  const formatted = format ? format(displayValue) : displayValue.toFixed(1);

  return (
    <span
      style={{
        display: 'inline-block',
        transform: isAnimating ? 'scale(1.1)' : 'scale(1)',
        transition: 'transform 0.3s ease-in-out',
        fontFamily: 'Consolas, monospace',
        fontSize: '14px',
        color: '#00D4AA'
      }}
    >
      {formatted}
    </span>
  );
};

export const ControlPanel: React.FC = () => {
  const statistics = useStatistics();
  const greenDuration = useGreenDuration();
  const gridConfig = useGridConfig();
  const lodEnabled = useLodEnabled();
  const { setGreenDuration, regenerateGrid } = useSimulationActions();

  const handleGreenDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    setGreenDuration(value);
  };

  const panelStyle: React.CSSProperties = {
    position: 'fixed',
    top: '20px',
    right: '20px',
    width: '280px',
    minWidth: '200px',
    backgroundColor: 'rgba(30, 30, 46, 0.9)',
    borderRadius: '10px',
    padding: '20px',
    color: '#FFFFFF',
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
    zIndex: 1000,
    backdropFilter: 'blur(10px)'
  };

  const sectionStyle: React.CSSProperties = {
    marginBottom: '24px'
  };

  const sectionTitleStyle: React.CSSProperties = {
    fontSize: '14px',
    fontWeight: 600,
    color: '#4A90D9',
    marginBottom: '12px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    borderBottom: '1px solid #2A2A4A',
    paddingBottom: '8px'
  };

  const statRowStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px',
    fontSize: '13px'
  };

  const statLabelStyle: React.CSSProperties = {
    color: '#8888AA'
  };

  const sliderContainerStyle: React.CSSProperties = {
    marginTop: '8px'
  };

  const sliderStyle: React.CSSProperties = {
    width: '100%',
    height: '6px',
    backgroundColor: '#3D3D5C',
    borderRadius: '3px',
    outline: 'none',
    WebkitAppearance: 'none',
    appearance: 'none',
    cursor: 'pointer'
  };

  const sliderValueStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: '8px',
    fontSize: '12px',
    color: '#8888AA'
  };

  const buttonStyle: React.CSSProperties = {
    width: '120px',
    height: '40px',
    backgroundColor: '#4A90D9',
    color: '#FFFFFF',
    fontSize: '16px',
    fontWeight: 500,
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease, transform 0.2s ease',
    fontFamily: 'inherit'
  };

  const buttonHoverStyle: React.CSSProperties = {
    backgroundColor: '#357ABD'
  };

  const gridInfoStyle: React.CSSProperties = {
    fontSize: '12px',
    color: '#8888AA',
    marginTop: '8px'
  };

  const lodIndicatorStyle: React.CSSProperties = {
    marginTop: '12px',
    padding: '8px 12px',
    backgroundColor: lodEnabled ? 'rgba(255, 136, 68, 0.2)' : 'rgba(0, 212, 170, 0.1)',
    borderRadius: '4px',
    fontSize: '12px',
    color: lodEnabled ? '#FF8844' : '#00D4AA',
    textAlign: 'center'
  };

  const [isButtonHovered, setIsButtonHovered] = useState(false);

  return (
    <div style={panelStyle}>
      <div style={sectionStyle}>
        <h2 style={{ ...sectionTitleStyle, fontSize: '16px', color: '#00D4AA' }}>
          CityFlow 3D
        </h2>
        <p style={{ fontSize: '11px', color: '#666688', marginTop: '-4px' }}>
          交通流模拟器
        </p>
      </div>

      <div style={sectionStyle}>
        <h3 style={sectionTitleStyle}>实时数据</h3>
        <div style={statRowStyle}>
          <span style={statLabelStyle}>车辆总数</span>
          <AnimatedValue
            value={statistics.totalVehicles}
            format={(v) => v.toFixed(0)}
          />
        </div>
        <div style={statRowStyle}>
          <span style={statLabelStyle}>平均速度</span>
          <AnimatedValue
            value={statistics.averageSpeed}
            format={(v) => `${v.toFixed(1)} km/h`}
          />
        </div>
        <div style={statRowStyle}>
          <span style={statLabelStyle}>拥堵指数</span>
          <AnimatedValue
            value={statistics.congestionIndex}
            format={(v) => `${(v * 100).toFixed(0)}%`}
          />
        </div>
        <div style={statRowStyle}>
          <span style={statLabelStyle}>平均等待时间</span>
          <AnimatedValue
            value={statistics.averageWaitingTime}
            format={(v) => `${v.toFixed(1)} s`}
          />
        </div>
      </div>

      <div style={sectionStyle}>
        <h3 style={sectionTitleStyle}>信号灯控制</h3>
        <div style={statRowStyle}>
          <span style={statLabelStyle}>绿灯时长</span>
          <span style={{ fontFamily: 'Consolas, monospace', color: '#00D4AA' }}>
            {greenDuration}s
          </span>
        </div>
        <div style={sliderContainerStyle}>
          <input
            type="range"
            min="15"
            max="60"
            step="5"
            value={greenDuration}
            onChange={handleGreenDurationChange}
            style={sliderStyle}
            className="custom-slider"
          />
          <div style={sliderValueStyle}>
            <span>15s</span>
            <span>60s</span>
          </div>
        </div>
      </div>

      <div style={sectionStyle}>
        <h3 style={sectionTitleStyle}>网格配置</h3>
        <div style={gridInfoStyle}>
          当前网格: {gridConfig.sizeX} × {gridConfig.sizeZ} 路口
        </div>
        <div style={{ marginTop: '16px', textAlign: 'center' }}>
          <button
            style={{
              ...buttonStyle,
              ...(isButtonHovered ? buttonHoverStyle : {})
            }}
            onClick={regenerateGrid}
            onMouseEnter={() => setIsButtonHovered(true)}
            onMouseLeave={() => setIsButtonHovered(false)}
          >
            重新生成
          </button>
        </div>
        {lodEnabled && (
          <div style={lodIndicatorStyle}>
            LOD 模式已启用 (车辆 &gt; 200)
          </div>
        )}
      </div>

      <div style={{ ...sectionStyle, marginBottom: 0 }}>
        <h3 style={sectionTitleStyle}>操作提示</h3>
        <div style={{ fontSize: '11px', color: '#666688', lineHeight: '1.6' }}>
          <div>• 左键拖拽: 旋转视角</div>
          <div>• 右键拖拽: 平移视角</div>
          <div>• 滚轮: 缩放</div>
          <div>• 点击车辆: 跟随模式</div>
          <div>• Esc: 退出跟随</div>
        </div>
      </div>

      <style>{`
        .custom-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #4A90D9;
          cursor: pointer;
          transition: background-color 0.2s ease, transform 0.2s ease;
        }
        .custom-slider::-webkit-slider-thumb:hover {
          background: #357ABD;
          transform: scale(1.1);
        }
        .custom-slider::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #4A90D9;
          cursor: pointer;
          border: none;
          transition: background-color 0.2s ease, transform 0.2s ease;
        }
        .custom-slider::-moz-range-thumb:hover {
          background: #357ABD;
          transform: scale(1.1);
        }
        @media (max-width: 1366px) {
          div[style*="position: fixed"] {
            width: 240px !important;
          }
        }
        @media (max-width: 1024px) {
          div[style*="position: fixed"] {
            width: 200px !important;
            padding: 15px !important;
          }
        }
      `}</style>
    </div>
  );
};
