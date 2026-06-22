import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useSimulationStore, type TorusPosition } from '../store/store';

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

type SampleRate = 100 | 50 | 30;

const UIPanel: React.FC = () => {
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);
  const [isLogExpanded, setIsLogExpanded] = useState(true);
  const [sampleRate, setSampleRate] = useState<SampleRate>(100);
  const [fps, setFps] = useState(60);
  const logContainerRef = useRef<HTMLDivElement>(null);
  const frameCountRef = useRef(0);
  const lastFpsCheckRef = useRef(performance.now());

  const { params, setParams, fusionRate, temperatureHistory, totalFusions, collisionLogs } =
    useSimulationStore();

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [collisionLogs, isLogExpanded]);

  useEffect(() => {
    let animationId: number;

    const monitorFps = () => {
      frameCountRef.current++;
      const now = performance.now();
      const elapsed = now - lastFpsCheckRef.current;

      if (elapsed >= 1000) {
        const currentFps = Math.round((frameCountRef.current * 1000) / elapsed);
        setFps(currentFps);
        frameCountRef.current = 0;
        lastFpsCheckRef.current = now;

        if (currentFps < 30 && sampleRate > 30) {
          setSampleRate(30);
        } else if (currentFps < 45 && currentFps >= 30 && sampleRate > 50) {
          setSampleRate(50);
        } else if (currentFps >= 45 && sampleRate < 100) {
          setSampleRate(100);
        }
      }

      animationId = requestAnimationFrame(monitorFps);
    };

    animationId = requestAnimationFrame(monitorFps);
    return () => cancelAnimationFrame(animationId);
  }, [sampleRate]);

  const formatScientific = (value: number): string => {
    if (value >= 1e6) {
      return `${(value / 1e6).toFixed(0)}e6`;
    }
    return value.toFixed(1);
  };

  const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp);
    const pad = (n: number, len: number = 2) => n.toString().padStart(len, '0');
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    const seconds = pad(date.getSeconds());
    const ms = pad(date.getMilliseconds(), 3);
    return `${hours}:${minutes}:${seconds}.${ms}`;
  };

  const formatTorusPosition = (pos: TorusPosition): string => {
    const thetaDeg = ((pos.theta * 180) / Math.PI).toFixed(0);
    return `R${pos.r.toFixed(2)} θ${thetaDeg}° Z${pos.z.toFixed(2)}`;
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
    const step = Math.ceil(100 / sampleRate);
    const data = temperatureHistory.slice(-100).filter((_, i) => i % step === 0);

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
  }, [temperatureHistory, sampleRate]);

  const logHeight = isLogExpanded ? '240px' : '60px';

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
          className="breathing-border overflow-hidden"
          style={{
            width: '320px',
          }}
        >
          <div className="relative z-10">
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
                  <span className="text-gray-400 text-xs uppercase tracking-wider">
                    等离子体平均温度
                    <span className="ml-2 text-gray-500">
                      ({sampleRate}帧 {fps >= 45 ? '✓' : fps >= 30 ? '○' : '↓'} {fps}fps)
                    </span>
                  </span>
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

            <div className="flex items-center justify-between px-3 py-1" style={{ backgroundColor: '#0A0E15', borderTop: '1px solid #1a2332' }}>
              <span className="text-gray-500 text-xs font-mono">碰撞日志 ({collisionLogs.length}/20)</span>
              <button
                onClick={() => setIsLogExpanded(!isLogExpanded)}
                className="text-gray-400 hover:text-white transition-colors p-1"
                title={isLogExpanded ? '收起' : '展开'}
              >
                {isLogExpanded ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
              </button>
            </div>

            <div
              className="log-scrollbar overflow-y-auto transition-all duration-300 ease-out"
              ref={logContainerRef}
              style={{
                height: logHeight,
                backgroundColor: '#0A0E15',
              }}
            >
              {collisionLogs.length === 0 ? (
                <div className="font-consolas text-[12px] px-3 py-2 text-gray-600 italic">
                  等待聚变碰撞事件...
                </div>
              ) : (
                collisionLogs.map((log) => (
                  <div
                    key={log.id}
                    className="font-consolas text-[12px] px-3 py-0.5 leading-5"
                    style={{ color: '#88CCFF' }}
                  >
                    碰撞 [{formatTimestamp(log.timestamp)}] {formatTorusPosition(log.torusPosition)}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UIPanel;
