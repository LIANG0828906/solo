import { useState, useEffect, useRef } from 'react';
import type { Question, Student } from '../types';
import { WebSocketClient } from '../utils/websocket';
import QuestionCard from '../components/QuestionCard';

interface Props {
  roomInfo: any;
  setRoomInfo: (r: any) => void;
  ws: WebSocketClient;
  studentId: string;
  studentName: string;
}

export default function StudentPage({ roomInfo, setRoomInfo, ws, studentId, studentName }: Props) {
  const [me, setMe] = useState<Student | null>(
    roomInfo.students?.find((s: Student) => s.id === studentId) || null
  );
  const [students, setStudents] = useState<Student[]>(roomInfo.students || []);
  const [activeQuestion, setActiveQuestion] = useState<Question | null>(null);
  const [endedQuestion, setEndedQuestion] = useState<Question | null>(null);
  const [submittedOption, setSubmittedOption] = useState<number | null>(null);
  const [buzzWon, setBuzzWon] = useState(false);
  const [roundScore, setRoundScore] = useState<number | null>(null);
  const [showRoundBanner, setShowRoundBanner] = useState(false);
  const [bounceScore, setBounceScore] = useState(false);
  const [bounceRank, setBounceRank] = useState(false);
  const [ending, setEnding] = useState(false);
  const [endData, setEndData] = useState<{ students: Student[]; avgCorrectRate: number } | null>(null);
  const prevRankRef = useRef<number>(me?.rank || 0);

  useEffect(() => {
    const unreg: (() => void)[] = [];

    unreg.push(
      ws.on('student_joined', (m: any) => {
        const newStudents = m.payload.students as Student[];
        setStudents(newStudents);
        const meUpdated = newStudents.find((s) => s.id === studentId);
        if (meUpdated) setMe(meUpdated);
        setRoomInfo({ ...roomInfo, students: newStudents });
      })
    );

    unreg.push(
      ws.on('question_started', (m: any) => {
        const q = m.payload.question as Question;
        setActiveQuestion(q);
        setEndedQuestion(null);
        setSubmittedOption(null);
        setBuzzWon(false);
        setRoundScore(null);
        setShowRoundBanner(false);
        prevRankRef.current = me?.rank || 0;
      })
    );

    unreg.push(
      ws.on('answer_ack', (m: any) => {
        if (m.payload.questionId === activeQuestion?.id) {
          // Already handled locally
        }
      })
    );

    unreg.push(
      ws.on('buzz_won', (m: any) => {
        if (activeQuestion) {
          setActiveQuestion({
            ...activeQuestion,
            buzzerId: m.payload.studentId,
            buzzerName: m.payload.studentName,
          });
          if (m.payload.studentId === studentId) {
            setBuzzWon(true);
          }
        }
      })
    );

    unreg.push(
      ws.on('question_ended', (m: any) => {
        const q = m.payload.question as Question;
        q.status = 'ended';
        setEndedQuestion(q);
        setActiveQuestion(null);
        const newStudents = m.payload.students as Student[];
        setStudents(newStudents);
        const updatedMe = newStudents.find((s) => s.id === studentId);
        if (updatedMe) {
          const roundGain = m.payload.roundScores?.find((r: any) => r.studentId === studentId)?.gain || 0;
          if (roundGain > 0) {
            setRoundScore(roundGain);
            setBounceScore(true);
            setTimeout(() => setBounceScore(false), 700);
          } else {
            setRoundScore(0);
          }
          if (updatedMe.rank < prevRankRef.current) {
            setBounceRank(true);
            setTimeout(() => setBounceRank(false), 700);
          }
          setMe(updatedMe);
          setShowRoundBanner(true);
          setTimeout(() => setShowRoundBanner(false), 10000);
        }
        setRoomInfo({
          ...roomInfo,
          activeQuestionId: null,
          students: newStudents,
        });
      })
    );

    unreg.push(
      ws.on('activity_ended', (m: any) => {
        const meFinal = m.payload.students.find((s: Student) => s.id === studentId);
        if (meFinal) setMe(meFinal);
        setEndData({
          students: m.payload.students as Student[],
          avgCorrectRate: m.payload.avgCorrectRate,
        });
        setEnding(true);
      })
    );

    return () => unreg.forEach((u) => u());
  }, [ws, roomInfo, studentId, activeQuestion, me]);

  const submitAnswer = (selectedIndex: number) => {
    if (!activeQuestion || submittedOption !== null) return;
    const success = ws.send('submit_answer', {
      questionId: activeQuestion.id,
      selectedIndex,
    });
    if (success) {
      setSubmittedOption(selectedIndex);
    }
  };

  const doBuzz = () => {
    if (!activeQuestion || buzzWon || activeQuestion.buzzerId) return;
    ws.send('buzz', { questionId: activeQuestion.id });
  };

  const sortedStudents = [...students].sort((a, b) => b.score - a.score);
  const myRank = me?.rank || 0;
  const rankDiff = prevRankRef.current - myRank;

  return (
    <div className="app">
      {ending && endData && me && (
        <EndModal
          data={endData}
          meId={studentId}
          myRank={endData.students.findIndex((s) => s.id === studentId) + 1}
        />
      )}

      <div className="student-page">
        <div className="student-header">
          <div className="header-room">
            <span className="header-room-label">房间号</span>
            <span className="header-room-code">{roomInfo.code}</span>
          </div>
          <div className="header-stats">
            <div className="header-stat">
              <div className={`header-stat-value ${bounceScore ? 'bounce-up' : ''}`}>
                {me?.score || 0}
              </div>
              <span className="header-stat-label">我的积分</span>
            </div>
            <div className="header-stat">
              <div className={`header-stat-value ${bounceRank ? 'bounce-up' : ''}`}>
                {myRank || '-'}
              </div>
              <span className="header-stat-label">
                {sortedStudents.length > 0 ? `/${sortedStudents.length} 名` : '排名'}
              </span>
            </div>
          </div>
        </div>

        {!activeQuestion && !endedQuestion && !showRoundBanner && (
          <div className="welcome-banner">
            <h3>👋 欢迎 {studentName}！</h3>
            <p>请耐心等待老师发布题目...</p>
          </div>
        )}

        <div className="question-area">
          {(activeQuestion || endedQuestion) && (
            <QuestionCard
              question={activeQuestion || endedQuestion!}
              isStudent={!!activeQuestion}
              onSubmit={submitAnswer}
              onBuzz={doBuzz}
              submittedOption={submittedOption}
              showCorrect={!!endedQuestion}
              answered={!!(
                (endedQuestion && submittedOption !== null) ||
                (activeQuestion && submittedOption !== null) ||
                buzzWon ||
                (endedQuestion && (activeQuestion?.type === 'buzz') && activeQuestion.buzzerId)
              )}
            />
          )}

          {!activeQuestion && !endedQuestion && !showRoundBanner && (
            <div className="no-question" style={{ width: '100%', maxWidth: 600 }}>
              <div className="no-question-icon">⏳</div>
              <div className="no-question-text">等待老师发布题目...</div>
            </div>
          )}
        </div>

        {showRoundBanner && endedQuestion && (
          <div className="question-ended-banner" style={{ animation: 'slideInBottom 0.5s ease' }}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>
              📌 本题结束 · 正确答案：
              <span style={{ color: 'var(--accent)' }}>
                {['A', 'B', 'C', 'D', 'E', 'F'][endedQuestion.correctIndex]}
              </span>
              <span style={{ marginLeft: 6, color: 'var(--text-light)', fontWeight: 500 }}>
                {endedQuestion.options[endedQuestion.correctIndex]}
              </span>
            </div>
            <div className="round-score">
              <span>
                本轮得分：
                <span className="round-score-gain">+{roundScore ?? 0} 分</span>
              </span>
              <span>
                当前排名：第 {myRank} 名
                {rankDiff !== 0 && (
                  <span className={`round-rank-change ${rankDiff > 0 ? 'up' : 'down'}`}>
                    {rankDiff > 0 ? `↑${rankDiff}` : `↓${-rankDiff}`}
                  </span>
                )}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function EndModal({
  data,
  meId,
  myRank,
}: {
  data: { students: Student[]; avgCorrectRate: number };
  meId: string;
  myRank: number;
}) {
  const sorted = [...data.students].sort((a, b) => b.score - a.score);
  const me = sorted.find((s) => s.id === meId);
  const top3 = sorted.slice(0, 3);
  const rest = sorted.slice(3);

  return (
    <div className="end-modal-overlay">
      <div className="end-modal">
        <h2>🎉 活动结束！</h2>
        <p className="end-subtitle">
          你取得了第 <strong style={{ color: 'var(--accent)' }}>{myRank}</strong> 名，
          获得 <strong style={{ color: 'var(--primary-dark)' }}>{me?.score || 0}</strong> 分
        </p>

        <div className="end-stats">
          <div className="end-stat-box">
            <div className="end-stat-value">{sorted.length}</div>
            <div className="end-stat-label">参与人数</div>
          </div>
          <div className="end-stat-box">
            <div className="end-stat-value">{data.avgCorrectRate}%</div>
            <div className="end-stat-label">班级正确率</div>
          </div>
          <div className="end-stat-box">
            <div className="end-stat-value">{me?.score || 0}</div>
            <div className="end-stat-label">我的得分</div>
          </div>
          <div className="end-stat-box">
            <div className="end-stat-value">
              {sorted.length > 0 ? sorted[0].score : 0}
            </div>
            <div className="end-stat-label">最高分</div>
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
                <div className="podium-name">
                  {top3[0].name}
                  {top3[0].id === meId && <span style={{ fontSize: 11, display: 'block' }}>(我)</span>}
                </div>
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
                  <tr key={s.id} className={s.id === meId ? 'rank-1' : ''}>
                    <td>
                      <span className="rank-num">{idx + 4}</span>
                    </td>
                    <td>
                      <span className="student-name">
                        {s.name}
                        {s.id === meId && <span style={{ color: 'var(--accent)', marginLeft: 6 }}>（我）</span>}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <span className="student-score">{s.score}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        <div style={{ marginTop: 28, fontSize: 14, color: 'var(--text-light)', textAlign: 'center' }}>
          💡 活动数据已保存在服务器端，老师可以查看复盘
        </div>
      </div>
    </div>
  );
}
