import { useState, useCallback } from 'react';
import { Palette } from 'lucide-react';
import GradientDesigner from './modules/GradientDesigner';
import PreviewRenderer from './modules/PreviewRenderer';
import ExportPanel from './modules/ExportPanel';
import type { GradientConfig } from './modules/ColorEngine';
import { generateCSSGradient, DEFAULT_CONFIG } from './modules/ColorEngine';

export default function App() {
  const [config, setConfig] = useState<GradientConfig>(DEFAULT_CONFIG);

  const handleConfigChange = useCallback((newConfig: GradientConfig) => {
    setConfig(newConfig);
  }, []);

  const gradientCSS = generateCSSGradient(config);

  return (
    <div className="w-full h-full bg-app-bg flex flex-col overflow-hidden">
      <header className="flex-shrink-0 px-6 py-4 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center"
            style={{ backgroundImage: gradientCSS }}
          >
            <Palette size={20} className="text-white drop-shadow" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white leading-tight">渐变色彩方案设计器</h1>
            <p className="text-xs text-slate-400">Gradient Designer Studio</p>
          </div>
        </div>
        <div className="text-xs text-slate-500 hidden sm:block">
          实时预览 · 多类型渐变 · 一键导出
        </div>
      </header>

      <main className="flex-1 overflow-hidden flex layout-sm:flex-col">
        <aside className="flex-shrink-0 w-[380px] layout-sm:w-full layout-sm:h-auto layout-sm:max-h-[50%] layout-sm:overflow-auto overflow-auto border-r border-white/10 bg-panel-bg p-5 layout-sm:border-r-0 layout-sm:border-b">
          <GradientDesigner config={config} onChange={handleConfigChange} />
        </aside>

        <section className="flex-1 overflow-hidden p-6 layout-sm:p-4">
          <PreviewRenderer gradientCSS={gradientCSS} />
        </section>
      </main>

      <ExportPanel config={config} />
    </div>
  );
}
