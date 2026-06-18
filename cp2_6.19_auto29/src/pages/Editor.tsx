import React from 'react';
import { useEditorStore } from '../store/editorStore';
import ToolBar from '../components/ToolBar';
import EditorCanvas from '../components/EditorCanvas';
import LayerPanel from '../components/LayerPanel';
import { exportCanvasImage, downloadImage, createMemeCard } from '../utils/exportImage';
import './Editor.css';

const Editor: React.FC = () => {
  const { layers, addCommunityMeme } = useEditorStore();

  const handleExport = async () => {
    try {
      const dataUrl = await exportCanvasImage(layers);
      downloadImage(dataUrl, `meme-${Date.now()}.png`);

      const card = createMemeCard(dataUrl, '我');
      addCommunityMeme(card);
    } catch (error) {
      console.error('导出失败:', error);
    }
  };

  return (
    <div className="editor-page">
      <div className="editor-toolbar">
        <ToolBar />
      </div>

      <div className="editor-main">
        <div className="editor-canvas-area">
          <EditorCanvas />
        </div>

        <div className="editor-sidebar">
          <LayerPanel />
        </div>
      </div>

      <button className="export-btn" onClick={handleExport}>
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        导出表情包
      </button>
    </div>
  );
};

export default Editor;
