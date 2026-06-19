import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { store } from '../store';
import { eventBus } from '../eventBus';
import { AppEventType, Assignment as IAssignment, Submission, ScoreRecord, ScoreDimension, AppState, ScoreSubmittedPayload } from '../types';
import { recomputeForAssignment } from '../eval/ScoringEngine';
import { DashboardPanel } from '../dashboard/DashboardPanel';

eventBus.on(AppEventType.SCORE_SUBMITTED, (payload) => {
  const p = payload as ScoreSubmittedPayload;
  const t0 = performance.now();
  recomputeForAssignment(p.assignmentId);
  const t1 = performance.now();
  if (t1 - t0 > 200) {
    console.warn(`[Perf] 评分一致性计算耗时 ${(t1 - t0).toFixed(1)}ms，超过200ms阈值`);
  }
});

function parseContent(content: string): { paragraphs: string[]; keywords: string[] } {
  const paragraphs = content
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
  let keywords: string[] = [];
  if (content.length >= 100) {
    const freq = new Map<string, number>();
    const tokens = content
      .replace(/[#>*`\-=\[\]().,:;!?。，、；：""''（）《》【】0-9a-zA-Z\n\r\t]/g, ' ')
      .split(/\s+/)
      .filter((t) => t.length >= 2);
    for (const t of tokens) {
      freq.set(t, (freq.get(t) || 0) + 1);
    }
    keywords = Array.from(freq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map((e) => e[0]);
  }
  return { paragraphs, keywords };
}

export const AssignmentBoard: React.FC = () => {
  const [state, setState] = useState<AppState>(store.getState());
  const [createOpen, setCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDeadline, setNewDeadline] = useState('');
  const [newTotal, setNewTotal] = useState('15');
  const [newDims, setNewDims] = useState('逻辑清晰度\n格式规范\n创新性');
  const [content, setContent] = useState('');
  const [reviewScores, setReviewScores] = useState<Record<string, Record<string, number>>>({});
  const [tab, setTab] = useState<'submit' | 'review' | 'dashboard'>('submit');

  useEffect(() => {
    const unsub = store.subscribe(() => setState({ ...store.getState() }));
    return unsub;
  }, []);

  const selectedId = state.selectedAssignmentId;
  const assignment: IAssignment | undefined = state.assignments.find((a) => a.id === selectedId);

  const mySubmission: Submission | undefined = assignment
    ? state.submissions.find((s) => s.assignmentId === assignment.id && s.studentId === state.currentUserId)
    : undefined;

  const assignedSubmissions = useMemo(() => {
    if (!assignment) return [];
    const myId = state.currentUserId;
    const allSubs = state.submissions.filter((s) => s.assignmentId === assignment.id && s.studentId !== myId && s.hasSubmitted);
    const reviewed = new Set(
      state.scoreRecords
        .filter((r) => r.assignmentId === assignment.id && r.raterId === myId)
        .map((r) => r.submissionId),
    );
    const byCount = new Map<string, number>();
    for (const r of state.scoreRecords.filter((r) => r.assignmentId === assignment.id)) {
      byCount.set(r.submissionId, (byCount.get(r.submissionId) || 0) + 1);
    }
    const toReview = allSubs
      .filter((s) => !reviewed.has(s.id))
      .sort((a, b) => (byCount.get(a.id) || 0) - (byCount.get(b.id) || 0));
    const shuffled = [...toReview].sort(() => Math.random() - 0.5);
    return [...allSubs.filter((s) => reviewed.has(s.id)), ...shuffled].slice(0, 3);
  }, [assignment, state.submissions, state.scoreRecords, state.currentUserId]);

  const handleSubmitAssignment = useCallback(() => {
    if (!content.trim() || !assignment) return;
    const { paragraphs, keywords } = parseContent(content);
    const sub: Submission = {
      id: `SUB_${assignment.id}_${state.currentUserId}`,
      assignmentId: assignment.id,
      studentId: state.currentUserId,
      content,
      paragraphs,
      keywords,
      submittedAt: new Date().toISOString(),
      hasSubmitted: true,
    };
    store.submitSubmission(sub);
    setContent('');
  }, [content, assignment, state.currentUserId]);

  const handleCreateAssignment = () => {
    if (!newTitle.trim()) return;
    const dims: ScoreDimension[] = newDims
      .split(/\n+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
      .map((name, i) => ({ id: `d${i + 1}`, name, weight: 1 }));
    const a: IAssignment = {
      id: `A${Date.now()}`,
      title: newTitle.trim(),
      deadline: newDeadline || new Date(Date.now() + 7 * 86400000).toISOString(),
      totalScore: Number(newTotal) || 15,
      dimensions: dims.length > 0 ? dims : genDims(),
      createdAt: new Date().toISOString(),
      submittedCount: 0,
      reviewedCount: 0,
      totalStudents: state.students.length,
      status: 'submitting',
    };
    store.addAssignment(a);
    setCreateOpen(false);
    setNewTitle('');
    setNewDeadline('');
    setNewDims('逻辑清晰度\n格式规范\n创新性');
  };

  const handleScoreChange = (subId: string, dimId: string, value: number) => {
    setReviewScores((prev) => {
      const cur = prev[subId] || {};
      return { ...prev, [subId]: { ...cur, [dimId]: value } };
    });
  };

  const handleSubmitScore = (subId: string) => {
    if (!assignment) return;
    const scores = reviewScores[subId] || {};
    const filled = assignment.dimensions.every((d) => typeof scores[d.id] === 'number');
    if (!filled) return;
    const total = Object.values(scores).reduce((s, v) => s + v, 0);
    const record: ScoreRecord = {
      id: `REC_${Date.now()}_${subId}`,
      assignmentId: assignment.id,
      submissionId: subId,
      raterId: state.currentUserId,
      scores,
      totalScore: total,
      submittedAt: new Date().toISOString(),
    };
    store.addScoreRecord(record);
  };

  const getSubmittedCountForAssignment = (aId: string) =>
    state.submissions.filter((s) => s.assignmentId === aId && s.hasSubmitted).length;

  return (
    <div className="main-container">
      <aside className="left-panel">
        <div className="left-header">
          <h2 className="panel-title">作业列表</h2>
          {state.userRole === 'teacher' && (
            <button className="btn-primary" onClick={() => setCreateOpen(true)}>
              + 新建作业
            </button>
          )}
        </div>
        <div className="assignment-list">
          {state.assignments.map((a) => {
            const submitted = getSubmittedCountForAssignment(a.id);
            const isSelected = a.id === selectedId;
            return (
              <motion.div
                key={a.id}
                whileHover={{ y: -5, boxShadow: '0 10px 20px rgba(0,0,0,0.12)' }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                onClick={() => store.setSelectedAssignment(a.id)}
                className={`assignment-card ${isSelected ? 'selected' : ''} ${submitted > 0 ? 'has-submissions' : ''}`}
              >
                <div className="card-header">
                  <span className="card-status status-badge status-a">{statusText(a.status)}</span>
                </div>
                <h3 className="card-title">{a.title}</h3>
                <div className="card-meta">
                  <span>总分 {a.totalScore}</span>
                  <span>截止 {a.deadline.slice(0, 10)}</span>
                </div>
                <div className="card-footer">
                  <span className="ratio-text">
                    已提交 {submitted}/{a.totalStudents} · 已评阅 {a.reviewedCount}/{a.totalStudents}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </aside>

      <section className="right-panel">
        {assignment ? (
          <div className="detail-wrapper">
            <div className="detail-header">
              <h2 className="detail-title">{assignment.title}</h2>
              <div className="detail-meta">
                <span className="meta-tag">总分 {assignment.totalScore}</span>
                <span className="meta-tag">截止 {assignment.deadline.slice(0, 10)}</span>
                <span className="meta-tag">评分维度：{assignment.dimensions.map((d) => d.name).join(' / ')}</span>
              </div>
            </div>

            <div className="tabs">
              <button className={`tab ${tab === 'submit' ? 'active' : ''}`} onClick={() => setTab('submit')}>
                作业提交
              </button>
              <button className={`tab ${tab === 'review' ? 'active' : ''}`} onClick={() => setTab('review')}>
                匿名互评
              </button>
              <button className={`tab ${tab === 'dashboard' ? 'active' : ''}`} onClick={() => setTab('dashboard')}>
                评分分析
              </button>
            </div>

            <div className="tab-content">
              {tab === 'submit' && (
                <div className="submit-section">
                  <div className="section-title">提交区（支持粘贴Markdown，≥100字自动提取关键词）</div>
                  <div className="submit-area">
                    <textarea
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="在此输入作业内容或粘贴Markdown文本..."
                      className="content-textarea"
                    />
                  </div>
                  {mySubmission && (
                    <div className="submission-preview">
                      <div className="preview-label">已提交内容（字数 {mySubmission.content.length}）</div>
                      <div className="preview-body">
                        {mySubmission.paragraphs.map((p, i) => (
                          <p key={i} className="preview-paragraph">{p}</p>
                        ))}
                      </div>
                      {mySubmission.keywords.length > 0 && (
                        <div className="keywords-box">
                          <span className="keywords-label">提取关键词：</span>
                          {mySubmission.keywords.map((k, i) => (
                            <span key={i} className="keyword-tag">{k}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  <div className="submit-actions">
                    <span className="word-count">当前字数：{content.length}</span>
                    <button className="btn-primary" onClick={handleSubmitAssignment} disabled={!content.trim()}>
                      提交作业
                    </button>
                  </div>
                </div>
              )}

              {tab === 'review' && (
                <div className="review-section">
                  <div className="section-title">请对以下 {assignedSubmissions.length} 份匿名作业逐维度评分（5分制）</div>
                  <div className="review-list">
                    {assignedSubmissions.map((sub) => {
                      const existing = state.scoreRecords.find(
                        (r) =>
                          r.assignmentId === assignment.id &&
                          r.raterId === state.currentUserId &&
                          r.submissionId === sub.id,
                      );
                      const currentScores = reviewScores[sub.id] || (existing?.scores ?? {});
                      const allFilled = assignment.dimensions.every((d) => typeof currentScores[d.id] === 'number');
                      return (
                        <motion.div
                          key={sub.id}
                          layout
                          className="review-card"
                        >
                          <div className="review-card-head">
                            <span className="review-id">匿名作业 #{sub.id.slice(-4)}</span>
                            {existing && <span className="review-done-tag">✓ 已评阅</span>}
                          </div>
                          <div className="review-content-preview">
                            {sub.paragraphs.slice(0, 2).map((p, i) => (
                              <p key={i} className="preview-short">{p.slice(0, 120)}{p.length > 120 ? '...' : ''}</p>
                            ))}
                          </div>
                          <div className="dims-list">
                            {assignment.dimensions.map((d) => (
                              <div key={d.id} className="dim-row">
                                <label className="dim-label">{d.name}</label>
                                <div className="slider-wrapper">
                                  <input
                                    type="range"
                                    min={0.5}
                                    max={5}
                                    step={0.5}
                                    value={currentScores[d.id] ?? 2.5}
                                    onChange={(e) => handleScoreChange(sub.id, d.id, Number(e.target.value))}
                                    className="score-slider"
                                  />
                                  <span className="slider-value">{(currentScores[d.id] ?? 2.5).toFixed(1)}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                          <div className="review-submit">
                            <button
                              className="btn-primary"
                              onClick={() => handleSubmitScore(sub.id)}
                              disabled={!allFilled}
                            >
                              {existing ? '更新评分' : '提交评分'}
                            </button>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              )}

              {tab === 'dashboard' && <DashboardPanel assignmentId={assignment.id} />}
            </div>
          </div>
        ) : (
          <div className="empty-state">请在左侧选择一份作业</div>
        )}
      </section>

      <AnimatePresence>
        {createOpen && (
          <motion.div
            className="modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setCreateOpen(false)}
          >
            <motion.div
              className="modal-box"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="modal-title">创建新作业</h3>
              <label className="form-label">作业标题</label>
              <input
                className="form-input"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="例如：数据结构期中作业"
              />
              <div className="form-row">
                <div>
                  <label className="form-label">截止日期</label>
                  <input
                    type="date"
                    className="form-input"
                    value={newDeadline}
                    onChange={(e) => setNewDeadline(e.target.value)}
                  />
                </div>
                <div>
                  <label className="form-label">总分</label>
                  <input
                    type="number"
                    className="form-input"
                    value={newTotal}
                    onChange={(e) => setNewTotal(e.target.value)}
                  />
                </div>
              </div>
              <label className="form-label">评分维度（每行一个）</label>
              <textarea
                className="form-textarea"
                rows={4}
                value={newDims}
                onChange={(e) => setNewDims(e.target.value)}
              />
              <div className="modal-actions">
                <button className="btn-secondary" onClick={() => setCreateOpen(false)}>取消</button>
                <button className="btn-primary" onClick={handleCreateAssignment}>确认创建</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

function genDims(): ScoreDimension[] {
  return [
    { id: 'd1', name: '逻辑清晰度', weight: 1 },
    { id: 'd2', name: '格式规范', weight: 1 },
    { id: 'd3', name: '创新性', weight: 1 },
  ];
}

function statusText(s: IAssignment['status']): string {
  switch (s) {
    case 'pending': return '未开始';
    case 'submitting': return '提交中';
    case 'reviewing': return '互评中';
    case 'finished': return '已完成';
  }
}
