import React, { useState } from 'react';
import type { Participant } from './App';
import './ParticipantPanel.css';

interface Props {
  participants: Participant[];
  onAddParticipant: (name: string) => void;
  onImportList: (names: string[]) => void;
  onRemoveParticipant: (id: string) => void;
  loading: boolean;
}

const ParticipantPanel: React.FC<Props> = ({
  participants,
  onAddParticipant,
  onImportList,
  onRemoveParticipant,
  loading,
}) => {
  const [inputName, setInputName] = useState('');
  const [importText, setImportText] = useState('');
  const [showImport, setShowImport] = useState(false);
  const [animatingIds, setAnimatingIds] = useState<Set<string>>(new Set());

  const handleAdd = () => {
    const trimmed = inputName.trim();
    if (!trimmed) return;
    onAddParticipant(trimmed);
    setInputName('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleAdd();
  };

  const handleImport = () => {
    if (!importText.trim()) return;
    const names = importText
      .split(/[,，\n\r]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (names.length === 0) return;
    onImportList(names);
    setImportText('');
    setShowImport(false);
  };

  const handleRemove = (id: string) => {
    setAnimatingIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
    setTimeout(() => {
      onRemoveParticipant(id);
      setAnimatingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, 300);
  };

  return (
    <div className="participant-panel">
      <h2 className="panel-title">👥 参与者</h2>
      <div className="participant-count">
        共 <span className="count-num">{participants.length}</span> 人
      </div>

      <div className="add-form">
        <input
          className="add-input"
          type="text"
          placeholder="输入姓名..."
          value={inputName}
          onChange={(e) => setInputName(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button className="add-btn" onClick={handleAdd}>
          ＋
        </button>
      </div>

      <button
        className="import-toggle-btn"
        onClick={() => setShowImport(!showImport)}
      >
        {showImport ? '收起导入' : '📋 批量导入'}
      </button>

      {showImport && (
        <div className="import-area">
          <textarea
            className="import-textarea"
            placeholder="用逗号或换行分隔姓名..."
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            rows={4}
          />
          <button className="import-btn" onClick={handleImport}>
            确认导入
          </button>
        </div>
      )}

      <div className="participant-list">
        {loading ? (
          <div className="loading-text">加载中...</div>
        ) : participants.length === 0 ? (
          <div className="empty-text">暂无参与者</div>
        ) : (
          participants.map((p, index) => (
            <div
              key={p.id}
              className={`participant-card ${
                index % 2 === 1 ? 'even' : ''
              } slide-in`}
              style={{ animationDelay: '0ms' }}
            >
              <span className="participant-avatar">👤</span>
              <span className="participant-name">{p.name}</span>
              <button
                className="remove-btn"
                onClick={() => handleRemove(p.id)}
                title="移除"
              >
                ✕
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ParticipantPanel;
