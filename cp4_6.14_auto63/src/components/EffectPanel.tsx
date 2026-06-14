import { useMixerStore } from '@store/useStore';
import { useAudioEngine } from '@hooks/useAudioEngine';
import { EFFECT_CONFIGS } from '@types/index';

export function EffectPanel() {
  const showEffectPanel = useMixerStore((state) => state.showEffectPanel);
  const selectedEffect = useMixerStore((state) => state.selectedEffect);
  const tracks = useMixerStore((state) => state.tracks);
  const setShowEffectPanel = useMixerStore((state) => state.setShowEffectPanel);

  const { setEffectParam, toggleEffectBypass, removeEffect } = useAudioEngine();

  if (!showEffectPanel || !selectedEffect) return null;

  const track = tracks.find((t) => t.id === selectedEffect.trackId);
  const effect = track?.effects.find((e) => e.id === selectedEffect.effectId);

  if (!track || !effect) return null;

  const config = EFFECT_CONFIGS[effect.type];

  const handleParamChange = (paramName: string, value: number) => {
    setEffectParam(track.id, effect.id, paramName, value);
  };

  const handleBypass = () => {
    toggleEffectBypass(track.id, effect.id);
  };

  const handleRemove = () => {
    removeEffect(track.id, effect.id);
    setShowEffectPanel(false);
  };

  const handleClose = () => {
    setShowEffectPanel(false);
  };

  return (
    <>
      <div
        onClick={handleClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 1000,
          backdropFilter: 'blur(2px)',
        }}
      />
      <div
        className="slide-in-right"
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '360px',
          backgroundColor: '#1e293b',
          borderRadius: '12px',
          border: '1px solid #334155',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
          zIndex: 1001,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: '1px solid #334155',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '20px' }}>{config.icon}</span>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#e2e8f0' }}>
                {config.name}
              </h3>
              <p style={{ fontSize: '11px', color: '#94a3b8' }}>
                轨道：{track.name}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '6px',
              color: '#94a3b8',
              fontSize: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#334155';
              e.currentTarget.style.color = '#e2e8f0';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = '#94a3b8';
            }}
          >
            ×
          </button>
        </div>

        <div style={{ padding: '20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {config.params.map((param) => {
              const value = effect.params[param.name] ?? param.default;
              const percent = ((value - param.min) / (param.max - param.min)) * 100;

              return (
                <div key={param.name}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <label style={{ fontSize: '12px', color: '#94a3b8' }}>
                      {param.label}
                    </label>
                    <span style={{ fontSize: '12px', color: '#e2e8f0', fontWeight: 500 }}>
                      {value.toFixed(param.step < 1 ? 2 : 0)}
                      {param.unit || ''}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={param.min}
                    max={param.max}
                    step={param.step}
                    value={value}
                    onChange={(e) => handleParamChange(param.name, Number(e.target.value))}
                    style={{
                      width: '100%',
                      background: `linear-gradient(to right, #a855f7 ${percent}%, #475569 ${percent}%)`,
                      height: '6px',
                      borderRadius: '3px',
                      appearance: 'none',
                      outline: 'none',
                      cursor: 'pointer',
                    }}
                  />
                </div>
              );
            })}
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            gap: '10px',
            padding: '16px 20px',
            borderTop: '1px solid #334155',
            backgroundColor: 'rgba(15, 23, 42, 0.5)',
          }}
        >
          <button
            onClick={handleBypass}
            style={{
              flex: 1,
              padding: '8px 16px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 500,
              transition: 'all 0.15s ease',
              backgroundColor: effect.bypassed ? '#475569' : '#334155',
              color: effect.bypassed ? '#94a3b8' : '#e2e8f0',
              border: '1px solid #475569',
              opacity: effect.bypassed ? 0.5 : 1,
            }}
            onMouseEnter={(e) => {
              if (!effect.bypassed) {
                e.currentTarget.style.backgroundColor = '#475569';
              }
            }}
            onMouseLeave={(e) => {
              if (!effect.bypassed) {
                e.currentTarget.style.backgroundColor = '#334155';
              }
            }}
          >
            {effect.bypassed ? '已旁路' : '旁路 (Bypass)'}
          </button>
          <button
            onClick={handleRemove}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 500,
              transition: 'all 0.15s ease',
              backgroundColor: 'rgba(220, 38, 38, 0.1)',
              color: '#dc2626',
              border: '1px solid rgba(220, 38, 38, 0.3)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(220, 38, 38, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(220, 38, 38, 0.1)';
            }}
          >
            移除
          </button>
        </div>
      </div>
    </>
  );
}
