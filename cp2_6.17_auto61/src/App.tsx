import SceneManager from '@/interaction/SceneManager';
import {
  ControlPanel,
  DiagnosticsPanel,
  NavigationBar,
  StarBackground,
} from '@/interaction/UIPanel';

export default function App() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#0A0A1A]">
      <StarBackground />

      <div className="relative w-full h-full pt-[60px] z-10">
        <SceneManager />
      </div>

      <NavigationBar />
      <ControlPanel />
      <DiagnosticsPanel />

      <div className="fixed bottom-4 right-4 text-xs text-[#B0B0B0] z-10 bg-[#0D1117] bg-opacity-80 px-3 py-2 rounded-lg backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-[#00FF88] rounded-full animate-pulse" />
          <span>模拟运行中</span>
        </div>
        <div className="mt-1 text-[10px] opacity-70">
          拖拽旋转 · 滚轮缩放 · 右键平移
        </div>
      </div>
    </div>
  );
}
