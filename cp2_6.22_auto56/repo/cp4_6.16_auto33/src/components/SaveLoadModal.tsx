import React, { useEffect } from 'react';
import { useGameStore } from '../store/gameStore';

const SaveLoadModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const saveGame = useGameStore(s => s.saveGame);
  const loadGame = useGameStore(s => s.loadGame);
  const loadSaveSlots = useGameStore(s => s.loadSaveSlots);
  const saveSlots = useGameStore(s => s.saveSlots);

  useEffect(() => {
    loadSaveSlots();
  }, [loadSaveSlots]);

  const handleSave = async () => {
    await saveGame();
    await loadSaveSlots();
  };

  const handleLoad = async (saveId: string) => {
    await loadGame(saveId);
    onClose();
  };

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-title">存档管理</div>

        <div style={{ marginBottom: 16 }}>
          <button className="modal-btn primary" onClick={handleSave} style={{ width: '100%' }}>
            保存当前进度
          </button>
        </div>

        <div>
          {saveSlots.length === 0 && (
            <div style={{ color: 'var(--text-dim)', fontSize: '0.7rem', textAlign: 'center', padding: 16 }}>
              暂无存档
            </div>
          )}
          {saveSlots.map(slot => (
            <div key={slot.id} className="save-slot-item">
              <div className="save-slot-info">
                <div className="save-slot-wave">第 {slot.waveNumber} 波</div>
                <div className="save-slot-time">{formatTime(slot.timestamp)}</div>
              </div>
              <div className="save-slot-actions">
                <button className="modal-btn" onClick={() => handleLoad(slot.id)}>
                  读档
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="modal-actions">
          <button className="modal-btn close" onClick={onClose}>
            关闭
          </button>
        </div>
      </div>
    </div>
  );
};

export default SaveLoadModal;
