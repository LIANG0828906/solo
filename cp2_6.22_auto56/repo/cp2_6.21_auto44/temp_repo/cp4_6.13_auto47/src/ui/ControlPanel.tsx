import { useParticleStore, MAX_ATTRACTORS, MAX_REPULSORS } from '../store';

const panelStyle: React.CSSProperties = {
  width: 280,
  height: '100vh',
  background: 'rgba(30, 30, 30, 0.85)',
  backdropFilter: 'blur(8px)',
  color: '#fff',
  padding: '16px',
  boxSizing: 'border-box',
  overflowY: 'auto',
  flexShrink: 0,
  borderRight: '1px solid rgba(255,255,255,0.08)',
};

const sectionStyle: React.CSSProperties = {
  padding: '12px 0',
  borderBottom: '1px solid rgba(255,255,255,0.1)',
};

const lastSectionStyle: React.CSSProperties = {
  padding: '12px 0',
};

const labelRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '6px',
  fontSize: 13,
};

const labelStyle: React.CSSProperties = {
  color: 'rgba(255,255,255,0.85)',
  fontWeight: 500,
};

const valueStyle: React.CSSProperties = {
  color: '#6fb8ff',
  fontFamily: 'monospace',
  fontSize: 12,
};

const subTitleStyle: React.CSSProperties = {
  fontSize: 12,
  color: 'rgba(255,255,255,0.5)',
  marginBottom: '10px',
  textTransform: 'uppercase',
  letterSpacing: 1,
};

const titleStyle: React.CSSProperties = {
  fontSize: 18,
  fontWeight: 600,
  marginBottom: 4,
  background: 'linear-gradient(90deg, #6fb8ff, #c58aff)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
};

const descStyle: React.CSSProperties = {
  fontSize: 11,
  color: 'rgba(255,255,255,0.45)',
  marginBottom: 12,
};

const sliderContainerStyle: React.CSSProperties = {
  position: 'relative',
  padding: '4px 0',
};

const getSliderStyle = (): React.CSSProperties => ({
  width: '100%',
  height: 20,
  appearance: 'none',
  WebkitAppearance: 'none',
  background: 'transparent',
  cursor: 'pointer',
});

const inputStyle: React.CSSProperties = {
  width: 56,
  background: 'rgba(255,255,255,0.1)',
  border: '1px solid rgba(255,255,255,0.2)',
  borderRadius: 4,
  color: '#fff',
  fontSize: 12,
  padding: '4px 6px',
  outline: 'none',
  fontFamily: 'monospace',
  transition: 'border-color 0.15s',
};

const btnStyle: React.CSSProperties = {
  height: 32,
  padding: '0 12px',
  background: 'rgba(255,255,255,0.05)',
  color: '#fff',
  fontSize: 14,
  border: 'none',
  borderRadius: 4,
  cursor: 'pointer',
  transition: 'background 0.15s',
  whiteSpace: 'nowrap',
};

const btnRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: 8,
  marginTop: 8,
};

const attractorCardStyle: React.CSSProperties = {
  background: 'rgba(0,255,136,0.05)',
  border: '1px solid rgba(0,255,136,0.2)',
  borderRadius: 6,
  padding: '10px',
  marginBottom: 8,
};

const repulsorCardStyle: React.CSSProperties = {
  background: 'rgba(255,68,68,0.05)',
  border: '1px solid rgba(255,68,68,0.2)',
  borderRadius: 6,
  padding: '10px',
  marginBottom: 8,
};

const cardHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 8,
};

const removeBtnStyle: React.CSSProperties = {
  background: 'rgba(255,68,68,0.2)',
  border: 'none',
  color: '#ff8888',
  width: 24,
  height: 24,
  borderRadius: 4,
  cursor: 'pointer',
  fontSize: 14,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'background 0.15s',
};

const inputRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: 6,
  alignItems: 'center',
  marginBottom: 6,
};

const axisLabelStyle: React.CSSProperties = {
  fontSize: 12,
  color: 'rgba(255,255,255,0.6)',
  width: 18,
  fontFamily: 'monospace',
};

