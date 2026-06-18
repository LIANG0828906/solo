import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { BoardCard } from './BoardCard';
import { useStore } from '@/store';
import { api } from '@/api';

export function BoardList() {
  const { boards, fetchBoards, createBoard, user } = useStore();
  const [showModal, setShowModal] = useState(false);
  const [newBoard, setNewBoard] = useState({ name: '', description: '' });
  const [taskCounts, setTaskCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (user) {
      fetchBoards();
    }
  }, [user, fetchBoards]);

  useEffect(() => {
    const loadTaskCounts = async () => {
      const counts: Record<string, number> = {};
      for (const board of boards) {
        const tasks = await api.getTasks(board.id);
        counts[board.id] = tasks.length;
      }
      setTaskCounts(counts);
    };
    loadTaskCounts();
  }, [boards]);

  const handleCreateBoard = async () => {
    if (!newBoard.name.trim()) return;

    try {
      await createBoard(newBoard.name.trim(), newBoard.description.trim());
      setNewBoard({ name: '', description: '' });
      setShowModal(false);
    } catch (err) {
      console.error('Failed to create board:', err);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: 700, color: 'white', marginBottom: '8px' }}>
            我的看板
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '16px' }}>
            管理你的项目和团队任务
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={20} />
          创建看板
        </button>
      </div>

      {boards.length === 0 ? (
        <div className="glass" style={{
          borderRadius: '16px',
          padding: '60px 24px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
          <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '8px', color: 'var(--color-primary)' }}>
            还没有看板
          </h2>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: '24px' }}>
            创建你的第一个看板，开始敏捷之旅
          </p>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={20} />
            创建看板
          </button>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '20px',
        }}>
          {boards.map((board) => (
            <BoardCard key={board.id} board={board} taskCount={taskCounts[board.id] || 0} />
          ))}
        </div>
      )}

      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(4px)',
        }} onClick={() => setShowModal(false)}>
          <div
            className="glass animate-fade-in"
            style={{
              borderRadius: '16px',
              padding: '32px',
              width: '100%',
              maxWidth: '480px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '24px', color: 'var(--color-primary)' }}>
              创建新看板
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '8px' }}>
                  看板名称 *
                </label>
                <input
                  type="text"
                  className="input"
                  placeholder="输入看板名称"
                  value={newBoard.name}
                  onChange={(e) => setNewBoard({ ...newBoard, name: e.target.value })}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '8px' }}>
                  看板描述
                </label>
                <textarea
                  className="textarea"
                  placeholder="输入看板描述（可选）"
                  value={newBoard.description}
                  onChange={(e) => setNewBoard({ ...newBoard, description: e.target.value })}
                />
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  style={{ flex: 1 }}
                  onClick={() => {
                    setShowModal(false);
                    setNewBoard({ name: '', description: '' });
                  }}
                >
                  取消
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                  onClick={handleCreateBoard}
                  disabled={!newBoard.name.trim()}
                >
                  创建
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
