import React, { useEffect, useCallback, useRef } from 'react';
import { useTimelineStore } from './store';
import { generateQuestions } from './QuestionGenerator';
import TimelineSorter from './TimelineSorter';

const App: React.FC = () => {
  const isStarted = useTimelineStore((state) => state.isStarted);
  const isSubmitted = useTimelineStore((state) => state.isSubmitted);
  const currentQuestions = useTimelineStore((state) => state.currentQuestions);
  const setQuestions = useTimelineStore((state) => state.setQuestions);
  const setStarted = useTimelineStore((state) => state.setStarted);
  const setSubmitted = useTimelineStore((state) => state.setSubmitted);
  const reset = useTimelineStore((state) => state.reset);

  const hasLoadedRef = useRef(false);

  const loadNewQuestions = useCallback(async () => {
    const questions = await generateQuestions(5);
    setQuestions(questions);
  }, [setQuestions]);

  useEffect(() => {
    if (!hasLoadedRef.current) {
      hasLoadedRef.current = true;
      loadNewQuestions();
    }
  }, [loadNewQuestions]);

  const handleStart = () => {
    setStarted(true);
    setSubmitted(false);
  };

  const handleRestart = async () => {
    reset();
    await loadNewQuestions();
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1 className="app-title">历史时间轴</h1>
      </header>

      <main className="app-main">
        <div className="quiz-container">
          <div
            className="quiz-intro"
            style={{
              textAlign: 'center',
              marginBottom: '24px',
            }}
          >
            <p
              style={{
                fontSize: '16px',
                color: '#5D4037',
                lineHeight: '1.6',
              }}
            >
              请将下列历史事件按发生时间的先后顺序排列
              <br />
              <span style={{ fontSize: '14px', color: '#8D6E63' }}>
                （从最早到最晚，从上到下排列）
              </span>
            </p>
          </div>

          {!isStarted && currentQuestions.length > 0 && (
            <div style={{ textAlign: 'center' }}>
              <div
                style={{
                  background: 'rgba(255, 248, 231, 0.6)',
                  borderRadius: '12px',
                  padding: '20px',
                  marginBottom: '20px',
                  border: '1px dashed #D7CCC8',
                }}
              >
                <p
                  style={{
                    color: '#6D4C41',
                    fontSize: '14px',
                    margin: '0 0 12px 0',
                  }}
                >
                  已为您随机抽取 {currentQuestions.length} 个历史事件
                </p>
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '8px',
                    justifyContent: 'center',
                  }}
                >
                  {currentQuestions.map((q) => (
                    <span
                      key={q.id}
                      style={{
                        background: '#FFF8E7',
                        padding: '6px 12px',
                        borderRadius: '20px',
                        fontSize: '13px',
                        color: '#5D4037',
                        border: '1px solid #D7CCC8',
                      }}
                    >
                      {q.event}
                    </span>
                  ))}
                </div>
              </div>
              <button
                onClick={handleStart}
                className="start-btn"
                style={{
                  background: 'linear-gradient(135deg, #3E2723 0%, #5D4037 100%)',
                  color: '#FFD700',
                  border: 'none',
                  padding: '16px 56px',
                  fontSize: '20px',
                  fontWeight: 'bold',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 6px 20px rgba(62, 39, 35, 0.4)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.boxShadow =
                    '0 8px 24px rgba(62, 39, 35, 0.5)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow =
                    '0 6px 20px rgba(62, 39, 35, 0.4)';
                }}
              >
                开始答题
              </button>
            </div>
          )}

          {isStarted && <TimelineSorter />}

          {isSubmitted && (
            <div style={{ textAlign: 'center', marginTop: '24px' }}>
              <button
                onClick={handleRestart}
                className="restart-btn"
                style={{
                  background: 'linear-gradient(135deg, #8B4513 0%, #A0522D 100%)',
                  color: '#FFF8E7',
                  border: 'none',
                  padding: '14px 48px',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 16px rgba(139, 69, 19, 0.4)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow =
                    '0 6px 20px rgba(139, 69, 19, 0.5)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow =
                    '0 4px 16px rgba(139, 69, 19, 0.4)';
                }}
              >
                重新开始
              </button>
            </div>
          )}
        </div>
      </main>

      <footer
        style={{
          textAlign: 'center',
          padding: '20px',
          color: '#8D6E63',
          fontSize: '13px',
          marginTop: '40px',
        }}
      >
        拖拽卡片调整顺序 · 每题20分 · 满分100分
      </footer>
    </div>
  );
};

export default App;
