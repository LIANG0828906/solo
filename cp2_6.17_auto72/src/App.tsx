import VoxelWorld from '@/scene/VoxelWorld';
import Toolbar from '@/ui/Toolbar';
import MaterialPanel from '@/ui/MaterialPanel';
import { useEditorStore } from '@/store/editorStore';

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

        <div className="absolute top-4 left-4 md:hidden z-10 flex gap-2">
          <MobileMenu />
        </div>
      </main>

      <div className="md:hidden fixed bottom-0 left-0 right-0 z-20 h-[80px] border-t border-white/10" style={{ backgroundColor: 'rgba(30,30,46,0.95)' }}>
        <MobileBottomBar />
      </div>
    </div>
  );
}

function MobileMenu() {
  const showMaterialPanel = useEditorStore((s) => s.showMaterialPanel);
  const setShowMaterialPanel = useEditorStore((s) => s.setShowMaterialPanel);

  return (
    <button
      onClick={() => setShowMaterialPanel(!showMaterialPanel)}
      className="w-10 h-10 rounded-lg bg-[#1E1E2E]/90 border border-white/10 flex items-center justify-center text-white"
    >
      🎨
    </button>
  );
}

function MobileBottomBar() {
  return (
    <div className="flex items-center justify-around h-full px-2">
      <Toolbar />
    </div>
  );
}
