import { ColorPanel } from './components/ColorPanel';
import { CanvasRender } from './components/CanvasRender';
import { PresetManager } from './components/PresetManager';

export default function App() {
  return (
    <div className="min-h-screen bg-[#1E1E2E] flex flex-col items-center py-8 px-6">
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-white mb-2">渐变工坊</h1>
        <p className="text-gray-400 text-sm">快速创建精美的渐变海报设计</p>
      </header>

      <main className="flex gap-6 mb-8">
        <ColorPanel />
        <CanvasRender />
      </main>

      <div className="w-full max-w-[900px]">
        <PresetManager />
      </div>
    </div>
  );
}
