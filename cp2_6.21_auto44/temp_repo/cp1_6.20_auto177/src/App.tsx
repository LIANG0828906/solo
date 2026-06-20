import { useState, useCallback } from 'react';
import GameCanvas from './GameCanvas';
import TrapPanel from './TrapPanel';
import DebugPanel from './DebugPanel';
import { TrapType, TrapParams, DebugInfo, getDefaultParams, DEFAULT_TRAP_TYPE } from './trapData';
import { RotateCcw } from 'lucide-react';

export default function App() {
  const [trapType, setTrapType] = useState<TrapType>(DEFAULT_TRAP_TYPE);
  const [params, setParams] = useState<TrapParams>(getDefaultParams(DEFAULT_TRAP_TYPE));
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
  const [fadeKey, setFadeKey] = useState(0);

  const handleTrapTypeChange = useCallback((newType: TrapType) => {
    setTrapType(newType);
    setParams(getDefaultParams(newType));
    setFadeKey(k => k + 1);
  }, []);

  const handleParamChange = useCallback((key: keyof TrapParams, value: number) => {
    setParams(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleReset = useCallback(() => {
    setParams(getDefaultParams(trapType));
    setFadeKey(k => k + 1);
  }, [trapType]);

  const handleDebugUpdate = useCallback((info: DebugInfo) => {
    setDebugInfo(info);
  }, []);

  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      background: 'var(--bg-primary)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{
        flex: 1,
        position: 'relative',
        minWidth: 0,
      }}>
        <GameCanvas
          key={fadeKey}
          trapType={trapType}
          params={params}
          onDebugUpdate={handleDebugUpdate}
        />
        <DebugPanel debugInfo={debugInfo} />
      </div>

      <TrapPanel
        trapType={trapType}
        params={params}
        onTrapTypeChange={handleTrapTypeChange}
        onParamChange={handleParamChange}
      />

      <button
        onClick={handleReset}
        title="重置"
        style={{
          position: 'absolute',
          top: 20,
          right: 340,
          width: 48,
          height: 48,
          borderRadius: '50%',
          border: '2px solid var(--accent)',
          background: 'rgba(22, 33, 62, 0.8)',
          color: 'var(--accent)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s ease',
          backdropFilter: 'blur(8px)',
          zIndex: 10,
        }}
        onMouseEnter={e => {
          const el = e.currentTarget;
          el.style.background = 'linear-gradient(135deg, #e94560, #0f3460)';
          el.style.color = '#fff';
          el.style.transform = 'scale(1.1)';
        }}
        onMouseLeave={e => {
          const el = e.currentTarget;
          el.style.background = 'rgba(22, 33, 62, 0.8)';
          el.style.color = 'var(--accent)';
          el.style.transform = 'scale(1)';
        }}
        onMouseDown={e => {
          e.currentTarget.style.transform = 'scale(0.95)';
        }}
        onMouseUp={e => {
          e.currentTarget.style.transform = 'scale(1.1)';
        }}
      >
        <RotateCcw size={20} />
      </button>
    </div>
  );
}
