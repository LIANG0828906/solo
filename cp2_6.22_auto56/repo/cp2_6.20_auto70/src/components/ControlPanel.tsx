import { useLayoutStore } from '@/store/useLayoutStore';
import { PieceShape, PIECE_COLORS } from '@/types';
import {
  Square,
  Circle,
  Triangle,
  Hexagon,
  Pentagon,
  Wand2,
  Scissors,
  Save,
  Trash2,
  Check,
  RotateCw,
  Maximize2,
  LayoutGrid,
} from 'lucide-react';

const SHAPE_ITEMS: Array<{ shape: PieceShape; icon: React.ReactNode; label: string }> = [
  { shape: 'rectangle', icon: <Square size={20} />, label: '矩形' },
  { shape: 'circle', icon: <Circle size={20} />, label: '圆形' },
  { shape: 'triangle', icon: <Triangle size={20} />, label: '三角形' },
  { shape: 'hexagon', icon: <Hexagon size={20} />, label: '六边形' },
  { shape: 'pentagon', icon: <Pentagon size={20} />, label: '五边形' },
  { shape: 'irregular', icon: <Wand2 size={20} />, label: '不规则' },
];

export function ControlPanel() {
  const addPiece = useLayoutStore((s) => s.addPiece);
  const pendingParams = useLayoutStore((s) => s.pendingParams);
  const paramsDirty = useLayoutStore((s) => s.paramsDirty);
  const setParams = useLayoutStore((s) => s.setParams);
  const applyParams = useLayoutStore((s) => s.applyParams);
  const toggleCuttingPath = useLayoutStore((s) => s.toggleCuttingPath);
  const showCuttingPath = useLayoutStore((s) => s.showCuttingPath);
  const runOptimization = useLayoutStore((s) => s.runOptimization);
  const saveScheme = useLayoutStore((s) => s.saveScheme);
  const clearAll = useLayoutStore((s) => s.clearAll);
  const optimizationProgress = useLayoutStore((s) => s.optimizationProgress);
  const pieces = useLayoutStore((s) => s.pieces);
  const selectedPieceId = useLayoutStore((s) => s.selectedPieceId);
  const removePiece = useLayoutStore((s) => s.removePiece);
  const schemes = useLayoutStore((s) => s.schemes);

  const isOptimizing = optimizationProgress.isRunning;

  return (
    <div className="glass-panel rounded-xl p-5 w-[280px] flex flex-col gap-4 h-full overflow-y-auto custom-scrollbar animate-slide-in">
      <h2 className="font-display text-sm font-semibold text-white/90 tracking-wide uppercase">
        切割件选择
      </h2>

      <div className="grid grid-cols-3 gap-2">
        {SHAPE_ITEMS.map(({ shape, icon, label }) => (
          <button
            key={shape}
            onClick={() => addPiece(shape)}
            disabled={pieces.length >= 30 || isOptimizing}
            className="flex flex-col items-center justify-center gap-1 p-2 rounded-lg bg-panel-card hover:bg-panel-hover transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed group"
            style={{ transitionTimingFunction: 'cubic-bezier(0.25, 0.1, 0.25, 1)' }}
          >
            <span
              className="text-white/70 group-hover:text-white transition-colors duration-200"
              style={{ color: PIECE_COLORS[shape] }}
            >
              {icon}
            </span>
            <span className="text-[10px] text-white/50 group-hover:text-white/70 transition-colors duration-200">
              {label}
            </span>
          </button>
        ))}
      </div>

      {selectedPieceId && (
        <button
          onClick={() => removePiece(selectedPieceId)}
          className="flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs text-danger-red/80 hover:text-danger-red bg-danger-red/10 hover:bg-danger-red/20 transition-all duration-300"
        >
          <Trash2 size={12} />
          删除选中
        </button>
      )}

      <div className="h-px bg-white/10" />

      <h2 className="font-display text-sm font-semibold text-white/90 tracking-wide uppercase">
        参数调整
      </h2>

      <div className="flex flex-col gap-3">
        <ParamSlider
          label="缩放比"
          value={pendingParams.scaleRatio}
          min={0.3}
          max={2}
          step={0.1}
          displayValue={pendingParams.scaleRatio.toFixed(1)}
          onChange={(v) => setParams({ scaleRatio: v })}
          icon={<Maximize2 size={12} />}
        />
        <ParamSlider
          label="旋转角度"
          value={pendingParams.rotationAngle}
          min={0}
          max={360}
          step={5}
          displayValue={`${Math.round(pendingParams.rotationAngle)}°`}
          onChange={(v) => setParams({ rotationAngle: v })}
          icon={<RotateCw size={12} />}
        />
        <ParamSlider
          label="布局密度"
          value={pendingParams.layoutDensity}
          min={0.1}
          max={1}
          step={0.05}
          displayValue={pendingParams.layoutDensity.toFixed(2)}
          onChange={(v) => setParams({ layoutDensity: v })}
          icon={<LayoutGrid size={12} />}
        />
      </div>

      <button
        onClick={applyParams}
        disabled={!paramsDirty || isOptimizing}
        className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-medium transition-all duration-300 ${
          paramsDirty
            ? 'bg-accent-green/20 text-accent-green hover:bg-accent-green/30'
            : 'bg-white/5 text-white/30 cursor-not-allowed'
        }`}
        style={{ transitionTimingFunction: 'cubic-bezier(0.25, 0.1, 0.25, 1)' }}
      >
        <Check size={14} />
        应用布局
      </button>

      <div className="h-px bg-white/10" />

      <h2 className="font-display text-sm font-semibold text-white/90 tracking-wide uppercase">
        操作
      </h2>

      <div className="flex flex-col gap-2">
        <ActionButton
          icon={<Wand2 size={14} />}
          label="自动优化"
          onClick={runOptimization}
          disabled={pieces.length === 0 || isOptimizing}
          primary
        />

        <ActionButton
          icon={<Scissors size={14} />}
          label={showCuttingPath ? '隐藏路径' : '显示路径'}
          onClick={toggleCuttingPath}
          disabled={pieces.length === 0}
          active={showCuttingPath}
        />

        <ActionButton
          icon={<Save size={14} />}
          label="保存方案"
          onClick={saveScheme}
          disabled={pieces.length === 0 || schemes.length >= 5}
        />

        <ActionButton
          icon={<Trash2 size={14} />}
          label="清空全部"
          onClick={clearAll}
          disabled={pieces.length === 0 || isOptimizing}
          danger
        />
      </div>
    </div>
  );
}

function ParamSlider({
  label,
  value,
  min,
  max,
  step,
  displayValue,
  onChange,
  icon,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  displayValue: string;
  onChange: (v: number) => void;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1 text-[11px] text-white/60">
          {icon}
          {label}
        </span>
        <span className="font-mono text-[11px] text-accent-green">{displayValue}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full"
      />
    </div>
  );
}

function ActionButton({
  icon,
  label,
  onClick,
  disabled,
  primary = false,
  active = false,
  danger = false,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  primary?: boolean;
  active?: boolean;
  danger?: boolean;
}) {
  const baseClasses = 'flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-medium transition-all duration-300';
  const disabledClasses = 'opacity-40 cursor-not-allowed';

  let colorClasses = 'bg-white/5 text-white/70 hover:bg-white/10';
  if (primary) colorClasses = 'bg-accent-teal text-white hover:bg-accent-tealHover';
  if (active) colorClasses = 'bg-accent-green/20 text-accent-green hover:bg-accent-green/30';
  if (danger) colorClasses = 'bg-danger-red/10 text-danger-red/80 hover:bg-danger-red/20 hover:text-danger-red';

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${disabled ? disabledClasses : colorClasses}`}
      style={{
        transitionTimingFunction: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
        ...(primary && !disabled ? { transform: 'scale(1)' } : {}),
      }}
      onMouseDown={(e) => {
        if (!disabled) (e.currentTarget.style.transform = 'scale(0.96)');
      }}
      onMouseUp={(e) => {
        if (!disabled) (e.currentTarget.style.transform = 'scale(1)');
      }}
      onMouseLeave={(e) => {
        (e.currentTarget.style.transform = 'scale(1)');
      }}
    >
      {icon}
      {label}
    </button>
  );
}