const Slider = ({
  min,
  max,
  step,
  value,
  onChange,
}: {
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (v: number) => void;
}) => {
  const percent = ((value - min) / (max - min)) * 100;
  return (
    <div style={sliderContainerStyle}>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        style={getSliderStyle()}
      />
      <style>{`
        input[type=range]::-webkit-slider-runnable-track {
          height: 4px;
          border-radius: 2px;
          background: linear-gradient(90deg, #1a4a8f ${percent}%, rgba(255,255,255,0.15) ${percent}%);
        }
        input[type=range]:hover::-webkit-slider-runnable-track {
          background: linear-gradient(90deg, #2a6abf ${percent}%, rgba(255,255,255,0.25) ${percent}%);
        }
        input[type=range]::-moz-range-track {
          height: 4px;
          border-radius: 2px;
          background: linear-gradient(90deg, #1a4a8f ${percent}%, rgba(255,255,255,0.15) ${percent}%);
        }
        input[type=range]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #ffffff;
          cursor: pointer;
          margin-top: -6px;
          border: none;
          box-shadow: 0 0 0 rgba(111,184,255,0);
          transition: box-shadow 0.2s;
        }
        input[type=range]:hover::-webkit-slider-thumb {
          box-shadow: 0 0 8px rgba(111,184,255,0.8), 0 0 16px rgba(111,184,255,0.4);
        }
        input[type=range]::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #ffffff;
          cursor: pointer;
          border: none;
        }
        input[type=range]:hover::-moz-range-thumb {
          box-shadow: 0 0 8px rgba(111,184,255,0.8);
        }
      `}</style>
    </div>
  );
};

function NumberInput({
  value,
  onChange,
  min,
  max,
  step,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
}) {
  return (
    <input
      type="number"
      value={Number(value.toFixed(2))}
      onChange={(e) => {
        let v = parseFloat(e.target.value);
        if (isNaN(v)) v = 0;
        if (min !== undefined) v = Math.max(min, v);
        if (max !== undefined) v = Math.min(max, v);
        onChange(v);
      }}
      step={step ?? 0.1}
      style={inputStyle}
      onFocus={(e) => (e.target.style.borderColor = 'rgba(111,184,255,0.6)')}
      onBlur={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.2)')}
    />
  );
}

