import React, { useState, useCallback } from 'react';
import DrawCanvas from './modules/draw/DrawCanvas';
import Scene3D from './modules/render/Scene3D';
import ControlPanel from './modules/ui/ControlPanel';
import { useAppStore } from './store/appStore';

const App: React.FC = () => {
  const { pathPoints, particleDensity, cameraPosition, resetPath } = useAppStore();
  const [toast, setToast] = useState<string | null>(null);

  const showToast = useCallback((message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 2500);
  }, []);

  const handleSave = useCallback(() => {
    const data = {
      pathPoints,
      particleDensity,
      cameraPosition,
      savedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `path_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('✓ 路径已保存为JSON文件');
  }, [pathPoints, particleDensity, cameraPosition, showToast]);

  const handleShare = useCallback(async () => {
    const data = {
      pathPoints,
      particleDensity,
      cameraPosition
    };
    const encoded = btoa(encodeURIComponent(JSON.stringify(data)));
    const shareUrl = `${window.location.origin}${window.location.pathname}#${encoded}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      showToast('✓ 分享链接已复制到剪贴板');
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = shareUrl;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      showToast('✓ 分享链接已复制');
    }
  }, [pathPoints, particleDensity, cameraPosition, showToast]);

  return (
    <div className="app-container">
      <div className="scene-container">
        <Scene3D />
      </div>

      <DrawCanvas />

      <button className="save-button" onClick={handleSave}>
        💾 保存路径
      </button>
      <button className="share-button" onClick={handleShare}>
        🔗 分享链接
      </button>

      <ControlPanel />

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
};

export default App;
