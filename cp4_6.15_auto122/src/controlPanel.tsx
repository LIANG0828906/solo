import { useOceanStore } from './store';
import { getEcoRegionDescription } from './simulationEngine';

const glassPanel: React.CSSProperties = {
  background: 'rgba(10, 22, 40, 0.6)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  border: '1px solid rgba(0, 229, 255, 0.15)',
  boxShadow: '0 0 20px rgba(0, 229, 255, 0.08), inset 0 0 20px rgba(0, 229, 255, 0.03)',
  borderRadius: '12px',
};

export default function ControlPanel() {
  const envParams = useOceanStore((s) => s.envParams);
  const setEnvParams = useOceanStore((s) => s.setEnvParams);
  const isSimulating = useOceanStore((s) => s.isSimulating);
  const startSimulation = useOceanStore((s) => s.startSimulation);
  const showReport = useOceanStore((s) => s.showReport);
  const setShowReport = useOceanStore((s) => s.setShowReport);

  const ecoRegion = getEcoRegionDescription(envParams);

  return (
    <div
      style={{
        ...glassPanel,
        width: '320px',
        padding: '24px',
        position: 'absolute',
        top: '20px',
        right: '20px',
        zIndex: 100,
        maxHeight: 'calc(100vh - 40px)',
        overflowY: 'auto',
      }}
    >
      <h2
        style={{
          fontFamily: "'Orbitron', sans-serif",
          fontSize: '14px',
          fontWeight: 600,
          letterSpacing: '2px',
          color: '#00e5ff',
          marginBottom: '20px',
          textTransform: 'uppercase',
        }}
      >
        环境参数控制
      </h2>

      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <label style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}>海水温度</label>
          <span style={{
            fontFamily: "'Orbitron', sans-serif",
            fontSize: '14px',
            color: '#00e5ff',
            fontWeight: 600,
          }}>
            {envParams.temperature.toFixed(1)}°C
          </span>
        </div>
        <input
          type="range"
          min={5}
          max={30}
          step={0.5}
          value={envParams.temperature}
          onChange={(e) => setEnvParams({ temperature: parseFloat(e.target.value) })}
          style={{ width: '100%' }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'rgba(255,255,255,0.3)', marginTop: '4px' }}>
          <span>5°C</span><span>30°C</span>
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <label style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}>盐度</label>
          <span style={{
            fontFamily: "'Orbitron', sans-serif",
            fontSize: '14px',
            color: '#00e5ff',
            fontWeight: 600,
          }}>
            {envParams.salinity.toFixed(1)} ppt
          </span>
        </div>
        <input
          type="range"
          min={30}
          max={40}
          step={0.5}
          value={envParams.salinity}
          onChange={(e) => setEnvParams({ salinity: parseFloat(e.target.value) })}
          style={{ width: '100%' }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'rgba(255,255,255,0.3)', marginTop: '4px' }}>
          <span>30 ppt</span><span>40 ppt</span>
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <label style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}>光照穿透深度</label>
          <span style={{
            fontFamily: "'Orbitron', sans-serif",
            fontSize: '14px',
            color: '#00e5ff',
            fontWeight: 600,
          }}>
            {envParams.lightPenetration.toFixed(0)} m
          </span>
        </div>
        <input
          type="range"
          min={10}
          max={200}
          step={5}
          value={envParams.lightPenetration}
          onChange={(e) => setEnvParams({ lightPenetration: parseFloat(e.target.value) })}
          style={{ width: '100%' }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'rgba(255,255,255,0.3)', marginTop: '4px' }}>
          <span>10 m</span><span>200 m</span>
        </div>
      </div>

      <div
        style={{
          ...glassPanel,
          padding: '12px 16px',
          marginBottom: '20px',
          borderRadius: '8px',
        }}
      >
        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '1px' }}>
          当前生态区域
        </div>
        <div style={{ fontSize: '15px', color: '#ff9a3c', fontWeight: 600, marginBottom: '4px' }}>
          {ecoRegion.label}
        </div>
        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>
          {ecoRegion.description}
        </div>
      </div>

      <button
        onClick={startSimulation}
        disabled={isSimulating}
        style={{
          width: '100%',
          padding: '12px',
          borderRadius: '8px',
          border: '1px solid rgba(0, 229, 255, 0.3)',
          background: isSimulating
            ? 'rgba(0, 229, 255, 0.1)'
            : 'linear-gradient(135deg, rgba(0, 229, 255, 0.2), rgba(0, 119, 182, 0.2))',
          color: isSimulating ? 'rgba(255,255,255,0.3)' : '#00e5ff',
          fontFamily: "'Orbitron', sans-serif",
          fontSize: '12px',
          fontWeight: 600,
          letterSpacing: '1px',
          cursor: isSimulating ? 'not-allowed' : 'pointer',
          transition: 'all 0.3s ease',
          textTransform: 'uppercase',
          boxShadow: isSimulating ? 'none' : '0 0 15px rgba(0, 229, 255, 0.15)',
        }}
        onMouseEnter={(e) => {
          if (!isSimulating) {
            e.currentTarget.style.boxShadow = '0 0 25px rgba(0, 229, 255, 0.3)';
            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(0, 229, 255, 0.3), rgba(0, 119, 182, 0.3))';
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = isSimulating ? 'none' : '0 0 15px rgba(0, 229, 255, 0.15)';
          e.currentTarget.style.background = isSimulating
            ? 'rgba(0, 229, 255, 0.1)'
            : 'linear-gradient(135deg, rgba(0, 229, 255, 0.2), rgba(0, 119, 182, 0.2))';
        }}
      >
        {isSimulating ? '模拟运行中...' : '运行模拟'}
      </button>

      {showReport && (
        <button
          onClick={() => setShowReport(true)}
          style={{
            width: '100%',
            padding: '10px',
            borderRadius: '8px',
            border: '1px solid rgba(255, 154, 60, 0.3)',
            background: 'linear-gradient(135deg, rgba(255, 154, 60, 0.15), rgba(255, 107, 53, 0.1))',
            color: '#ff9a3c',
            fontFamily: "'Orbitron', sans-serif",
            fontSize: '11px',
            fontWeight: 600,
            letterSpacing: '1px',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            marginTop: '10px',
            textTransform: 'uppercase',
          }}
        >
          查看报告
        </button>
      )}
    </div>
  );
}
