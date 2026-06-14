import { useState, useEffect } from 'react';
import { Question, StudentAnswer, QuestionStats, LeaderboardEntry, HistoryItem } from '../shared/types';
import { eventBus, EVENTS } from '../shared/EventBus';
import './LiveBoard.css';

interface LiveBoardProps {
  currentQuestion: Question | null;
  timeRemaining: number;
  isActive: boolean;
  answers: StudentAnswer[];
  scores: Record<string, { name: string; score: number }>;
}

function LiveBoard({ currentQuestion, timeRemaining, isActive, answers, scores }: LiveBoardProps) {
  const [stats, setStats] = useState<QuestionStats | null>(null);
  const [endedQuestion, setEndedQuestion] = useState<HistoryItem | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    const handleStatsUpdated = (newStats: QuestionStats) => {
      setStats(newStats);
    };

    const handleQuestionEnded = (item: HistoryItem) => {
      setEndedQuestion(item);
    };

    eventBus.on(EVENTS.STATS_UPDATED, handleStatsUpdated);
    eventBus.on(EVENTS.QUESTION_ENDED, handleQuestionEnded);

    return () => {
      eventBus.off(EVENTS.STATS_UPDATED, handleStatsUpdated);
      eventBus.off(EVENTS.QUESTION_ENDED, handleQuestionEnded);
    };
  }, []);

  useEffect(() => {
    if (isActive && currentQuestion) {
      setEndedQuestion(null);
      const optionCounts = currentQuestion.options.map((_, idx) =>
        answers.filter((a) => a.selectedIndex === idx).length
      );
      setStats({
        questionId: currentQuestion.id,
        optionCounts,
        totalAnswers: answers.length,
      });
    }
  }, [isActive, currentQuestion, answers]);

  useEffect(() => {
    const sortedScores = Object.entries(scores)
      .map(([id, data]) => ({
        studentId: id,
        studentName: data.name,
        score: data.score,
        rank: 0,
      }))
      .sort((a, b) => b.score - a.score)
      .map((entry, idx) => ({ ...entry, rank: idx + 1 }));
    setLeaderboard(sortedScores);
  }, [scores]);

  const maxCount = stats ? Math.max(...stats.optionCounts, 1) : 1;

  const progress = currentQuestion
    ? ((currentQuestion.duration - timeRemaining) / currentQuestion.duration) * 100
    : 0;

  const isUrgent = timeRemaining <= 5 && isActive;

  return (
    <div className="live-board">
      <div className="board-header">
        <h2 className="board-title">实时看板</h2>
        {isActive && (
          <div className={`timer-display ${isUrgent ? 'urgent' : ''}`}>
            <div className="timer-ring">
              <svg viewBox="0 0 36 36">
                <path
                  className="timer-bg"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#e2e8f0"
                  strokeWidth="3"
                />
                <path
                  className={`timer-progress ${isUrgent ? 'urgent-path' : ''}`}
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke={isUrgent ? '#ef4444' : '#4facfe'}
                  strokeWidth="3"
                  strokeDasharray={`${progress}, 100`}
                  strokeLinecap="round"
                />
              </svg>
              <span className={`timer-text ${isUrgent ? 'urgent-timer-text' : ''}`}>
                {timeRemaining}s
              </span>
            </div>
          </div>
        )}
      </div>

      {!currentQuestion && !endedQuestion ? (
        <div className="empty-state">
          <div className="empty-icon">📊</div>
          <p className="empty-text">等待发布题目...</p>
          <p className="empty-subtext">发布题目后这里将显示实时统计</p>
        </div>
      ) : (
        <>
          <div className="question-info">
            <h3 className="current-question-title">
              {isActive ? '当前题目' : '已结束题目'}
            </h3>
            <p className="question-text">
              {(currentQuestion || endedQuestion?.question)?.title}
            </p>
          </div>

          <div className="chart-section">
            <h4 className="section-title">选项统计</h4>
            <div className="bar-chart">
              {(currentQuestion?.options || endedQuestion?.question.options || []).map(
                (_option, index) => {
                  const count = stats?.optionCounts[index] || 0;
                  const height = (count / maxCount) * 100;
                  const isCorrect =
                    !isActive &&
                    endedQuestion &&
                    index === endedQuestion.question.correctIndex;

                  return (
                    <div key={index} className="bar-column">
                      <span className="bar-value">{count}</span>
                      <div className="bar-wrapper">
                        <div
                          className={`bar ${isCorrect ? 'correct' : ''}`}
                          style={{ height: `${Math.max(height, 2)}%` }}
                        />
                      </div>
                      <span className="bar-label">
                        {String.fromCharCode(65 + index)}
                      </span>
                    </div>
                  );
                }
              )}
            </div>
            <p className="total-answers">
              共 {stats?.totalAnswers || 0} 人作答
            </p>
          </div>

          {!isActive && endedQuestion && (
            <div className="top-students-section">
              <h4 className="section-title">🏆 最快答对前5名</h4>
              {endedQuestion.topStudents.length > 0 ? (
                <div className="top-students-list">
                  {endedQuestion.topStudents.map((student) => (
                    <div key={student.studentId} className="top-student-item">
                      <span className={`rank-badge rank-${student.rank}`}>
                        {student.rank}
                      </span>
                      <span className="student-name">{student.studentName}</span>
                      <span className="score-badge">+10分</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="no-winners">暂无答对的学生</p>
              )}
            </div>
          )}
        </>
      )}

      <div className="leaderboard-section">
        <h4 className="section-title">📈 总积分排行榜</h4>
        {leaderboard.length > 0 ? (
          <div className="leaderboard-list">
            {leaderboard.slice(0, 10).map((entry) => (
              <div key={entry.studentId} className="leaderboard-item">
                <span className={`leaderboard-rank ${entry.rank <= 3 ? 'top' : ''}`}>
                  {entry.rank}
                </span>
                <span className="leaderboard-name">{entry.studentName}</span>
                <span className="leaderboard-score">{entry.score}分</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="no-scores">暂无积分数据</p>
        )}
      </div>
    </div>
  );
}

export default LiveBoard;
