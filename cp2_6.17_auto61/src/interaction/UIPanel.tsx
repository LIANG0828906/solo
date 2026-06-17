import { useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Maximize, Minimize, RotateCcw } from 'lucide-react';
import { useFusionStore } from '@/store/store';

function formatTemperature(temp: number): string {
  if (temp >= 1e8) return (temp / 1e8).toFixed(1) + '亿 K';
  if (temp >= 1e6) return (temp / 1e6).toFixed(1) + 'M K';
  return temp.toFixed(0) + ' K';
}

function ParameterSlider({
  label,
  value,
  min,
  max,
  step,
  unit,
  gradient,
  onChange,
  formatValue,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  gradient?: string;
  onChange: (value: number) => void;
  formatValue?: (v: number) => string;
}) {
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className="mb-5">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm text-[#B0B0B0]">{label}</span>
        <span className="text-sm font-mono text-[#00E5FF]">
          {formatValue ? formatValue(value) : value}
          {unit}
        </span>
      </div>
      <div className="relative h-2 rounded-full bg-[#1a1a2e] overflow-hidden">
        <div
          className="absolute left-0 top-0 h-full rounded-full transition-all duration-100"
          style={{
            width: `${percentage}%`,
            background: gradient || 'linear-gradient(90deg, #00E5FF, #FF3366)',
          }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
      </div>
    </div>
  );
}

function ReactionRateBar({ rate }: { rate: number }) {
  const maxRate = 100;
  const percentage = Math.min(100, (rate / maxRate) * 100);

  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs text-[#B0B0B0]">聚变反应速率</span>
        <span className="text-xs font-mono text-white">{rate.toFixed(1)} 反应/秒</span>
      </div>
      <div className="relative h-3 rounded-full bg-[#0A0A1A] overflow-hidden">
        <div
          className="absolute left-0 top-0 h-full rounded-full transition-all duration-150"
          style={{
            width: `${percentage}%`,
            background: 'linear-gradient(90deg, #00E5FF, #FF3366)',
          }}
        />
      </div>
    </div>
  );
}

function TemperatureChart({ history, current }: { history: number[]; current: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || history.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const padding = 2;

    ctx.clearRect(0, 0, width, height);

    const minTemp = Math.min(...history) * 0.95;
    const maxTemp = Math.max(...history) * 1.05;
    const tempRange = maxTemp - minTemp || 1;

    ctx.beginPath();
    ctx.strokeStyle = '#00FF88';
    ctx.lineWidth = 2;

    history.forEach((temp, i) => {
      const x = padding + (i / (history.length - 1)) * (width - padding * 2);
      const y = height - padding - ((temp - minTemp) / tempRange) * (height - padding * 2);
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();
  }, [history]);

  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs text-[#B0B0B0]">平均温度</span>
        <span className="text-xs font-mono text-white">
          {formatTemperature(current)}
        </span>
      </div>
      <canvas
        ref={canvasRef}
        width={280}
        height={40}
        className="w-full rounded bg-[#0A0A1A]"
      />
    </div>
  );
}

function TotalFusions({ count }: { count: number }) {
  return (
    <div>
      <span className="text-xs text-[#B0B0B0]">累计聚变次数</span>
      <div className="font-mono text-[20px] font-bold text-white mt-1">
        {count.toLocaleString()}
      </div>
    </div>
  );
}

export function ControlPanel() {
  const params = useFusionStore((state) => state.params);
  const setParams = useFusionStore((state) => state.setParams);
  const isPanelOpen = useFusionStore((state) => state.isPanelOpen);
  const togglePanel = useFusionStore((state) => state.togglePanel);

  return (
    <div
      className={`fixed top-20 right-0 h-[calc(100vh-80px)] transition-all duration-300 ease-out z-20`}
      style={{
        width: isPanelOpen ? '320px' : '40px',
        transform: isPanelOpen ? 'translateX(0)' : 'translateX(280px)',
      }}
    >
      <button
        onClick={togglePanel}
        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full w-10 h-16 bg-[#1A1A2E] bg-opacity-90 rounded-l-xl flex items-center justify-center hover:bg-opacity-100 transition-all border-r border-[#00E5FF] border-opacity-30"
        title={isPanelOpen ? '收起面板' : '展开面板'}
      >
        {isPanelOpen ? (
          <ChevronRight className="w-5 h-5 text-[#00E5FF]" />
        ) : (
          <ChevronLeft className="w-5 h-5 text-[#00E5FF]" />
        )}
      </button>

      <div className="w-full h-full bg-[#1A1A2E] bg-opacity-90 backdrop-blur-sm rounded-l-2xl p-6 overflow-y-auto border-l border-t border-b border-[#00E5FF] border-opacity-20">
        <h2 className="text-lg font-semibold text-white mb-6 pb-3 border-b border-[#00E5FF] border-opacity-20">
          模拟参数控制
        </h2>

        <ParameterSlider
          label="等离子体温度"
          value={params.temperature}
          min={1e6}
          max={1.5e8}
          step={1e6}
          unit=""
          gradient="linear-gradient(90deg, #1E90FF, #FF3366)"
          formatValue={(v) => formatTemperature(v)}
          onChange={(v) => setParams({ temperature: v })}
        />

        <ParameterSlider
          label="磁场强度"
          value={params.magneticField}
          min={1}
          max={10}
          step={0.1}
          unit=" T"
          gradient="linear-gradient(90deg, #00E5FF, #00FF88)"
          formatValue={(v) => v.toFixed(1)}
          onChange={(v) => setParams({ magneticField: v })}
        />

        <ParameterSlider
          label="粒子数量"
          value={params.particleCount}
          min={50}
          max={500}
          step={10}
          unit=""
          gradient="linear-gradient(90deg, #FFD700, #FF6600)"
          onChange={(v) => setParams({ particleCount: v })}
        />

        <ParameterSlider
          label="聚变反应概率"
          value={params.reactionProbability}
          min={1}
          max={100}
          step={1}
          unit="%"
          gradient="linear-gradient(90deg, #9333EA, #FF3366)"
          onChange={(v) => setParams({ reactionProbability: v })}
        />

        <div className="mt-6 p-4 bg-[#0D1117] rounded-xl border border-[#00E5FF] border-opacity-20">
          <h3 className="text-sm font-medium text-[#00E5FF] mb-2">物理提示</h3>
          <p className="text-xs text-[#B0B0B0] leading-relaxed">
            提高温度和粒子密度会增加聚变反应速率。强磁场可以更好地约束等离子体，减少能量损失。
          </p>
        </div>
      </div>
    </div>
  );
}

export function DiagnosticsPanel() {
  const diagnostics = useFusionStore((state) => state.diagnostics);

  return (
    <div
      className="fixed left-4 bottom-4 w-[320px] h-[200px] bg-[#0D1117] bg-opacity-95 rounded-xl border-2 border-[#00E5FF] p-4 z-10 backdrop-blur-sm"
    >
      <h3 className="text-sm font-semibold text-[#00E5FF] mb-3 flex items-center gap-2">
        <span className="w-2 h-2 bg-[#00FF88] rounded-full animate-pulse" />
        实时诊断数据
      </h3>

      <ReactionRateBar rate={diagnostics.reactionRate} />
      <TemperatureChart
        history={diagnostics.temperatureHistory}
        current={diagnostics.averageTemperature}
      />
      <TotalFusions count={diagnostics.totalFusions} />
    </div>
  );
}

export function NavigationBar() {
  const resetSimulation = useFusionStore((state) => state.resetSimulation);
  const toggleFullscreen = useFusionStore((state) => state.toggleFullscreen);
  const isFullscreen = useFusionStore((state) => state.isFullscreen);

  return (
    <nav className="fixed top-0 left-0 right-0 h-[60px] bg-[#0A0A1A] bg-opacity-85 backdrop-blur-md z-30 border-b border-[#00E5FF] border-opacity-50 flex items-center justify-between px-6">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#00E5FF] to-[#FF3366] flex items-center justify-center">
          <span className="text-white font-bold text-sm">⚛</span>
        </div>
        <h1 className="text-xl font-bold bg-gradient-to-r from-[#00E5FF] to-[#00FF88] bg-clip-text text-transparent">
          FusionSim
        </h1>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={resetSimulation}
          className="flex items-center gap-2 px-4 h-9 rounded-lg bg-[#FF3366] text-white text-sm font-medium hover:bg-[#FF6699] transition-all duration-200"
        >
          <RotateCcw className="w-4 h-4" />
          重启模拟
        </button>

        <button
          onClick={toggleFullscreen}
          className="flex items-center justify-center w-9 h-9 rounded-lg bg-[#1A1A2E] text-[#B0B0B0] hover:text-white hover:bg-[#2A2A4E] transition-all duration-200"
          title={isFullscreen ? '退出全屏' : '全屏模式'}
        >
          {isFullscreen ? (
            <Minimize className="w-4 h-4" />
          ) : (
            <Maximize className="w-4 h-4" />
          )}
        </button>
      </div>
    </nav>
  );
}

export function StarBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      drawStars();
    };

    const drawStars = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const starCount = Math.floor((canvas.width * canvas.height) / 3000);

      for (let i = 0; i < starCount; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const size = 1 + Math.random() * 1;
        const opacity = 0.2 + Math.random() * 0.4;

        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
        ctx.fill();
      }
    };

    resize();
    window.addEventListener('resize', resize);

    return () => window.removeEventListener('resize', resize);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-0"
    />
  );
}
