import { useState } from 'react';
import {
  Clock,
  RefreshCw,
  Play,
  Pause,
  GitCompare,
  Menu,
  X,
  Gauge,
  XCircle
} from 'lucide-react';

export type TimeRange = '1h' | '24h' | '7d';
export type AnimationSpeed = 1 | 2 | 4 | 8;

interface ControlPanelProps {
  timeRange: TimeRange;
  onTimeRangeChange: (range: TimeRange) => void;
  onRefresh: () => void;
  isAnimating: boolean;
  onToggleAnimation: () => void;
  animationSpeed: AnimationSpeed;
  onAnimationSpeedChange: (speed: AnimationSpeed) => void;
  autoRefresh: boolean;
  onToggleAutoRefresh: () => void;
  compareMode: boolean;
  onToggleCompareMode: () => void;
  isLoading: boolean;
}

const timeRangeOptions: { value: TimeRange; label: string }[] = [
  { value: '1h', label: '近1小时' },
  { value: '24h', label: '近24小时' },
  { value: '7d', label: '近7天' }
];

const speedOptions: AnimationSpeed[] = [1, 2, 4, 8];

function ControlPanelContent({
  timeRange,
  onTimeRangeChange,
  onRefresh,
  isAnimating,
  onToggleAnimation,
  animationSpeed,
  onAnimationSpeedChange,
  autoRefresh,
  onToggleAutoRefresh,
  compareMode,
  onToggleCompareMode,
  isLoading
}: ControlPanelProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-1 bg-[#0F172A] rounded-lg p-1">
        <Clock className="w-4 h-4 text-[#94A3B8] ml-2" />
        {timeRangeOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => onTimeRangeChange(option.value)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
              timeRange === option.value
                ? 'bg-[#3B82F6] text-white'
                : 'text-[#94A3B8] hover:text-white hover:bg-[#334155]'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      <button
        onClick={onRefresh}
        disabled={isLoading}
        className="btn-secondary"
      >
        <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        <span className="hidden sm:inline">刷新</span>
      </button>

      <div className="flex items-center gap-1 bg-[#0F172A] rounded-lg p-1">
        <button
          onClick={onToggleAnimation}
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 flex items-center gap-1.5 ${
            isAnimating
              ? 'bg-[#3B82F6] text-white'
              : 'text-[#94A3B8] hover:text-white hover:bg-[#334155]'
          }`}
        >
          {isAnimating ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          <span className="hidden sm:inline">{isAnimating ? '暂停' : '播放'}</span>
        </button>
        {isAnimating && (
          <>
            <div className="w-px h-5 bg-[#334155] mx-1" />
            <div className="flex items-center gap-1">
              <Gauge className="w-3.5 h-3.5 text-[#94A3B8]" />
              {speedOptions.map((speed) => (
                <button
                  key={speed}
                  onClick={() => onAnimationSpeedChange(speed)}
                  className={`px-2 py-1 rounded text-xs font-medium transition-all duration-200 ${
                    animationSpeed === speed
                      ? 'bg-[#1E40AF] text-white'
                      : 'text-[#94A3B8] hover:text-white hover:bg-[#334155]'
                  }`}
                >
                  {speed}x
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      <button
        onClick={onToggleAutoRefresh}
        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-1.5 ${
          autoRefresh
            ? 'bg-[#10B981] text-white'
            : 'bg-[#334155] text-[#94A3B8] hover:text-white hover:bg-[#475569]'
        }`}
      >
        <RefreshCw className={`w-4 h-4 ${autoRefresh ? 'animate-spin' : ''}`} style={{ animationDuration: '3s' }} />
        <span className="hidden sm:inline">自动</span>
      </button>

      <button
        onClick={onToggleCompareMode}
        className={`btn-primary ${compareMode ? 'ring-2 ring-[#60A5FA]' : ''}`}
      >
        <GitCompare className="w-4 h-4" />
        <span className="hidden sm:inline">方案对比</span>
      </button>
    </div>
  );
}

export default function ControlPanel(props: ControlPanelProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      <div className="hidden md:flex items-center gap-3 mr-6">
        <ControlPanelContent {...props} />
      </div>

      <button
        onClick={() => setDrawerOpen(true)}
        className="md:hidden mr-4 p-2 rounded-lg bg-[#334155] text-white hover:bg-[#475569] transition-colors"
      >
        <Menu className="w-5 h-5" />
      </button>

      {drawerOpen && (
        <>
          <div className="drawer-overlay" onClick={() => setDrawerOpen(false)} />
          <div className="drawer-panel">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-white">控制面板</h3>
              <button
                onClick={() => setDrawerOpen(false)}
                className="p-2 rounded-lg hover:bg-[#334155] text-[#94A3B8] hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex flex-col gap-4">
              <ControlPanelContent {...props} />
            </div>
          </div>
        </>
      )}
    </>
  );
}
