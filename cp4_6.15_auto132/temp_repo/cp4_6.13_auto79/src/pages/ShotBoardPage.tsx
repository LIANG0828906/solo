import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import ShotBoard from '../components/ShotBoard';
import PreviewPlayer from '../components/PreviewPlayer';
import ShotEditor from '../components/ShotEditor';
import { shotApi, type Shot, type User } from '../api';
import '../styles/shotboard.css';

interface ShotBoardPageProps {
  user: User;
  onLogout: () => void;
}

function ShotBoardPage({ user, onLogout }: ShotBoardPageProps) {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [shots, setShots] = useState<Shot[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingShot, setEditingShot] = useState<Shot | null>(null);
  const [selectedShotIds, setSelectedShotIds] = useState<Set<string>>(new Set());
  const [showBatchModal, setShowBatchModal] = useState<'delete' | 'duration' | null>(null);
  const [batchDuration, setBatchDuration] = useState(1.0);

  const loadShots = useCallback(async () => {
    if (!projectId) return;
    try {
      const data = await shotApi.getShots(projectId);
      setShots(data);
    } catch (err) {
      console.error('加载镜头失败:', err);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadShots();
  }, [loadShots]);

  const handleCreateShot = async () => {
    if (!projectId) return;
    try {
      const newShot = await shotApi.createShot(projectId, {
        duration: 1.0,
        description: '',
      });
      setShots([...shots, newShot]);
    } catch (err) {
      alert(err instanceof Error ? err.message : '创建失败');
    }
  };

  const handleUpdateShot = async (shotId: string, data: Partial<Shot>) => {
    try {
      const updated = await shotApi.updateShot(shotId, data);
      setShots(shots.map((s) => (s.id === shotId ? updated : s)));
      setEditingShot(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : '保存失败');
    }
  };

  const handleDeleteShot = async (shotId: string) => {
    if (!confirm('确定要删除这个镜头吗？')) return;
    try {
      await shotApi.deleteShot(shotId);
      setShots(shots.filter((s) => s.id !== shotId));
      setSelectedShotIds((prev) => {
        const next = new Set(prev);
        next.delete(shotId);
        return next;
      });
    } catch (err) {
      alert(err instanceof Error ? err.message : '删除失败');
    }
  };

  const handleReorder = async (shotId: string, newIndex: number) => {
    if (!projectId) return;
    try {
      const result = await shotApi.reorderShots(projectId, shotId, newIndex);
      setShots(result.shots);
    } catch (err) {
      console.error('排序失败:', err);
      loadShots();
    }
  };

  const toggleSelect = (shotId: string) => {
    setSelectedShotIds((prev) => {
      const next = new Set(prev);
      if (next.has(shotId)) {
        next.delete(shotId);
      } else {
        next.add(shotId);
      }
      return next;
    });
  };

  const clearSelection = () => {
    setSelectedShotIds(new Set());
  };

  const handleBatchDelete = async () => {
    if (selectedShotIds.size === 0) return;
    try {
      await shotApi.batchDelete(Array.from(selectedShotIds));
      setShots(shots.filter((s) => !selectedShotIds.has(s.id)));
      setSelectedShotIds(new Set());
      setShowBatchModal(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : '批量删除失败');
    }
  };

  const handleBatchSetDuration = async () => {
    if (selectedShotIds.size === 0) return;
    try {
      await shotApi.batchSetDuration(Array.from(selectedShotIds), batchDuration);
      setShots(shots.map((s) =>
        selectedShotIds.has(s.id) ? { ...s, duration: batchDuration } : s
      ));
      setShowBatchModal(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : '批量设置失败');
    }
  };

  const sortedShots = [...shots].sort((a, b) => a.shotIndex - b.shotIndex);

  return (
    <div className="shotboard-page">
      <header className="shotboard-header">
        <div className="header-left">
          <Link to="/dashboard" className="back-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            返回
          </Link>
          <div className="logo-small">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M9 9l6 3-6 3V9z" fill="currentColor" />
            </svg>
            <span>ShotBoard Studio</span>
          </div>
        </div>
        <div className="header-right">
          <span className="user-email">{user.email}</span>
          <button className="logout-btn" onClick={onLogout}>
            退出登录
          </button>
        </div>
      </header>

      <main className="shotboard-main">
        {loading ? (
          <div className="loading-state">加载中...</div>
        ) : (
          <div className="shotboard-layout">
            <div className="shots-section">
              <div className="section-toolbar">
                <h2 className="section-title">镜头序列</h2>
                <div className="toolbar-actions">
                  {selectedShotIds.size > 0 && (
                    <>
                      <span className="selection-count">
                        已选 {selectedShotIds.size} 个
                      </span>
                      <button
                        className="toolbar-btn danger"
                        onClick={() => setShowBatchModal('delete')}
                      >
                        批量删除
                      </button>
                      <button
                        className="toolbar-btn"
                        onClick={() => setShowBatchModal('duration')}
                      >
                        批量设时长
                      </button>
                      <button
                        className="toolbar-btn secondary"
                        onClick={clearSelection}
                      >
                        取消选择
                      </button>
                    </>
                  )}
                  <button className="add-shot-btn" onClick={handleCreateShot}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    添加镜头
                  </button>
                </div>
              </div>

              <ShotBoard
                shots={sortedShots}
                selectedIds={selectedShotIds}
                onEdit={(shot) => setEditingShot(shot)}
                onDelete={handleDeleteShot}
                onReorder={handleReorder}
                onToggleSelect={toggleSelect}
              />
            </div>

            <div className="preview-section">
              <div className="section-toolbar">
                <h2 className="section-title">预览播放</h2>
              </div>
              <PreviewPlayer shots={sortedShots} />
            </div>
          </div>
        )}
      </main>

      {editingShot && (
        <ShotEditor
          shot={editingShot}
          onClose={() => setEditingShot(null)}
          onSave={(data) => handleUpdateShot(editingShot.id, data)}
        />
      )}

      {showBatchModal && (
        <div className="modal-overlay" onClick={() => setShowBatchModal(null)}>
          <div
            className="modal-content modal-small"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="modal-title">
              {showBatchModal === 'delete' ? '批量删除' : '批量设置时长'}
            </h2>
            {showBatchModal === 'delete' ? (
              <p className="modal-text">
                确定要删除选中的 {selectedShotIds.size} 个镜头吗？此操作不可撤销。
              </p>
            ) : (
              <div className="form-group">
                <label className="form-label">设置时长（秒）</label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  className="form-input"
                  value={batchDuration}
                  onChange={(e) => setBatchDuration(Math.max(0.5, parseFloat(e.target.value) || 0.5))}
                  autoFocus
                />
              </div>
            )}
            <div className="modal-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setShowBatchModal(null)}
              >
                取消
              </button>
              <button
                type="button"
                className={showBatchModal === 'delete' ? 'btn-danger' : 'btn-primary'}
                onClick={showBatchModal === 'delete' ? handleBatchDelete : handleBatchSetDuration}
              >
                确认
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ShotBoardPage;
