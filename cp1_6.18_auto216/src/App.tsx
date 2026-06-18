import { CityScene } from '@/components/CityScene';
import { FPSCounter } from '@/components/FPSCounter';
import { InfoPanel } from '@/ui/InfoPanel';
import { ControlBar } from '@/ui/ControlBar';

function TitleBar() {
  return (
    <div
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 30,
        padding: '14px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        pointerEvents: 'none',
      }}
    >
      <div style={{
        pointerEvents: 'auto',
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: 12,
          background: 'linear-gradient(135deg, #4A6FA5 0%, #2A3A6A 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#FFFFFF', fontSize: 20, fontWeight: 700,
          boxShadow: '0 4px 16px rgba(74,111,165,0.4)',
          fontFamily: 'serif',
        }}>
          {'城'}
        </div>
        <div>
          <div style={{
            color: '#FFFFFF', fontSize: 17, fontWeight: 700,
            letterSpacing: 1,
            textShadow: '0 2px 10px rgba(0,0,0,0.5)',
          }}>
            城境推演师
          </div>
          <div style={{ color: '#7A8AAC', fontSize: 11, letterSpacing: 0.5 }}>
            3D城市建筑方案可视化平台
          </div>
        </div>
      </div>
      <div style={{
        pointerEvents: 'auto',
        display: 'flex',
        alignItems: 'center', gap: 14,
      }}>
        <div style={{
          padding: '6px 12px', borderRadius: 999,
          background: 'rgba(74,111,165,0.15)',
          border: '1px solid rgba(74,111,165,0.3)',
          color: '#A0C0E0', fontSize: 11, letterSpacing: 0.5,
        }}>
          <span style={{ color: '#00E676', fontFamily: 'monospace', fontWeight: 700 }}>●</span>
          {' '}实时日照模拟中
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
      <CityScene />
      <TitleBar />
      <FPSCounter />
      <InfoPanel />
      <ControlBar />
    </div>
  );
}
