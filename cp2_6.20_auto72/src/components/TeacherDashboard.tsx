import { useState, useEffect, useRef } from 'react';
import dayjs from 'dayjs';
import { useQuizStore } from '../store';
import { quizApi } from '../api';
import type { Score } from '../types';

function TeacherDashboard() {
  const allScores = useQuizStore((state) => state.allScores);
  const setAllScores = useQuizStore((state) => state.setAllScores);
  const quizzes = useQuizStore((state) => state.quizzes);

  const [selectedQuiz, setSelectedQuiz] = useState<string>('all');
  const [selectedStudent, setSelectedStudent] = useState<Score | null>(null);
  const [newScoreIds, setNewScoreIds] = useState<Set<string>>(new Set());
  const prevScoreCountRef = useRef(0);

  useEffect(() => {
    const loadScores = async () => {
      const scores = await quizApi.getAllScores(
        selectedQuiz === 'all' ? undefined : selectedQuiz
      );
      if (scores.length > prevScoreCountRef.current && prevScoreCountRef.current > 0) {
        const newIds = new Set(
          scores.slice(prevScoreCountRef.current).map((s) => s.quizId + s.studentName)
        );
        setNewScoreIds(newIds);
        setTimeout(() => setNewScoreIds(new Set()), 500);
      }
      prevScoreCountRef.current = scores.length;
      setAllScores(scores);
    };
    loadScores();

    const interval = setInterval(loadScores, 30000);
    return () => clearInterval(interval);
  }, [selectedQuiz, setAllScores]);

  const filteredScores =
    selectedQuiz === 'all'
      ? allScores
      : allScores.filter((s) => s.quizId === selectedQuiz);

  const getQuizTitle = (quizId: string) => {
    const quiz = quizzes.find((q) => q.id === quizId);
    return quiz?.title || quizId;
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}分${secs}秒`;
  };

  if (selectedStudent) {
    return (
      <div className="animate-fade-in">
        <button
          onClick={() => setSelectedStudent(null)}
          style={{
            marginBottom: '16px',
            padding: '8px 16px',
            backgroundColor: 'transparent',
            border: '1px solid #3182ce',
            color: '#3182ce',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 500,
          }}
        >
          ← 返回成绩列表
        </button>

        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            padding: '24px',
            marginBottom: '24px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          }}
        >
          <h2 style={{ color: '#1a365d', marginBottom: '16px' }}>
            {selectedStudent.studentName} 的答题详情
          </h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: '16px',
              marginBottom: '16px',
            }}
          >
            <div>
              <div style={{ color: '#718096', fontSize: '14px' }}>测验</div>
              <div style={{ color: '#1a365d', fontWeight: 600 }}>
                {getQuizTitle(selectedStudent.quizId)}
              </div>
            </div>
            <div>
              <div style={{ color: '#718096', fontSize: '14px' }}>总得分</div>
              <div style={{ color: '#1a365d', fontWeight: 600, fontSize: '24px' }}>
                {selectedStudent.totalScore}
              </div>
            </div>
            <div>
              <div style={{ color: '#718096', fontSize: '14px' }}>正确率</div>
              <div style={{ color: '#38a169', fontWeight: 600, fontSize: '24px' }}>
                {selectedStudent.accuracy}%
              </div>
            </div>
            <div>
              <div style={{ color: '#718096', fontSize: '14px' }}>总用时</div>
              <div style={{ color: '#3182ce', fontWeight: 600 }}>
                {formatTime(selectedStudent.totalTime)}
              </div>
            </div>
          </div>
        </div>

        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            overflow: 'hidden',
          }}
        >
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr
                style={{
                  backgroundColor: '#1a365d',
                  color: '#ffffff',
                }}
              >
                <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '14px' }}>
                  题号
                </th>
                <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '14px' }}>
                  学生答案
                </th>
                <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '14px' }}>
                  是否正确
                </th>
                <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '14px' }}>
                  用时
                </th>
              </tr>
            </thead>
            <tbody>
              {selectedStudent.answers.map((answer, index) => (
                <tr
                  key={index}
                  style={{
                    backgroundColor: index % 2 === 0 ? '#ffffff' : '#e8f4fd',
                    borderBottom: '1px solid #e2e8f0',
                  }}
                >
                  <td style={{ padding: '14px 16px', color: '#4a5568' }}>
                    第{index + 1}题
                  </td>
                  <td style={{ padding: '14px 16px', color: '#2d3748', fontWeight: 500 }}>
                    {answer.answer || '(未作答)'}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span
                      style={{
                        padding: '4px 10px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: 600,
                        backgroundColor: answer.isCorrect ? '#f0fff4' : '#fff5f5',
                        color: answer.isCorrect ? '#38a169' : '#e53e3e',
                      }}
                    >
                      {answer.isCorrect ? '✓ 正确' : '✗ 错误'}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px', color: '#718096' }}>
                    {answer.timeSpent}秒
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <h2 style={{ color: '#1a365d', fontSize: '24px', fontWeight: 700 }}>
          学生成绩概览
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ color: '#718096', fontSize: '14px' }}>筛选测验：</span>
          <select
            value={selectedQuiz}
            onChange={(e) => {
              setSelectedQuiz(e.target.value);
              prevScoreCountRef.current = 0;
            }}
            style={{
              padding: '8px 12px',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              fontSize: '14px',
              backgroundColor: '#ffffff',
              color: '#2d3748',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            <option value="all">全部测验</option>
            {quizzes.map((quiz) => (
              <option key={quiz.id} value={quiz.id}>
                {quiz.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          overflow: 'hidden',
        }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
            <thead>
              <tr
                style={{
                  backgroundColor: '#1a365d',
                  color: '#ffffff',
                }}
              >
                <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '14px' }}>
                  学生姓名
                </th>
                <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '14px' }}>
                  测验名称
                </th>
                <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '14px' }}>
                  总得分
                </th>
                <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '14px' }}>
                  正确率
                </th>
                <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '14px' }}>
                  用时
                </th>
                <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '14px' }}>
                  提交时间
                </th>
                <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '14px' }}>
                  操作
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredScores.map((score, index) => {
                const isNew = newScoreIds.has(score.quizId + score.studentName);
                return (
                  <tr
                    key={score.quizId + score.studentName + index}
                    className={isNew ? 'animate-slide-in-right' : ''}
                    style={{
                      backgroundColor: index % 2 === 0 ? '#ffffff' : '#e8f4fd',
                      borderBottom: '1px solid #e2e8f0',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#d0e7f7';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor =
                        index % 2 === 0 ? '#ffffff' : '#e8f4fd';
                    }}
                    onClick={() => setSelectedStudent(score)}
                  >
                    <td
                      style={{
                        padding: '14px 16px',
                        color: '#1a365d',
                        fontWeight: 600,
                      }}
                    >
                      {score.studentName}
                    </td>
                    <td style={{ padding: '14px 16px', color: '#4a5568' }}>
                      {getQuizTitle(score.quizId)}
                    </td>
                    <td
                      style={{
                        padding: '14px 16px',
                        color: '#1a365d',
                        fontWeight: 600,
                        fontSize: '16px',
                      }}
                    >
                      {score.totalScore}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span
                        style={{
                          padding: '4px 10px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: 600,
                          backgroundColor:
                            score.accuracy >= 60 ? '#f0fff4' : '#fff5f5',
                          color: score.accuracy >= 60 ? '#38a169' : '#e53e3e',
                        }}
                      >
                        {score.accuracy}%
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', color: '#718096' }}>
                      {formatTime(score.totalTime)}
                    </td>
                    <td style={{ padding: '14px 16px', color: '#718096', fontSize: '13px' }}>
                      {dayjs(score.submittedAt).format('YYYY-MM-DD HH:mm')}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span
                        style={{
                          color: '#3182ce',
                          fontWeight: 500,
                          fontSize: '14px',
                        }}
                      >
                        查看详情 →
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filteredScores.length === 0 && (
          <div
            style={{
              padding: '40px',
              textAlign: 'center',
              color: '#718096',
            }}
          >
            暂无成绩数据
          </div>
        )}
      </div>
    </div>
  );
}

export default TeacherDashboard;
