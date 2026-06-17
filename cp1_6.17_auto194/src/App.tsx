import React, { useEffect, useState, useRef } from 'react';
import { usePixelStore, ProjectData } from './store';
import { assetManager } from './AssetManager';
import { AssetPanel } from './components/素材面板';
import { PropertyPanel } from './components/属性面板';
import { Canvas } from './components/画布';
import { Timeline } from './components/时间轴';
import { Download, Upload } from 'lucide-react';

const App: React.FC = () => {
  const [toast, setToast] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const exportProject = usePixelStore(s => s.exportProject);
  const importProject = usePixelStore(s => s.importProject);

  useEffect(() => {
    assetManager.init();
  }, []);

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  const handleExport = () => {
    const data = exportProject();
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pixel-theater-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('项目已导出！');
  };

  const handleImport = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string) as ProjectData;
        if (data.frames && Array.isArray(data.frames)) {
          importProject(data);
          showToast('项目导入成功！');
        } else {
          showToast('无效的项目文件');
        }
      } catch {
        showToast('文件解析失败');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div
      className="flex flex-col h-screen overflow-hidden select-none"
      style={{ background: '#1A1C20', color: '#E0E0E0' }}
    >
      <div className="flex items-center justify-between px-4 py-2" style={{ background: '#1E2024' }}>
        <h1 className="text-lg font-bold" style={{ color: '#F5A623' }}>
          🎬 像素小剧场搬砖
        </h1>
        <div className="flex items-center gap-2">
          <button
            className="flex items-center gap-1 px-3 py-1.5 text-sm transition-all duration-200"
            style={{
              background: '#3A3D42',
              borderRadius: 6,
              color: '#E0E0E0',
            }}
            onClick={handleExport}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#4A4E52')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#3A3D42')}
            onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.95)')}
            onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            onMouseLeave={(e) => { (e.currentTarget.style.background = '#3A3D42'); e.currentTarget.style.transform = 'scale(1)'; }}
          >
            <Download size={14} />
            导出
          </button>
          <button
            className="flex items-center gap-1 px-3 py-1.5 text-sm transition-all duration-200"
            style={{
              background: '#3A3D42',
              borderRadius: 6,
              color: '#E0E0E0',
            }}
            onClick={handleImport}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#4A4E52')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#3A3D42')}
            onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.95)')}
            onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            onMouseLeave={(e) => { (e.currentTarget.style.background = '#3A3D42'); e.currentTarget.style.transform = 'scale(1)'; }}
          >
            <Upload size={14} />
            导入
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="p-2 flex-shrink-0">
          <AssetPanel />
        </div>

        <div className="flex-1 flex items-center justify-center p-4">
          <Canvas />
        </div>

        <div className="p-2 flex-shrink-0">
          <PropertyPanel />
        </div>
      </div>

      <Timeline />

      {toast && (
        <div
          className="fixed top-4 left-1/2 -translate-x-1/2 px-6 py-3 text-sm z-50 animate-fadeIn"
          style={{
            background: '#1E2024',
            borderRadius: 8,
            color: '#fff',
            boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
            border: '1px solid #3A3D42',
          }}
        >
          {toast}
        </div>
      )}
    </div>
  );
};

export default App;
