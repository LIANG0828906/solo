import React, { useEffect } from 'react';
import Toolbar from './components/Toolbar';
import Canvas from './components/Canvas';
import CollaborationSidebar from './components/CollaborationSidebar';
import { Download } from 'lucide-react';
import { useEditorStore } from './stores/editorStore';
import { exportToHTML } from './services/exportService';
import { collaborationService } from './services/collaborationService';
import './App.css';

const App: React.FC = () => {
  const {
    blocks,
    users,
    lockBlock,
    unlockBlock,
    setUserEditingBlock,
    collaborationOpen,
  } = useEditorStore();

  useEffect(() => {
    const interval = setInterval(() => {
      const unlockedBlocks = blocks.filter((b) => !b.lockedBy);
      if (unlockedBlocks.length > 0 && Math.random() > 0.7) {
        const randomBlock = unlockedBlocks[Math.floor(Math.random() * unlockedBlocks.length)];
        collaborationService.simulateOtherUserEditing(
          randomBlock.id,
          users,
          lockBlock,
          unlockBlock,
          setUserEditingBlock
        );
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [blocks, users, lockBlock, unlockBlock, setUserEditingBlock]);

  const handleExport = () => {
    const exporter = exportToHTML(blocks);
    exporter.preview();
    setTimeout(() => {
      exporter.download();
    }, 500);
  };

  return (
    <div className="app-root">
      <Toolbar />

      <div className={`app-main ${collaborationOpen ? 'with-sidebar' : ''}`}>
        <div className="app-header">
          <div>
            <h1 className="app-title">协作简报编辑器</h1>
            <p className="app-subtitle">拖拽调整布局 · 双击编辑内容 · 一键导出HTML</p>
          </div>
          <div className="app-status">
            <div className="app-status-dot" />
            <span>{users.filter((u) => u.online).length} 人协作中</span>
          </div>
        </div>

        <Canvas />
      </div>

      <CollaborationSidebar />

      <button
        onClick={handleExport}
        className={`export-btn ${collaborationOpen ? 'with-sidebar' : ''}`}
      >
        <Download size={22} color="#ffffff" strokeWidth={2.2} />
      </button>
    </div>
  );
};

export default App;
