import { useState, useCallback } from 'react';
import { useTimelineStore } from '../store/useTimelineStore';
import { ThemeMode } from '../modules/timeline/TimelineEngine';
import {
  exportSnapshotToFile,
  importSnapshotFromFile,
  openFilePicker,
} from '../utils/snapshot';

export default function ThemePanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const theme = useTimelineStore(s => s.theme);
  const setTheme = useTimelineStore(s => s.setTheme);
  const addTimeline = useTimelineStore(s => s.addTimeline);
  const addNode = useTimelineStore(s => s.addNode);
  const exportSnapshot = useTimelineStore(s => s.exportSnapshot);
  const importSnapshot = useTimelineStore(s => s.importSnapshot);
  const timelines = useTimelineStore(s => s.timelines);

  const showMessage = useCallback((type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 2500);
  }, []);

  const handleThemeChange = (mode: ThemeMode) => {
    setTheme(mode);
  };

  const handleAddTimeline = () => {
    const tl = addTimeline();
    if (tl) {
      addNode(tl.id, { title: '启动事件', description: '双击编辑此事件的详细信息...', tags: ['示例'] });
      addNode(tl.id, { title: '里程碑', tags: ['重要'] });
      addNode(tl.id, { title: '完成阶段', tags: ['阶段'] });
      showMessage('success', '已添加新时间线');
    }
  };

  const handleExport = () => {
    try {
      const snapshot = exportSnapshot();
      exportSnapshotToFile(snapshot);
      showMessage('success', '快照已导出');
    } catch (e) {
      showMessage('error', `导出失败: ${(e as Error).message}`);
    }
  };

  const handleImport = async () => {
    try {
      const file = await openFilePicker();
      const snapshot = await importSnapshotFromFile(file);
      const result = importSnapshot(snapshot);
      if (result.success) {
        showMessage('success', `成功导入 ${snapshot.timelines.length} 条时间线`);
      } else {
        showMessage('error', result.error || '导入失败');
      }
    } catch (e) {
      const msg = (e as Error).message;
      if (msg !== '未选择文件') {
        showMessage('error', msg);
      }
    }
  };

  return (
    <div className="theme-panel">
      <button
        className="theme-panel-toggle"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? '关闭面板' : '打开面板'}
        title="设置"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      </button>

      {isOpen && (
        <div className="theme-panel-content">
          <div className="theme-panel-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
              <path d="M2 12h20" />
            </svg>
            编辑器设置
          </div>

          <div className="theme-options">
            <button
              className={`theme-btn ${theme === 'light' ? 'active' : ''}`}
              onClick={() => handleThemeChange('light')}
            >
              <span className="theme-preview" style={{ background: '#FFFFFF', borderColor: '#E5E7EB' }} />
              <span>明亮模式</span>
            </button>
            <button
              className={`theme-btn ${theme === 'dark' ? 'active' : ''}`}
              onClick={() => handleThemeChange('dark')}
            >
              <span className="theme-preview" style={{ background: '#1E1E2E', borderColor: '#313244' }} />
              <span>暗色模式</span>
            </button>
          </div>

          <div className="snapshot-section">
            <div className="snapshot-title">时间线操作</div>
            <div className="snapshot-buttons">
              <button className="snapshot-btn" onClick={handleAddTimeline}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                添加时间线
                <span style={{ marginLeft: 'auto', opacity: 0.5, fontSize: 11 }}>
                  {timelines.length}
                </span>
              </button>
            </div>
          </div>

          <div className="snapshot-section">
            <div className="snapshot-title">快照管理</div>
            <div className="snapshot-buttons">
              <button className="snapshot-btn" onClick={handleExport}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                导出快照
              </button>
              <button className="snapshot-btn" onClick={handleImport}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                导入快照
              </button>
            </div>
          </div>

          {message && (
            <div
              style={{
                marginTop: 12,
                padding: '8px 12px',
                borderRadius: 8,
                fontSize: 12,
                background: message.type === 'success'
                  ? 'rgba(150, 206, 180, 0.2)'
                  : 'rgba(255, 107, 107, 0.2)',
                color: message.type === 'success' ? '#2E8B6B' : '#C73E3E',
              }}
            >
              {message.text}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
