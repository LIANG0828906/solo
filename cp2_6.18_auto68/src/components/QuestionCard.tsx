import { useEffect, useRef, useCallback } from 'react';
import { useGameStore } from '../store';
import { wsService } from '../buzzer/websocketService';
import { eventBus } from '../eventBus';

export default function QuestionCard() {
  const currentQuestion = useGameStore((s) => s.currentQuestion);
  const questionIndex = useGameStore((s) => s.questionIndex);
  const totalRounds = useGameStore((s) => s.totalRounds);
  const timeRemaining = useGameStore((s) => s.timeRemaining);
  const totalTime = useGameStore((s) => s.totalTime);
  const answerState = useGameStore((s) => s.answerState);
  const isTransitioning = useGameStore((s) => s.isTransitioning);
  const currentPlayerId = useGameStore((s) => s.currentPlayerId);
  const roundEndTime = useGameStore((s) => s.roundEndTime);

  const answerTimeRef = useRef<number>(Date.now());
  const hasAnsweredRef = useRef(false);
  const nextQuestionTriggered = useRef(false);

  useEffect(() => {
    answerTimeRef.current = Date.now();
    hasAnsweredRef.current = false;
    nextQuestionTriggered.current = false;
  }, [questionIndex]);

  const handleOptionClick = useCallback(
    (index: number) => {
      if (answerState.isLocked || hasAnsweredRef.current) return;
      hasAnsweredRef.current = true;

      const timeElapsed = (Date.now() - answerTimeRef.current) / 1000;
      wsService.submitAnswer(currentPlayerId, index, timeElapsed);
    },
    [answerState.isLocked, currentPlayerId]
  );

  useEffect(() => {
    if (
      answerState.isLocked &&
      !nextQuestionTriggered.current &&
      roundEndTime !== null
    ) {
      nextQuestionTriggered.current = true;
      const store = useGameStore.getState();
      store.setIsTransitioning(true);

      setTimeout(() => {
        store.setRoundEndTime(null);
        wsService.nextQuestion(store.questionIndex);
      }, 1500);
    }
  }, [answerState.isLocked, roundEndTime]);

  useEffect(() => {
    const unsub = eventBus.on('roundEnd', () => {
      const store = useGameStore.getState();
      if (!nextQuestionTriggered.current) {
        nextQuestionTriggered.current = true;
        store.setRoundEndTime(Date.now());
        store.setIsTransitioning(true);

        if (!answerState.isLocked) {
          store.setAnswerState({
            selectedIndex: null,
            isCorrect: false,
            isLocked: true,
          });
        }

        setTimeout(() => {
          store.setRoundEndTime(null);
          wsService.nextQuestion(store.questionIndex);
        }, 1500);
      }
    });
    return unsub;
  }, [answerState.isLocked, questionIndex]);

  if (!currentQuestion) return null;

  const progress = (timeRemaining / totalTime) * 100;
  const timerColor =
    progress > 60 ? '#00FF88' : progress > 30 ? '#FFD700' : '#FF4444';

  return (
    <div
      className={`w-full max-w-2xl transition-all duration-300 ${
        isTransitioning
          ? 'opacity-0 -translate-x-full'
          : 'opacity-100 translate-x-0'
      }`}
    >
      <div className="flex items-center justify-between mb-3 text-sm text-[#A0A0A0]">
        <span>
          第 {questionIndex + 1}/{totalRounds} 题
        </span>
        <span className={timeRemaining <= 3 ? 'text-[#FF4444] font-bold' : ''}>
          {Math.ceil(timeRemaining)}s
        </span>
      </div>

      <div className="w-full h-1.5 bg-[#333] rounded-full mb-6 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-100 ease-linear"
          style={{
            width: `${progress}%`,
            backgroundColor: timerColor,
          }}
        />
      </div>

      <div className="glass-panel p-8 mb-6 relative overflow-hidden">
        {answerState.isLocked && answerState.isCorrect && (
          <div className="correct-ripple" />
        )}
        <h2 className="text-xl md:text-2xl text-white font-semibold mb-8 text-center leading-relaxed">
          {currentQuestion.question}
        </h2>

        <div className="flex flex-wrap justify-center gap-6">
          {currentQuestion.options.map((option, i) => {
            let borderClass = 'border-[#FFFFFF30]';
            let bgClass = '';

            if (answerState.isLocked) {
              if (i === currentQuestion.correctIndex) {
                borderClass = 'border-[#00FF88]';
              } else if (
                i === answerState.selectedIndex &&
                !answerState.isCorrect
              ) {
                borderClass = 'border-[#FF4444]';
                bgClass = 'bg-[#FF444420] animate-shake';
              }
              if (
                i === answerState.selectedIndex &&
                answerState.isCorrect
              ) {
                bgClass = 'bg-[#00FF8820]';
              }
            }

            return (
              <button
                key={i}
                onClick={() => handleOptionClick(i)}
                disabled={answerState.isLocked}
                className={`relative option-btn border-2 ${borderClass} ${bgClass} rounded-xl px-6 py-4 text-white font-medium min-w-[140px] transition-all duration-200 hover:scale-105 hover:brightness-110 disabled:hover:scale-100 disabled:hover:brightness-100`}
              >
                <span className="text-[#6C63FF] font-bold mr-2">
                  {String.fromCharCode(65 + i)}.
                </span>
                {option}
                {answerState.isLocked &&
                  i === answerState.selectedIndex &&
                  answerState.isCorrect && (
                    <span className="score-float">+100</span>
                  )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
