import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAppStore, Note, NoteSection, api } from '../store';

const NoteDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, updateNote } = useAppStore();
  const [note, setNote] = useState<Note | null>(null);
  const [selectedSection, setSelectedSection] = useState<NoteSection | null>(null);
  const [loading, setLoading] = useState(true);
  const [pledging, setPledging] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [hasPledged, setHasPledged] = useState(false);

  useEffect(() => {
    fetchNote();
  }, [id]);

  const fetchNote = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/notes/${id}`);
      setNote(res.data);
      if (res.data.current_amount >= res.data.target_amount && res.data.sections?.length > 0) {
        setSelectedSection(res.data.sections[0]);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadSection = async (section: NoteSection) => {
    if (!user) {
      alert('请先登录');
      return;
    }
    if (!note || note.current_amount < note.target_amount) {
      alert('需要众筹完成后才能阅读');
      return;
    }
    try {
      const res = await api.get(`/notes/${id}/sections/${section.id}`);
      setSelectedSection(res.data);
    } catch (e: any) {
      alert(e.response?.data?.message || '加载失败');
    }
  };

  const handlePledge = async () => {
    if (!user) {
      alert('请先登录');
      return;
    }
    if (!note) return;
    setPledging(true);
    try {
      const res = await api.post(`/notes/${id}/pledge`);
      setHasPledged(true);
      const updatedNote = { ...note, current_amount: res.data.current_amount };
      setNote(updatedNote);
      updateNote(updatedNote);
      alert(res.data.message);
    } catch (e: any) {
      alert(e.response?.data?.message || '众筹失败');
    } finally {
      setPledging(false);
    }
  };

  const handleRate = async (rating: number) => {
    if (!user) {
      alert('请先登录');
      return;
    }
    try {
      const res = await api.post(`/notes/${id}/rate`, { rating });
      if (note) {
        setNote({ ...note, avg_rating: res.data.avg_rating, rating_count: res.data.rating_count });
      }
      setUserRating(rating);
      alert('评分成功');
    } catch (e: any) {
      alert(e.response?.data?.message || '评分失败');
    }
  };

  if (loading) return <div className="page"><div className="empty-state">加载中...</div></div>;
  if (!note) return <div className="page"><div className="empty-state">笔记不存在</div></div>;

  const progress = Math.min((note.current_amount / note.target_amount) * 100, 100);
  const isUnlocked = note.current_amount >= note.target_amount;
  const isCreator = user && user.id === note.creator_id;
  const canRead = isUnlocked && (hasPledged || isCreator);

  const getProgressColor = () => {
    if (progress >= 100) return '#2ECC71';
    const r = Math.round(231 - (231 - 46) * (progress / 100));
    const g = Math.round(76 + (204 - 76) * (progress / 100));
    const b = Math.round(60 + (113 - 60) * (progress / 100));
    return `rgb(${r}, ${g}, ${b})`;
  };

  return (
    <div className="page">
      <button
        className="btn btn-ghost"
        style={{ marginBottom: 20 }}
        onClick={() => navigate(-1)}
      >
        ← 返回列表
      </button>

      <div className="note-detail">
        <div className="note-detail-left">
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#2C3E50', marginBottom: 8 }}>{note.title}</h1>
          <span className="note-subject">{note.subject}</span>

          <div style={{ marginTop: 20 }}>
            <div style={{ fontSize: 13, color: '#7F8C8D', marginBottom: 8 }}>众筹进度</div>
            <div className="progress-bar" style={{ height: 12 }}>
              <motion.div
                className="progress-fill"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%`, backgroundColor: getProgressColor() }}
                transition={{ duration: 2, ease: 'easeInOut' }}
              />
            </div>
            <div className="progress-text" style={{ marginTop: 6 }}>
              <span style={{ fontWeight: 600, color: '#2C3E50' }}>¥{note.current_amount}</span>
              <span> / ¥{note.target_amount} ({progress.toFixed(0)}%)</span>
            </div>
          </div>

          {!isUnlocked && (
            <button
              className="btn btn-accent"
              style={{ width: '100%', marginTop: 20 }}
              onClick={handlePledge}
              disabled={pledging}
            >
              {pledging ? '众筹中...' : '参与众筹（¥10）'}
            </button>
          )}

          {isUnlocked && user && (
            <div style={{ marginTop: 20 }}>
              <div style={{ fontSize: 13, color: '#7F8C8D', marginBottom: 8 }}>为笔记评分</div>
              <div className="stars">
                {[1, 2, 3, 4, 5].map((r) => (
                  <span
                    key={r}
                    className={`star ${userRating >= r ? 'active' : ''}`}
                    onClick={() => handleRate(r)}
                  >
                    ★
                  </span>
                ))}
                {note.rating_count && note.rating_count > 0 && (
                  <span style={{ marginLeft: 8, alignSelf: 'center', fontSize: 13, color: '#888' }}>
                    {(note.avg_rating || 0).toFixed(1)} / 5 ({note.rating_count})
                  </span>
                )}
              </div>
            </div>
          )}

          <div style={{ marginTop: 24 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#2C3E50', marginBottom: 8 }}>笔记目录</div>
            <ul className="toc-list">
              {note.sections?.map((sec) => (
                <li
                  key={sec.id}
                  className={`toc-item ${selectedSection?.id === sec.id ? 'active' : ''}`}
                  onClick={() => loadSection(sec)}
                >
                  {sec.position}. {sec.section_title}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="note-detail-right">
          {!isUnlocked ? (
            <div className="locked-content">
              <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
              <h3 style={{ marginBottom: 8 }}>笔记尚未解锁</h3>
              <p>该笔记众筹进度达到 100% 后，所有参与者即可阅读全文。</p>
              <p style={{ marginTop: 8, fontSize: 13 }}>每次支持 ¥10，当前进度 {progress.toFixed(0)}%</p>
            </div>
          ) : selectedSection ? (
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 600, color: '#2C3E50', marginBottom: 8 }}>
                {selectedSection.section_title}
              </h2>
              <div className="note-content">{selectedSection.content}</div>
            </div>
          ) : (
            <div className="locked-content">
              <div style={{ fontSize: 48, marginBottom: 16 }}>📖</div>
              <p>请从左侧目录选择章节开始阅读</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NoteDetailPage;