export default function ControlPanel() {
  const fieldConfig = useParticleStore((s) => s.fieldConfig);
  const isRunning = useParticleStore((s) => s.isRunning);
  const particleCount = useParticleStore((s) => s.particleCount);

  const setVortexStrength = useParticleStore((s) => s.setVortexStrength);
  const addAttractor = useParticleStore((s) => s.addAttractor);
  const removeAttractor = useParticleStore((s) => s.removeAttractor);
  const setAttractorPosition = useParticleStore((s) => s.setAttractorPosition);
  const setAttractorStrength = useParticleStore((s) => s.setAttractorStrength);
  const addRepulsor = useParticleStore((s) => s.addRepulsor);
  const removeRepulsor = useParticleStore((s) => s.removeRepulsor);
  const setRepulsorPosition = useParticleStore((s) => s.setRepulsorPosition);
  const setRepulsorRadius = useParticleStore((s) => s.setRepulsorRadius);
  const setParticleCount = useParticleStore((s) => s.setParticleCount);
  const setIsRunning = useParticleStore((s) => s.setIsRunning);
  const reset = useParticleStore((s) => s.reset);

  return (
    <div style={panelStyle}>
      <div>
        <div style={titleStyle}>星云粒子可视化</div>
        <div style={descStyle}>Nebula Particle Simulation</div>
      </div>

      <div style={sectionStyle}>
        <div style={subTitleStyle}>通用设置</div>

        <div style={labelRowStyle}>
          <span style={labelStyle}>粒子数量</span>
          <span style={valueStyle}>{particleCount}</span>
        </div>
        <Slider
          min={100}
          max={2000}
          step={100}
          value={particleCount}
          onChange={setParticleCount}
        />

        <div style={{ height: 12 }} />

        <div style={labelRowStyle}>
          <span style={labelStyle}>涡流强度</span>
          <span style={valueStyle}>{fieldConfig.vortexStrength.toFixed(2)}</span>
        </div>
        <Slider
          min={-5}
          max={5}
          step={0.1}
          value={fieldConfig.vortexStrength}
          onChange={setVortexStrength}
        />

        <div style={btnRowStyle}>
          <button
            style={{
              ...btnStyle,
              flex: 1,
              background: isRunning ? 'rgba(111,184,255,0.15)' : 'rgba(0,255,136,0.15)',
              border: `1px solid ${isRunning ? 'rgba(111,184,255,0.3)' : 'rgba(0,255,136,0.3)'}`,
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = isRunning ? 'rgba(111,184,255,0.25)' : 'rgba(0,255,136,0.25)')
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = isRunning ? 'rgba(111,184,255,0.15)' : 'rgba(0,255,136,0.15)')
            }
            onMouseDown={(e) =>
              (e.currentTarget.style.background = isRunning ? 'rgba(111,184,255,0.35)' : 'rgba(0,255,136,0.35)')
            }
            onMouseUp={(e) =>
              (e.currentTarget.style.background = isRunning ? 'rgba(111,184,255,0.25)' : 'rgba(0,255,136,0.25)')
            }
            onClick={() => setIsRunning(!isRunning)}
          >
            {isRunning ? '⏸ 暂停' : '▶ 继续'}
          </button>
          <button
            style={{
              ...btnStyle,
              flex: 1,
              border: '1px solid rgba(255,180,100,0.3)',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.15)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
            onMouseDown={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.25)')}
            onMouseUp={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.15)')}
            onClick={reset}
          >
            ↻ 重置
          </button>
        </div>
      </div>

      <div style={sectionStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div style={subTitleStyle}>
            吸引子 ({fieldConfig.attractors.length}/{MAX_ATTRACTORS})
          </div>
          <button
            style={{
              ...btnStyle,
              height: 26,
              fontSize: 12,
              padding: '0 10px',
              background: 'rgba(0,255,136,0.1)',
              border: '1px solid rgba(0,255,136,0.3)',
              opacity: fieldConfig.attractors.length >= MAX_ATTRACTORS ? 0.4 : 1,
              cursor: fieldConfig.attractors.length >= MAX_ATTRACTORS ? 'not-allowed' : 'pointer',
            }}
            onMouseEnter={(e) => {
              if (fieldConfig.attractors.length < MAX_ATTRACTORS)
                e.currentTarget.style.background = 'rgba(0,255,136,0.2)';
            }}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(0,255,136,0.1)')}
            onMouseDown={(e) => {
              if (fieldConfig.attractors.length < MAX_ATTRACTORS)
                e.currentTarget.style.background = 'rgba(0,255,136,0.3)';
            }}
            onMouseUp={(e) => (e.currentTarget.style.background = 'rgba(0,255,136,0.2)')}
            onClick={addAttractor}
            disabled={fieldConfig.attractors.length >= MAX_ATTRACTORS}
          >
            + 添加
          </button>
        </div>

        {fieldConfig.attractors.map((a, idx) => (
          <div key={a.id} style={attractorCardStyle}>
            <div style={cardHeaderStyle}>
              <span style={{ fontSize: 13, color: '#00ff88', fontWeight: 600 }}>
                吸引子 #{idx + 1}
              </span>
              <button
                style={removeBtnStyle}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,68,68,0.4)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,68,68,0.2)')}
                onClick={() => removeAttractor(a.id)}
              >
                ✕
              </button>
            </div>
            <div style={inputRowStyle}>
              <span style={axisLabelStyle}>X</span>
              <NumberInput
                value={a.position.x}
                onChange={(v) => setAttractorPosition(a.id, 'x', v)}
                min={-10}
                max={10}
              />
              <span style={axisLabelStyle}>Y</span>
              <NumberInput
                value={a.position.y}
                onChange={(v) => setAttractorPosition(a.id, 'y', v)}
                min={-10}
                max={10}
              />
              <span style={axisLabelStyle}>Z</span>
              <NumberInput
                value={a.position.z}
                onChange={(v) => setAttractorPosition(a.id, 'z', v)}
                min={-10}
                max={10}
              />
            </div>
            <div style={labelRowStyle}>
              <span style={{ ...labelStyle, fontSize: 12 }}>强度</span>
              <span style={valueStyle}>{a.strength.toFixed(2)}</span>
            </div>
            <Slider
              min={0}
              max={5}
              step={0.1}
              value={a.strength}
              onChange={(v) => setAttractorStrength(a.id, v)}
            />
          </div>
        ))}

        {fieldConfig.attractors.length === 0 && (
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', textAlign: 'center', padding: '12px 0' }}>
            暂无吸引子
          </div>
        )}
      </div>

      <div style={lastSectionStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div style={subTitleStyle}>
            排斥子 ({fieldConfig.repulsors.length}/{MAX_REPULSORS})
          </div>
          <button
            style={{
              ...btnStyle,
              height: 26,
              fontSize: 12,
              padding: '0 10px',
              background: 'rgba(255,68,68,0.1)',
              border: '1px solid rgba(255,68,68,0.3)',
              opacity: fieldConfig.repulsors.length >= MAX_REPULSORS ? 0.4 : 1,
              cursor: fieldConfig.repulsors.length >= MAX_REPULSORS ? 'not-allowed' : 'pointer',
            }}
            onMouseEnter={(e) => {
              if (fieldConfig.repulsors.length < MAX_REPULSORS)
                e.currentTarget.style.background = 'rgba(255,68,68,0.2)';
            }}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,68,68,0.1)')}
            onMouseDown={(e) => {
              if (fieldConfig.repulsors.length < MAX_REPULSORS)
                e.currentTarget.style.background = 'rgba(255,68,68,0.3)';
            }}
            onMouseUp={(e) => (e.currentTarget.style.background = 'rgba(255,68,68,0.2)')}
            onClick={addRepulsor}
            disabled={fieldConfig.repulsors.length >= MAX_REPULSORS}
          >
            + 添加
          </button>
        </div>

        {fieldConfig.repulsors.map((r, idx) => (
          <div key={r.id} style={repulsorCardStyle}>
            <div style={cardHeaderStyle}>
              <span style={{ fontSize: 13, color: '#ff6666', fontWeight: 600 }}>
                排斥子 #{idx + 1}
              </span>
              <button
                style={removeBtnStyle}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,68,68,0.4)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,68,68,0.2)')}
                onClick={() => removeRepulsor(r.id)}
              >
                ✕
              </button>
            </div>
            <div style={inputRowStyle}>
              <span style={axisLabelStyle}>X</span>
              <NumberInput
                value={r.position.x}
                onChange={(v) => setRepulsorPosition(r.id, 'x', v)}
                min={-10}
                max={10}
              />
              <span style={axisLabelStyle}>Y</span>
              <NumberInput
                value={r.position.y}
                onChange={(v) => setRepulsorPosition(r.id, 'y', v)}
                min={-10}
                max={10}
              />
              <span style={axisLabelStyle}>Z</span>
              <NumberInput
                value={r.position.z}
                onChange={(v) => setRepulsorPosition(r.id, 'z', v)}
                min={-10}
                max={10}
              />
            </div>
            <div style={labelRowStyle}>
              <span style={{ ...labelStyle, fontSize: 12 }}>影响半径</span>
              <span style={valueStyle}>{r.radius.toFixed(2)}</span>
            </div>
            <Slider
              min={0.5}
              max={5}
              step={0.1}
              value={r.radius}
              onChange={(v) => setRepulsorRadius(r.id, v)}
            />
          </div>
        ))}

        {fieldConfig.repulsors.length === 0 && (
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', textAlign: 'center', padding: '12px 0' }}>
            暂无排斥子
          </div>
        )}
      </div>

      <div
        style={{
          marginTop: 16,
          padding: 12,
          background: 'rgba(255,255,255,0.03)',
          borderRadius: 6,
          fontSize: 11,
          color: 'rgba(255,255,255,0.4)',
          lineHeight: 1.6,
        }}
      >
        <div style={{ fontWeight: 600, marginBottom: 6, color: 'rgba(255,255,255,0.6)' }}>
          操作提示
        </div>
        <div>🖱 左键拖拽：旋转视角</div>
        <div>🖱 滚轮：缩放 (5-50)</div>
        <div>🖱 右键拖拽：平移视角</div>
      </div>
    </div>
  );
}
