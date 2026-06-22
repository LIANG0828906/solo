import React, { useState } from 'react';
import type { GradeResult, Question } from '../types';
import RadarChart from '../RadarChart';
import { generateErrorStats } from '../GraderService';

interface ResultPageProps {
  result: GradeResult;
  questions: Question[];
  onRetry: () => void;
  onBackHome: () => void;
}

const OPTION_LABELS = ['A', 'B', 'C', 'D'];

const ResultPage: React.FC<ResultPageProps> = ({ result, questions, onRetry, onBackHome }) => {
  const stats = generateErrorStats(result.results);
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    result.results.forEach((r) => {
      if (!r.isCorrect) init[r.questionId] = true;
    });
    return init;
  });

  const toggleExpand = (id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const getQuestion = (id: string) => questions.find((q) => q.id === id);
  const accuracyPercent = Math.round(stats.accuracy);

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 16px' }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, color: '#111827', marginBottom: 24 }}>
        答题结果报告
      </h1>

      <div
        style={{
          background: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
          borderRadius: 16,
          padding: '32px 36px',
          color: '#fff',
          marginBottom: 28,
          boxShadow: '0 8px 24px rgba(79, 70, 229, 0.25)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20 }}>
          <div>
            <div style={{ fontSize: 16, opacity: 0.9, marginBottom: 8 }}>总得分</div>
            <div style={{ fontSize: 48, fontWeight: 700, lineHeight: 1 }}>
              {result.totalScore}
              <span style={{ fontSize: 20, fontWeight: 400, opacity: 0.85, marginLeft: 8 }}>
                / {result.maxScore}
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 32 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 700 }}>{stats.correctCount}</div>
              <div style={{ fontSize: 13, opacity: 0.9, marginTop: 4 }}>答对</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 700 }}>{stats.errorCount}</div>
              <div style={{ fontSize: 13, opacity: 0.9, marginTop: 4 }}>答错</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 700 }}>{accuracyPercent}%</div>
              <div style={{ fontSize: 13, opacity: 0.9, marginTop: 4 }}>正确率</div>
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          gap: 24,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ flex: 1, minWidth: 320 }}>
          <div style={{ fontSize: 18, fontWeight: 600, color: '#111827', marginBottom: 16 }}>
            每题详情
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {result.results.map((r, idx) => {
              const q = getQuestion(r.questionId);
              const isOpen = !!expanded[r.questionId];
              return (
                <div
                  key={r.questionId}
                  style={{
                    background: '#F9FAFB',
                    borderRadius: 12,
                    padding: 20,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                    border: r.isCorrect ? '2px solid #86EFAC' : '2px solid #FCA5A5',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <div style={{ flexShrink: 0 }}>
                      {r.isCorrect ? (
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            background: '#22C55E',
                            color: '#fff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 20,
                            fontWeight: 700,
                          }}
                        >
                          ✓
                        </div>
                      ) : (
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            background: '#EF4444',
                            color: '#fff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 20,
                            fontWeight: 700,
                          }}
                        >
                          ✗
                        </div>
                      )}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                        <span style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>
                          第 {idx + 1} 题
                        </span>
                        <span
                          style={{
                            padding: '2px 8px',
                            borderRadius: 4,
                            background: q?.type === 'choice' ? '#EEF2FF' : '#FEF3C7',
                            color: q?.type === 'choice' ? '#6366F1' : '#D97706',
                            fontSize: 11,
                            fontWeight: 600,
                          }}
                        >
                          {q?.type === 'choice' ? '选择题' : '判断题'}
                        </span>
                        <span
                          style={{
                            padding: '2px 8px',
                            borderRadius: 4,
                            background: r.isCorrect ? '#F0FDF4' : '#FEF2F2',
                            color: r.isCorrect ? '#15803D' : '#B91C1C',
                            fontSize: 11,
                            fontWeight: 600,
                          }}
                        >
                          +{r.score} 分
                        </span>
                      </div>
                      <p style={{ margin: '0 0 8px 0', fontSize: 14, color: '#111827', lineHeight: 1.5 }}>
                        {q?.text}
                      </p>
                      {q?.type === 'choice' && q.options && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginBottom: 8 }}>
                          {q.options.map((opt, i) => (
                            <div
                              key={i}
                              style={{
                                fontSize: 13,
                                padding: '4px 8px',
                                borderRadius: 4,
                                background: OPTION_LABELS[i] === r.correctAnswer
                                  ? '#F0FDF4'
                                  : OPTION_LABELS[i] === r.userAnswer && !r.isCorrect
                                    ? '#FEF2F2'
                                    : 'transparent',
                                color: OPTION_LABELS[i] === r.correctAnswer
                                  ? '#15803D'
                                  : OPTION_LABELS[i] === r.userAnswer && !r.isCorrect
                                    ? '#B91C1C'
                                    : '#6B7280',
                                fontWeight:
                                  OPTION_LABELS[i] === r.correctAnswer ||
                                  (OPTION_LABELS[i] === r.userAnswer && !r.isCorrect)
                                    ? 600
                                    : 400,
                              }}
                            >
                              {OPTION_LABELS[i]}. {opt}
                              {OPTION_LABELS[i] === r.correctAnswer && '  ← 正确答案'}
                              {OPTION_LABELS[i] === r.userAnswer && !r.isCorrect && OPTION_LABELS[i] !== r.correctAnswer && '  ← 你的选择'}
                            </div>
                          ))}
                        </div>
                      )}
                      {q?.type === 'judge' && (
                        <div style={{ fontSize: 13, marginBottom: 8, color: '#6B7280' }}>
                          你的答案：
                          <span style={{ color: r.isCorrect ? '#15803D' : '#B91C1C', fontWeight: 600 }}>
                            {r.userAnswer === 'true' ? '正确' : r.userAnswer === 'false' ? '错误' : '未作答'}
                          </span>
                          {!r.isCorrect && (
                            <>
                              ，正确答案：
                              <span style={{ color: '#15803D', fontWeight: 600 }}>
                                {r.correctAnswer === 'true' ? '正确' : '错误'}
                              </span>
                            </>
                          )}
                        </div>
                      )}
                      {!r.isCorrect && (
                        <button
                          onClick={() => toggleExpand(r.questionId)}
                          style={{
                            marginTop: 4,
                            padding: '6px 14px',
                            borderRadius: 6,
                            border: '1px solid #8B5CF6',
                            background: '#fff',
                            color: '#6366F1',
                            fontSize: 12,
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                          }}
                        >
                          {isOpen ? '收起解析 ▲' : '查看解析 ▼'}
                        </button>
                      )}
                      <div
                        style={{
                          marginTop: isOpen ? 12 : 0,
                          maxHeight: isOpen ? 500 : 0,
                          overflow: 'hidden',
                          transition: 'max-height 0.3s ease-in-out',
                        }}
                      >
                        <div
                          style={{
                            background: '#EEF2FF',
                            borderRadius: 8,
                            padding: 16,
                            borderLeft: '3px solid #8B5CF6',
                          }}
                        >
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#4F46E5', marginBottom: 8 }}>
                            📚 知识点解析
                          </div>
                          <p style={{ margin: '0 0 10px 0', fontSize: 13, color: '#374151', lineHeight: 1.6 }}>
                            {r.explanation}
                          </p>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                            {r.knowledgePoints.map((kp, i) => (
                              <span
                                key={i}
                                style={{
                                  padding: '3px 10px',
                                  borderRadius: 999,
                                  background: '#fff',
                                  color: '#7C3AED',
                                  fontSize: 11,
                                  border: '1px solid #DDD6FE',
                                }}
                              >
                                🔗 {kp}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ width: 380, flexShrink: 0, minWidth: 300 }}>
          <RadarChart data={result.knowledgePointErrors} width={340} height={340} radius={120} />

          <div
            style={{
              marginTop: 20,
              background: '#F9FAFB',
              borderRadius: 12,
              padding: 20,
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            }}
          >
            <div style={{ fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 12 }}>
              📝 个性化学习建议
            </div>
            <p style={{ margin: 0, fontSize: 13, color: '#6B7280', lineHeight: 1.7 }}>
              {Object.keys(result.knowledgePointErrors).length === 0
                ? '太棒了！本次测验全部答对，继续保持！🎉'
                : Object.entries(result.knowledgePointErrors)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 3)
                    .map(([name, count], i) => (
                      <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: i < 2 ? 8 : 0 }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: 22,
                            height: 22,
                            borderRadius: 6,
                            background:
                              i === 0 ? '#FEF2F2' : i === 1 ? '#FFF7ED' : '#FEFCE8',
                            color:
                              i === 0 ? '#DC2626' : i === 1 ? '#EA580C' : '#CA8A04',
                            fontSize: 12,
                            fontWeight: 700,
                          }}
                        >
                          {i + 1}
                        </span>
                        <span style={{ fontSize: 13, color: '#374151', flex: 1 }}>
                          {name}
                        </span>
                        <span style={{ fontSize: 12, color: '#EF4444', fontWeight: 600 }}>
                          错 {count} 次
                        </span>
                      </div>
                    ))
                    .reduce<React.ReactNode[]>((acc, node) => {
                      acc.push(node);
                      return acc;
                    }, []) as unknown as React.ReactNode}
            </p>
            {Object.keys(result.knowledgePointErrors).length > 0 && (
              <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid #E5E7EB' }}>
                <div style={{ fontSize: 12, color: '#9CA3AF', lineHeight: 1.6 }}>
                  建议优先复习以上薄弱知识点，结合具体案例加深理解，
                  完成后可点击"再测一次"进行巩固练习。
                </div>
              </div>
            )}
          </div>

          <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button
              onClick={onRetry}
              style={{
                padding: '13px 24px',
                borderRadius: 10,
                border: 'none',
                background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                color: '#fff',
                fontSize: 15,
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.filter = 'brightness(1.2)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.filter = 'brightness(1)';
              }}
            >
              🔄 再测一次
            </button>
            <button
              onClick={onBackHome}
              style={{
                padding: '13px 24px',
                borderRadius: 10,
                border: '2px solid #E5E7EB',
                background: '#fff',
                color: '#374151',
                fontSize: 15,
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              🏠 返回首页
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultPage;
