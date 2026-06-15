import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from 'recharts';
import type { PublicQuestion, QuestionSummary, QuestionStatsData, StudentResult } from './types';
import { useToast } from './Toast';

interface QuizRoomProps {
  ws: WebSocket;
  role: 'teacher' | 'student';
  nickname: string;
  roomCode: string;
  roomId: string;
}

interface ChartDataPoint {
  option: string;
  count: number;
}

const CORRECT_COLOR = '#52C41A';
const OPTION_COLORS = ['#4A90D9', '#6BA8E8', '#8FBCEE', '#B3D0F3'];

function getRateBadgeClass(rate: number): string {
  if (rate >= 70) return 'high';
  if (rate >= 40) return 'mid';
  return 'low';
}

const StatsChart: React.FC<{ stats: QuestionStatsData; question: PublicQuestion | null }> = ({ stats, question }) => {
  const maxCount = Math.max(1, ...stats.options.map(o => o.count));
  const correctOpt = question?.correctOption;

  const chartData: ChartDataPoint[] = stats.options.map(opt => ({
    option: opt.option,
    count: opt.count,
  }));

  const total = stats.totalParticipants;

  return (
    <div className="chart-wrapper">
      <ResponsiveContainer width="100%" height={260}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 10, right: 40, left: 10, bottom: 10 }}
          barCategoryGap="25%"
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#F0F2F5" horizontal={false} />
          <XAxis type="number" domain={[0, maxCount]} tick={{ fontSize: 12 }} />
          <YAxis
            type="category"
            dataKey="option"
            width={30}
            tick={{ fontSize: 14, fontWeight: 700, fill: '#666' }}
          />
          <Tooltip
            formatter={(val: number) => [`${val} 人 (${total > 0 ? Math.round((val / total) * 100) : 0}%)`, '选择人数']}
            contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.1)' }}
          />
          <Bar
            dataKey="count"
            radius={[0, 8, 8, 0]}
            isAnimationActive={true}
            animationBegin={0}
            animationDuration={600}
            animationEasing="ease-out"
          >
            {chartData.map((entry, index) => (
              <Cell
                key={entry.option}
                fill={correctOpt && entry.option === correctOpt ? CORRECT_COLOR : OPTION_COLORS[index]}
              />
            ))}
            <LabelList
              dataKey="count"
              position="right"
              formatter={(v: number) => (v > 0 ? `${v}人` : '')}
              style={{ fontSize: 12, fill: '#666', fontWeight: 500 }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

const QuizRoom: React.FC<QuizRoomProps> = ({ ws, role, nickname, roomCode, roomId: initialRoomId }) => {
  const { showToast } = useToast();
  const [studentCount, setStudentCount] = useState(0);

  const [questionSummaries, setQuestionSummaries] = useState<QuestionSummary[]>([]);
  const [activeViewQuestionId, setActiveViewQuestionId] = useState<number | null>(null);

  const [qText, setQText] = useState('');
  const [optA, setOptA] = useState('');
  const [optB, setOptB] = useState('');
  const [optC, setOptC] = useState('');
  const [optD, setOptD] = useState('');
  const [correctOpt, setCorrectOpt] = useState<string>('A');

  const [activeQuestion, setActiveQuestion] = useState<PublicQuestion | null>(null);
  const [stats, setStats] = useState<QuestionStatsData | null>(null);

  const throttledStatsRef = useRef<QuestionStatsData | null>(null);
  const statsTimerRef = useRef<number | null>(null);
  const lastStatsUpdateRef = useRef<number>(0);

  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [studentResult, setStudentResult] = useState<StudentResult | null>(null);
  const [classCorrectRate, setClassCorrectRate] = useState<number>(0);

  const flushStats = useCallback(() => {
    if (throttledStatsRef.current) {
      setStats(throttledStatsRef.current);
      throttledStatsRef.current = null;
    }
    statsTimerRef.current = null;
  }, []);

  const updateStatsThrottled = useCallback((newStats: QuestionStatsData) => {
    throttledStatsRef.current = newStats;
    const now = Date.now();
    const MIN_INTERVAL = 200;

    if (now - lastStatsUpdateRef.current >= MIN_INTERVAL) {
      lastStatsUpdateRef.current = now;
      setStats(newStats);
      throttledStatsRef.current = null;
    } else if (!statsTimerRef.current) {
      const remaining = MIN_INTERVAL - (now - lastStatsUpdateRef.current);
      statsTimerRef.current = window.setTimeout(() => {
        lastStatsUpdateRef.current = Date.now();
        flushStats();
      }, remaining);
    }
  }, [flushStats]);

  useEffect(() => {
    return () => {
      if (statsTimerRef.current) {
        clearTimeout(statsTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const onMessage = (evt: MessageEvent) => {
      try {
        const msg = JSON.parse(evt.data);

        switch (msg.type) {
          case 'room_created':
            if (msg.questionSummaries) {
              setQuestionSummaries(msg.questionSummaries);
            }
            showToast(`房间已创建，房间码：${msg.code}`, 'success');
            break;

          case 'room_joined':
            if (msg.questionSummaries) {
              setQuestionSummaries(msg.questionSummaries);
            }
            if (msg.currentQuestion) {
              setActiveQuestion(msg.currentQuestion);
              if (msg.studentAnswer) {
                setSelectedOption(msg.studentAnswer.selectedOption);
                setSubmitted(true);
              }
            }
            showToast('已加入房间', 'success');
            break;

          case 'question_list_updated':
            setQuestionSummaries(msg.summaries);
            break;

          case 'question_added':
            showToast('题目已添加', 'success');
            setQText('');
            setOptA('');
            setOptB('');
            setOptC('');
            setOptD('');
            setCorrectOpt('A');
            break;

          case 'question_published':
            showToast('题目已发布', role === 'teacher' ? 'success' : 'info');
            setActiveQuestion(msg.question);
            if (role === 'teacher' && msg.stats) {
              setStats(msg.stats);
              lastStatsUpdateRef.current = Date.now();
            }
            if (role === 'student') {
              setSelectedOption(null);
              setSubmitted(false);
              setStudentResult(null);
              setClassCorrectRate(0);
            }
            break;

          case 'stats_updated':
            updateStatsThrottled(msg.stats);
            break;

          case 'question_stats_view':
            setActiveQuestion(msg.question);
            setStats(msg.stats);
            lastStatsUpdateRef.current = Date.now();
            setActiveViewQuestionId(msg.question.id);
            break;

          case 'answer_submitted':
            setSubmitted(true);
            showToast('答案已提交', 'success');
            break;

          case 'question_ended':
            if (role === 'teacher') {
              if (msg.stats) {
                setStats(msg.stats);
                lastStatsUpdateRef.current = Date.now();
              }
              showToast('答题已结束', 'info');
            } else {
              setStudentResult(msg.studentResult);
              setClassCorrectRate(msg.correctRate ?? 0);
              const isCorrect = msg.studentResult?.isCorrect;
              showToast(isCorrect ? '回答正确！🎉' : '回答错误', isCorrect ? 'success' : 'error');
              setActiveQuestion(prev =>
                prev
                  ? { ...prev, isEnded: true, correctOption: msg.studentResult?.correctOption }
                  : prev
              );
            }
            break;

          case 'student_joined':
            setStudentCount(msg.studentCount);
            break;

          case 'error':
            showToast(msg.message || '操作失败', 'error');
            break;
        }
      } catch (err) {
        console.error('Parse error', err);
      }
    };

    ws.addEventListener('message', onMessage);
    return () => ws.removeEventListener('message', onMessage);
  }, [ws, role, showToast, updateStatsThrottled]);

  const handleAddQuestion = () => {
    if (!qText.trim() || !optA.trim() || !optB.trim() || !optC.trim() || !optD.trim()) {
      showToast('请完整填写题目和选项', 'error');
      return;
    }
    ws.send(JSON.stringify({
      type: 'add_question',
      payload: {
        questionText: qText.trim(),
        optionA: optA.trim(),
        optionB: optB.trim(),
        optionC: optC.trim(),
        optionD: optD.trim(),
        correctOption: correctOpt,
      },
    }));
  };

  const handlePublishQuestion = (qId: number) => {
    ws.send(JSON.stringify({ type: 'publish_question', questionId: qId }));
  };

  const handleSubmitAnswer = () => {
    if (!selectedOption || !activeQuestion) return;
    ws.send(JSON.stringify({
      type: 'submit_answer',
      payload: { questionId: activeQuestion.id, selectedOption },
    }));
  };

  const handleEndQuestion = () => {
    if (!activeQuestion) return;
    ws.send(JSON.stringify({ type: 'end_question', questionId: activeQuestion.id }));
  };

  const handleViewHistory = (qId: number) => {
    ws.send(JSON.stringify({ type: 'view_question_stats', questionId: qId }));
  };

  const unpublishedQs = questionSummaries.filter(q => !q.isActive && !q.isEnded);
  const latestUnpublished = unpublishedQs[unpublishedQs.length - 1];

  if (role === 'student') {
    return (
      <div className="student-container">
        <div className="student-header">
          <div className="student-room-info">
            <span>房间码</span>
            <span className="student-room-code">{roomCode}</span>
            <span>·</span>
            <span>{nickname}</span>
          </div>
        </div>

        {!activeQuestion ? (
          <div className="waiting-card">
            <div className="waiting-icon">⏳</div>
            <div className="waiting-title">等待老师发布题目</div>
            <div className="waiting-sub">请耐心等待，题目发布后将自动显示</div>
          </div>
        ) : (
          <div className="student-question-card">
            <div className="question-number-badge">第 {activeQuestion.questionNumber} 题</div>
            <div className="question-text">{activeQuestion.questionText}</div>

            {activeQuestion.options.map(opt => {
              let cls = 'option-btn';
              if (activeQuestion.isEnded) {
                if (opt.label === activeQuestion.correctOption) {
                  cls += ' correct';
                } else if (studentResult && opt.label === studentResult.selectedOption && !studentResult.isCorrect) {
                  cls += ' wrong';
                }
              } else if (selectedOption === opt.label) {
                cls += ' selected';
              }

              const disabled = submitted || activeQuestion.isEnded;

              return (
                <button
                  key={opt.label}
                  className={cls}
                  disabled={disabled}
                  onClick={() => !disabled && setSelectedOption(opt.label)}
                >
                  <span className="option-circle">{opt.label}</span>
                  <span>{opt.text}</span>
                  {activeQuestion.isEnded && opt.label === activeQuestion.correctOption && (
                    <span className="option-check-icon">✓</span>
                  )}
                  {studentResult && opt.label === studentResult.selectedOption && !studentResult.isCorrect && (
                    <span className="option-check-icon">✕</span>
                  )}
                </button>
              );
            })}

            {!activeQuestion.isEnded && (
              <div className="submit-btn-area">
                <button
                  className="btn-primary"
                  onClick={handleSubmitAnswer}
                  disabled={!selectedOption || submitted}
                >
                  {submitted ? '✓ 已提交' : '提交答案'}
                </button>
              </div>
            )}

            {activeQuestion.isEnded && studentResult && (
              <>
                <div className={`feedback-banner ${studentResult.isCorrect ? 'correct' : 'wrong'}`}>
                  {studentResult.selectedOption
                    ? (studentResult.isCorrect ? '🎉 回答正确！' : '✕ 回答错误')
                    : '未作答'}
                </div>
                <div className="accuracy-bar">
                  <div className="accuracy-label">
                    <span>全班正确率</span>
                    <strong>{classCorrectRate}%</strong>
                  </div>
                  <div className="accuracy-track">
                    <div className="accuracy-fill" style={{ width: `${classCorrectRate}%` }}></div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="room-header">
        <div className="room-header-left">
          <div className="room-code-badge">{roomCode}</div>
          <div className="room-header-title">LiveQuiz 课堂互动测验</div>
        </div>
        <div className="room-header-right">
          <div className="student-count-pill">
            <span className="student-count-dot"></span>
            <span>{studentCount} 位学生在线</span>
          </div>
          <div>👨‍🏫 {nickname}</div>
        </div>
      </div>

      <div className="teacher-layout">
        <div className="col">
          <div className="col-title">📚 历史题目</div>
          {questionSummaries.length === 0 ? (
            <div className="history-empty">暂无题目记录<br/>在右侧添加题目</div>
          ) : (
            <div className="history-list">
              {questionSummaries.map(q => (
                <div
                  key={q.id}
                  className={`history-item ${activeViewQuestionId === q.id ? 'active' : ''}`}
                  onClick={() => handleViewHistory(q.id)}
                >
                  <div className="history-item-header">
                    <span className="history-item-num">第 {q.questionNumber} 题</span>
                    <span className={`history-rate ${q.isEnded ? getRateBadgeClass(q.correctRate) : ''}`}>
                      {q.isActive ? '进行中' : q.isEnded ? `${q.correctRate}%` : '未发布'}
                    </span>
                  </div>
                  <div className="history-item-text">{q.questionText}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="col question-creator">
          <div className="col-title">✏️ 创建题目</div>

          <div className="form-group">
            <label className="form-label">题目内容</label>
            <textarea
              value={qText}
              onChange={e => setQText(e.target.value)}
              placeholder="请输入题目内容..."
            />
          </div>

          <div className="form-group">
            <label className="form-label">选项（点击字母设置正确答案）</label>
            {[
              { label: 'A', val: optA, setter: setOptA },
              { label: 'B', val: optB, setter: setOptB },
              { label: 'C', val: optC, setter: setOptC },
              { label: 'D', val: optD, setter: setOptD },
            ].map(item => (
              <div className="option-row" key={item.label}>
                <button
                  type="button"
                  className={`option-label-btn ${correctOpt === item.label ? 'correct' : ''}`}
                  onClick={() => setCorrectOpt(item.label)}
                >
                  {correctOpt === item.label ? '✓' : item.label}
                </button>
                <input
                  type="text"
                  className="form-input"
                  value={item.val}
                  onChange={e => item.setter(e.target.value)}
                  placeholder={`选项 ${item.label}`}
                />
              </div>
            ))}
          </div>

          <div className="btn-row" style={{ marginTop: 20 }}>
            <button className="btn-secondary" onClick={handleAddQuestion}>
              添加题目
            </button>
          </div>

          {latestUnpublished && (
            <div style={{ marginTop: 24, padding: 16, background: '#F5F7FA', borderRadius: 12 }}>
              <div style={{ fontSize: 13, color: '#888', marginBottom: 8 }}>待发布题目</div>
              <div style={{ fontWeight: 600, marginBottom: 12 }}>
                第 {latestUnpublished.questionNumber} 题：{latestUnpublished.questionText}
              </div>
              <button
                className="btn-success"
                style={{ width: '100%' }}
                onClick={() => handlePublishQuestion(latestUnpublished.id)}
              >
                🚀 发布题目
              </button>
            </div>
          )}

          {activeQuestion && activeQuestion.isActive && (
            <div style={{ marginTop: 16 }}>
              <button
                className="btn-danger"
                style={{ width: '100%' }}
                onClick={handleEndQuestion}
              >
                ⏹ 结束答题
              </button>
            </div>
          )}
        </div>

        <div className="col">
          <div className="col-title">📊 实时统计</div>
          {!activeQuestion || !stats ? (
            <div className="no-stats">暂无统计数据<br/>发布题目后将实时显示答题情况</div>
          ) : (
            <>
              <div className="stats-header">
                <div className="stats-header-question">
                  第 {activeQuestion.questionNumber} 题 · {activeQuestion.questionText.length > 30 ? activeQuestion.questionText.slice(0, 30) + '...' : activeQuestion.questionText}
                </div>
                <div className="stats-header-grid">
                  <div>
                    <div className="stats-item-value">{stats.totalParticipants}</div>
                    <div className="stats-item-label">参与人数</div>
                  </div>
                  <div>
                    <div className="stats-item-value">{stats.correctCount}</div>
                    <div className="stats-item-label">答对人数</div>
                  </div>
                  <div>
                    <div className="stats-item-value">{stats.correctRate}%</div>
                    <div className="stats-item-label">正确率</div>
                  </div>
                </div>
              </div>
              <StatsChart stats={stats} question={activeQuestion} />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuizRoom;
