import React, { useState } from 'react';
import { Edit3, Save, Upload, Leaf, Mountain, Droplets, UserPlus, Skull, RotateCcw } from 'lucide-react';
import { useGameStore } from './store';
import { saveSnapshot, loadSnapshot, fetchSnapshots } from './api';
import type { TerrainType } from './types';
import { ANIMATION_DURATION } from './config';

interface SaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
  action: 'save' | 'load';
  snapshots?: string[];
  selectedSnapshot?: string;
  onSelectSnapshot?: (name: string) => void;
}

const SaveModal: React.FC<SaveModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  loading,
  action,
  snapshots = [],
  selectedSnapshot,
  onSelectSnapshot,
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: `modalFadeIn ${ANIMATION_DURATION}ms ease-out` }}
      >
        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner">
              <div className="spinner-ring" />
            </div>
            <p>{action === 'save' ? '保存中...' : '加载中...'}</p>
          </div>
        ) : (
          <>
            <h3 className="modal-title">
              {action === 'save' ? '保存战斗快照' : '加载战斗快照'}
            </h3>

            {action === 'save' ? (
              <p className="modal-description">
                确定要保存当前战斗状态吗？保存后可以随时重新加载恢复。
              </p>
            ) : (
              <div className="snapshot-list">
                {snapshots.length === 0 ? (
                  <p className="empty-snapshots">暂无保存的快照</p>
                ) : (
                  snapshots.map((snapshot) => (
                    <div
                      key={snapshot}
                      className={`snapshot-item ${selectedSnapshot === snapshot ? 'selected' : ''}`}
                      onClick={() => onSelectSnapshot?.(snapshot)}
                    >
                      {snapshot}
                    </div>
                  ))
                )}
              </div>
            )}

            <div className="modal-actions">
              <button className="secondary-btn" onClick={onClose}>
                取消
              </button>
              <button
                className="primary-btn"
                onClick={onConfirm}
                disabled={action === 'load' && !selectedSnapshot}
              >
                {action === 'save' ? '确认保存' : '确认加载'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const Toolbar: React.FC = () => {
  const {
    editMode,
    brushType,
    setEditMode,
    setBrushType,
    units,
    terrain,
    currentRound,
    selectedUnitId,
    logs,
    loadState,
    addUnit,
    resetRound,
  } = useGameStore();

  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [loadModalOpen, setLoadModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [snapshots, setSnapshots] = useState<string[]>([]);
  const [selectedSnapshot, setSelectedSnapshot] = useState<string>('');

  const terrainButtons: { type: TerrainType; icon: React.ElementType; label: string }[] = [
    { type: 'grass', icon: Leaf, label: '草地' },
    { type: 'stone', icon: Mountain, label: '石块' },
    { type: 'water', icon: Droplets, label: '水域' },
  ];

  const handleSave = async () => {
    setLoading(true);
    try {
      const state = {
        units,
        terrain,
        currentRound,
        selectedUnitId,
        editMode,
        brushType,
        logs,
      };
      await saveSnapshot(state);
    } catch (error) {
      console.error('保存失败:', error);
    } finally {
      setLoading(false);
      setSaveModalOpen(false);
    }
  };

  const handleOpenLoadModal = async () => {
    setLoading(true);
    setLoadModalOpen(true);
    try {
      const result = await fetchSnapshots();
      setSnapshots(result.filenames);
      setSelectedSnapshot('');
    } catch (error) {
      console.error('获取快照列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLoad = async () => {
    if (!selectedSnapshot) return;
    setLoading(true);
    try {
      const state = await loadSnapshot(selectedSnapshot);
      loadState(state);
      setLoadModalOpen(false);
    } catch (error) {
      console.error('加载失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPlayer = () => {
    const emptyPos = findEmptyPosition();
    if (emptyPos) {
      addUnit('player', emptyPos.q, emptyPos.r);
    }
  };

  const handleAddEnemy = () => {
    const emptyPos = findEmptyPosition(true);
    if (emptyPos) {
      addUnit('enemy', emptyPos.q, emptyPos.r);
    }
  };

  const findEmptyPosition = (enemy = false): { q: number; r: number } | null => {
    const startQ = enemy ? 15 : 3;
    for (let r = 5; r < 12; r++) {
      const occupied = units.some((u) => u.position.q === startQ && u.position.r === r);
      if (!occupied) {
        return { q: startQ, r };
      }
    }
    return null;
  };

  return (
    <div className="toolbar">
      <div className="toolbar-left">
        <h1 className="app-title">⚔️ RPG战斗管理器</h1>
        <div className="round-badge">
          <span>第 {currentRound} 回合</span>
        </div>
      </div>

      <div className="toolbar-center">
        <button
          className={`tool-btn ${editMode ? 'active' : ''}`}
          onClick={() => setEditMode(!editMode)}
        >
          <Edit3 size={18} />
          <span>{editMode ? '退出编辑' : '编辑模式'}</span>
        </button>

        {editMode && (
          <div className="terrain-brushes">
            <span className="brush-label">地形:</span>
            {terrainButtons.map(({ type, icon: Icon, label }) => (
              <button
                key={type}
                className={`brush-btn ${brushType === type ? 'active' : ''}`}
                onClick={() => setBrushType(type)}
                title={label}
              >
                <Icon size={16} />
              </button>
            ))}
          </div>
        )}

        {!editMode && (
          <div className="unit-add-btns">
            <button className="tool-btn" onClick={handleAddPlayer}>
              <UserPlus size={18} />
              <span>添加玩家</span>
            </button>
            <button className="tool-btn" onClick={handleAddEnemy}>
              <Skull size={18} />
              <span>添加敌人</span>
            </button>
            <button className="tool-btn" onClick={resetRound}>
              <RotateCcw size={18} />
              <span>重置回合</span>
            </button>
          </div>
        )}
      </div>

      <div className="toolbar-right">
        <button className="tool-btn" onClick={handleOpenLoadModal}>
          <Upload size={18} />
          <span>加载</span>
        </button>
        <button className="tool-btn primary" onClick={() => setSaveModalOpen(true)}>
          <Save size={18} />
          <span>保存</span>
        </button>
      </div>

      <SaveModal
        isOpen={saveModalOpen}
        onClose={() => setSaveModalOpen(false)}
        onConfirm={handleSave}
        loading={loading}
        action="save"
      />

      <SaveModal
        isOpen={loadModalOpen}
        onClose={() => setLoadModalOpen(false)}
        onConfirm={handleLoad}
        loading={loading}
        action="load"
        snapshots={snapshots}
        selectedSnapshot={selectedSnapshot}
        onSelectSnapshot={setSelectedSnapshot}
      />
    </div>
  );
};

export default Toolbar;
