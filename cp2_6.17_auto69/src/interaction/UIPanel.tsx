import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useSimulationStore } from '../store/store';

interface SliderConfig {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  unit: string;
  isTemperature?: boolean;
  onChange: (value: number) => void;
  formatValue?: (value: number) => string;
}

const UIPanel: React.FC = () => {
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);
  const logContainerRef = useRef<HTMLDivElement>(null);

  const { params, setParams, fusionRate, temperatureHistory, totalFusions, collisionLogs } =
    useSimulationStore();

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [collisionLogs]);

  const formatScientific = (value: number): string => {
    if (value >= 1e6) {
      return `${(value / 1e6).toFixed(0)}e6`;
    }
    return value.toFixed(1);
  };

  const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp);
    const ms = date.getMilliseconds().toString().padStart(3, '0');
    return `${date.toLocaleTimeString('zh-CN', { hour12: false })}.${ms}`;
  };

  const formatPosition = (pos: { x: number; y: number; z: number }): string => {
    return `(${pos.x.toFixed(1)}, ${pos.y.toFixed(1)}, ${pos.z.toFixed(1)})`;
  };

  const sliders: SliderConfig[] = [
    {
      label: '温度',
      min: 1e6,
      max: 1.5e8,
      step: 1e6,
      value: params.temperature,
      unit: 'K',
      isTemperature: true,
      onChange: (v) => setParams({ temperature: v }),
      formatValue: formatScientific,
    },
    {
      label: '磁场强度',
      min: 1,
      max: 10,
      step: 0.1,
      value: params.magneticField,
      unit: 'T',
      onChange: (v) => setParams({ magneticField: v }),
    },
    {
      label: '粒子数量',
      min: 50,
      max: 500,
      step: 10,
      value: params.particleCount,
      unit: '',
      onChange: (v) => setParams({ particleCount: v }),
    },
    {
      label: '聚变概率',
      min: 1,
      max: 100,
      step: 1,
      value: params.fusionProbability,
      unit: '%',
      onChange: (v) => setParams({ fusionProbability: v }),
    },
  ];

  const renderSlider = (config: SliderConfig) => {
    const displayValue = config.formatValue ? config.formatValue(config.value) : config.value.toString();
    const progressPercent = ((config.value - config.min) / (config.max - config.min)) * 100;

    return (
      <div key={config.label} className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-gray-300 text-sm font-medium">{config.label}</span>
          <span className="text-cyan text-sm font-mono">
            {displayValue} {config.unit}
          </span>
        </div>
        <div className="relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1.5 rounded-full overflow-hidden w-full">
            <div
              className={`h-full ${config.isTemperature ? 'slider-temperature' : 'slider-default'}`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <input
            type="range"
            min={config.min}
            max={config.max}
            step={config.step}
            value={config.value}
            onChange={(e) => config.onChange(Number(e.target.value))}
            className={`relative z-10 w-full h-1.5 rounded-full appearance-none cursor-pointer bg-transparent ${
              config.isTemperature ? 'slider-temperature' : 'slider-default'
            }`}
            style={{ background: 'transparent' }}
          />
        </div>
      </div>
    );
  };

  const chartData = useMemo(() => {
    const data = temperatureHistory.slice(-100);
    if (data.length === 0) return { points: '', area: '', maxTemp: 0, minTemp: 0, avgTemp: 0 };

    const maxTemp = Math.max(...data);
    const minTemp = Math.min(...data);
    const avgTemp = data.reduce((a, b) => a + b, 0) / data.length;
    const range = maxTemp - minTemp || 1;

    const width = 280;
    const height = 60;
    const padding = 2;

    const points = data
      .map((temp, i) => {
        const x = padding + (i / (data.length - 1 || 1)) * (width - 2 * padding);
        const y = height - padding - ((temp - minTemp) / range) * (height - 2 * padding);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');

    const areaPoints = `${padding},${height - padding} ${points} ${width - padding},${height - padding}`;

    return { points, area: areaPoints, maxTemp, minTemp, avgTemp };
  }, [temperatureHistory]);

  return (
    <div className="fixed inset-0 pointer-events-none">
      <div
        className="absolute top-4 right-4 pointer-events-auto transition-transform duration-300 ease-out"
        style={{
          transform: isPanelCollapsed ? 'translateX(288px)' : 'translateX(0)',
        }}
      >
        <div
          className="relative rounded-xl overflow-hidden"
          style={{
            width: '320px',
            backgroundColor: '#1A1A2E',
            opacity: 0.9,
            backdropFilter: 'blur(10px)',
          }}
        >
          <button
            onClick={() => setIsPanelCollapsed(!isPanelCollapsed)}
            className="absolute -left-10 top-4 w-8 h-16 bg-panel-bg rounded-l-lg flex items-center justify-center text-gray-400 hover:text-white transition-colors duration-200 shadow-lg"
            style={{ opacity: 0.95 }}
          >
            <svg
              className={`w-5 h-5 transition-transform duration-300 ${isPanelCollapsed ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <div className="p-6 pt-5">
            <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <span className="w-2 h-2 bg-cyan rounded-full animate-pulse" />
              参数控制
            </h2>
            {sliders.map(renderSlider)}
          </div>
        </div>
      </div>

      <div className="absolute bottom-4 left-4 pointer-events-auto">
        <div
          className="rounded-lg border-2 overflow-hidden animate-border-pulse"
          style={{
            width: '320px',
            height: '260px',
            backgroundColor: '#0D1117',
          }}
        >
          <div className="p-4" style={{ height: '200px' }}>
            <div className="mb-3">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-400 text-xs uppercase tracking-wider">聚变反应速率</span>
                <span className="text-cyan text-xs font-mono">{fusionRate.toFixed(2)} /s</span>
              </div>
              <div className="w-[280px] h-3 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-100"
                  style={{
                    width: `${Math.min(fusionRate * 10, 100)}%`,
                    background: 'linear-gradient(to right, #00E5FF, #FF3366)',
                  }}
                />
              </div>
            </div>

            <div className="mb-3">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-400 text-xs uppercase tracking-wider">等离子体平均温度</span>
                <span className="text-green text-xs font-mono">{formatScientific(chartData.avgTemp)} K</span>
              </div>
              <svg width="280" height="60" className="block">
                <defs>
                  <linearGradient id="tempGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#00FF88" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#00FF88" stopOpacity="0" />
                  </linearGradient>
                </defs>
                {chartData.area && (
                  <polygon points={chartData.area} fill="url(#tempGradient)" opacity="0.15" />
                )}
                {chartData.points && (
                  <polyline
                    points={chartData.points}
                    fill="none"
                    stroke="#00FF88"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}
              </svg>
            </div>

            <div>
              <span className="text-gray-400 text-xs uppercase tracking-wider">累计聚变次数</span>
              <div className="font-consolas text-[20px] font-bold text-white">
                {totalFusions.toLocaleString()}
              </div>
            </div>
          </div>

          <div
            className="log-scrollbar overflow-y-auto"
            ref={logContainerRef}
            style={{
              height: '60px',
              backgroundColor: '#0A0E15',
            }}
          >
            {collisionLogs.map((log) => (
              <div
                key={log.id}
                className="font-consolas text-[12px] px-3 py-0.5 leading-5 truncate"
                style={{ color: '#88CCFF' }}
              >
                碰撞 [{formatTimestamp(log.timestamp)}] {formatPosition(log.position)}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UIPanel;
