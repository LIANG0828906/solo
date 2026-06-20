import React from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useMagazineStore } from './store';
import EditorCanvas from './EditorCanvas';
import Preview from './Preview';
import { exportMagazineToJson, importMagazineFromJson, generateCoverThumbnail } from './utils';

function App() {
  const isPreviewMode = useMagazineStore((s) => s.isPreviewMode);
  const setPreviewMode = useMagazineStore((s) => s.setPreviewMode);
  const importMagazine = useMagazineStore((s) => s.importMagazine);
  const magazine = useMagazineStore((s) => s.magazine);

  const handleExport = () => {
    exportMagazineToJson(magazine);
    generateCoverThumbnail(magazine);
  };

  const handleImport = async () => {
    try {
      const data = await importMagazineFromJson();
      importMagazine(data);
    } catch (e) {
      alert((e as Error).message || '导入失败');
    }
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', position: 'relative' }}>
        <div style={{
          position: 'absolute',
          top: 0,
          right: 16,
          zIndex: 200,
          display: 'flex',
          gap: 8,
          padding: '8px 0',
        }}>
          <button
            onClick={handleExport}
            className="toolbar-btn"
            style={{ fontSize: 12 }}
          >
            💾 导出
          </button>
          <button
            onClick={handleImport}
            className="toolbar-btn"
            style={{ fontSize: 12 }}
          >
            📂 导入
          </button>
          <button
            onClick={() => setPreviewMode(true)}
            className="toolbar-btn"
            style={{
              fontSize: 12,
              background: '#e67e22',
              color: '#fff',
            }}
          >
            ▶ 预览
          </button>
        </div>
        <EditorCanvas />
        {isPreviewMode && <Preview />}
      </div>
    </DndProvider>
  );
}

export default App;
