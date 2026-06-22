import React, { useCallback, useEffect, useState } from 'react';
import { api } from '../api/client';
import { CreateModal } from './CreateModal';

interface StoryboardSummary {
  id: string;
  title: string;
  cover: string;
  createdAt: string;
  updatedAt: string;
}

interface Props {
  onNavigate: (route: { name: 'editor' | 'viewer'; id: string }) => void;
  notify: (msg: string) => void;
}

export const StoryboardList: React.FC<Props> = ({ onNavigate, notify }) => {
  const [list, setList] = useState<StoryboardSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.listStoryboards();
      setList(data);
    } catch (err) {
      notify('加载失败：' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleCreate = async (payload: { title: string; cover: string }) => {
    setSubmitting(true);
    try {
      const sb = await api.createStoryboard(payload);
      notify('创建成功');
      setCreateOpen(false);
      onNavigate({ name: 'editor', id: sb.id });
    } catch (err) {
      notify('创建失败：' + (err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm('确定删除该故事板吗？')) return;
    try {
      await api.deleteStoryboard(id);
      notify('已删除');
      await load();
    } catch (err) {
      notify('删除失败：' + (err as Error).message);
    }
  };

  const fmt = (iso: string) => {
    const d = new Date(iso);
    return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  return (
    <div className="list-page">
      <div className="list-header">
        <h1 className="list-title"><span className="dot">◆</span>Storyboard Studio</h1>
        <button className="btn btn-primary" onClick={() => setCreateOpen(true)}>
          <span style={{ fontSize: 18, lineHeight: 1 }}>+</span> 新建故事板
        </button>
      </div>

      {loading ? (
        <div className="loading-wrap"><div className="spinner" /></div>
      ) : list.length === 0 ? (
        <div className="sb-empty">
          <h3>还没有故事板</h3>
          <p>点击右上角「新建故事板」开始创作你的第一个系列作品集</p>
        </div>
      ) : (
        <div className="list-grid">
          {list.map((sb) => (
            <div
              key={sb.id}
              className="sb-card"
              onClick={() => onNavigate({ name: 'editor', id: sb.id })}
            >
              <button
                className="sb-delete"
                title="删除"
                onClick={(e) => handleDelete(e, sb.id)}
              >
                ✕
              </button>
              <div className="sb-cover">
                {sb.cover ? <img src={sb.cover} alt="" loading="lazy" /> : null}
              </div>
              <div className="sb-body">
                <h3 className="sb-title">{sb.title}</h3>
                <p className="sb-date">更新于 {fmt(sb.updatedAt)}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <CreateModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={handleCreate}
        submitting={submitting}
      />
    </div>
  );
};
