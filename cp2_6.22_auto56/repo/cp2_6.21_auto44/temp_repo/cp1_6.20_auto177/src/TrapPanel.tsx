import { TrapType, TrapParams, TRAP_DEFINITIONS } from './trapData';

interface TrapPanelProps {
  trapType: TrapType;
  params: TrapParams;
  onTrapTypeChange: (type: TrapType) => void;
  onParamChange: (key: keyof TrapParams, value: number) => void;
}

export default function TrapPanel({ trapType, params, onTrapTypeChange, onParamChange }: TrapPanelProps) {
  return (
    <div style={{
      width: 320,
      height: '100%',
      background: 'rgba(22, 33, 62, 0.85)',
      backdropFilter: 'blur(16px)',
      borderLeft: '1px solid rgba(233, 69, 96, 0.2)',
      padding: '24px 20px',
      display: 'flex',
      flexDirection: 'column',
      gap: 24,
      overflowY: 'auto',
      zIndex: 5,
    }}>
      <h2 style={{
        fontFamily: 'var(--font-display)',
        fontSize: 22,
        fontWeight: 700,
        color: 'var(--accent)',
        textTransform: 'uppercase',
        letterSpacing: 2,
        borderBottom: '1px solid rgba(233, 69, 96, 0.3)',
        paddingBottom: 12,
        margin: 0,
      }}>
        陷阱控制
      </h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <label style={{
          fontSize: 13,
          color: 'var(--text-secondary)',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: 1,
        }}>
          陷阱类型
        </label>
        <select
          value={trapType}
          onChange={e => onTrapTypeChange(e.target.value as TrapType)}
          style={{
            background: 'var(--bg-track)',
            color: 'var(--text-primary)',
            border: '1px solid rgba(233, 69, 96, 0.3)',
            borderRadius: 8,
            padding: '10px 14px',
            fontSize: 16,
            fontFamily: 'var(--font-ui)',
            fontWeight: 600,
            cursor: 'pointer',
            outline: 'none',
            appearance: 'none',
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%23e94560' viewBox='0 0 16 16'%3E%3Cpath d='M8 11L2 5h12z'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 12px center',
          }}
        >
          {TRAP_DEFINITIONS.map(d => (
            <option key={d.type} value={d.type}>{d.label}</option>
          ))}
        </select>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginTop: 8 }}>
        <SliderControl
          label="触发半径"
          value={params.triggerRadius}
          min={0.5}
          max={3.0}
          step={0.1}
          unit="m"
          onChange={v => onParamChange('triggerRadius', v)}
        />
        <SliderControl
          label="伤害值"
          value={params.damage}
          min={1}
          max={10}
          step={1}
          unit=""
          onChange={v => onParamChange('damage', v)}
        />
        <SliderControl
          label="持续时间"
          value={params.duration}
          min={1}
          max={5}
          step={0.5}
          unit="s"
          onChange={v => onParamChange('duration', v)}
        />
      </div>

      <div style={{
        marginTop: 'auto',
        padding: 16,
        background: 'rgba(15, 52, 96, 0.4)',
        borderRadius: 10,
        border: '1px solid rgba(233, 69, 96, 0.15)',
      }}>
        <div style={{
          fontSize: 12,
          color: 'var(--text-secondary)',
          textTransform: 'uppercase',
          letterSpacing: 1,
          marginBottom: 8,
          fontWeight: 600,
        }}>
          当前参数概览
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-secondary)' }}>类型</span>
            <span style={{ color: 'var(--accent)', fontWeight: 700 }}>
              {TRAP_DEFINITIONS.find(d => d.type === trapType)?.label}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-secondary)' }}>半径</span>
            <span style={{ color: '#fff', fontWeight: 600 }}>{params.triggerRadius.toFixed(1)}m</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-secondary)' }}>伤害</span>
            <span style={{ color: '#fff', fontWeight: 600 }}>{params.damage}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-secondary)' }}>持续</span>
            <span style={{ color: '#fff', fontWeight: 600 }}>{params.duration.toFixed(1)}s</span>
          </div>
        </div>
      </div>
    </div>
  );
}

interface SliderControlProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (v: number) => void;
}

function SliderControl({ label, value, min, max, step, unit, onChange }: SliderControlProps) {
  const pct = ((value - min) / (max - min)) * 100;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <label style={{
          fontSize: 13,
          color: 'var(--text-secondary)',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: 1,
        }}>
          {label}
        </label>
        <span style={{
          fontSize: 16,
          color: 'var(--accent)',
          fontWeight: 700,
          fontFamily: 'var(--font-ui)',
          minWidth: 48,
          textAlign: 'right',
        }}>
          {step >= 1 ? value : value.toFixed(1)}{unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        style={{
          width: '100%',
          height: 6,
          appearance: 'none',
          background: `linear-gradient(to right, var(--accent) 0%, var(--accent) ${pct}%, var(--bg-track) ${pct}%, var(--bg-track) 100%)`,
          borderRadius: 3,
          outline: 'none',
          cursor: 'pointer',
        }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-secondary)' }}>
        <span>{min}{unit}</span>
        <span>{max}{unit}</span>
      </div>
    </div>
  );
}
