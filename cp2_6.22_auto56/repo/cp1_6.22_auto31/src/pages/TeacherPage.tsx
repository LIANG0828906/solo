import { useState, useEffect, useRef } from 'react';
import type { Question, Student } from '../types';
import { WebSocketClient } from '../utils/websocket';
import QuestionCard from '../components/QuestionCard';

interface Props {
  roomInfo: any;
  setRoomInfo: (r: any) => void;
  ws: WebSocketClient;
  teacherName: string;
  onEnd: () => void;
}

export default function TeacherPage({ roomInfo, setRoomInfo, ws, teacherName, onEnd }: Props) {
  const [qType, setQType] = useState<'single' | 'buzz'>('single');
  const [qTitle, setQTitle] = useState('');
  const [options, setOptions] = useState<string[]>(['', '']);
  const [correctIndex, setCorrectIndex] = useState(0);
  const [duration, setDuration] = useState(30);
  const [students, setStudents] = useState<Student[]>(roomInfo.students || []);
  const [activeQuestion, setActiveQuestion] = useState<Question | null>(null);
  const [endedQuestion, setEndedQuestion] = useState<Question | null>(null);
  const [optionCounts, setOptionCounts] = useState<Record<number, number>>({});
  const [questionHistory, setQuestionHistory] = useState<Question[]>([]);
  const [onlineCount, setOnlineCount] = useState(students.length);
  const [flashOnline, setFlashOnline] = useState(false);
  const [winnerToast, setWinnerToast] = useState<string | null>(null);
  const [ending, setEnding] = useState(false);
  const [endData, setEndData] = useState<{ students: Student[]; avgCorrectRate: number } | null>(null);
  const prevOnlineRef = useRef(onlineCount);
  const letters = ['A', 'B', 'C', 'D', 'E', 'F'];

  useEffect(() => {
    if (roomInfo.activeQuestionId) {
      const q = roomInfo.questions.find((x: Question) => x.id === roomInfo.activeQuestionId);
      if (q) {
        setActiveQuestion(q);
        const counts: Record<number, number> = {};
        q.options.forEach((_o: string, i: number) => (counts[i] = 0));
        setOptionCounts(counts);
      }
    }
  }, []);

  useEffect(() => {
    const unreg: (() => void)[] = [];
    unreg.push(
      ws.on('student_joined', (m: any) => {
        const newStudents = m.payload.students as Student[];
        setStudents(newStudents);
        setOnlineCount(m.payload.onlineCount || newStudents.length);
        setRoomInfo({ ...roomInfo, students: newStudents });
      })
    );
    unreg.push(
      ws.on('question_started', (m: any) => {
        const q = m.payload.question as Question;
        setActiveQuestion(q);
        setEndedQuestion(null);
        setQuestionHistory((h) => [...h, q]);
        const counts: Record<number, number> = {};
        q.options.forEach((_o: string, i: number) => (counts[i] = 0));
        setOptionCounts(counts);
        setRoomInfo({ ...roomInfo, activeQuestionId: q.id, questions: [...(roomInfo.questions || []), q] });
      })
    );
    unreg.push(
      ws.on('answer_submitted', (m: any) => {
        setOptionCounts({ ...(m.payload.optionCounts || {}) });
      })
    );
    unreg.push(
      ws.on('buzz_won', (m: any) => {
        setWinnerToast(`🏆 ${m.payload.studentName} 抢答成功！`);
        setTimeout(() => setWinnerToast(null), 4000);
        if (activeQuestion) {
          setActiveQuestion({
            ...activeQuestion,
            buzzerId: m.payload.studentId,
            buzzerName: m.payload.studentName,
          });
        }
      })
    );
    unreg.push(
      ws.on('question_ended', (m: any) => {
        const q = m.payload.question as Question;
        q.status = 'ended';
        setEndedQuestion(q);
        setActiveQuestion(null);
        setOptionCounts(m.payload.optionCounts || {});
        setStudents(m.payload.students as Student[]);
        setRoomInfo({
          ...roomInfo,
          activeQuestionId: null,
          students: m.payload.students,
        });
      })
    );
    unreg.push(
      ws.on('activity_ended', (m: any) => {
        setEndData({
          students: m.payload.students as Student[],
          avgCorrectRate: m.payload.avgCorrectRate,
        });
        setEnding(true);
      })
    );
    return () => unreg.forEach((u) => u());
  }, [ws, roomInfo]);

  useEffect(() => {
    if (onlineCount !== prevOnlineRef.current) {
      setFlashOnline(true);
      const t = setTimeout(() => setFlashOnline(false), 600);
      prevOnlineRef.current = onlineCount;
      return () => clearTimeout(t);
    }
  }, [onlineCount]);

  const addOption = () => {
    if (options.length >= 6) return;
    setOptions([...options, '']);
  };

  const removeOption = (idx: number) => {
    if (options.length <= 2) return;
    const newOpts = options.filter((_, i) => i !== idx);
    setOptions(newOpts);
    if (correctIndex === idx) setCorrectIndex(0);
    else if (correctIndex > idx) setCorrectIndex(correctIndex - 1);
  };

  const updateOption = (idx: number, v: string) => {
    const newOpts = [...options];
    newOpts[idx] = v;
    setOptions(newOpts);
  };

  const publishQuestion = async () => {
    if (activeQuestion) {
      alert('当前有题目正在进行，请等待结束');
      return;
    }
    if (!qTitle.trim()) {
      alert('请输入题目内容');
      return;
    }
    const validOpts = options.filter((o) => o.trim());
    if (qType === 'single' && validOpts.length < 2) {
      alert('请至少填写2个选项');
      return;
    }
    if (qType === 'buzz' && validOpts.length < 1) {
      alert('请填写正确答案选项');
      return;
    }
    const finalOpts = validOpts.length >= 2 ? validOpts : ['正确', '错误'];
    if (correctIndex >= finalOpts.length) setCorrectIndex(0);
    try {
      const res = await fetch(`/api/rooms/${roomInfo.id}/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: qType,
          title: qTitle.trim(),
          options: finalOpts,
          correctIndex: qType === 'buzz' ? 0 : correctIndex,
          duration: qType === 'buzz' ? Math.max(3, duration) : duration,
        }),
      });
      const data = await res.json();
      if (data.error) {
        alert(data.error);
        return;
      }
      setQTitle('');
      setOptions(['', '']);
      setCorrectIndex(0);
    } catch (e) {
      alert('发布失败');
    }
  };

  const endQuestion = async () => {
    if (!activeQuestion) return;
    try {
      await fetch(`/api/rooms/${roomInfo.id}/questions/${activeQuestion.id}/end`, {
        method: 'POST',
      });
    } catch (e) {
      alert('结束失败');
    }
  };

  const endActivity = async () => {
    if (!confirm('确定要结束本次问答活动吗？')) return;
    try {
      const res = await fetch(`/api/rooms/${roomInfo.id}/end`, {
        method: 'POST',
      });
      const data = await res.json();
      setEndData({
        students: students.sort((a, b) => b.score - a.score),
        avgCorrectRate: data.avgCorrectRate || 0,
      });
      setEnding(true);
    } catch (e) {
      alert('结束失败');
    }
  };

  const maxCount = Math.max(1, ...Object.values(optionCounts));
  const sortedStudents = [...students].sort((a, b) => b.score - a.score);
  const avgCorrect = roomInfo.totalAnswers > 0
    ? Math.round((roomInfo.totalCorrect / roomInfo.totalAnswers) * 100)
    : 0;

  return (
    <div className="app">
      {winnerToast && <div className="winner-toast">{winnerToast}</div>}
      {ending && endData && (
        <EndModal data={endData} onClose={onEnd} />
      )}

      <div className="teacher-page">
        <div className="left-panel">
          <div className="card">
            <div className="room-info">
              <div>
                <div className="room-label">房间码</div>
                <div className="room-code">{roomInfo.code}</div>
              </div>
              <div className="online-card">
                <div className={`online-number ${flashOnline ? 'flash' : ''}`}>
                  {onlineCount}
                </div>
                <div className="online-label">在线学生</div>
              </div>
            </div>

            <div style={{ color: 'var(--text-light)', fontSize: 13, marginBottom: 18, textAlign: 'center' }}>
              教师：{teacherName || '未命名'}
            </div>

            <div className="card-title">📋 创建题目</div>

            <div className="question-type-tabs">
              <button
                className={`type-tab ${qType === 'single' ? 'active' : ''}`}
                onClick={() => setQType('single')}
              >
                📝 单选题
              </button>
              <button
                className={`type-tab ${qType === 'buzz' ? 'active' : ''}`}
                onClick={() => setQType('buzz')}
              >
                ⚡ 抢答题
              </button>
            </div>

            <div className="form-group" style={{ marginBottom: 16 }}>
              <label className="form-label">题目内容</label>
              <textarea
                className="form-input"
                placeholder="请输入题目..."
                value={qTitle}
                onChange={(e) => setQTitle(e.target.value)}
                rows={3}
                style={{ resize: 'vertical' }}
              />
            </div>

            {qType === 'single' && (
              <>
                <label className="form-label" style={{ fontSize: 13 }}>选项（点击✓标记正确答案）</label>
                <div style={{ marginBottom: 12 }}>
                  {options.map((opt, idx) => (
                    <div className="option-row" key={idx}>
                      <div className="option-label">{letters[idx]}</div>
                      <input
                        className="option-input"
                        placeholder={`选项 ${letters[idx]}`}
                        value={opt}
                        onChange={(e) => updateOption(idx, e.target.value)}
                      />
                      <button
                        className={`correct-toggle ${correctIndex === idx ? 'active' : ''}`}
                        onClick={() => setCorrectIndex(idx)}
                        title="设为正确答案"
                      >
                        ✓
                      </button>
                      {options.length > 2 && (
                        <button
                          className="correct-toggle"
                          onClick={() => removeOption(idx)}
                          style={{ borderColor: '#ef9a9a', color: '#ef5350' }}
                          title="删除选项"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                  {options.length < 6 && (
                    <button className="add-option-btn" onClick={addOption}>
                      + 添加选项
                    </button>
                  )}
                </div>
              </>
            )}

            <div className="duration-row">
              <label className="form-label" style={{ marginBottom: 0 }}>
                ⏱ 答题时间
              </label>
              <input
                type="range"
                className="duration-slider"
                min={qType === 'buzz' ? 3 : 10}
                max={120}
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
              />
              <div className="duration-value">{duration}秒</div>
            </div>

            <div className="actions-bar" style={{ marginTop: 20 }}>
              <button
                className="primary-btn"
                onClick={publishQuestion}
                disabled={!!activeQuestion}
              >
                🚀 发布题目
              </button>
            </div>

            <div className="actions-bar" style={{ marginTop: 16 }}>
              <button
                className="secondary-btn"
                onClick={endQuestion}
                disabled={!activeQuestion}
                style={{ borderColor: '#ffa726', color: '#f57c00' }}
              >
                ⏹ 结束当前题
              </button>
              <button className="danger-btn" onClick={endActivity}>
                📊 结束活动
              </button>
            </div>
          </div>
        </div>

        <div className="right-panel">
          <div className="card">
            <div className="stats-header">
              <div className="card-title" style={{ marginBottom: 0 }}>📊 实时统计看板</div>
              <div style={{ fontSize: 13, color: 'var(--text-light)' }}>
                共 {questionHistory.length} 题
              </div>
            </div>
            <div className="dashboard-grid">
              <div className="stat-card">
                <div className="stat-value">{sortedStudents.length}</div>
                <div className="stat-label">参与人数</div>
              </div>
              <div className="stat-card accent">
                <div className="stat-value">{avgCorrect}%</div>
                <div className="stat-label">平均正确率</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">
                  {sortedStudents.length > 0 ? sortedStudents[0].score : 0}
                </div>
                <div className="stat-label">最高分</div>
              </div>
              <div className="stat-card accent">
                <div className="stat-value">{roomInfo.totalAnswers}</div>
                <div className="stat-label">总答题数</div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-title">
              {(activeQuestion || endedQuestion) ? (
                <>📈 {endedQuestion ? '结果统计' : '实时答题统计'} - 第{questionHistory.length}题</>
              ) : (
                <>📈 答题统计</>
              )}
            </div>
            {(activeQuestion || endedQuestion) ? (
              <>
                <div style={{ marginBottom: 12, color: 'var(--text)', fontSize: 14, fontWeight: 600 }}>
                  Q: {activeQuestion?.title || endedQuestion?.title}
                </div>
                <div className="chart-container">
                  <div className="bar-chart">
                    {(activeQuestion?.options || endedQuestion?.options || []).map((_opt: string, idx: number) => {
                      const count = optionCounts[idx] || 0;
                      const height = (count / maxCount) * 100;
                      const isCorrect = endedQuestion && idx === endedQuestion.correctIndex;
                      return (
                        <div className="bar-wrapper" key={idx}>
                          <div className={`bar ${isCorrect ? 'correct' : ''}`} style={{ height: `${height}%` }}>
                            <span className="bar-count">{count}</span>
                          </div>
                          <span className="bar-label">{letters[idx]}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
                {endedQuestion && (
                  <div className="question-ended-banner">
                    <div style={{ fontWeight: 700, marginBottom: 6 }}>
                      ✓ 本题正确答案：
                      <span style={{ color: 'var(--accent)' }}>
                        {letters[endedQuestion.correctIndex]}
                      </span>
                      <span style={{ marginLeft: 8, color: 'var(--text-light)', fontWeight: 500 }}>
                        {endedQuestion.options[endedQuestion.correctIndex]}
                      </span>
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text-light)' }}>
                      类型：{endedQuestion.type === 'single' ? '单选题 · 答对+10分' : '抢答题 · 抢答者+15分'}
                    </div>
                  </div>
                )}

                <div style={{ marginTop: 20 }}>
                  <QuestionCard
                    question={activeQuestion || endedQuestion!}
                    showCorrect={!!endedQuestion}
                  />
                </div>
              </>
            ) : (
              <div className="no-question" style={{ padding: '40px 20px', boxShadow: 'none', background: 'transparent' }}>
                <div className="no-question-icon">📊</div>
                <div className="no-question-text">暂无题目，请在左侧发布</div>
              </div>
            )}
          </div>

          <div className="card">
            <div className="card-title">🏆 积分排行榜</div>
            {sortedStudents.length > 0 ? (
              <table className="ranking-table">
                <thead>
                  <tr>
                    <th>排名</th>
                    <th>学生</th>
                    <th>状态</th>
                    <th>积分</th>
                    <th>变化</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedStudents.map((s, idx) => {
                    const rank = idx + 1;
                    const diff = s.prevRank - s.rank;
                    return (
                      <tr key={s.id} className={`rank-${rank}`}>
                        <td>
                          <span className="rank-num">{rank}</span>
                        </td>
                        <td>
                          <span className="student-name">{s.name}</span>
                        </td>
                        <td>
                          <span
                            style={{
                              display: 'inline-block',
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              background: s.connected ? 'var(--success)' : '#bdbdbd',
                              marginRight: 6,
                            }}
                          />
                          <span style={{ fontSize: 12, color: 'var(--text-light)' }}>
                            {s.connected ? '在线' : '离线'}
                          </span>
                        </td>
                        <td>
                          <span className="student-score">{s.score}</span>
                        </td>
                        <td>
                          <span className={`rank-change ${diff > 0 ? 'up' : diff < 0 ? 'down' : 'same'}`}>
                            {diff > 0 ? `↑${diff}` : diff < 0 ? `↓${-diff}` : '—'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="no-question" style={{ padding: 30, boxShadow: 'none', background: 'transparent' }}>
                <div className="no-question-icon">👥</div>
                <div className="no-question-text" style={{ fontSize: 14 }}>等待学生加入...</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function EndModal({ data, onClose }: { data: { students: Student[]; avgCorrectRate: number }; onClose: () => void }) {
  const sorted = [...data.students].sort((a, b) => b.score - a.score);
  const top3 = sorted.slice(0, 3);
  const rest = sorted.slice(3);

  return (
    <div className="end-modal-overlay">
      <div className="end-modal">
        <h2>🎉 活动结束</h2>
        <p className="end-subtitle">感谢大家的参与！</p>

        <div className="end-stats">
          <div className="end-stat-box">
            <div className="end-stat-value">{sorted.length}</div>
            <div className="end-stat-label">参与人数</div>
          </div>
          <div className="end-stat-box">
            <div className="end-stat-value">{data.avgCorrectRate}%</div>
            <div className="end-stat-label">平均正确率</div>
          </div>
          <div className="end-stat-box">
            <div className="end-stat-value">
              {sorted.length > 0 ? sorted[0].score : 0}
            </div>
            <div className="end-stat-label">最高分</div>
          </div>
          <div className="end-stat-box">
            <div className="end-stat-value">
              {sorted.length > 0
                ? Math.round(sorted.reduce((a, b) => a + b.score, 0) / sorted.length)
                : 0}
            </div>
            <div className="end-stat-label">平均得分</div>
          </div>
        </div>

        {top3.length > 0 && (
          <div className="podium">
            {top3[1] && (
              <div className="podium-step silver">
                <div className="podium-rank">🥈</div>
                <div className="podium-name">{top3[1].name}</div>
                <div className="podium-score">{top3[1].score}</div>
              </div>
            )}
            {top3[0] && (
              <div className="podium-step gold">
                <div className="podium-rank">🥇</div>
                <div className="podium-name">{top3[0].name}</div>
                <div className="podium-score">{top3[0].score}</div>
              </div>
            )}
            {top3[2] && (
              <div className="podium-step bronze">
                <div className="podium-rank">🥉</div>
                <div className="podium-name">{top3[2].name}</div>
                <div className="podium-score">{top3[2].score}</div>
              </div>
            )}
          </div>
        )}

        {rest.length > 0 && (
          <>
            <h4 style={{ margin: '24px 0 12px', color: 'var(--text)' }}>完整排名</h4>
            <table className="ranking-table">
              <tbody>
                {rest.map((s, idx) => (
                  <tr key={s.id}>
                    <td>
                      <span className="rank-num">{idx + 4}</span>
                    </td>
                    <td><span className="student-name">{s.name}</span></td>
                    <td style={{ textAlign: 'right' }}>
                      <span className="student-score">{s.score}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        <div style={{ marginTop: 28 }}>
          <button className="primary-btn" onClick={onClose}>
            返回首页
          </button>
        </div>
      </div>
    </div>
  );
}
