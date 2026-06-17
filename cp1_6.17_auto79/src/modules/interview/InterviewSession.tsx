import { useState, useCallback, useMemo, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import Timer from './Timer';
import type { Question, InterviewState } from '@/types';
import questionsData from '@/data/questions.json';

function pickRandomQuestions(all: Question[], count: number): Question[] {
  const shuffled = [...all].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

interface InterviewSessionProps {
  onInterviewStart: (interviewId: string, questionIds: string[]) => void;
  onQuestionChange: (questionId: string, questionIndex: number) => void;
  onInterviewEnd: () => void;
  currentQuestionId: string | null;
}

export default function InterviewSession({
  onInterviewStart,
  onQuestionChange,
  onInterviewEnd,
}: InterviewSessionProps) {
  const [state, setState] = useState<InterviewState>({
    isStarted: false,
    isFinished: false,
    interviewId: null,
    currentQuestionIndex: 0,
    questions: [],
  });

  const callbacksRef = useRef({ onInterviewStart, onQuestionChange, onInterviewEnd });
  callbacksRef.current = { onInterviewStart, onQuestionChange, onInterviewEnd };

  const startInterview = useCallback(() => {
    const id = uuidv4();
    const selected = pickRandomQuestions(questionsData as Question[], 5);
    const questionIds = selected.map((q) => q.id);
    setState({
      isStarted: true,
      isFinished: false,
      interviewId: id,
      currentQuestionIndex: 0,
      questions: selected,
    });
    callbacksRef.current.onInterviewStart(id, questionIds);
    callbacksRef.current.onQuestionChange(selected[0].id, 0);
  }, []);

  const handleTimeUp = useCallback(() => {
    setState((prev) => {
      const nextIndex = prev.currentQuestionIndex + 1;
      if (nextIndex >= prev.questions.length) {
        setTimeout(() => callbacksRef.current.onInterviewEnd(), 0);
        return { ...prev, isFinished: true };
      }
      const nextQuestion = prev.questions[nextIndex];
      setTimeout(() => callbacksRef.current.onQuestionChange(nextQuestion.id, nextIndex), 0);
      return { ...prev, currentQuestionIndex: nextIndex };
    });
  }, []);

  const endInterview = useCallback(() => {
    setState((prev) => ({ ...prev, isFinished: true }));
    callbacksRef.current.onInterviewEnd();
  }, []);

  const currentQuestion = useMemo(
    () => state.questions[state.currentQuestionIndex] ?? null,
    [state.questions, state.currentQuestionIndex]
  );

  const isLastQuestion = state.currentQuestionIndex >= state.questions.length - 1;

  if (!state.isStarted) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-6">
        <div className="text-2xl font-bold text-gray-700">技术面试评分系统</div>
        <p className="text-gray-500 text-center max-w-md">
          点击下方按钮开始面试，系统将随机抽取5道技术题目，每题5分钟倒计时
        </p>
        <button
          onClick={startInterview}
          className="px-8 py-3 bg-[#2196F3] text-white rounded-lg font-medium
            hover:bg-[#1976D2] active:scale-[0.98] transition-all duration-200"
        >
          开始面试
        </button>
      </div>
    );
  }

  if (state.isFinished) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <div className="text-2xl font-bold text-gray-700">面试已结束</div>
        <p className="text-gray-500">
          面试ID: {state.interviewId?.slice(0, 8)}
        </p>
        <p className="text-gray-400 text-sm">可在左侧面板查看评分记录</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full gap-8">
      <div className="text-sm text-gray-400 mb-2">
        面试ID: {state.interviewId?.slice(0, 8)} · 第 {state.currentQuestionIndex + 1} / {state.questions.length} 题
      </div>

      {currentQuestion && (
        <div className="text-center max-w-2xl px-4">
          <p className="text-[20px] font-bold text-[#424242] leading-relaxed">
            {currentQuestion.content}
          </p>
        </div>
      )}

      <Timer
        key={`q-${state.currentQuestionIndex}`}
        duration={currentQuestion?.duration ?? 300}
        onTimeUp={handleTimeUp}
        isRunning={state.isStarted && !state.isFinished}
      />

      {isLastQuestion && !state.isFinished && (
        <button
          onClick={endInterview}
          className="px-6 py-2.5 bg-[#E53935] text-white rounded-lg font-medium
            hover:bg-[#C62828] active:scale-[0.98] transition-all duration-200"
        >
          面试结束
        </button>
      )}
    </div>
  );
}
