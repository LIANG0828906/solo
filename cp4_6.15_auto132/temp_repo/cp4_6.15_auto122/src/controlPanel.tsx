import { useOceanStore } from './store';
import { getEcoRegionDescription } from './simulationEngine';
import type { EnvParams } from './types';

const glassPanelStyle = (): React.CSSProperties => ({
  background: 'rgba(10, 22, 40, 0.62)',
  backdropFilter: 'blur(18px) saturate(140%)',
  WebkitBackdropFilter: 'blur(18px) saturate(140%)',
  border: '1px solid rgba(0, 229, 255, 0.18)',
  boxShadow:
    '0 0 24px rgba(0, 229, 255, 0.09), 0 8px 32px rgba(0, 0, 0, 0.4), inset 0 0 30px rgba(0, 229, 255, 0.025)',
  borderRadius: '14px',
});

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (v: number) => void;
  accentColor?: string;
}

function ParamSlider({ label, value, min, max, step, unit, onChange, accentColor = '#00e5ff' }: SliderProps) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div style={{ marginBottom: '22px' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          marginBottom: '10px',
        }}
      >
        <div>
          <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.55)', fontWeight: 500 }}>
            {label}
          </span>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: '4px',
          }}
        >
          <span
            style={{
              fontFamily: "'Orbitron', sans-serif",
              fontSize: '20px',
              color: accentColor,
              fontWeight: 700,
              letterSpacing: '0.5px',
              textShadow: `0 0 10px ${accentColor}55`,
            }}
          >
            {value}
          </span>
          <span
            style={{
              fontSize: '11px',
              color: 'rgba(255,255,255,0.35)',
              fontFamily: "'Orbitron', sans-serif",
            }}
          >
            {unit}
          </span>
        </div>
      </div>

      <div style={{ position: 'relative', padding: '8px 0 4px' }}>
        <div
          style={{
            position: 'absolute',
            top: '50%',
            transform: 'translateY(-50%)',
            left: 0,
            right: 0,
            height: '6px',
            background:
              'linear-gradient(90deg, rgba(0,229,255,0.04) 0%, rgba(0,229,255,0.12) 100%)',
            borderRadius: '3px',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: '50%',
            transform: 'translateY(-50%)',
            left: 0,
            width: `${pct}%`,
            height: '6px',
            background: `linear-gradient(90deg, ${accentColor}33 0%, ${accentColor}cc 100%)`,
            borderRadius: '3px',
            pointerEvents: 'none',
            boxShadow: `0 0 8px ${accentColor}66`,
          }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          style={{
            width: '100%',
            position: 'relative',
            zIndex: 2,
          }}
        />
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '10px',
          color: 'rgba(255,255,255,0.25)',
          marginTop: '6px',
          fontFamily: "'Orbitron', sans-serif",
          letterSpacing: '0.5px',
        }}
      >
        <span>
          {min}
          {unit}
        </span>
        <span>
          {max}
          {unit}
        </span>
      </div>
    </div>
  );
}

function EcoRegionCard({ params }: { params: EnvParams }) {
  const region = getEcoRegionDescription(params);
  const avgTemp =
    (params.temperature + params.temperature) / 2;
  const bandColor =
    avgTemp >= 24
      ? '#ff6b35'
      : avgTemp >= 18
      ? '#ffd166'
      : avgTemp >= 12
      ? '#4ecdc4'
      : '#00b4d8';

  return (
    <div
      style={{
        ...glassPanelStyle(),
        padding: '14px 18px',
        marginBottom: '24px',
        borderRadius: '10px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: '3px',
          background: `linear-gradient(180deg, ${bandColor}, ${bandColor}00)`,
          boxShadow: `0 0 12px ${bandColor}88`,
        }}
      />
      <div
        style={{
          fontSize: '10px',
          color: 'rgba(255,255,255,0.35)',
          marginBottom: '6px',
          textTransform: 'uppercase',
          letterSpacing: '1.5px',
        }}
      >
        当前生态区域
      </div>
      <div
        style={{
          fontSize: '16px',
          color: '#ff9a3c',
          fontWeight: 700,
          marginBottom: '6px',
          letterSpacing: '0.3px',
        }}
      >
        {region.label}
      </div>
      <div
        style={{
          fontSize: '12px',
          color: 'rgba(255,255,255,0.62)',
          lineHeight: 1.55,
        }}
      >
        {region.description}
      </div>
    </div>
  );
}

