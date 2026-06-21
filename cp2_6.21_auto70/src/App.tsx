import React, { useRef } from 'react';
import { useResumeStore } from '@/store/useResumeStore';
import EditorPanel from '@/components/EditorPanel';
import ResumeCanvas from '@/features/builder/ResumeCanvas';
import { PDFService } from '@/features/export/PDFService';
import './App.css';

const App: React.FC = () => {
  const {
    resumeData,
    isExporting,
    exportProgress,
    setIsExporting,
    setExportProgress,
  } = useResumeStore();

  const handleExport = async () => {
    const canvasElement = document.getElementById('resume-canvas');
    if (!canvasElement) return;

    setIsExporting(true);
    setExportProgress(0);

    try {
      await PDFService.exportToPDF(
        resumeData,
        canvasElement,
        (progress) => {
          setExportProgress(progress);
        }
      );
    } catch (error) {
      console.error('导出失败', error);
      alert('导出失败，请重试');
    } finally {
      setTimeout(() => {
        setIsExporting(false);
        setExportProgress(0);
      }, 500);
    }
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-left">
          <span className="logo">📄</span>
          <h1>在线简历生成器</h1>
        </div>
        <div className="header-right">
          <button
            className="export-btn"
            onClick={handleExport}
            disabled={isExporting}
          >
            {isExporting ? '导出中...' : '导出 PDF'}
          </button>
        </div>
      </header>

      {isExporting && (
        <div className="progress-bar-container">
          <div
            className="progress-bar"
            style={{ width: `${exportProgress}%` }}
          />
          <span className="progress-text">{Math.round(exportProgress)}%</span>
        </div>
      )}

      <div className="main-content">
        <EditorPanel />
        <ResumeCanvas />
      </div>

      <footer className="app-footer">
        <p>拖拽左侧模块到画布 · 实时预览 · 一键导出 PDF</p>
      </footer>
    </div>
  );
};

export default App;
