import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { QuestionData, SurveyData } from '../types';
import { createSurvey, updateSurvey, getSurvey } from '../api';

const QUESTION_TYPES: { type: 'single' | 'multiple' | 'text'; label: string; icon: string }[] = [
  { type: 'single', label: '单选题', icon: '◉' },
  { type: 'multiple', label: '多选题', icon: '☑' },
  { type: 'text', label: '文本题', icon: '✎' }
];

export default function Editor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [title, setTitle] = useState('我的问卷');
  const [description, setDescription] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [questions, setQuestions] = useState<QuestionData[]>([]);
  const [saving, setSaving] = useState(false);
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const [loading, setLoading] = useState(!!id);
  const dragTimerRef = useRef<number>();

  useEffect(() => {
    if (id) {
      loadSurvey();
    }
  }, [id]);

  async function loadSurvey() {
    try {
      const data = await getSurvey(id!);
      setTitle(data.title);
      setDescription(data.description || '');
      setStartTime(data.start_time ? data.start_time.slice(0, 16) : '');
      setEndTime(data.end_time ? data.end_time.slice(0, 16) : '');
      setQuestions(data.questions.map((q: any) => ({
        id: q.id,
        type: q.type,
        title: q.title,
        required: q.required === 1,
        options: q.options || [],
        sortOrder: q.sort_order
      })));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  function addQuestion(type: 'single' | 'multiple' | 'text') {
    const newQ: QuestionData = {
      id: uuidv4(),
      type,
      title: '',
      required: false,
      options: type === 'text' ? [] : ['选项1', '选项2'],
      sortOrder: questions.length
    };
    setQuestions([...questions, newQ]);
  }

  function updateQuestion(qid: string, updates: Partial<QuestionData>) {
    setQuestions(questions.map(q => q.id === qid ? { ...q, ...updates } : q));
  }

  function deleteQuestion(qid: string) {
    setQuestions(questions.filter(q => q.id !== qid).map((q, i) => ({ ...q, sortOrder: i })));
  }

  function addOption(qid: string) {
    const q = questions.find(x => x.id === qid);
    if (!q) return;
    updateQuestion(qid, { options: [...q.options, `选项${q.options.length + 1}`] });
  }

  function updateOption(qid: string, idx: number, value: string) {
    const q = questions.find(x => x.id === qid);
    if (!q) return;
    const newOpts = [...q.options];
    newOpts[idx] = value;
    updateQuestion(qid, { options: newOpts });
  }

  function deleteOption(qid: string, idx: number) {
    const q = questions.find(x => x.id === qid);
    if (!q || q.options.length <= 2) return;
    updateQuestion(qid, { options: q.options.filter((_, i) => i !== idx) });
  }

  function handleDragStart(e: React.DragEvent, idx: number) {
    setDraggedIdx(idx);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(idx));
  }

  function handleDragOver(e: React.DragEvent, idx: number) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragTimerRef.current) cancelAnimationFrame(dragTimerRef.current);
    dragTimerRef.current = requestAnimationFrame(() => {
      if (dragOverIdx !== idx) setDragOverIdx(idx);
    });
  }

  function handleDragLeave() {
    // handled by dragOver
  }

  function handleDrop(e: React.DragEvent, targetIdx: number) {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === targetIdx) {
      setDraggedIdx(null);
      setDragOverIdx(null);
      return;
    }
    const newQs = [...questions];
    const [moved] = newQs.splice(draggedIdx, 1);
    newQs.splice(targetIdx, 0, moved);
    setQuestions(newQs.map((q, i) => ({ ...q, sortOrder: i })));
    setDraggedIdx(null);
    setDragOverIdx(null);
  }

  function handleDragEnd() {
    setDraggedIdx(null);
    setDragOverIdx(null);
  }

  async function handleSave(publish: boolean) {
    if (questions.length === 0) {
      alert('请至少添加一道题目');
      return;
    }
    for (const q of questions) {
      if (!q.title.trim()) {
        alert('所有题目都需要填写标题');
        return;
      }
      if (q.type !== 'text' && q.options.some(o => !o.trim())) {
        alert('选项不能为空');
        return;
      }
    }
    if (!title.trim()) {
      alert('请填写问卷标题');
      return;
    }

    setSaving(true);
    const data: SurveyData = {
      title,
      description,
      startTime: startTime || null,
      endTime: endTime || null,
      questions
    };

    try {
      if (id) {
        await updateSurvey(id, data);
        if (publish) navigate(`/admin/share/${id}`);
        else alert('保存成功');
      } else {
        const { id: newId } = await createSurvey(data);
        if (publish) navigate(`/admin/share/${newId}`);
        else navigate(`/admin/editor/${newId}`);
      }
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="page-container"><div className="card" style={{ textAlign: 'center', padding: 48 }}>加载中...</div></div>;
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">{id ? '编辑问卷' : '创建问卷'}</h1>
          <p className="page-subtitle">拖拽题目调整顺序，右侧实时预览效果</p>
        </div>
        <div className="header-actions">
          <Link to="/admin/surveys" className="btn btn-secondary">返回列表</Link>
          <button className="btn btn-secondary" onClick={() => handleSave(false)} disabled={saving}>
            {saving ? '保存中...' : '保存草稿'}
          </button>
          <button className="btn" onClick={() => handleSave(true)} disabled={saving}>
            {saving ? '发布中...' : '发布问卷'}
          </button>
        </div>
      </div>

      <div
        className="editor-layout"
        style={{
          maxWidth: 1400,
          margin: '0 auto',
          display: 'flex',
          gap: 24,
          alignItems: 'flex-start'
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="card fade-in" style={{ marginBottom: 20 }}>
            <h3 style={{ color: 'var(--primary)', marginBottom: 16, fontSize: 16 }}>问卷信息</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, color: 'var(--text-light)', marginBottom: 6 }}>问卷标题</label>
                <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="请输入问卷标题" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, color: 'var(--text-light)', marginBottom: 6 }}>问卷描述</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="请输入问卷描述（可选）" rows={3} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, color: 'var(--text-light)', marginBottom: 6 }}>开始时间</label>
                  <input type="datetime-local" value={startTime} onChange={e => setStartTime(e.target.value)} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, color: 'var(--text-light)', marginBottom: 6 }}>结束时间</label>
                  <input type="datetime-local" value={endTime} onChange={e => setEndTime(e.target.value)} />
                </div>
              </div>
            </div>
          </div>

          <div className="card fade-in" style={{ marginBottom: 20 }}>
            <h3 style={{ color: 'var(--primary)', marginBottom: 16, fontSize: 16 }}>添加题目</h3>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {QUESTION_TYPES.map(qt => (
                <button
                  key={qt.type}
                  className="btn btn-secondary"
                  onClick={() => addQuestion(qt.type)}
                  style={{ padding: '12px 20px' }}
                >
                  <span style={{ fontSize: 16, marginRight: 6 }}>{qt.icon}</span>
                  {qt.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {questions.map((q, idx) => (
              <div
                key={q.id}
                className="card fade-in"
                draggable
                onDragStart={(e) => handleDragStart(e, idx)}
                onDragOver={(e) => handleDragOver(e, idx)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, idx)}
                onDragEnd={handleDragEnd}
                style={{
                  cursor: draggedIdx === idx ? 'grabbing' : 'grab',
                  opacity: draggedIdx === idx ? 0.5 : 1,
                  borderTop: dragOverIdx === idx && draggedIdx !== idx ? '3px solid var(--accent)' : '1px solid rgba(255, 255, 255, 0.3)',
                  transition: draggedIdx !== null ? 'none' : 'all 0.2s ease',
                  animationDelay: `${idx * 30}ms`
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
                    <span style={{ color: 'var(--accent)', fontWeight: 600, fontSize: 14, userSelect: 'none' }}>⋮⋮ Q{idx + 1}</span>
                    <select
                      value={q.type}
                      onChange={e => updateQuestion(q.id, { type: e.target.value as any, options: e.target.value === 'text' ? [] : ['选项1', '选项2'] })}
                      style={{ width: 'auto', padding: '6px 10px', fontSize: 13 }}
                    >
                      <option value="single">单选题</option>
                      <option value="multiple">多选题</option>
                      <option value="text">文本题</option>
                    </select>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={q.required}
                        onChange={e => updateQuestion(q.id, { required: e.target.checked })}
                        style={{ accentColor: 'var(--accent)', width: 16, height: 16 }}
                      />
                      必填
                    </label>
                    <button
                      className="btn btn-danger"
                      onClick={() => deleteQuestion(q.id)}
                      style={{ padding: '6px 10px', fontSize: 12 }}
                    >
                      删除
                    </button>
                  </div>
                </div>
                <input
                  type="text"
                  value={q.title}
                  onChange={e => updateQuestion(q.id, { title: e.target.value })}
                  placeholder="请输入题目内容"
                  style={{ marginBottom: q.type === 'text' ? 0 : 14 }}
                />
                {q.type !== 'text' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {q.options.map((opt, oi) => (
                      <div key={oi} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <span style={{ color: 'var(--text-light)', fontSize: 13, width: 20, textAlign: 'center' }}>
                          {q.type === 'single' ? '◉' : '☑'}
                        </span>
                        <input
                          type="text"
                          value={opt}
                          onChange={e => updateOption(q.id, oi, e.target.value)}
                          placeholder={`选项${oi + 1}`}
                        />
                        <button
                          className="btn btn-danger"
                          onClick={() => deleteOption(q.id, oi)}
                          disabled={q.options.length <= 2}
                          style={{ padding: '6px 10px', fontSize: 12, opacity: q.options.length <= 2 ? 0.4 : 1, cursor: q.options.length <= 2 ? 'not-allowed' : 'pointer' }}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    <button
                      className="btn btn-secondary"
                      onClick={() => addOption(q.id)}
                      style={{ alignSelf: 'flex-start', padding: '6px 14px', fontSize: 13, marginTop: 4 }}
                    >
                      + 添加选项
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {questions.length === 0 && (
            <div className="card fade-in" style={{ textAlign: 'center', padding: 48 }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>📝</div>
              <p style={{ color: 'var(--text-light)' }}>点击上方按钮添加第一题</p>
            </div>
          )}
        </div>

        <div className="phone-preview-wrapper" style={{ width: 380, flexShrink: 0, position: 'sticky', top: 24 }}>
          <div
            style={{
              background: '#1a1a1a',
              borderRadius: 36,
              padding: 14,
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.25)',
              transition: 'opacity 0.3s ease'
            }}
          >
            <div
              style={{
                background: '#f5f7fa',
                borderRadius: 24,
                overflow: 'hidden',
                height: 640,
                position: 'relative'
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: 100,
                  height: 24,
                  background: '#1a1a1a',
                  borderRadius: '0 0 16px 16px',
                  zIndex: 10
                }}
              />
              <div
                style={{
                  height: '100%',
                  overflowY: 'auto',
                  padding: '40px 16px 20px',
                  scrollbarWidth: 'thin'
                }}
              >
                <div style={{ background: 'white', borderRadius: 12, padding: 16, marginBottom: 12 }}>
                  <h2 style={{ color: 'var(--primary)', fontSize: 18, marginBottom: 6 }}>
                    {title || '问卷标题'}
                  </h2>
                  {description && (
                    <p style={{ color: 'var(--text-light)', fontSize: 12, lineHeight: 1.5 }}>
                      {description}
                    </p>
                  )}
                </div>
                {questions.map((q, idx) => (
                  <div key={q.id} style={{ background: 'white', borderRadius: 12, padding: 14, marginBottom: 10 }}>
                    <div style={{ marginBottom: 10 }}>
                      <span style={{ color: 'var(--accent)', fontWeight: 600, fontSize: 12, marginRight: 4 }}>Q{idx + 1}.</span>
                      <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>
                        {q.title || '题目内容'}
                      </span>
                      {q.required && <span style={{ color: '#f44336', fontSize: 12, marginLeft: 2 }}>*</span>}
                    </div>
                    {q.type === 'single' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {q.options.map((opt, oi) => (
                          <div key={oi} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: 'rgba(0,0,0,0.02)', borderRadius: 8 }}>
                            <div style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid #ccc' }} />
                            <span style={{ fontSize: 12 }}>{opt || `选项${oi + 1}`}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {q.type === 'multiple' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {q.options.map((opt, oi) => (
                          <div key={oi} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: 'rgba(0,0,0,0.02)', borderRadius: 8 }}>
                            <div style={{ width: 14, height: 14, borderRadius: 3, border: '2px solid #ccc' }} />
                            <span style={{ fontSize: 12 }}>{opt || `选项${oi + 1}`}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {q.type === 'text' && (
                      <div style={{ padding: '10px', background: 'rgba(0,0,0,0.02)', borderRadius: 8, fontSize: 12, color: 'var(--text-light)' }}>
                        请输入您的回答...
                      </div>
                    )}
                  </div>
                ))}
                {questions.length === 0 && (
                  <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-light)', fontSize: 12 }}>
                    添加题目后在此预览
                  </div>
                )}
              </div>
            </div>
          </div>
          <p style={{ textAlign: 'center', color: 'var(--text-light)', fontSize: 12, marginTop: 12 }}>手机端实时预览</p>
        </div>
      </div>
    </div>
  );
}
