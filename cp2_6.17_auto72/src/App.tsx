import VoxelWorld from '@/scene/VoxelWorld';
import Toolbar from '@/ui/Toolbar';
import MaterialPanel from '@/ui/MaterialPanel';

export default function App() {
  return (
    <div className="w-full h-full flex relative overflow-hidden">
      <aside
        className="hidden md:flex flex-col w-[220px] h-full border-r border-white/10 panel-glow z-10"
        style={{ backgroundColor: '#1E1E2E' }}
      >
        <Toolbar />
      </aside>

      <main className="flex-1 h-full relative">
        <VoxelWorld />

        <div className="absolute top-4 right-4 z-10 hidden md:block">
          <MaterialPanel />
        </div>
      </main>

      <div className="md:hidden fixed bottom-0 left-0 right-0 z-20 border-t border-white/10"
        style={{
          backgroundColor: 'rgba(30,30,46,0.95)',
          backdropFilter: 'blur(12px)',
          height: '80px',
        }}
      >
        <MobileBottomBar />
      </div>
    </div>
  );
}

function MobileBottomBar() {
  return (
    <div className="flex items-center h-full px-2 overflow-x-auto">
      <Toolbar />
    </div>
  );
}
