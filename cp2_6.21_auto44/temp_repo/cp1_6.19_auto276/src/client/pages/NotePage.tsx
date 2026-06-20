import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAppStore, Note, api } from '../store';

const SUBJECTS = ['数学', '物理', '化学', '计算机', '文学', '语言', '历史', '哲学'];

const NotePage = () => {
  const { notes, fetchNotes, user, updateNote } = useAppStore();
  const navigate = useNavigate();
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({
    title: '',
    subject: '数学',
    target_amount: '100',
    sections: [{ section_title: '', content: '' }],
  });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert('请先登录');
      return;
    }
    setCreating(true);
    try {
      const validSections = createForm.sections.filter(
        (s) => s.section_title.trim() && s.content.trim() && s.content.trim().length >= 50
      );
      if (validSections.length === 0) {
        alert('请至少填写一个有效的章节（内容不少于50字）');
        setCreating(false);
        return;
      }
      await api.post('/notes', { ...createForm, sections: validSections });
      setShowCreate(false);
      setCreateForm({ title: '', subject: '数学', target_amount: '100', sections: [{ section_title: '', content: '' }] });
      fetchNotes();
    } catch (err: any) {
      alert(err.response?.data?.message || '创建失败');
    } finally {
      setCreating(false);
    }
  };

  const addSection = () => {
    setCreateForm({
      ...createForm,
      sections: [...createForm.sections, { section_title: '', content: '' }],
    });
  };

  const updateSection = (i: number, field: string, value: string) => {
    const sections = [...createForm.sections];
    (sections[i] as any)[field] = value;
    setCreateForm({ ...createForm, sections });
  };

  const removeSection = (i: number) => {
    if (createForm.sections.length <= 1) return;
    const sections = createForm.sections.filter((_, idx) => idx !== i);
    setCreateForm({ ...createForm, sections });
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 100) return '#2ECC71';
    const r = Math.round(231 - (231 - 46) * (progress / 100));
    const g = Math.round(76 + (204 - 76) * (progress / 100));
    const b = Math.round(60 + (113 - 60) * (progress / 100));
    return `rgb(${r}, ${g}, ${b})`;
  };

  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(<span key={i} style={{ opacity: i <= Math.round(rating) ? 1 : 0.3 }}>★</span>);
    }
    return stars;
  };

  return (
    <div className="page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 className="page-title" style={{ marginBottom: 0 }}>笔记众筹</h1>
        <button className="btn btn-accent" onClick={() => setShowCreate(true)}>
          + 创建笔记项目
        </button>
      </div>

      {notes.length === 0 ? (
        <div className="empty-state">暂无笔记项目</div>
      ) : (
        <div className="notes-grid">
          {notes.map((note) => {
            const progress = Math.min((note.current_amount / note.target_amount) * 100, 100);
            return (
              <div key={note.id} className="note-card" onClick={() => navigate(`/notes/${note.id}`)}>
                <h3 className="note-title">{note.title}</h3>
                <span className="note-subject">{note.subject}</span>
                <div className="progress-bar">
                  <motion.div
                    className="progress-fill"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%`, backgroundColor: getProgressColor(progress) }}
                    transition={{ duration: 2, ease: 'easeInOut' }}
                  />
                </div>
                <div className="progress-text">
                  <span>¥{note.current_amount} / ¥{note.target_amount}</span>
                  <span>{progress.toFixed(0)}%</span>
                </div>
                {note.rating_count && note.rating_count > 0 && (
                  <div className="rating">
                    {renderStars(note.avg_rating || 0)}
                    <span style={{ marginLeft: 4 }}>{(note.avg_rating || 0).toFixed(1)} ({note.rating_count})</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 560, maxHeight: '85vh', overflowY: 'auto' }}>
            <h2 className="modal-title">创建笔记众筹</h2>
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label className="form-label">笔记标题</label>
                <input
                  className="form-input"
                  value={createForm.title}
                  onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                  placeholder="请输入笔记标题"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">科目</label>
                <select
                  className="form-input"
                  value={createForm.subject}
                  onChange={(e) => setCreateForm({ ...createForm, subject: e.target.value })}
                >
                  {SUBJECTS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">目标金额（元）</label>
                <input
                  className="form-input"
                  type="number"
                  min="10"
                  value={createForm.target_amount}
                  onChange={(e) => setCreateForm({ ...createForm, target_amount: e.target.value })}
                  required
                />
              </div>

              <h3 style={{ fontSize: 15, marginTop: 20, marginBottom: 12, color: '#2C3E50' }}>笔记章节</h3>
              {createForm.sections.map((sec, i) => (
                <div key={i} style={{ background: '#f8f9fa', padding: 14, borderRadius: 10, marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>章节 {i + 1}</span>
                    {createForm.sections.length > 1 && (
                      <button type="button" onClick={() => removeSection(i)} style={{ color: '#E74C3C', background: 'none', fontSize: 13 }}>
                        删除
                      </button>
                    )}
                  </div>
                  <div className="form-group" style={{ marginBottom: 10 }}>
                    <label className="form-label">章节标题</label>
                    <input
                      className="form-input"
                      value={sec.section_title}
                      onChange={(e) => updateSection(i, 'section_title', e.target.value)}
                      placeholder="章节标题"
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">章节内容（200-500字）</label>
                    <textarea
                      className="form-textarea"
                      value={sec.content}
                      onChange={(e) => updateSection(i, 'content', e.target.value)}
                      placeholder="请输入章节内容..."
                      rows={5}
                    />
                    <div style={{ fontSize: 11, color: '#999', marginTop: 4 }}>{sec.content.length} 字</div>
                  </div>
                </div>
              ))}
              <button type="button" className="btn btn-ghost" style={{ width: '100%' }} onClick={addSection}>
                + 添加章节
              </button>

              <div className="form-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setShowCreate(false)}>
                  取消
                </button>
                <button type="submit" className="btn btn-accent" disabled={creating}>
                  {creating ? '创建中...' : '确认创建'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotePage;
