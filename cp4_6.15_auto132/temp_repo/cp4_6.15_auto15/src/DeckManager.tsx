import { useState, useRef } from 'react';
import { useAppContext, DeckWithCards } from './App';
import { getDeckMastery, getDueCards } from './utils/spacedRepetition';

interface DeckManagerProps {
  onStudy: (deckId: string) => void;
}

export default function DeckManager({ onStudy }: DeckManagerProps) {
  const { state, addDeck, deleteDeck, exportData, importData, addSampleData } = useAppContext();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCreate = () => {
    if (!newName.trim()) return;
    addDeck(newName.trim(), newDesc.trim());
    setNewName('');
    setNewDesc('');
    setShowCreateModal(false);
  };

  const handleExport = () => {
    const json = exportData();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `flashcards-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const ok = importData(text);
      if (!ok) {
        alert('导入失败：文件格式不正确');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const formatDateStr = (dateStr: string | null) => {
    if (!dateStr) return '从未复习';
    const d = new Date(dateStr + 'T00:00:00');
    const now = new Date();
    const diff = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 0) return '今天';
    if (diff === 1) return '昨天';
    if (diff < 7) return `${diff}天前`;
    return dateStr;
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">我的卡片集</h1>
          <p className="page-subtitle">共 {state.decks.length} 个卡片集，点击进入学习</p>
        </div>
        <div className="header-actions">
          {state.decks.length === 0 && (
            <button className="glass-btn" onClick={addSampleData}>
              ✨ 示例数据
            </button>
          )}
          <button className="glass-btn" onClick={handleExport}>
            📤 导出
          </button>
          <button className="glass-btn" onClick={() => fileInputRef.current?.click()}>
            📥 导入
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            style={{ display: 'none' }}
            onChange={handleImport}
          />
          <button className="glass-btn primary" onClick={() => setShowCreateModal(true)}>
            ＋ 新建卡片集
          </button>
        </div>
      </div>

      {state.decks.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📚</div>
          <div className="empty-state-title">还没有卡片集</div>
          <div className="empty-state-desc">
            创建你的第一个知识卡片集，开始高效记忆之旅吧！
            也可以点击"示例数据"快速体验完整功能。
          </div>
          <button className="glass-btn primary" onClick={() => setShowCreateModal(true)}>
            ＋ 创建第一个卡片集
          </button>
        </div>
      ) : (
        <div className="deck-grid">
          {state.decks.map((deck) => (
            <DeckCard
              key={deck.id}
              deck={deck}
              onStudy={() => onStudy(deck.id)}
              onDelete={() => {
                if (confirm(`确定要删除「${deck.name}」吗？此操作不可恢复。`)) {
                  deleteDeck(deck.id);
                }
              }}
              formatDateStr={formatDateStr}
            />
          ))}
        </div>
      )}

      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">✨ 新建卡片集</h2>
            <div className="form-group">
              <label className="form-label">名称</label>
              <input
                className="form-input"
                placeholder="例如：英语单词、历史年代..."
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                autoFocus
              />
            </div>
            <div className="form-group">
              <label className="form-label">描述（可选）</label>
              <textarea
                className="form-input form-textarea"
                placeholder="简要描述这个卡片集的内容..."
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
              />
            </div>
            <div className="modal-actions">
              <button className="glass-btn" onClick={() => setShowCreateModal(false)}>
                取消
              </button>
              <button
                className="glass-btn primary"
                onClick={handleCreate}
                disabled={!newName.trim()}
              >
                创建
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface DeckCardProps {
  deck: DeckWithCards;
  onStudy: () => void;
  onDelete: () => void;
  formatDateStr: (s: string | null) => string;
}

function DeckCard({ deck, onStudy, onDelete, formatDateStr }: DeckCardProps) {
  const dueCount = getDueCards(deck.cards).length;
  const mastery = getDeckMastery(deck.cards);

  return (
    <div className="deck-card" onClick={onStudy}>
      <div className="deck-card-actions">
        <button
          className="icon-btn danger"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          title="删除"
        >
          🗑
        </button>
      </div>
      <div className="deck-card-header">
        <h3 className="deck-card-title">{deck.name}</h3>
      </div>
      {deck.description && <p className="deck-card-desc">{deck.description}</p>}
      <div className="deck-card-meta">
        <div className="deck-card-count">
          <span>📝</span>
          <span>
            <strong>{deck.cards.length}</strong> 张卡片
          </span>
        </div>
        {dueCount > 0 && (
          <div className="deck-card-count">
            <span>⏰</span>
            <span>
              <strong>{dueCount}</strong> 待复习
            </span>
          </div>
        )}
      </div>
      <div className="deck-card-meta" style={{ borderTop: 'none', paddingTop: 12 }}>
        <div className="deck-card-count">
          <span>📈</span>
          <span>
            掌握度 <strong>{mastery}%</strong>
          </span>
        </div>
        <div className="deck-card-date">
          {formatDateStr(deck.lastReviewedAt)}
        </div>
      </div>
    </div>
  );
}
