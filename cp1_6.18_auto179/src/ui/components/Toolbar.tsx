import React from 'react';
import { useEditorStore } from '../store';

const Toolbar: React.FC = () => {
  const {
    activePanel,
    setActivePanel,
    saveVersion,
    undo,
    redo,
    canUndo,
    canRedo,
    userName,
    userColor,
    addComment,
    selectionStart,
    selectionEnd,
  } = useEditorStore();

  const handleSave = () => {
    saveVersion();
  };

  const handleUndo = () => {
    undo();
  };

  const handleRedo = () => {
    redo();
  };

  const handleToggleComments = () => {
    setActivePanel(activePanel === 'comments' ? null : 'comments');
  };

  const handleToggleVersions = () => {
    setActivePanel(activePanel === 'versions' ? null : 'versions');
  };

  const handleAddComment = () => {
    if (selectionStart === selectionEnd) {
      alert('请先选择一段文字');
      return;
    }
    const text = prompt('请输入批注内容：');
    if (text && text.trim()) {
      addComment(selectionStart, selectionEnd, text.trim());
    }
  };

  return (
    <div className="toolbar">
      <button
        className="toolbar-btn"
        onClick={handleSave}
        title="保存版本"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
          <polyline points="17 21 17 13 7 13 7 21" />
          <polyline points="7 3 7 8 15 8" />
        </svg>
      </button>

      <button
        className="toolbar-btn"
        onClick={handleUndo}
        disabled={!canUndo()}
        title="撤销"
        style={{ opacity: canUndo() ? 1 : 0.4, cursor: canUndo() ? 'pointer' : 'not-allowed' }}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="1 4 1 10 7 10" />
          <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
        </svg>
      </button>

      <button
        className="toolbar-btn"
        onClick={handleRedo}
        disabled={!canRedo()}
        title="重做"
        style={{ opacity: canRedo() ? 1 : 0.4, cursor: canRedo() ? 'pointer' : 'not-allowed' }}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="23 4 23 10 17 10" />
          <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
        </svg>
      </button>

      <div className="toolbar-divider" />

      <button
        className={`toolbar-btn ${activePanel === 'comments' ? 'active' : ''}`}
        onClick={handleToggleComments}
        title="批注面板"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </button>

      <button
        className={`toolbar-btn ${activePanel === 'versions' ? 'active' : ''}`}
        onClick={handleToggleVersions}
        title="版本历史"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      </button>

      <div className="toolbar-divider" />

      <button
        className="toolbar-btn"
        onClick={handleAddComment}
        title="添加批注"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
        </svg>
      </button>

      <div className="toolbar-bottom">
        <div className="user-indicator">
          <div className="user-avatar" style={{ background: userColor }}>
            {userName.charAt(0)}
          </div>
          <div className="user-name">{userName}</div>
        </div>
      </div>
    </div>
  );
};

export default Toolbar;
