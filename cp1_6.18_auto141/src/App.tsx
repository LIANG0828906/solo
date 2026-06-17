import { useState } from 'react';
import './styles/globals.css';
import ElementList from './components/ElementList';
import PreviewPanel from './components/PreviewPanel';
import PropertyPanel from './components/PropertyPanel';
import Timeline from './components/Timeline';
import ExportModal from './components/ExportModal';
import { useAnimationStore } from './stores/animationStore';

export default function App() {
  const [exportOpen, setExportOpen] = useState(false);
  const { resetAll } = useAnimationStore();

  const handleReset = () => {
    if (window.confirm('确定要重置所有关键帧和元素配置吗？此操作不可撤销。')) {
      resetAll();
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-title">✦ CSS 动画编辑器</div>
        <div className="header-actions">
          <button className="btn-reset" onClick={handleReset}>
            Reset All
          </button>
          <button className="btn-export" onClick={() => setExportOpen(true)}>
            Export CSS
          </button>
        </div>
      </header>

      <div className="app-body">
        <ElementList />

        <div className="main-area">
          <PreviewPanel />
          <PropertyPanel />
        </div>
      </div>

      <Timeline />

      <ExportModal open={exportOpen} onClose={() => setExportOpen(false)} />
    </div>
  );
}
