import React, { useState, useEffect } from 'react';
import { Clapperboard, FileDown, Share2 } from 'lucide-react';
import { Canvas } from './Canvas';
import { ScriptPanel } from './ScriptPanel';
import { Toolbox } from './Toolbox';
import { useEditorStore } from '../store/useEditorStore';

export const App: React.FC = () => {
  const [scriptCollapsed, setScriptCollapsed] = useState(false);
  const exportPdf = useEditorStore((s) => s.exportPdf);
  const generateShareLink = useEditorStore((s) => s.generateShareLink);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'b' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        setScriptCollapsed((v) => !v);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <div className="app-container">
      <header className="navbar">
        <div className="navbar-logo">
          <Clapperboard size={24} color="#4a90d9" />
          <span>漫画分镜脚本编辑器</span>
        </div>

        <div className="navbar-actions">
          <button className="btn-secondary" onClick={() => setScriptCollapsed((v) => !v)}>
            {scriptCollapsed ? '展开剧本' : '收起剧本'}
            <span style={{ fontSize: 10, color: '#999', marginLeft: 4 }}>Ctrl+B</span>
          </button>
          <button className="btn-primary" onClick={generateShareLink}>
            <Share2 size={16} />
            分享链接
          </button>
          <button className="btn-primary" onClick={exportPdf}>
            <FileDown size={16} />
            导出 PDF
          </button>
        </div>
      </header>

      <main className="main-content">
        <ScriptPanel collapsed={scriptCollapsed} onToggle={() => setScriptCollapsed((v) => !v)} />
        <Canvas />
        <Toolbox />
      </main>
    </div>
  );
};

export default App;
