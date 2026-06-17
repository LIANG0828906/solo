import ColorSliders from '@/components/ColorSliders';
import ColorPreview from '@/components/ColorPreview';
import PalettePanel from '@/components/PalettePanel';
import EffectsPanel from '@/components/EffectsPanel';

export default function App() {
  return (
    <div className="app-root">
      <header className="app-header">
        <h1 className="app-title">代码调色板</h1>
        <p className="app-subtitle">交互式CSS色彩探索工具</p>
      </header>

      <main className="app-container">
        <aside className="control-panel">
          <section className="panel">
            <h2 className="panel-header">色彩调节</h2>
            <ColorSliders />
          </section>

          <section className="panel">
            <PalettePanel />
          </section>
        </aside>

        <section className="preview-panel">
          <section className="panel">
            <h2 className="panel-header">颜色预览</h2>
            <ColorPreview />
          </section>

          <section className="panel">
            <h2 className="panel-header">效果生成</h2>
            <EffectsPanel />
          </section>
        </section>
      </main>

      <footer className="app-footer">
        <span>使用 React + TypeScript + Zustand + Vite 构建</span>
      </footer>
    </div>
  );
}
