import { DreamScene } from '@/scene/DreamScene';
import { ControlPanel } from '@/ui/ControlPanel';
import { LogPanel } from '@/ui/LogPanel';

function App() {
  return (
    <div className="w-full h-screen overflow-hidden relative">
      <div className="absolute inset-0">
        <DreamScene />
      </div>

      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-10 text-center pointer-events-none">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent tracking-wider">
          编织梦境
        </h1>
        <p className="text-white/50 text-sm mt-1">
          点击场景创建节点 · 拖拽节点调整位置 · 点击节点触发涟漪
        </p>
      </div>

      <ControlPanel />
      <LogPanel />
    </div>
  );
}

export default App;
