import React, { useState, useEffect } from 'react';
import { Image as ImageIcon, Layers, Sparkles } from 'lucide-react';
import { ImageImport } from '@/modules/import/ImageImport';
import { FrameList } from '@/modules/frames/FrameList';
import { Preview } from '@/modules/animator/Preview';
import { Timeline } from '@/modules/animator/Timeline';
import { ExportButton } from '@/modules/export/ExportButton';
import './App.css';

type LeftTab = 'import' | 'frames';

export const App: React.FC = () => {
  const [leftTab, setLeftTab] = useState<LeftTab>('import');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 900);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (isMobile) {
    return (
      <div className="app mobile">
        <header className="app-header">
          <div className="app-title">
            <Sparkles size={20} className="title-icon" />
            <span>SpriteForge</span>
          </div>
          <ExportButton />
        </header>

        <div className="mobile-tabs">
          <button
            className={`mobile-tab ${leftTab === 'import' ? 'active' : ''}`}
            onClick={() => setLeftTab('import')}
          >
            <ImageIcon size={16} />
            导入
          </button>
          <button
            className={`mobile-tab ${leftTab === 'frames' ? 'active' : ''}`}
            onClick={() => setLeftTab('frames')}
          >
            <Layers size={16} />
            帧
          </button>
        </div>

        <div className="mobile-panel">
          {leftTab === 'import' && <ImageImport />}
          {leftTab === 'frames' && <FrameList />}
        </div>

        <div className="mobile-preview">
          <Preview />
        </div>

        <div className="mobile-timeline">
          <Timeline />
        </div>
      </div>
    );
  }

  return (
    <div className="app desktop">
      <header className="app-header">
        <div className="app-title">
          <Sparkles size={20} className="title-icon" />
          <span>SpriteForge</span>
          <span className="app-subtitle">像素动画帧编辑器</span>
        </div>
        <ExportButton />
      </header>

      <div className="main-layout">
        <aside className="left-panel">
          <div className="panel-tabs">
            <button
              className={`tab-btn ${leftTab === 'import' ? 'active' : ''}`}
              onClick={() => setLeftTab('import')}
            >
              <ImageIcon size={14} />
              Import
            </button>
            <button
              className={`tab-btn ${leftTab === 'frames' ? 'active' : ''}`}
              onClick={() => setLeftTab('frames')}
            >
              <Layers size={14} />
              Frames
            </button>
          </div>
          <div className="tab-content">
            {leftTab === 'import' && <ImageImport />}
            {leftTab === 'frames' && <FrameList />}
          </div>
        </aside>

        <main className="center-panel">
          <Preview />
        </main>

        <aside className="right-panel">
          <Timeline />
        </aside>
      </div>
    </div>
  );
};
