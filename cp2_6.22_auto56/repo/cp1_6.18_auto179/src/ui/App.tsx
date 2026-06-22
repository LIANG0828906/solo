import React, { useEffect } from 'react';
import { useEditorStore } from './store';
import Toolbar from './components/Toolbar';
import Editor from './components/Editor';
import CommentPanel from './components/CommentPanel';
import VersionPanel from './components/VersionPanel';
import StatusBar from './components/StatusBar';
import ConflictAlert from './components/ConflictAlert';

const App: React.FC = () => {
  const { initEngines, activePanel, saveVersion } = useEditorStore();

  useEffect(() => {
    initEngines();
  }, [initEngines]);

  useEffect(() => {
    const interval = setInterval(() => {
      saveVersion();
    }, 3 * 60 * 1000);

    return () => clearInterval(interval);
  }, [saveVersion]);

  return (
    <div className="app-container">
      <Toolbar />

      <div className="editor-area">
        <div className="editor-header">
          <ConflictAlert />
        </div>
        <Editor />
        <StatusBar />
      </div>

      {activePanel && (
        <div className="right-panel">
          <div className="panel-tabs">
            <button
              className={`panel-tab ${activePanel === 'comments' ? 'active' : ''}`}
              onClick={() => useEditorStore.getState().setActivePanel('comments')}
            >
              批注
            </button>
            <button
              className={`panel-tab ${activePanel === 'versions' ? 'active' : ''}`}
              onClick={() => useEditorStore.getState().setActivePanel('versions')}
            >
              版本
            </button>
          </div>
          <div className="panel-content">
            {activePanel === 'comments' && <CommentPanel />}
            {activePanel === 'versions' && <VersionPanel />}
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