export default function ControlPanel() {
  const envParams = useOceanStore((s) => s.envParams);
  const setEnvParams = useOceanStore((s) => s.setEnvParams);
  const isSimulating = useOceanStore((s) => s.isSimulating);
  const startSimulation = useOceanStore((s) => s.startSimulation);
  const showReport = useOceanStore((s) => s.showReport);
  const setShowReport = useOceanStore((s) => s.setShowReport);

  return (
    <div
      style={{
        ...glassPanelStyle(),
        width: '340px',
        padding: '26px 24px',
        position: 'absolute',
        top: '20px',
        right: '20px',
        zIndex: 100,
        maxHeight: 'calc(100vh - 40px)',
        overflowY: 'auto',
      }}
    >
      <div style={{ marginBottom: '22px' }}>
        <h2
          style={{
            fontFamily: "'Orbitron', sans-serif",
            fontSize: '13px',
            fontWeight: 700,
            letterSpacing: '3px',
            color: '#00e5ff',
            marginBottom: '6px',
            textTransform: 'uppercase',
            textShadow: '0 0 16px rgba(0, 229, 255, 0.3)',
          }}
        >
          Environment
        </h2>
        <div
          style={{
            width: '40px',
            height: '2px',
            background: 'linear-gradient(90deg, #00e5ff, #00e5ff00)',
            marginBottom: '4px',
          }}
        />
        <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', lineHeight: 1.5 }}>
          调整环境参数实时观察物种分布变化
        </p>
      </div>

      <ParamSlider
        label="海水温度 (Temperature)"
        value={Number(envParams.temperature.toFixed(1))}
        min={5}
        max={30}
        step={0.5}
        unit="°C"
        onChange={(v) => setEnvParams({ temperature: v })}
        accentColor="#ff6b35"
      />

      <ParamSlider
        label="盐度 (Salinity)"
        value={Number(envParams.salinity.toFixed(1))}
        min={30}
        max={40}
        step={0.5}
        unit="ppt"
        onChange={(v) => setEnvParams({ salinity: v })}
        accentColor="#4ecdc4"
      />

      <ParamSlider
        label="光照穿透深度 (Light Penetration)"
        value={Number(envParams.lightPenetration.toFixed(0))}
        min={10}
        max={200}
        step={5}
        unit="m"
        onChange={(v) => setEnvParams({ lightPenetration: v })}
        accentColor="#00e5ff"
      />

      <EcoRegionCard params={envParams} />

      <button
        onClick={() => {
          startSimulation();
        }}
        disabled={isSimulating}
        style={{
          width: '100%',
          padding: '14px',
          borderRadius: '10px',
          border: isSimulating
            ? '1px solid rgba(0, 229, 255, 0.15)'
            : '1px solid rgba(0, 229, 255, 0.35)',
          background: isSimulating
            ? 'rgba(0, 229, 255, 0.08)'
            : 'linear-gradient(135deg, rgba(0, 229, 255, 0.22) 0%, rgba(0, 119, 182, 0.18) 100%)',
          color: isSimulating ? 'rgba(255,255,255,0.45)' : '#ffffff',
          fontFamily: "'Orbitron', sans-serif",
          fontSize: '12px',
          fontWeight: 600,
          letterSpacing: '2px',
          cursor: isSimulating ? 'not-allowed' : 'pointer',
          transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
          textTransform: 'uppercase',
          boxShadow: isSimulating ? 'none' : '0 0 18px rgba(0, 229, 255, 0.2)',
          position: 'relative',
          overflow: 'hidden',
        }}
        onMouseEnter={(e) => {
          if (!isSimulating) {
            e.currentTarget.style.boxShadow = '0 0 30px rgba(0, 229, 255, 0.4)';
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.background =
              'linear-gradient(135deg, rgba(0, 229, 255, 0.3) 0%, rgba(0, 119, 182, 0.26) 100%)';
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = isSimulating
            ? 'none'
            : '0 0 18px rgba(0, 229, 255, 0.2)';
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.background = isSimulating
            ? 'rgba(0, 229, 255, 0.08)'
            : 'linear-gradient(135deg, rgba(0, 229, 255, 0.22) 0%, rgba(0, 119, 182, 0.18) 100%)';
        }}
        onMouseDown={(e) => {
          if (!isSimulating) {
            e.currentTarget.style.transform = 'translateY(1px) scale(0.99)';
          }
        }}
        onMouseUp={(e) => {
          if (!isSimulating) {
            e.currentTarget.style.transform = 'translateY(-1px)';
          }
        }}
      >
        {isSimulating ? (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
            <span
              style={{
                display: 'inline-block',
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: '#00e5ff',
                boxShadow: '0 0 10px #00e5ff',
                animation: 'sim-pulse 1s ease-in-out infinite',
              }}
            />
            <span>
              模拟运行中...
            </span>
          </span>
        ) : (
          '运行模拟'
        )}
      </button>

      {showReport && (
        <button
          onClick={() => setShowReport(true)}
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: '10px',
            border: '1px solid rgba(255, 154, 60, 0.35)',
            background:
              'linear-gradient(135deg, rgba(255, 154, 60, 0.18) 0%, rgba(255, 107, 53, 0.12) 100%)',
            color: '#ff9a3c',
            fontFamily: "'Orbitron', sans-serif",
            fontSize: '11px',
            fontWeight: 600,
            letterSpacing: '1.5px',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            marginTop: '12px',
            textTransform: 'uppercase',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = '0 0 25px rgba(255, 154, 60, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          查看分析报告
        </button>
      )}

      <style>{`
        @keyframes sim-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.8); }
        }
      `}</style>
    </div>
  );
}
