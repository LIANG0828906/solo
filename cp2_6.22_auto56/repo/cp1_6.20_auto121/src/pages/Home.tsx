import FurniturePanel from '@/components/FurniturePanel';
import ControlPanel from '@/components/ControlPanel';
import StatusBar from '@/components/StatusBar';

export default function Home() {
  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        position: 'relative',
        background: 'linear-gradient(180deg, #E8EEF2 0%, #D4DCE2 100%)',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'rgba(45, 55, 72, 0.4)',
          fontSize: 16,
          fontWeight: 500,
        }}
      >
        3D 场景视图区域
      </div>

      <FurniturePanel />
      <ControlPanel />
      <StatusBar />
    </div>
  );
}