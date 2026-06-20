import React, { useCallback, useState, useRef } from 'react';
import { useStore } from './store';
import Editor from './components/Editor';
import Preview from './components/Preview';
import CodeView from './components/CodeView';
import TemplateLibrary from './components/TemplateLibrary';
import { createShare, generateHash } from './api';
import type { Keyframe } from './types';

function App() {
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const keyframes = useStore((s) => s.keyframes);
  const generateCSS = useStore((s) => s.generateCSS);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2500);
  }, []);

  const handleExportCSS = useCallback(() => {
    const css = generateCSS();
    const blob = new Blob([css], { type: 'text/css' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'animation.css';
    a.click();
    URL.revokeObjectURL(url);
    showToast('CSS文件已下载');
  }, [generateCSS, showToast]);

  const handleCopyCode = useCallback(() => {
    const css = generateCSS();
    navigator.clipboard.writeText(css).then(() => {
      showToast('代码已复制到剪贴板');
    }).catch(() => {
      showToast('复制失败，请手动复制');
    });
  }, [generateCSS, showToast]);

  const handleShare = useCallback(async () => {
    try {
      const data = JSON.stringify(keyframes);
      const hash = await generateHash(data);
      await createShare(hash, keyframes);
      const shareUrl = `${window.location.origin}/share/${hash}`;
      await navigator.clipboard.writeText(shareUrl);
      showToast(`分享链接已复制: ${shareUrl}`);
    } catch {
      showToast('分享失败，请检查后端服务');
    }
  }, [keyframes, showToast]);

  return (
    <>
      <nav className="navbar">
        <div className="navbar-title">
          <span>动效</span>工坊
        </div>
        <div className="navbar-actions">
          <button className="btn" onClick={handleExportCSS}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
            导出CSS
          </button>
          <button className="btn btn-outline" onClick={handleCopyCode}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
            复制代码
          </button>
          <button className="btn btn-outline" onClick={handleShare}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
            分享
          </button>
        </div>
      </nav>

      <div className="workspace">
        <div className="workspace-inner">
          <div className="editor-panel">
            <Editor />
            <CodeView />
          </div>

          <div className="preview-panel">
            <Preview />
            <TemplateLibrary />
          </div>
        </div>
      </div>

      {toast && <div className={`toast ${toast ? 'show' : ''}`}>{toast}</div>}
    </>
  );
}

export default App;
