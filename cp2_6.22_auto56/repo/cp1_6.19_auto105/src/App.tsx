import { Scene } from '@/scene/Scene';
import { Panel } from '@/ui/Panel';
import './App.css';

function App() {
  return (
    <div className="w-full h-screen relative overflow-hidden bg-gray-900">
      <div className="absolute inset-0">
        <Scene />
      </div>

      <Panel />

      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
        <div className="bg-white/10 backdrop-blur-sm rounded-full px-5 py-2 text-white/70 text-sm">
          拖拽旋转 · 滚轮缩放 · 点击右侧面板查看详情
        </div>
      </div>
    </div>
  );
}

export default App;
