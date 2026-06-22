import { useEffect, useCallback, useRef } from 'react';
import { useTypingStore } from '../store/typingStore';
import type { CharStatus } from '../store/typingStore';

const WPM_UPDATE_INTERVAL = 1000 / 12;

export function useTypingEngine() {
  const {
    status,
    currentText,
    currentIndex,
    correctChars,
    totalChars,
    charErrors,
    wordErrors,
    timeLeft,
    wpmHistory,
    currentWpm,
    peakWpm,
    accuracy,
    heatmapMode,
    showResult,
    flashIndex,
    startGame,
    handleInput,
    backspace,
    tick,
    recordWpm,
    resetGame,
    toggleHeatmap,
    setFlashIndex,
    finishGame,
    getCharStatus: storeGetCharStatus,
  } = useTypingStore();

  const wpmIntervalRef = useRef<number | null>(null);
  const tickIntervalRef = useRef<number | null>(null);

  const calculateWpm = useCallback(() => {
    const state = useTypingStore.getState();
    if (state.startTime === null || state.status !== 'playing') return 0;

    const elapsedMinutes = (Date.now() - state.startTime) / 1000 / 60;
    if (elapsedMinutes === 0) return 0;

    return Math.round(state.correctChars / 5 / elapsedMinutes);
  }, []);

  useEffect(() => {
    if (status === 'playing') {
      wpmIntervalRef.current = window.setInterval(() => {
        const wpm = calculateWpm();
        const state = useTypingStore.getState();
        const elapsed = state.startTime ? (Date.now() - state.startTime) / 1000 : 0;
        recordWpm(wpm, elapsed);
      }, WPM_UPDATE_INTERVAL);

      tickIntervalRef.current = window.setInterval(() => {
        tick();
      }, 100);

      return () => {
        if (wpmIntervalRef.current) {
          clearInterval(wpmIntervalRef.current);
        }
        if (tickIntervalRef.current) {
          clearInterval(tickIntervalRef.current);
        }
      };
    }
  }, [status, calculateWpm, recordWpm, tick]);

  const handleKeyPress = useCallback(
    (key: string) => {
      if (status !== 'playing') return;

      if (key === 'Backspace') {
        backspace();
        return;
      }

      if (key.length === 1) {
        const idx = currentIndex;
        const expectedChar = currentText[idx];
        const isCorrect = key === expectedChar;

        handleInput(key);

        if (!isCorrect) {
          setFlashIndex(idx);
          setTimeout(() => {
            setFlashIndex(null);
          }, 150);
        }

        const state = useTypingStore.getState();
        if (state.currentIndex >= state.currentText.length) {
          finishGame();
        }
      }
    },
    [status, currentText, currentIndex, handleInput, backspace, setFlashIndex, finishGame]
  );

  const getCharStatus = useCallback(
    (index: number): CharStatus => {
      return storeGetCharStatus(index);
    },
    [storeGetCharStatus]
  );

  const getWpmHistoryAtIntervals = useCallback(
    (interval: number): { time: number; wpm: number }[] => {
      const result: { time: number; wpm: number }[] = [];
      for (let t = 0; t <= 60; t += interval) {
        const point = [...wpmHistory].reverse().find((p) => p.time <= t);
        if (point) {
          result.push({ time: t, wpm: point.wpm });
        }
      }
      if (result.length === 0 && wpmHistory.length > 0) {
        result.push(wpmHistory[0]);
      }
      return result;
    },
    [wpmHistory]
  );

  const getWordErrorRate = useCallback(
    (word: string): number => {
      const wordData = wordErrors[word];
      if (!wordData || wordData.attempts === 0) return 0;
      return wordData.errors / wordData.attempts;
    },
    [wordErrors]
  );

  const getSortedErrors = useCallback(() => {
    return Object.entries(charErrors)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
  }, [charErrors]);

  const getAvgWpm = useCallback(() => {
    if (wpmHistory.length === 0) return 0;
    const sum = wpmHistory.reduce((acc, p) => acc + p.wpm, 0);
    return Math.round(sum / wpmHistory.length);
  }, [wpmHistory]);

  return {
    status,
    currentText,
    currentIndex,
    correctChars,
    totalChars,
    charErrors,
    wordErrors,
    timeLeft,
    wpmHistory,
    currentWpm,
    peakWpm,
    accuracy,
    heatmapMode,
    showResult,
    flashIndex,
    startGame,
    handleKeyPress,
    resetGame,
    toggleHeatmap,
    getCharStatus,
    getWpmHistoryAtIntervals,
    getWordErrorRate,
    getSortedErrors,
    getAvgWpm,
  };
}
