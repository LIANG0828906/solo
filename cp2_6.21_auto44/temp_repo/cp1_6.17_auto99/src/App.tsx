import { useEffect, useRef, useState } from 'react';
import BrailleGrid from './BrailleGrid';
import QuizPanel from './QuizPanel';
import { useBrailleStore } from './store/brailleStore';
import { charToDots, dotsEqual } from './BrailleChar';
import './App.css';

export default function App() {
  const {
    mode,
    currentDots,
    toggleDot,
    checkAnswer,
    nextQuestion,
    showErrorMsg,
    hideError,
    showError,
    submitTestAnswer,
    testCurrentIndex,
    testQuestions,
    testResults,
    score,
    correctCount,
    totalQuestions,
  } = useBrailleStore();

  const [shake, setShake] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const timerRef = useRef<number | null>(null);
  const errorTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (mode === 'test' && !testResults) {
      timerRef.current = window.setInterval(() => {
        const elapsed = (Date.now() - useBrailleStore.getState().testStartTime) / 1000;
        setElapsedTime(elapsed);
      }, 100);
    } else {
      setElapsedTime(0);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [mode, testResults]);

  const handleDotClick = (index: number) => {
    toggleDot(index);

    setTimeout(() => {
      const state = useBrailleStore.getState();
      const correctDots = charToDots(state.currentChar);

      if (dotsEqual(state.currentDots, correctDots)) {
        if (state.mode === 'practice') {
          checkAnswer();
          setTimeout(() => {
            nextQuestion();
          }, 500);
        } else if (state.mode === 'test') {
          submitTestAnswer();
        }
      } else if (state.mode === 'practice') {
        const hasWrongDot = state.currentDots.some((dot, i) => dot && !correctDots[i]);
        if (hasWrongDot) {
          showErrorMsg('点位不正确，请再试一次');
        }
      }
    }, 0);
  };

  useEffect(() => {
    if (showError) {
      setShake(true);
      setTimeout(() => setShake(false), 200);

      if (errorTimeoutRef.current) {
        clearTimeout(errorTimeoutRef.current);
      }
      errorTimeoutRef.current = window.setTimeout(() => {
        hideError();
      }, 1500);
    }

    return () => {
      if (errorTimeoutRef.current) {
        clearTimeout(errorTimeoutRef.current);
      }
    };
  }, [showError, hideError]);

  const progressText = mode === 'practice'
    ? `第 ${totalQuestions + 1} 题`
    : `第 ${testCurrentIndex + 1}/${testQuestions.length} 题`;

  const scoreText = mode === 'practice' ? `得分: ${score}` : '';
  const timeText = mode === 'test' ? `已用: ${elapsedTime.toFixed(1)}s` : `正确率: ${totalQuestions > 0 ? ((correctCount / totalQuestions) * 100).toFixed(1) : '0.0'}%`;

  return (
    <div className="app">
      <div className="app-main">
        <div className="grid-container">
          <div className="grid-title">盲文输入区</div>
          <BrailleGrid
            dots={currentDots}
            onDotClick={handleDotClick}
            shake={shake}
          />
        </div>
        <QuizPanel elapsedTime={elapsedTime} />
      </div>
      <div className="app-footer">
        <div className="footer-left">{progressText}</div>
        <div className="footer-center">{scoreText}</div>
        <div className="footer-right">{timeText}</div>
      </div>
    </div>
  );
}
